package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// ListeningRepository định nghĩa Interface tiếp xúc với cơ sở dữ liệu
type ListeningRepository interface {
	ListListeningPassagesByLanguage(ctx context.Context, languageID string) ([]db.ListListeningPassagesByLanguageRow, error)
	GetListeningPassageByID(ctx context.Context, id pgtype.UUID) (db.ListeningPassage, error)
	ListListeningQuestionsByPassage(ctx context.Context, passageID pgtype.UUID) ([]db.ListListeningQuestionsByPassageRow, error)
	GetListeningQuestionByID(ctx context.Context, id pgtype.UUID) (db.ListeningQuestion, error)

	CreateListeningPassage(ctx context.Context, arg db.CreateListeningPassageParams) (db.ListeningPassage, error)
	UpdateListeningPassage(ctx context.Context, arg db.UpdateListeningPassageParams) (db.ListeningPassage, error)
	DeleteListeningPassage(ctx context.Context, id pgtype.UUID) error
	ListListeningPassagesAdminPaged(ctx context.Context, arg db.ListListeningPassagesAdminPagedParams) ([]db.ListListeningPassagesAdminPagedRow, error)
	ListListeningQuestionsByPassageAdmin(ctx context.Context, arg db.ListListeningQuestionsByPassageAdminParams) ([]db.ListListeningQuestionsByPassageAdminRow, error)
	CreateListeningQuestion(ctx context.Context, arg db.CreateListeningQuestionParams) (db.ListeningQuestion, error)
	UpdateListeningQuestion(ctx context.Context, arg db.UpdateListeningQuestionParams) (db.ListeningQuestion, error)
	DeleteListeningQuestion(ctx context.Context, id pgtype.UUID) error
}

// ListeningPassageSummary — 1 bài luyện nghe trong danh sách (không kèm script/câu hỏi)
type ListeningPassageSummary struct {
	ID         uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	Title      string    `json:"title" example:"A Day at the Market"`
	Topic      string    `json:"topic,omitempty"`
	Level      string    `json:"level" example:"A1"`
	OrderIndex int32     `json:"order_index"`
}

// ListeningQuestionResponse — câu hỏi hiển thị cho learner, KHÔNG có correct_answer
// (chỉ server biết, chấm qua SubmitAnswer).
type ListeningQuestionResponse struct {
	ID       uuid.UUID       `json:"id" swaggertype:"string" format:"uuid"`
	Question string          `json:"question"`
	Options  json.RawMessage `json:"options" swaggertype:"array,string"`
}

// ListeningPassageDetail — bài luyện nghe đầy đủ: script để phát TTS + câu hỏi
type ListeningPassageDetail struct {
	ID        uuid.UUID                   `json:"id" swaggertype:"string" format:"uuid"`
	Title     string                      `json:"title"`
	Script    string                      `json:"script"`
	Topic     string                      `json:"topic,omitempty"`
	Level     string                      `json:"level"`
	Questions []ListeningQuestionResponse `json:"questions"`
}

// SubmitListeningAnswerResponse — kết quả chấm 1 câu hỏi nghe hiểu
type SubmitListeningAnswerResponse struct {
	Correct       bool   `json:"correct"`
	CorrectAnswer string `json:"correct_answer"`
	Explanation   string `json:"explanation,omitempty"`
}

type ListeningService struct {
	repo     ListeningRepository
	missions *MissionService
}

func NewListeningService(repo ListeningRepository, missions *MissionService) *ListeningService {
	return &ListeningService{repo: repo, missions: missions}
}

// ListPassages trả về danh sách bài luyện nghe của 1 ngôn ngữ (không kèm script/câu hỏi)
func (s *ListeningService) ListPassages(ctx context.Context, languageID string) ([]ListeningPassageSummary, error) {
	rows, err := s.repo.ListListeningPassagesByLanguage(ctx, languageID)
	if err != nil {
		return nil, err
	}
	results := make([]ListeningPassageSummary, 0, len(rows))
	for _, r := range rows {
		results = append(results, ListeningPassageSummary{
			ID:         uuid.UUID(r.ID.Bytes),
			Title:      r.Title,
			Topic:      r.Topic.String,
			Level:      r.Level.String,
			OrderIndex: r.OrderIndex.Int32,
		})
	}
	return results, nil
}

// GetPassageDetail trả về script (để FE tự phát bằng Web Speech TTS) + câu hỏi
// (không lộ đáp án đúng).
func (s *ListeningService) GetPassageDetail(ctx context.Context, id uuid.UUID) (ListeningPassageDetail, error) {
	passage, err := s.repo.GetListeningPassageByID(ctx, toPgUUID(id))
	if errors.Is(err, pgx.ErrNoRows) {
		return ListeningPassageDetail{}, ErrNotFound
	}
	if err != nil {
		return ListeningPassageDetail{}, err
	}

	questions, err := s.repo.ListListeningQuestionsByPassage(ctx, passage.ID)
	if err != nil {
		return ListeningPassageDetail{}, err
	}

	questionResponses := make([]ListeningQuestionResponse, 0, len(questions))
	for _, q := range questions {
		options := json.RawMessage(q.Options)
		if options == nil || bytes.Equal(options, []byte("null")) {
			options = json.RawMessage("[]")
		}
		questionResponses = append(questionResponses, ListeningQuestionResponse{
			ID:       uuid.UUID(q.ID.Bytes),
			Question: q.Question,
			Options:  options,
		})
	}

	return ListeningPassageDetail{
		ID:        uuid.UUID(passage.ID.Bytes),
		Title:     passage.Title,
		Script:    passage.Script,
		Topic:     passage.Topic.String,
		Level:     passage.Level.String,
		Questions: questionResponses,
	}, nil
}

// SubmitAnswer chấm 1 câu hỏi nghe hiểu — đúng thì ghi nhận nhiệm vụ
// "listening_practice" (+1), và luôn trả lại đáp án đúng + giải thích (khác
// grammar: ở đây FE không có sẵn đáp án từ trước, nên tiết lộ luôn sau khi nộp).
func (s *ListeningService) SubmitAnswer(ctx context.Context, userID, questionID uuid.UUID, answer string) (SubmitListeningAnswerResponse, error) {
	if userID == uuid.Nil || questionID == uuid.Nil {
		return SubmitListeningAnswerResponse{}, ErrInvalidInput
	}

	question, err := s.repo.GetListeningQuestionByID(ctx, toPgUUID(questionID))
	if errors.Is(err, pgx.ErrNoRows) {
		return SubmitListeningAnswerResponse{}, ErrNotFound
	}
	if err != nil {
		return SubmitListeningAnswerResponse{}, err
	}

	correct := strings.EqualFold(strings.TrimSpace(answer), strings.TrimSpace(question.CorrectAnswer))
	if correct {
		if err := s.missions.RecordAction(ctx, userID, "listening_practice", 1); err != nil {
			log.Printf("❌ mission: RecordAction user=%s action=listening_practice: %v", userID, err)
		}
	}

	return SubmitListeningAnswerResponse{
		Correct:       correct,
		CorrectAnswer: question.CorrectAnswer,
		Explanation:   question.Explanation.String,
	}, nil
}

// ===== Admin CRUD (quản lý nội dung luyện nghe) =====

type ListeningPassageRequest struct {
	LanguageID string `json:"language_id" example:"en"`
	Title      string `json:"title"`
	Script     string `json:"script"`
	Topic      string `json:"topic,omitempty"`
	Level      string `json:"level" example:"A1"`
	OrderIndex int32  `json:"order_index"`
}

// ListeningPassageAdminResponse — bài luyện nghe nhìn từ admin (có script đầy đủ)
type ListeningPassageAdminResponse struct {
	ID         uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	LanguageID string    `json:"language_id"`
	Title      string    `json:"title"`
	Script     string    `json:"script"`
	Topic      string    `json:"topic,omitempty"`
	Level      string    `json:"level"`
	OrderIndex int32     `json:"order_index"`
}

type ListeningQuestionRequest struct {
	PassageID     uuid.UUID `json:"passage_id" swaggertype:"string" format:"uuid"`
	Question      string    `json:"question"`
	Options       []string  `json:"options"`
	CorrectAnswer string    `json:"correct_answer"`
	Explanation   string    `json:"explanation,omitempty"`
	OrderIndex    int32     `json:"order_index"`
}

// ListeningQuestionAdminResponse — câu hỏi nhìn từ admin (CÓ correct_answer)
type ListeningQuestionAdminResponse struct {
	ID            uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	Question      string    `json:"question"`
	Options       []string  `json:"options"`
	CorrectAnswer string    `json:"correct_answer"`
	Explanation   string    `json:"explanation,omitempty"`
	OrderIndex    int32     `json:"order_index"`
}

func toListeningPassageAdminResponse(p db.ListeningPassage) ListeningPassageAdminResponse {
	return ListeningPassageAdminResponse{
		ID:         uuid.UUID(p.ID.Bytes),
		LanguageID: p.LanguageID,
		Title:      p.Title,
		Script:     p.Script,
		Topic:      p.Topic.String,
		Level:      p.Level.String,
		OrderIndex: p.OrderIndex.Int32,
	}
}

// CreatePassage tạo 1 bài luyện nghe mới
func (s *ListeningService) CreatePassage(ctx context.Context, req ListeningPassageRequest) (ListeningPassageAdminResponse, error) {
	if req.LanguageID == "" || req.Title == "" || req.Script == "" {
		return ListeningPassageAdminResponse{}, ErrInvalidInput
	}
	p, err := s.repo.CreateListeningPassage(ctx, db.CreateListeningPassageParams{
		LanguageID: req.LanguageID,
		Title:      req.Title,
		Script:     req.Script,
		Topic:      pgtype.Text{String: req.Topic, Valid: req.Topic != ""},
		Level:      pgtype.Text{String: req.Level, Valid: req.Level != ""},
		OrderIndex: pgtype.Int4{Int32: req.OrderIndex, Valid: true},
	})
	if isPgError(err, pgForeignKeyViolation) {
		return ListeningPassageAdminResponse{}, fmt.Errorf("không tìm thấy ngôn ngữ: %w", ErrInvalidInput)
	}
	if err != nil {
		return ListeningPassageAdminResponse{}, err
	}
	return toListeningPassageAdminResponse(p), nil
}

// ListPassagesAdmin trả về toàn bộ bài luyện nghe của 1 ngôn ngữ (có script đầy đủ)
func (s *ListeningService) ListPassagesAdmin(ctx context.Context, languageID, search, level string, page, pageSize int32) (PageResult[ListeningPassageAdminResponse], error) {
	limit, offset := NormalizePage(page, pageSize)
	rows, err := s.repo.ListListeningPassagesAdminPaged(ctx, db.ListListeningPassagesAdminPagedParams{
		LanguageID: languageID,
		Search:     pgtype.Text{String: search, Valid: search != ""},
		Level:      pgtype.Text{String: level, Valid: level != ""},
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		return PageResult[ListeningPassageAdminResponse]{}, err
	}
	results := make([]ListeningPassageAdminResponse, 0, len(rows))
	var total int64
	for _, r := range rows {
		total = r.TotalCount
		results = append(results, toListeningPassageAdminResponse(db.ListeningPassage{
			ID: r.ID, LanguageID: r.LanguageID, Title: r.Title, Script: r.Script,
			Topic: r.Topic, Level: r.Level, OrderIndex: r.OrderIndex, CreatedAt: r.CreatedAt, UpdatedAt: r.UpdatedAt,
		}))
	}
	return PageResult[ListeningPassageAdminResponse]{Items: results, Total: total}, nil
}

// UpdatePassage sửa 1 bài luyện nghe (không đổi language_id)
func (s *ListeningService) UpdatePassage(ctx context.Context, id uuid.UUID, req ListeningPassageRequest) (ListeningPassageAdminResponse, error) {
	if req.Title == "" || req.Script == "" {
		return ListeningPassageAdminResponse{}, ErrInvalidInput
	}
	p, err := s.repo.UpdateListeningPassage(ctx, db.UpdateListeningPassageParams{
		ID:         toPgUUID(id),
		Title:      req.Title,
		Script:     req.Script,
		Topic:      pgtype.Text{String: req.Topic, Valid: req.Topic != ""},
		Level:      pgtype.Text{String: req.Level, Valid: req.Level != ""},
		OrderIndex: pgtype.Int4{Int32: req.OrderIndex, Valid: true},
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return ListeningPassageAdminResponse{}, ErrNotFound
	}
	if err != nil {
		return ListeningPassageAdminResponse{}, err
	}
	return toListeningPassageAdminResponse(p), nil
}

// DeletePassage xoá 1 bài luyện nghe (CASCADE xoá câu hỏi bên trong)
func (s *ListeningService) DeletePassage(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteListeningPassage(ctx, toPgUUID(id))
}

// BulkImportPassages nhập hàng loạt bài luyện nghe
func (s *ListeningService) BulkImportPassages(ctx context.Context, items []ListeningPassageRequest) []BulkImportResult {
	return runBulkImport(items, func(req ListeningPassageRequest) error {
		_, err := s.CreatePassage(ctx, req)
		return err
	})
}

func toListeningQuestionAdminResponse(q db.ListeningQuestion) ListeningQuestionAdminResponse {
	var options []string
	_ = json.Unmarshal(q.Options, &options)
	return ListeningQuestionAdminResponse{
		ID:            uuid.UUID(q.ID.Bytes),
		Question:      q.Question,
		Options:       options,
		CorrectAnswer: q.CorrectAnswer,
		Explanation:   q.Explanation.String,
		OrderIndex:    q.OrderIndex.Int32,
	}
}

// CreateQuestion tạo 1 câu hỏi nghe hiểu mới cho 1 passage
func (s *ListeningService) CreateQuestion(ctx context.Context, req ListeningQuestionRequest) (ListeningQuestionAdminResponse, error) {
	if req.PassageID == uuid.Nil || req.Question == "" || len(req.Options) < 2 || req.CorrectAnswer == "" {
		return ListeningQuestionAdminResponse{}, ErrInvalidInput
	}
	options, err := json.Marshal(req.Options)
	if err != nil {
		return ListeningQuestionAdminResponse{}, ErrInvalidInput
	}
	q, err := s.repo.CreateListeningQuestion(ctx, db.CreateListeningQuestionParams{
		PassageID:     toPgUUID(req.PassageID),
		Question:      req.Question,
		Options:       options,
		CorrectAnswer: req.CorrectAnswer,
		Explanation:   pgtype.Text{String: req.Explanation, Valid: req.Explanation != ""},
		OrderIndex:    pgtype.Int4{Int32: req.OrderIndex, Valid: true},
	})
	if isPgError(err, pgForeignKeyViolation) {
		return ListeningQuestionAdminResponse{}, fmt.Errorf("không tìm thấy bài luyện nghe: %w", ErrInvalidInput)
	}
	if err != nil {
		return ListeningQuestionAdminResponse{}, err
	}
	return toListeningQuestionAdminResponse(q), nil
}

// ListQuestionsAdmin trả về câu hỏi của 1 passage, CÓ correct_answer (chỉ admin dùng)
func (s *ListeningService) ListQuestionsAdmin(ctx context.Context, passageID uuid.UUID, search string, page, pageSize int32) (PageResult[ListeningQuestionAdminResponse], error) {
	limit, offset := NormalizePage(page, pageSize)
	rows, err := s.repo.ListListeningQuestionsByPassageAdmin(ctx, db.ListListeningQuestionsByPassageAdminParams{
		PassageID: toPgUUID(passageID),
		Search:    pgtype.Text{String: search, Valid: search != ""},
		Limit:     limit,
		Offset:    offset,
	})
	if err != nil {
		return PageResult[ListeningQuestionAdminResponse]{}, err
	}
	results := make([]ListeningQuestionAdminResponse, 0, len(rows))
	var total int64
	for _, q := range rows {
		total = q.TotalCount
		results = append(results, toListeningQuestionAdminResponse(db.ListeningQuestion{
			ID: q.ID, PassageID: q.PassageID, Question: q.Question, Options: q.Options,
			CorrectAnswer: q.CorrectAnswer, Explanation: q.Explanation, OrderIndex: q.OrderIndex,
		}))
	}
	return PageResult[ListeningQuestionAdminResponse]{Items: results, Total: total}, nil
}

// UpdateQuestion sửa 1 câu hỏi nghe hiểu (không đổi passage_id)
func (s *ListeningService) UpdateQuestion(ctx context.Context, id uuid.UUID, req ListeningQuestionRequest) (ListeningQuestionAdminResponse, error) {
	if req.Question == "" || len(req.Options) < 2 || req.CorrectAnswer == "" {
		return ListeningQuestionAdminResponse{}, ErrInvalidInput
	}
	options, err := json.Marshal(req.Options)
	if err != nil {
		return ListeningQuestionAdminResponse{}, ErrInvalidInput
	}
	q, err := s.repo.UpdateListeningQuestion(ctx, db.UpdateListeningQuestionParams{
		ID:            toPgUUID(id),
		Question:      req.Question,
		Options:       options,
		CorrectAnswer: req.CorrectAnswer,
		Explanation:   pgtype.Text{String: req.Explanation, Valid: req.Explanation != ""},
		OrderIndex:    pgtype.Int4{Int32: req.OrderIndex, Valid: true},
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return ListeningQuestionAdminResponse{}, ErrNotFound
	}
	if err != nil {
		return ListeningQuestionAdminResponse{}, err
	}
	return toListeningQuestionAdminResponse(q), nil
}

// DeleteQuestion xoá 1 câu hỏi nghe hiểu
func (s *ListeningService) DeleteQuestion(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteListeningQuestion(ctx, toPgUUID(id))
}

// BulkImportQuestions nhập hàng loạt câu hỏi nghe hiểu
func (s *ListeningService) BulkImportQuestions(ctx context.Context, items []ListeningQuestionRequest) []BulkImportResult {
	return runBulkImport(items, func(req ListeningQuestionRequest) error {
		_, err := s.CreateQuestion(ctx, req)
		return err
	})
}
