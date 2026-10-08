package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"strings"
	"time"

	"laclingo-backend/internal/repository/db"
	"laclingo-backend/internal/storage"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// ListeningRepository định nghĩa Interface tiếp xúc với cơ sở dữ liệu
type ListeningRepository interface {
	ListListeningPassagesByLanguage(ctx context.Context, arg db.ListListeningPassagesByLanguageParams) ([]db.ListListeningPassagesByLanguageRow, error)
	GetListeningPassageByID(ctx context.Context, id pgtype.UUID) (db.ListeningPassage, error)
	ListListeningQuestionsByPassage(ctx context.Context, passageID pgtype.UUID) ([]db.ListListeningQuestionsByPassageRow, error)
	GetListeningQuestionByID(ctx context.Context, id pgtype.UUID) (db.ListeningQuestion, error)
	ListListeningTopics(ctx context.Context, languageID string) ([]db.ListListeningTopicsRow, error)

	CreateListeningPassage(ctx context.Context, arg db.CreateListeningPassageParams) (db.ListeningPassage, error)
	UpdateListeningPassage(ctx context.Context, arg db.UpdateListeningPassageParams) (db.ListeningPassage, error)
	DeleteListeningPassage(ctx context.Context, id pgtype.UUID) error
	ListListeningPassagesAdminPaged(ctx context.Context, arg db.ListListeningPassagesAdminPagedParams) ([]db.ListListeningPassagesAdminPagedRow, error)
	ListListeningQuestionsByPassageAdmin(ctx context.Context, arg db.ListListeningQuestionsByPassageAdminParams) ([]db.ListListeningQuestionsByPassageAdminRow, error)
	CreateListeningQuestion(ctx context.Context, arg db.CreateListeningQuestionParams) (db.ListeningQuestion, error)
	UpdateListeningQuestion(ctx context.Context, arg db.UpdateListeningQuestionParams) (db.ListeningQuestion, error)
	DeleteListeningQuestion(ctx context.Context, id pgtype.UUID) error
	CreateListeningTopic(ctx context.Context, arg db.CreateListeningTopicParams) (db.ListeningTopic, error)
	ListListeningTopicsByLanguageAdmin(ctx context.Context, arg db.ListListeningTopicsByLanguageAdminParams) ([]db.ListListeningTopicsByLanguageAdminRow, error)
	DeleteListeningTopic(ctx context.Context, arg db.DeleteListeningTopicParams) error
	UpdateListeningPassageAudioKey(ctx context.Context, arg db.UpdateListeningPassageAudioKeyParams) (db.ListeningPassage, error)
}

// ListeningPassageSummary — 1 bài luyện nghe trong danh sách (không kèm script/câu hỏi)
type ListeningPassageSummary struct {
	ID         uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	Title      string    `json:"title" example:"A Day at the Market"`
	Topic      string    `json:"topic,omitempty"`
	Level      string    `json:"level" example:"A1"`
	OrderIndex int32     `json:"order_index"`
}

// ListeningTopic là một chủ đề luyện nghe kèm số bài trong chủ đề đó
type ListeningTopic struct {
	Name  string `json:"name" example:"Daily life"`
	Icon  string `json:"icon" example:"🎧"`
	Total int32  `json:"total" example:"5"`
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
	AudioURL  string                      `json:"audio_url,omitempty"` // link tạm (presigned) phát audio thật nếu có — không thì FE fallback TTS từ Script
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
	// r2 có thể nil — tính năng audio tắt nếu R2 chưa được cấu hình (xem
	// config.Config.R2Configured), các hàm liên quan trả ErrInvalidInput rõ ràng.
	r2 *storage.R2Client
}

func NewListeningService(repo ListeningRepository, missions *MissionService, r2 *storage.R2Client) *ListeningService {
	return &ListeningService{repo: repo, missions: missions, r2: r2}
}

// audioPresignTTL — đủ dài cho 1 phiên nghe, không cần bucket public.
const audioPresignTTL = 2 * time.Hour

// presignAudioURL trả về "" nếu bài không có audio hoặc R2 chưa cấu hình —
// KHÔNG coi là lỗi (audio luôn optional, có script TTS làm fallback).
func (s *ListeningService) presignAudioURL(ctx context.Context, audioKey pgtype.Text) string {
	if !audioKey.Valid || audioKey.String == "" || s.r2 == nil {
		return ""
	}
	url, err := s.r2.PresignGet(ctx, audioKey.String, audioPresignTTL)
	if err != nil {
		log.Printf("❌ presign audio key=%s: %v", audioKey.String, err)
		return ""
	}
	return url
}

// ListPassages trả về danh sách bài luyện nghe của 1 ngôn ngữ (không kèm
// script/câu hỏi). topic để trống thì lấy mọi chủ đề; truyền topic thì chỉ
// lấy bài của đúng chủ đề đó (trang chọn chủ đề, sau ListTopics).
func (s *ListeningService) ListPassages(ctx context.Context, languageID, topic string) ([]ListeningPassageSummary, error) {
	rows, err := s.repo.ListListeningPassagesByLanguage(ctx, db.ListListeningPassagesByLanguageParams{
		LanguageID: languageID,
		Topic:      pgtype.Text{String: topic, Valid: topic != ""},
	})
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

// ListTopics trả về các chủ đề luyện nghe của 1 ngôn ngữ kèm số bài mỗi chủ đề
func (s *ListeningService) ListTopics(ctx context.Context, languageID string) ([]ListeningTopic, error) {
	rows, err := s.repo.ListListeningTopics(ctx, languageID)
	if err != nil {
		return nil, err
	}
	results := make([]ListeningTopic, 0, len(rows))
	for _, r := range rows {
		results = append(results, ListeningTopic{Name: r.Name, Icon: r.Icon, Total: r.Total})
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
		AudioURL:  s.presignAudioURL(ctx, passage.AudioKey),
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
	AudioURL   string    `json:"audio_url,omitempty"` // link tạm (presigned) để admin nghe lại/kiểm tra
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

func (s *ListeningService) toListeningPassageAdminResponse(ctx context.Context, p db.ListeningPassage) ListeningPassageAdminResponse {
	return ListeningPassageAdminResponse{
		ID:         uuid.UUID(p.ID.Bytes),
		LanguageID: p.LanguageID,
		Title:      p.Title,
		Script:     p.Script,
		Topic:      p.Topic.String,
		Level:      p.Level.String,
		OrderIndex: p.OrderIndex.Int32,
		AudioURL:   s.presignAudioURL(ctx, p.AudioKey),
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
	return s.toListeningPassageAdminResponse(ctx, p), nil
}

// ListPassagesAdmin trả về toàn bộ bài luyện nghe của 1 ngôn ngữ (có script đầy đủ)
func (s *ListeningService) ListPassagesAdmin(ctx context.Context, languageID, search, topic, level string, page, pageSize int32) (PageResult[ListeningPassageAdminResponse], error) {
	limit, offset := NormalizePage(page, pageSize)
	rows, err := s.repo.ListListeningPassagesAdminPaged(ctx, db.ListListeningPassagesAdminPagedParams{
		LanguageID: languageID,
		Search:     pgtype.Text{String: search, Valid: search != ""},
		Topic:      pgtype.Text{String: topic, Valid: topic != ""},
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
		results = append(results, s.toListeningPassageAdminResponse(ctx, db.ListeningPassage{
			ID: r.ID, LanguageID: r.LanguageID, Title: r.Title, Script: r.Script,
			Topic: r.Topic, Level: r.Level, OrderIndex: r.OrderIndex, AudioKey: r.AudioKey, CreatedAt: r.CreatedAt, UpdatedAt: r.UpdatedAt,
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
	return s.toListeningPassageAdminResponse(ctx, p), nil
}

// DeletePassage xoá 1 bài luyện nghe (CASCADE xoá câu hỏi bên trong) và dọn
// luôn file audio trên R2 nếu có — xoá passage trước mà quên dọn R2 sẽ để
// rác vĩnh viễn trong bucket (không còn passage nào tham chiếu tới key đó
// để dọn sau).
func (s *ListeningService) DeletePassage(ctx context.Context, id uuid.UUID) error {
	if s.r2 != nil {
		passage, err := s.repo.GetListeningPassageByID(ctx, toPgUUID(id))
		if err == nil && passage.AudioKey.Valid && passage.AudioKey.String != "" {
			if err := s.r2.Delete(ctx, passage.AudioKey.String); err != nil {
				log.Printf("❌ xoá audio key=%s khi xoá passage id=%s: %v", passage.AudioKey.String, id, err)
			}
		}
	}
	return s.repo.DeleteListeningPassage(ctx, toPgUUID(id))
}

var allowedAudioContentTypes = map[string]bool{
	"audio/mpeg": true, "audio/mp3": true, "audio/wav": true, "audio/x-wav": true,
	"audio/ogg": true, "audio/mp4": true, "audio/x-m4a": true, "audio/webm": true,
}

const maxAudioBytes = 25 * 1024 * 1024 // 25MB — đủ vài phút audio nén, chặn upload quá khổ

// UploadAudio upload 1 file audio lên R2 và gắn vào passage (thay audio cũ
// nếu có, dọn luôn object cũ tránh rác bucket). ext nên lấy từ tên file gốc
// (vd ".mp3") để trình phát nhận diện đúng định dạng.
func (s *ListeningService) UploadAudio(ctx context.Context, passageID uuid.UUID, content io.Reader, size int64, contentType, ext string) (ListeningPassageAdminResponse, error) {
	if s.r2 == nil {
		return ListeningPassageAdminResponse{}, fmt.Errorf("chưa cấu hình lưu trữ audio (R2): %w", ErrInvalidInput)
	}
	if !allowedAudioContentTypes[contentType] {
		return ListeningPassageAdminResponse{}, fmt.Errorf("định dạng audio không hỗ trợ (%s): %w", contentType, ErrInvalidInput)
	}
	if size > maxAudioBytes {
		return ListeningPassageAdminResponse{}, fmt.Errorf("file audio quá lớn (tối đa %dMB): %w", maxAudioBytes/1024/1024, ErrInvalidInput)
	}

	passage, err := s.repo.GetListeningPassageByID(ctx, toPgUUID(passageID))
	if errors.Is(err, pgx.ErrNoRows) {
		return ListeningPassageAdminResponse{}, ErrNotFound
	}
	if err != nil {
		return ListeningPassageAdminResponse{}, err
	}

	key := fmt.Sprintf("listening/%s%s", passageID, ext)
	if err := s.r2.Upload(ctx, key, content, contentType); err != nil {
		return ListeningPassageAdminResponse{}, fmt.Errorf("upload audio thất bại: %w", err)
	}
	if passage.AudioKey.Valid && passage.AudioKey.String != "" && passage.AudioKey.String != key {
		if err := s.r2.Delete(ctx, passage.AudioKey.String); err != nil {
			log.Printf("❌ xoá audio cũ key=%s: %v", passage.AudioKey.String, err)
		}
	}

	updated, err := s.repo.UpdateListeningPassageAudioKey(ctx, db.UpdateListeningPassageAudioKeyParams{
		ID:       toPgUUID(passageID),
		AudioKey: pgtype.Text{String: key, Valid: true},
	})
	if err != nil {
		return ListeningPassageAdminResponse{}, err
	}
	return s.toListeningPassageAdminResponse(ctx, updated), nil
}

// DeleteAudio gỡ audio khỏi 1 bài luyện nghe (xoá object trên R2 + audio_key).
func (s *ListeningService) DeleteAudio(ctx context.Context, passageID uuid.UUID) (ListeningPassageAdminResponse, error) {
	if s.r2 == nil {
		return ListeningPassageAdminResponse{}, fmt.Errorf("chưa cấu hình lưu trữ audio (R2): %w", ErrInvalidInput)
	}
	passage, err := s.repo.GetListeningPassageByID(ctx, toPgUUID(passageID))
	if errors.Is(err, pgx.ErrNoRows) {
		return ListeningPassageAdminResponse{}, ErrNotFound
	}
	if err != nil {
		return ListeningPassageAdminResponse{}, err
	}
	if passage.AudioKey.Valid && passage.AudioKey.String != "" {
		if err := s.r2.Delete(ctx, passage.AudioKey.String); err != nil {
			log.Printf("❌ xoá audio key=%s: %v", passage.AudioKey.String, err)
		}
	}
	updated, err := s.repo.UpdateListeningPassageAudioKey(ctx, db.UpdateListeningPassageAudioKeyParams{
		ID:       toPgUUID(passageID),
		AudioKey: pgtype.Text{Valid: false},
	})
	if err != nil {
		return ListeningPassageAdminResponse{}, err
	}
	return s.toListeningPassageAdminResponse(ctx, updated), nil
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

// ===== Admin CRUD chủ đề luyện nghe =====

type ListeningTopicRequest struct {
	LanguageID string `json:"language_id" example:"en"`
	Name       string `json:"name" example:"Daily life"`
	Icon       string `json:"icon" example:"🎧"`
	OrderIndex int32  `json:"order_index"`
}

type ListeningTopicAdminResponse struct {
	LanguageID string `json:"language_id"`
	Name       string `json:"name"`
	Icon       string `json:"icon"`
	OrderIndex int32  `json:"order_index"`
}

func toListeningTopicAdminResponse(t db.ListeningTopic) ListeningTopicAdminResponse {
	return ListeningTopicAdminResponse{LanguageID: t.LanguageID, Name: t.Name, Icon: t.Icon, OrderIndex: t.OrderIndex}
}

// CreateOrUpdateTopic tạo chủ đề mới hoặc cập nhật icon/thứ tự nếu đã tồn tại
// (natural key là language_id+name, nên create/update dùng chung 1 upsert).
func (s *ListeningService) CreateOrUpdateTopic(ctx context.Context, req ListeningTopicRequest) (ListeningTopicAdminResponse, error) {
	if req.LanguageID == "" || req.Name == "" {
		return ListeningTopicAdminResponse{}, ErrInvalidInput
	}
	icon := req.Icon
	if icon == "" {
		icon = "🎧"
	}
	t, err := s.repo.CreateListeningTopic(ctx, db.CreateListeningTopicParams{
		LanguageID: req.LanguageID,
		Name:       req.Name,
		Icon:       icon,
		OrderIndex: req.OrderIndex,
	})
	if isPgError(err, pgForeignKeyViolation) {
		return ListeningTopicAdminResponse{}, fmt.Errorf("không tìm thấy ngôn ngữ: %w", ErrInvalidInput)
	}
	if err != nil {
		return ListeningTopicAdminResponse{}, err
	}
	return toListeningTopicAdminResponse(t), nil
}

// ListTopicsAdmin trả về toàn bộ chủ đề luyện nghe của 1 ngôn ngữ (icon/thứ tự hiển thị)
// ListTopicsAdmin trả về toàn bộ chủ đề luyện nghe của 1 ngôn ngữ — gộp chủ
// đề ĐÃ ĐĂNG KÝ (có icon/thứ tự riêng, trong listening_topics) với chủ đề
// ĐANG DÙNG trong bài luyện nghe nhưng CHƯA đăng ký (suy từ
// listening_passages.topic, icon mặc định 🎧) — nếu chỉ lấy từ
// listening_topics thì tab Chủ đề (và filter chủ đề) sẽ trống trơn ngay cả
// khi bài luyện nghe đã có chủ đề (chỉ chưa ai bấm "Thêm chủ đề" cho nó).
func (s *ListeningService) ListTopicsAdmin(ctx context.Context, languageID, search string, page, pageSize int32) (PageResult[ListeningTopicAdminResponse], error) {
	registeredRows, err := s.repo.ListListeningTopicsByLanguageAdmin(ctx, db.ListListeningTopicsByLanguageAdminParams{
		LanguageID: languageID,
		Limit:      1000,
	})
	if err != nil {
		return PageResult[ListeningTopicAdminResponse]{}, err
	}

	merged := make(map[string]ListeningTopicAdminResponse, len(registeredRows))
	order := make([]string, 0, len(registeredRows))
	for _, t := range registeredRows {
		merged[t.Name] = ListeningTopicAdminResponse{LanguageID: t.LanguageID, Name: t.Name, Icon: t.Icon, OrderIndex: t.OrderIndex}
		order = append(order, t.Name)
	}

	derivedRows, err := s.repo.ListListeningTopics(ctx, languageID)
	if err != nil {
		return PageResult[ListeningTopicAdminResponse]{}, err
	}
	for _, t := range derivedRows {
		if _, ok := merged[t.Name]; ok {
			continue
		}
		merged[t.Name] = ListeningTopicAdminResponse{LanguageID: languageID, Name: t.Name, Icon: t.Icon, OrderIndex: int32(len(order))}
		order = append(order, t.Name)
	}

	q := strings.ToLower(search)
	results := make([]ListeningTopicAdminResponse, 0, len(order))
	for _, name := range order {
		if q != "" && !strings.Contains(strings.ToLower(name), q) {
			continue
		}
		results = append(results, merged[name])
	}

	total := int64(len(results))
	limit, offset := NormalizePage(page, pageSize)
	start := int(offset)
	if start > len(results) {
		start = len(results)
	}
	end := start + int(limit)
	if end > len(results) {
		end = len(results)
	}
	return PageResult[ListeningTopicAdminResponse]{Items: results[start:end], Total: total}, nil
}

// DeleteTopic xoá 1 chủ đề (chỉ xoá metadata hiển thị — bài luyện nghe có topic
// trùng tên vẫn giữ nguyên, chỉ không còn icon/thứ tự riêng).
func (s *ListeningService) DeleteTopic(ctx context.Context, languageID, name string) error {
	return s.repo.DeleteListeningTopic(ctx, db.DeleteListeningTopicParams{LanguageID: languageID, Name: name})
}

// BulkImportTopics nhập hàng loạt chủ đề luyện nghe
func (s *ListeningService) BulkImportTopics(ctx context.Context, items []ListeningTopicRequest) []BulkImportResult {
	return runBulkImport(items, func(req ListeningTopicRequest) error {
		_, err := s.CreateOrUpdateTopic(ctx, req)
		return err
	})
}
