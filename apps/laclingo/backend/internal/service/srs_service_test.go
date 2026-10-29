package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"laclingo-backend/internal/domain"
	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// fakeSRSRepo — 1 dòng tiến độ ôn trong bộ nhớ, ghi theo đúng điều kiện của query thật (chỉ ghi khi mới hơn lần
// ôn đã lưu và khác client_review_id đã lưu); method khác panic (interface nhúng nil)
type fakeSRSRepo struct {
	SRSRepository
	row *db.UserVocabularyReview
}

func (f *fakeSRSRepo) GetVocabularyReview(_ context.Context, _ db.GetVocabularyReviewParams) (db.UserVocabularyReview, error) {
	if f.row == nil {
		return db.UserVocabularyReview{}, pgx.ErrNoRows
	}
	return *f.row, nil
}

func (f *fakeSRSRepo) newer(at pgtype.Timestamptz) bool {
	return !f.row.LastReviewedAt.Valid || f.row.LastReviewedAt.Time.Before(at.Time)
}

func (f *fakeSRSRepo) otherReview(id pgtype.UUID) bool {
	return !id.Valid || f.row.LastClientReviewID != id
}

func (f *fakeSRSRepo) UpsertVocabularyReview(_ context.Context, arg db.UpsertVocabularyReviewParams) (db.UserVocabularyReview, error) {
	if f.row != nil && !(f.newer(arg.LastReviewedAt) && f.otherReview(arg.LastClientReviewID)) {
		return db.UserVocabularyReview{}, pgx.ErrNoRows
	}
	if f.row == nil {
		f.row = &db.UserVocabularyReview{UserID: arg.UserID, VocabularyID: arg.VocabularyID}
	}
	f.row.SrsStage, f.row.EaseFactor, f.row.IntervalDays = arg.SrsStage, arg.EaseFactor, arg.IntervalDays
	f.row.NextReviewAt, f.row.LastReviewedAt, f.row.LastClientReviewID = arg.NextReviewAt, arg.LastReviewedAt, arg.LastClientReviewID
	return *f.row, nil
}

func (f *fakeSRSRepo) PracticeVocabularyReview(_ context.Context, arg db.PracticeVocabularyReviewParams) (db.UserVocabularyReview, error) {
	if f.row == nil || !(f.newer(arg.LastReviewedAt) && f.otherReview(arg.LastClientReviewID)) {
		return db.UserVocabularyReview{}, pgx.ErrNoRows
	}
	f.row.SrsStage, f.row.EaseFactor, f.row.IntervalDays = arg.SrsStage, arg.EaseFactor, arg.IntervalDays
	f.row.NextReviewAt, f.row.LastReviewedAt, f.row.LastClientReviewID = arg.NextReviewAt, arg.LastReviewedAt, arg.LastClientReviewID
	f.row.PracticeCount++
	return *f.row, nil
}

func (f *fakeSRSRepo) IncrementVocabularyPracticeOnly(_ context.Context, arg db.IncrementVocabularyPracticeOnlyParams) (db.UserVocabularyReview, error) {
	if f.row == nil || !f.otherReview(arg.LastClientReviewID) {
		return db.UserVocabularyReview{}, pgx.ErrNoRows
	}
	f.row.LastClientReviewID = arg.LastClientReviewID
	f.row.PracticeCount++
	return *f.row, nil
}

// fakeSRSMissionRepo — đếm số lần ghi nhận học (MarkStudied), không có nhiệm vụ active
type fakeSRSMissionRepo struct {
	MissionRepository
	studied int
}

func (f *fakeSRSMissionRepo) TouchUserStudiedAt(context.Context, pgtype.UUID) error {
	f.studied++
	return nil
}

func (f *fakeSRSMissionRepo) ListActiveMissionsByAction(context.Context, string) ([]db.Mission, error) {
	return nil, nil
}

// fakeReviewQuota — không giới hạn, đếm lượt đã trừ (trừ lượt rồi hoàn lại thì không tính)
type fakeReviewQuota struct {
	QuotaProvider
	used int
}

func (f *fakeReviewQuota) Reserve(context.Context, uuid.UUID, string) (func(), error) {
	f.used++
	return func() { f.used-- }, nil
}

type srsFixture struct {
	svc      *SRSService
	repo     *fakeSRSRepo
	missions *fakeSRSMissionRepo
	quota    *fakeReviewQuota
	user     uuid.UUID
	vocab    uuid.UUID
	now      time.Time
}

// newSRSFixture — từ đã đến hạn từ 2 ngày trước, lần ôn cuối 3 ngày trước
func newSRSFixture() *srsFixture {
	f := &srsFixture{
		repo:     &fakeSRSRepo{},
		missions: &fakeSRSMissionRepo{},
		quota:    &fakeReviewQuota{},
		user:     uuid.New(),
		vocab:    uuid.New(),
		now:      time.Date(2026, 10, 28, 9, 0, 0, 0, time.UTC),
	}
	f.repo.row = &db.UserVocabularyReview{
		UserID:         toPgUUID(f.user),
		VocabularyID:   toPgUUID(f.vocab),
		SrsStage:       pgtype.Int4{Int32: 2, Valid: true},
		EaseFactor:     pgtype.Float8{Float64: 2.5, Valid: true},
		IntervalDays:   pgtype.Int4{Int32: 6, Valid: true},
		NextReviewAt:   pgtype.Timestamptz{Time: f.now.Add(-48 * time.Hour), Valid: true},
		LastReviewedAt: pgtype.Timestamptz{Time: f.now.Add(-72 * time.Hour), Valid: true},
	}
	f.svc = NewSRSService(f.repo, NewMissionService(f.missions, nil), f.quota, nil)
	f.svc.now = func() time.Time { return f.now }
	return f
}

func TestReviewOfflineResultIsAppliedOnceAndScheduledFromReviewTime(t *testing.T) {
	f := newSRSFixture()
	reviewedAt := f.now.Add(-5 * time.Hour)
	req := domain.VocabularyReviewRequest{VocabularyID: f.vocab, Quality: 5, ReviewedAt: &reviewedAt}

	first, err := f.svc.ReviewVocabulary(context.Background(), f.user, req)
	if err != nil {
		t.Fatalf("first: %v", err)
	}
	if want := reviewedAt.AddDate(0, 0, int(first.IntervalDays)); !first.NextReviewAt.Equal(want) {
		t.Fatalf("next_review_at = %v, want %v (tính từ lúc ôn offline)", first.NextReviewAt, want)
	}

	// Đồng bộ bị ngắt sau khi server đã lưu → app gửi lại đúng kết quả đó
	again, err := f.svc.ReviewVocabulary(context.Background(), f.user, req)
	if err != nil {
		t.Fatalf("resend: %v", err)
	}
	if again != first {
		t.Fatalf("resend = %+v, want %+v", again, first)
	}
	if f.quota.used != 1 || f.missions.studied != 1 {
		t.Fatalf("quota used %d, studied %d; want 1, 1", f.quota.used, f.missions.studied)
	}
}

func TestReviewOlderThanStoredIsNotApplied(t *testing.T) {
	f := newSRSFixture()
	before := *f.repo.row
	old := f.now.Add(-96 * time.Hour) // trước lần ôn cuối (máy khác đã ôn sau đó)

	resp, err := f.svc.ReviewVocabulary(context.Background(), f.user, domain.VocabularyReviewRequest{VocabularyID: f.vocab, Quality: 0, ReviewedAt: &old})
	if err != nil {
		t.Fatal(err)
	}
	if resp.IntervalDays != before.IntervalDays.Int32 || *f.repo.row != before {
		t.Fatalf("stale review changed progress: %+v", f.repo.row)
	}
	if f.quota.used != 0 || f.missions.studied != 0 {
		t.Fatalf("quota used %d, studied %d; want 0, 0", f.quota.used, f.missions.studied)
	}
}

func TestPracticeResendCountsOnce(t *testing.T) {
	f := newSRSFixture()
	reviewedAt := f.now.Add(-time.Hour)
	id := uuid.New()
	req := domain.VocabularyPracticeRequest{VocabularyID: f.vocab, Mistakes: 1, ReviewedAt: &reviewedAt, ClientReviewID: &id}

	for i := 0; i < 2; i++ {
		resp, err := f.svc.PracticeVocabulary(context.Background(), f.user, req)
		if err != nil {
			t.Fatalf("send %d: %v", i, err)
		}
		if resp.PracticeCount != 1 || resp.Quality != 4 {
			t.Fatalf("send %d: practice_count %d quality %d; want 1, 4", i, resp.PracticeCount, resp.Quality)
		}
	}
	if f.quota.used != 1 {
		t.Fatalf("quota used %d, want 1", f.quota.used)
	}
}

func TestPracticeNotDueResendCountsOnce(t *testing.T) {
	f := newSRSFixture()
	f.repo.row.NextReviewAt = pgtype.Timestamptz{Time: f.now.Add(48 * time.Hour), Valid: true} // "học lại list"
	before := f.repo.row.LastReviewedAt
	id := uuid.New()
	req := domain.VocabularyPracticeRequest{VocabularyID: f.vocab, ClientReviewID: &id}

	for i := 0; i < 2; i++ {
		if _, err := f.svc.PracticeVocabulary(context.Background(), f.user, req); err != nil {
			t.Fatalf("send %d: %v", i, err)
		}
	}
	if f.repo.row.PracticeCount != 1 || f.repo.row.IntervalDays.Int32 != 6 {
		t.Fatalf("practice_count %d interval %d; want 1, 6", f.repo.row.PracticeCount, f.repo.row.IntervalDays.Int32)
	}
	// Luyện sớm không phải 1 lần ôn SM-2 — không được chặn kết quả ôn offline cũ hơn gửi tới sau
	if f.repo.row.LastReviewedAt != before {
		t.Fatalf("last_reviewed_at changed to %v", f.repo.row.LastReviewedAt.Time)
	}
}

// Đồng hồ máy chạy nhanh: lần gửi online (giờ server) lưu rồi nhưng mất phản hồi → gửi lại từ hàng đợi kèm
// reviewed_at ở "tương lai" (bị đổi thành giờ server lúc gửi lại, mới hơn lần đã lưu) — vẫn không chấm lần 2 nhờ uuid
func TestReviewResendWithFastClockIsDeduplicatedByClientID(t *testing.T) {
	f := newSRSFixture()
	id := uuid.New()
	if _, err := f.svc.ReviewVocabulary(context.Background(), f.user, domain.VocabularyReviewRequest{VocabularyID: f.vocab, Quality: 4, ClientReviewID: &id}); err != nil {
		t.Fatal(err)
	}
	saved := *f.repo.row

	f.now = f.now.Add(10 * time.Minute)
	fast := f.now.Add(time.Hour)
	if _, err := f.svc.ReviewVocabulary(context.Background(), f.user, domain.VocabularyReviewRequest{VocabularyID: f.vocab, Quality: 4, ReviewedAt: &fast, ClientReviewID: &id}); err != nil {
		t.Fatal(err)
	}
	if *f.repo.row != saved || f.quota.used != 1 {
		t.Fatalf("resend applied again: row %+v, quota used %d", f.repo.row, f.quota.used)
	}
}

// Ôn online không gửi reviewed_at → luôn dùng giờ server, máy đồng hồ chậm không bị coi là kết quả cũ
func TestOnlineReviewWithoutReviewedAtAlwaysApplies(t *testing.T) {
	f := newSRSFixture()
	f.repo.row.LastReviewedAt = pgtype.Timestamptz{Time: f.now.Add(-time.Minute), Valid: true} // máy khác vừa ôn
	id := uuid.New()
	if _, err := f.svc.ReviewVocabulary(context.Background(), f.user, domain.VocabularyReviewRequest{VocabularyID: f.vocab, Quality: 5, ClientReviewID: &id}); err != nil {
		t.Fatal(err)
	}
	if f.quota.used != 1 || !f.repo.row.LastReviewedAt.Time.Equal(f.now) {
		t.Fatalf("quota used %d, last_reviewed_at %v; want applied at now", f.quota.used, f.repo.row.LastReviewedAt.Time)
	}
}

func TestReviewTimeBounds(t *testing.T) {
	f := newSRSFixture()
	tooOld := f.now.Add(-31 * 24 * time.Hour)
	if _, err := f.svc.ReviewVocabulary(context.Background(), f.user, domain.VocabularyReviewRequest{VocabularyID: f.vocab, Quality: 4, ReviewedAt: &tooOld}); !errors.Is(err, ErrInvalidInput) {
		t.Fatalf("too old: err = %v, want ErrInvalidInput", err)
	}

	// Đồng hồ máy chạy nhanh → coi như ôn bây giờ
	future := f.now.Add(2 * time.Hour)
	if _, err := f.svc.ReviewVocabulary(context.Background(), f.user, domain.VocabularyReviewRequest{VocabularyID: f.vocab, Quality: 4, ReviewedAt: &future}); err != nil {
		t.Fatal(err)
	}
	if !f.repo.row.LastReviewedAt.Time.Equal(f.now) {
		t.Fatalf("last_reviewed_at = %v, want now", f.repo.row.LastReviewedAt.Time)
	}
}
