package service

import (
	"context"
	"errors"
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
}

type SRSService struct {
	repo SRSRepository
	now  func() time.Time
}

func NewSRSService(repo SRSRepository) *SRSService {
	return &SRSService{
		repo: repo,
		now:  time.Now,
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

	results := make([]DueVocabulary, 0, len(rows))
	for _, r := range rows {
		results = append(results, DueVocabulary{
			VocabularyID: uuid.UUID(r.VocabularyID.Bytes),
			LanguageID:   r.LanguageID,
			Term:         r.Term,
			Phonetic:     r.Phonetic.String,
			Meaning:      r.Meaning,
			AudioURL:     r.AudioUrl.String,
			SRSStage:     r.SrsStage.Int32,
			NextReviewAt: r.NextReviewAt.Time,
		})
	}
	return results, nil
}

// ReviewVocabulary chấm điểm một lần ôn tập theo SM-2 và lưu kết quả
func (s *SRSService) ReviewVocabulary(ctx context.Context, userID uuid.UUID, req domain.VocabularyReviewRequest) (domain.VocabularyReviewResponse, error) {
	if userID == uuid.Nil || req.VocabularyID == uuid.Nil || req.Quality < 0 || req.Quality > 5 {
		return domain.VocabularyReviewResponse{}, ErrInvalidInput
	}

	input := srs.SRSInput{
		EaseFactor: defaultEaseFactor,
		Quality:    srs.ReviewQuality(req.Quality),
	}

	current, err := s.repo.GetVocabularyReview(ctx, db.GetVocabularyReviewParams{
		UserID:       toPgUUID(userID),
		VocabularyID: toPgUUID(req.VocabularyID),
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
		return domain.VocabularyReviewResponse{}, err
	}

	out := srs.CalculateSM2(input, s.now())

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

	_, err := s.repo.CreateVocabularyReviewIfAbsent(ctx, db.CreateVocabularyReviewIfAbsentParams{
		UserID:       toPgUUID(userID),
		VocabularyID: toPgUUID(vocabularyID),
	})
	if isPgError(err, pgForeignKeyViolation) {
		return ErrNotFound
	}
	return err
}

func toPgUUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: id, Valid: true}
}
