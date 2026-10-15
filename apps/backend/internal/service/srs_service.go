package service

import (
	"context"
	"errors"
	"log"
	"math/rand"
	"time"

	"laclingo-backend/internal/domain"
	"laclingo-backend/internal/repository/db"
	"laclingo-backend/internal/srs"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

const (
	defaultEaseFactor   = 2.5
	defaultDueLimit     = 20
	maxDueLimit         = 100
	defaultNewBatchSize = 10
)

// SRSRepository định nghĩa Interface tiếp xúc với cơ sở dữ liệu
type SRSRepository interface {
	GetDueVocabulariesForUser(ctx context.Context, arg db.GetDueVocabulariesForUserParams) ([]db.GetDueVocabulariesForUserRow, error)
	GetVocabularyReview(ctx context.Context, arg db.GetVocabularyReviewParams) (db.UserVocabularyReview, error)
	UpsertVocabularyReview(ctx context.Context, arg db.UpsertVocabularyReviewParams) (db.UserVocabularyReview, error)
	ListNewVocabulariesForUser(ctx context.Context, arg db.ListNewVocabulariesForUserParams) ([]db.Vocabulary, error)
	CreateVocabularyReviewIfAbsent(ctx context.Context, arg db.CreateVocabularyReviewIfAbsentParams) (int64, error)
	ListMeaningDistractorsForVocabularies(ctx context.Context, vocabularyIds []pgtype.UUID) ([]db.ListMeaningDistractorsForVocabulariesRow, error)
	PracticeVocabularyReview(ctx context.Context, arg db.PracticeVocabularyReviewParams) (db.UserVocabularyReview, error)
	GetDeckVocabulariesForPractice(ctx context.Context, arg db.GetDeckVocabulariesForPracticeParams) ([]db.GetDeckVocabulariesForPracticeRow, error)
	IncrementVocabularyPracticeOnly(ctx context.Context, arg db.IncrementVocabularyPracticeOnlyParams) (db.UserVocabularyReview, error)
	GetDeckForUser(ctx context.Context, arg db.GetDeckForUserParams) (db.UserDeck, error)
}

// NewVocabulary là một từ user chưa học, hiển thị ở flow "Học từ mới"
type NewVocabulary struct {
	VocabularyID uuid.UUID `json:"vocabulary_id" swaggertype:"string" format:"uuid"`
	LanguageID   string    `json:"language_id" example:"en"`
	Term         string    `json:"term" example:"apple"`
	Phonetic     string    `json:"phonetic"`
	Meaning      string    `json:"meaning"`
	Example      string    `json:"example"`
	Topic        string    `json:"topic" example:"Đồ ăn & Thức uống"`
	Level        string    `json:"level" example:"A1"`
	AudioURL     string    `json:"audio_url"`
}

// DueVocabulary là một từ vựng đến hạn ôn tập
type DueVocabulary struct {
	VocabularyID uuid.UUID `json:"vocabulary_id" swaggertype:"string" format:"uuid"`
	LanguageID   string    `json:"language_id" example:"en"`
	Term         string    `json:"term" example:"apple"`
	Phonetic     string    `json:"phonetic"`
	Meaning      string    `json:"meaning"`
	AudioURL     string    `json:"audio_url"`
	SRSStage     int32     `json:"srs_stage"`
	NextReviewAt time.Time `json:"next_review_at"`
	// Dữ liệu cho bài luyện tập khi ôn (chọn nghĩa / ghép câu / ghép nghĩa câu / nghe-viết)
	Example        string   `json:"example"`
	ExampleMeaning string   `json:"example_meaning"`
	ImageEmoji     string   `json:"image_emoji"`
	ImageURL       string   `json:"image_url"`
	PracticeCount  int32    `json:"practice_count"`
	Choices        []string `json:"choices"` // nghĩa đúng + tối đa 3 nghĩa nhiễu, đã xáo trộn
}

type SRSService struct {
	repo     SRSRepository
	missions *MissionService
	now      func() time.Time
}

func NewSRSService(repo SRSRepository, missions *MissionService) *SRSService {
	return &SRSService{
		repo:     repo,
		missions: missions,
		now:      time.Now,
	}
}

// recordMissionAction ghi nhận hành động cho hệ thống nhiệm vụ — lỗi ở đây
// (ví dụ DB tạm trục trặc) KHÔNG được làm fail hành động chính (ôn tập/học từ
// mới), chỉ log lại để điều tra sau.
func (s *SRSService) recordMissionAction(ctx context.Context, userID uuid.UUID, actionType string) {
	if err := s.missions.RecordAction(ctx, userID, actionType, 1); err != nil {
		log.Printf("❌ mission: RecordAction user=%s action=%s: %v", userID, actionType, err)
	}
}

// GetDueVocabularies trả về từ đến hạn ôn tập. languageID rỗng thì lấy ở MỌI
// ngôn ngữ user đang học (hành vi mặc định) — truyền vào để chỉ ôn riêng 1 ngôn ngữ.
func (s *SRSService) GetDueVocabularies(ctx context.Context, userID uuid.UUID, limit int32, languageID string) ([]DueVocabulary, error) {
	if limit <= 0 {
		limit = defaultDueLimit
	}
	if limit > maxDueLimit {
		limit = maxDueLimit
	}

	var languageFilter pgtype.Text
	if languageID != "" {
		languageFilter = pgtype.Text{String: languageID, Valid: true}
	}

	rows, err := s.repo.GetDueVocabulariesForUser(ctx, db.GetDueVocabulariesForUserParams{
		UserID:     toPgUUID(userID),
		LanguageID: languageFilter,
		Limit:      limit,
	})
	if err != nil {
		return nil, err
	}
	return s.toDueVocabularies(ctx, rows)
}

// GetDeckVocabularies trả về MỌI từ trong 1 danh sách ôn tập của user (không
// chỉ từ đến hạn — "học lại list"), từ sắp đến hạn trước, kèm đáp án chọn nghĩa.
func (s *SRSService) GetDeckVocabularies(ctx context.Context, userID, deckID uuid.UUID, limit int32) ([]DueVocabulary, error) {
	if limit <= 0 || limit > maxDueLimit {
		limit = maxDueLimit
	}
	// List không tồn tại / của user khác → 404, không trả [] như list rỗng
	if _, err := s.repo.GetDeckForUser(ctx, db.GetDeckForUserParams{ID: toPgUUID(deckID), UserID: toPgUUID(userID)}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	rows, err := s.repo.GetDeckVocabulariesForPractice(ctx, db.GetDeckVocabulariesForPracticeParams{
		DeckID: toPgUUID(deckID),
		UserID: toPgUUID(userID),
		Limit:  limit,
	})
	if err != nil {
		return nil, err
	}
	// 2 query cố ý chọn cùng danh sách cột nên 2 kiểu Row convert được cho nhau
	due := make([]db.GetDueVocabulariesForUserRow, 0, len(rows))
	for _, r := range rows {
		due = append(due, db.GetDueVocabulariesForUserRow(r))
	}
	return s.toDueVocabularies(ctx, due)
}

func (s *SRSService) toDueVocabularies(ctx context.Context, rows []db.GetDueVocabulariesForUserRow) ([]DueVocabulary, error) {
	results := make([]DueVocabulary, 0, len(rows))
	for _, r := range rows {
		results = append(results, DueVocabulary{
			VocabularyID:   uuid.UUID(r.VocabularyID.Bytes),
			LanguageID:     r.LanguageID,
			Term:           r.Term,
			Phonetic:       r.Phonetic.String,
			Meaning:        r.Meaning,
			AudioURL:       r.AudioUrl.String,
			SRSStage:       r.SrsStage.Int32,
			NextReviewAt:   r.NextReviewAt.Time,
			Example:        r.Example.String,
			ExampleMeaning: r.ExampleMeaning.String,
			ImageEmoji:     r.ImageEmoji.String,
			ImageURL:       r.ImageUrl.String,
			PracticeCount:  r.PracticeCount,
		})
	}

	if err := s.attachMeaningChoices(ctx, rows, results); err != nil {
		return nil, err
	}
	return results, nil
}

// attachMeaningChoices gắn cho mỗi từ: nghĩa đúng + tối đa 3 nghĩa nhiễu (1 query cho cả danh sách), xáo trộn
func (s *SRSService) attachMeaningChoices(ctx context.Context, rows []db.GetDueVocabulariesForUserRow, results []DueVocabulary) error {
	if len(rows) == 0 {
		return nil
	}
	ids := make([]pgtype.UUID, 0, len(rows))
	for _, r := range rows {
		ids = append(ids, r.VocabularyID)
	}
	distractors, err := s.repo.ListMeaningDistractorsForVocabularies(ctx, ids)
	if err != nil {
		return err
	}
	byVocab := make(map[uuid.UUID][]string, len(rows))
	for _, d := range distractors {
		id := uuid.UUID(d.VocabularyID.Bytes)
		byVocab[id] = append(byVocab[id], d.Meaning)
	}
	for i := range results {
		choices := append([]string{results[i].Meaning}, byVocab[results[i].VocabularyID]...)
		rand.Shuffle(len(choices), func(a, b int) { choices[a], choices[b] = choices[b], choices[a] })
		results[i].Choices = choices
	}
	return nil
}

// qualityFromMistakes quy số lần sai trong bộ bài luyện tập về thang SM-2:
// không sai = nhớ hoàn hảo (5), sai từ 3 lần trở lên = nhớ sai (2, reset interval).
func qualityFromMistakes(mistakes int32) int32 {
	switch {
	case mistakes <= 0:
		return 5
	case mistakes == 1:
		return 4
	case mistakes == 2:
		return 3
	default:
		return 2
	}
}

// PracticeVocabulary ghi nhận user đã làm xong trọn bộ bài luyện tập của 1 từ
// đang ôn: chấm SM-2 tự động theo số lần sai và +1 practice_count (cùng 1 câu
// lệnh). Từ chưa có trong hàng đợi ôn tập → ErrNotFound.
func (s *SRSService) PracticeVocabulary(ctx context.Context, userID uuid.UUID, req domain.VocabularyPracticeRequest) (domain.VocabularyPracticeResponse, error) {
	if userID == uuid.Nil || req.VocabularyID == uuid.Nil || req.Mistakes < 0 {
		return domain.VocabularyPracticeResponse{}, ErrInvalidInput
	}
	quality := qualityFromMistakes(req.Mistakes)

	current, err := s.repo.GetVocabularyReview(ctx, db.GetVocabularyReviewParams{
		UserID:       toPgUUID(userID),
		VocabularyID: toPgUUID(req.VocabularyID),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.VocabularyPracticeResponse{}, ErrNotFound
	}
	if err != nil {
		return domain.VocabularyPracticeResponse{}, err
	}
	// Từ CHƯA đến hạn (vd "học lại list"): chỉ +1 lần luyện, giữ nguyên lịch
	// SM-2 và không tính nhiệm vụ — luyện sớm/lặp lại không được đẩy interval
	// lên hay cày tiến độ nhiệm vụ.
	if current.NextReviewAt.Time.After(s.now()) {
		saved, err := s.repo.IncrementVocabularyPracticeOnly(ctx, db.IncrementVocabularyPracticeOnlyParams{
			UserID:       toPgUUID(userID),
			VocabularyID: toPgUUID(req.VocabularyID),
		})
		if err != nil {
			return domain.VocabularyPracticeResponse{}, err
		}
		return toPracticeResponse(saved, quality), nil
	}

	out, err := s.nextSM2(ctx, userID, req.VocabularyID, quality)
	if err != nil {
		return domain.VocabularyPracticeResponse{}, err
	}

	saved, err := s.repo.PracticeVocabularyReview(ctx, db.PracticeVocabularyReviewParams{
		UserID:       toPgUUID(userID),
		VocabularyID: toPgUUID(req.VocabularyID),
		SrsStage:     pgtype.Int4{Int32: out.NewSRSStage, Valid: true},
		EaseFactor:   pgtype.Float8{Float64: out.NewEaseFactor, Valid: true},
		IntervalDays: pgtype.Int4{Int32: out.NewIntervalDays, Valid: true},
		NextReviewAt: pgtype.Timestamptz{Time: out.NextReviewAt, Valid: true},
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.VocabularyPracticeResponse{}, ErrNotFound
	}
	if err != nil {
		return domain.VocabularyPracticeResponse{}, err
	}

	s.recordMissionAction(ctx, userID, "srs_review")

	return toPracticeResponse(saved, quality), nil
}

func toPracticeResponse(saved db.UserVocabularyReview, quality int32) domain.VocabularyPracticeResponse {
	return domain.VocabularyPracticeResponse{
		VocabularyReviewResponse: domain.VocabularyReviewResponse{
			VocabularyID: uuid.UUID(saved.VocabularyID.Bytes),
			NewStage:     saved.SrsStage.Int32,
			IntervalDays: saved.IntervalDays.Int32,
			NextReviewAt: saved.NextReviewAt.Time,
		},
		Quality:       quality,
		PracticeCount: saved.PracticeCount,
	}
}

// nextSM2 tính lịch ôn tiếp theo theo SM-2 từ tiến độ hiện tại (chưa có thì dùng mặc định)
func (s *SRSService) nextSM2(ctx context.Context, userID, vocabularyID uuid.UUID, quality int32) (srs.SRSOutput, error) {
	input := srs.SRSInput{
		EaseFactor: defaultEaseFactor,
		Quality:    srs.ReviewQuality(quality),
	}

	current, err := s.repo.GetVocabularyReview(ctx, db.GetVocabularyReviewParams{
		UserID:       toPgUUID(userID),
		VocabularyID: toPgUUID(vocabularyID),
	})
	switch {
	case err == nil:
		input.SRSStage = current.SrsStage.Int32
		input.IntervalDays = current.IntervalDays.Int32
		if current.EaseFactor.Valid {
			input.EaseFactor = current.EaseFactor.Float64
		}
	case errors.Is(err, pgx.ErrNoRows):
		// Lần ôn tập đầu tiên — dùng giá trị mặc định
	default:
		return srs.SRSOutput{}, err
	}

	return srs.CalculateSM2(input, s.now()), nil
}

// ReviewVocabulary chấm điểm một lần ôn tập theo SM-2 và lưu kết quả
func (s *SRSService) ReviewVocabulary(ctx context.Context, userID uuid.UUID, req domain.VocabularyReviewRequest) (domain.VocabularyReviewResponse, error) {
	if userID == uuid.Nil || req.VocabularyID == uuid.Nil || req.Quality < 0 || req.Quality > 5 {
		return domain.VocabularyReviewResponse{}, ErrInvalidInput
	}

	out, err := s.nextSM2(ctx, userID, req.VocabularyID, req.Quality)
	if err != nil {
		return domain.VocabularyReviewResponse{}, err
	}

	saved, err := s.repo.UpsertVocabularyReview(ctx, db.UpsertVocabularyReviewParams{
		UserID:       toPgUUID(userID),
		VocabularyID: toPgUUID(req.VocabularyID),
		SrsStage:     pgtype.Int4{Int32: out.NewSRSStage, Valid: true},
		EaseFactor:   pgtype.Float8{Float64: out.NewEaseFactor, Valid: true},
		IntervalDays: pgtype.Int4{Int32: out.NewIntervalDays, Valid: true},
		NextReviewAt: pgtype.Timestamptz{Time: out.NextReviewAt, Valid: true},
	})
	if isPgError(err, pgForeignKeyViolation) {
		// vocabulary_id (hoặc user) không tồn tại
		return domain.VocabularyReviewResponse{}, ErrNotFound
	}
	if err != nil {
		return domain.VocabularyReviewResponse{}, err
	}

	s.recordMissionAction(ctx, userID, "srs_review")

	return domain.VocabularyReviewResponse{
		VocabularyID: uuid.UUID(saved.VocabularyID.Bytes),
		NewStage:     saved.SrsStage.Int32,
		IntervalDays: saved.IntervalDays.Int32,
		NextReviewAt: saved.NextReviewAt.Time,
	}, nil
}

// GetNewVocabularies trả về các từ user chưa học (chưa có review row) để học mới
func (s *SRSService) GetNewVocabularies(ctx context.Context, userID uuid.UUID, languageID string, limit int32) ([]NewVocabulary, error) {
	if limit <= 0 {
		limit = defaultNewBatchSize
	}
	if limit > maxDueLimit {
		limit = maxDueLimit
	}

	rows, err := s.repo.ListNewVocabulariesForUser(ctx, db.ListNewVocabulariesForUserParams{
		LanguageID: languageID,
		UserID:     toPgUUID(userID),
		Limit:      limit,
	})
	if err != nil {
		return nil, err
	}

	results := make([]NewVocabulary, 0, len(rows))
	for _, v := range rows {
		results = append(results, NewVocabulary{
			VocabularyID: uuid.UUID(v.ID.Bytes),
			LanguageID:   v.LanguageID,
			Term:         v.Term,
			Phonetic:     v.Phonetic.String,
			Meaning:      v.Meaning,
			Example:      v.Example.String,
			Topic:        v.Topic.String,
			Level:        v.Level.String,
			AudioURL:     v.AudioUrl.String,
		})
	}
	return results, nil
}

// LearnVocabulary đánh dấu "đã học" một từ mới: tạo review row stage 0, đến hạn
// ôn ngay. Đã học rồi thì giữ nguyên tiến độ (idempotent).
func (s *SRSService) LearnVocabulary(ctx context.Context, userID uuid.UUID, vocabularyID uuid.UUID) error {
	if userID == uuid.Nil || vocabularyID == uuid.Nil {
		return ErrInvalidInput
	}

	inserted, err := s.repo.CreateVocabularyReviewIfAbsent(ctx, db.CreateVocabularyReviewIfAbsentParams{
		UserID:       toPgUUID(userID),
		VocabularyID: toPgUUID(vocabularyID),
	})
	if isPgError(err, pgForeignKeyViolation) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}

	if inserted > 0 {
		// Chỉ tính nhiệm vụ khi đây thực sự là lần học đầu (ON CONFLICT DO
		// NOTHING trả 0 dòng nếu đã học rồi) — gọi lại hàm idempotent này
		// không được cộng progress nhiều lần cho cùng 1 từ.
		s.recordMissionAction(ctx, userID, "learn_word")
	}
	return nil
}

func toPgUUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: id, Valid: true}
}
