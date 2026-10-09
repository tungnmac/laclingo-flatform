package service

import (
	"context"
	"encoding/json"
	"errors"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// ChallengeQuestionRepository định nghĩa Interface tiếp xúc với cơ sở dữ liệu
// (quản lý ngân hàng câu hỏi thách đấu — tách khỏi ChallengeRepository vì đó
// là luồng chơi game, còn đây là luồng quản trị nội dung).
type ChallengeQuestionRepository interface {
	CreateChallengeQuestion(ctx context.Context, arg db.CreateChallengeQuestionParams) (db.ChallengeQuestion, error)
	ListChallengeQuestionsByLanguage(ctx context.Context, arg db.ListChallengeQuestionsByLanguageParams) ([]db.ListChallengeQuestionsByLanguageRow, error)
	UpdateChallengeQuestion(ctx context.Context, arg db.UpdateChallengeQuestionParams) (db.ChallengeQuestion, error)
	DeleteChallengeQuestion(ctx context.Context, id pgtype.UUID) error
}

// ChallengeQuestionRequest — body tạo/sửa 1 câu hỏi trong ngân hàng thách đấu
type ChallengeQuestionRequest struct {
	LanguageID   string   `json:"language_id" example:"en"`
	Question     string   `json:"question"`
	Options      []string `json:"options"`
	CorrectIndex int32    `json:"correct_index" minimum:"0"`
	Explanation  string   `json:"explanation,omitempty"`
	Difficulty   int32    `json:"difficulty" minimum:"1" maximum:"5" example:"1"`
}

// ChallengeQuestionResponse — câu hỏi đầy đủ (CÓ correct_index, chỉ admin dùng)
type ChallengeQuestionResponse struct {
	ID           uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	LanguageID   string    `json:"language_id,omitempty"`
	Question     string    `json:"question"`
	Options      []string  `json:"options"`
	CorrectIndex int32     `json:"correct_index"`
	Explanation  string    `json:"explanation,omitempty"`
	Difficulty   int32     `json:"difficulty"`
}

type ChallengeQuestionService struct {
	repo ChallengeQuestionRepository
}

func NewChallengeQuestionService(repo ChallengeQuestionRepository) *ChallengeQuestionService {
	return &ChallengeQuestionService{repo: repo}
}

func toChallengeQuestionResponse(q db.ChallengeQuestion) ChallengeQuestionResponse {
	var options []string
	_ = json.Unmarshal(q.Options, &options)
	return ChallengeQuestionResponse{
		ID:           uuid.UUID(q.ID.Bytes),
		LanguageID:   q.LanguageID.String,
		Question:     q.Question,
		Options:      options,
		CorrectIndex: q.CorrectIndex,
		Explanation:  q.Explanation.String,
		Difficulty:   q.Difficulty,
	}
}

func validateChallengeQuestionRequest(req ChallengeQuestionRequest) error {
	if req.Question == "" || len(req.Options) < 2 || req.CorrectIndex < 0 || int(req.CorrectIndex) >= len(req.Options) {
		return ErrInvalidInput
	}
	return nil
}

// CreateQuestion thêm 1 câu hỏi mới vào ngân hàng thách đấu
func (s *ChallengeQuestionService) CreateQuestion(ctx context.Context, req ChallengeQuestionRequest) (ChallengeQuestionResponse, error) {
	if err := validateChallengeQuestionRequest(req); err != nil {
		return ChallengeQuestionResponse{}, err
	}
	difficulty := req.Difficulty
	if difficulty == 0 {
		difficulty = 1
	}
	options, err := json.Marshal(req.Options)
	if err != nil {
		return ChallengeQuestionResponse{}, ErrInvalidInput
	}

	q, err := s.repo.CreateChallengeQuestion(ctx, db.CreateChallengeQuestionParams{
		LanguageID:   pgtype.Text{String: req.LanguageID, Valid: req.LanguageID != ""},
		Question:     req.Question,
		Options:      options,
		CorrectIndex: req.CorrectIndex,
		Explanation:  pgtype.Text{String: req.Explanation, Valid: req.Explanation != ""},
		Difficulty:   difficulty,
	})
	if err != nil {
		return ChallengeQuestionResponse{}, err
	}
	return toChallengeQuestionResponse(q), nil
}

// ListQuestions trả về 1 trang câu hỏi của 1 ngôn ngữ (admin quản lý), lọc
// theo search (khớp nội dung câu hỏi)/difficulty, phân trang server-side.
func (s *ChallengeQuestionService) ListQuestions(ctx context.Context, languageID, search string, difficulty, page, pageSize int32) (PageResult[ChallengeQuestionResponse], error) {
	limit, offset := NormalizePage(page, pageSize)
	rows, err := s.repo.ListChallengeQuestionsByLanguage(ctx, db.ListChallengeQuestionsByLanguageParams{
		LanguageID: pgtype.Text{String: languageID, Valid: languageID != ""},
		Search:     pgtype.Text{String: search, Valid: search != ""},
		Difficulty: pgtype.Int4{Int32: difficulty, Valid: difficulty != 0},
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		return PageResult[ChallengeQuestionResponse]{}, err
	}
	results := make([]ChallengeQuestionResponse, 0, len(rows))
	var total int64
	for _, q := range rows {
		total = q.TotalCount
		results = append(results, toChallengeQuestionResponse(db.ChallengeQuestion{
			ID: q.ID, LanguageID: q.LanguageID, Question: q.Question, Options: q.Options,
			CorrectIndex: q.CorrectIndex, Explanation: q.Explanation, Difficulty: q.Difficulty, CreatedAt: q.CreatedAt,
		}))
	}
	return PageResult[ChallengeQuestionResponse]{Items: results, Total: total}, nil
}

// UpdateQuestion sửa 1 câu hỏi (không đổi language_id)
func (s *ChallengeQuestionService) UpdateQuestion(ctx context.Context, id uuid.UUID, req ChallengeQuestionRequest) (ChallengeQuestionResponse, error) {
	if err := validateChallengeQuestionRequest(req); err != nil {
		return ChallengeQuestionResponse{}, err
	}
	options, err := json.Marshal(req.Options)
	if err != nil {
		return ChallengeQuestionResponse{}, ErrInvalidInput
	}

	q, err := s.repo.UpdateChallengeQuestion(ctx, db.UpdateChallengeQuestionParams{
		ID:           toPgUUID(id),
		Question:     req.Question,
		Options:      options,
		CorrectIndex: req.CorrectIndex,
		Explanation:  pgtype.Text{String: req.Explanation, Valid: req.Explanation != ""},
		Difficulty:   req.Difficulty,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return ChallengeQuestionResponse{}, ErrNotFound
	}
	if err != nil {
		return ChallengeQuestionResponse{}, err
	}
	return toChallengeQuestionResponse(q), nil
}

// DeleteQuestion xoá 1 câu hỏi khỏi ngân hàng
func (s *ChallengeQuestionService) DeleteQuestion(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteChallengeQuestion(ctx, toPgUUID(id))
}

// BulkImportQuestions nhập hàng loạt câu hỏi — lỗi 1 dòng không chặn các dòng khác
func (s *ChallengeQuestionService) BulkImportQuestions(ctx context.Context, items []ChallengeQuestionRequest) []BulkImportResult {
	return runBulkImport(items, func(req ChallengeQuestionRequest) error {
		_, err := s.CreateQuestion(ctx, req)
		return err
	})
}
