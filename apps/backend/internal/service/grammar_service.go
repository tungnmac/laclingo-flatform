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

// GrammarRepository định nghĩa Interface tiếp xúc với cơ sở dữ liệu
type GrammarRepository interface {
	ListGrammarTopicsByLanguage(ctx context.Context, languageID string) ([]db.GrammarTopic, error)
	ListGrammarLessonsByLanguage(ctx context.Context, languageID string) ([]db.ListGrammarLessonsByLanguageRow, error)
	GetGrammarLessonByCode(ctx context.Context, code string) (db.GrammarLesson, error)
	ListGrammarExercisesByLesson(ctx context.Context, lessonID pgtype.UUID) ([]db.GrammarExercise, error)
	GetGrammarExerciseByID(ctx context.Context, id pgtype.UUID) (db.GrammarExercise, error)

	CreateGrammarTopic(ctx context.Context, arg db.CreateGrammarTopicParams) (db.GrammarTopic, error)
	UpdateGrammarTopic(ctx context.Context, arg db.UpdateGrammarTopicParams) (db.GrammarTopic, error)
	DeleteGrammarTopic(ctx context.Context, id pgtype.UUID) error
	CreateGrammarLesson(ctx context.Context, arg db.CreateGrammarLessonParams) (db.GrammarLesson, error)
	UpdateGrammarLesson(ctx context.Context, arg db.UpdateGrammarLessonParams) (db.GrammarLesson, error)
	DeleteGrammarLesson(ctx context.Context, id pgtype.UUID) error
	CreateGrammarExercise(ctx context.Context, arg db.CreateGrammarExerciseParams) (db.GrammarExercise, error)
	UpdateGrammarExercise(ctx context.Context, arg db.UpdateGrammarExerciseParams) (db.GrammarExercise, error)
	DeleteGrammarExercise(ctx context.Context, id pgtype.UUID) error

	ListGrammarTopicsAdminPaged(ctx context.Context, arg db.ListGrammarTopicsAdminPagedParams) ([]db.ListGrammarTopicsAdminPagedRow, error)
	ListGrammarLessonsAdminPaged(ctx context.Context, arg db.ListGrammarLessonsAdminPagedParams) ([]db.ListGrammarLessonsAdminPagedRow, error)
	ListGrammarExercisesAdminPaged(ctx context.Context, arg db.ListGrammarExercisesAdminPagedParams) ([]db.ListGrammarExercisesAdminPagedRow, error)
}

// SubmitExerciseResponse — kết quả chấm 1 bài tập ngữ pháp
type SubmitExerciseResponse struct {
	Correct bool `json:"correct"`
}

// GrammarLessonSummary — bài học trong danh sách, không kèm content
type GrammarLessonSummary struct {
	ID         uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	Code       string    `json:"code" example:"present_simple"`
	Title      string    `json:"title" example:"Thì Hiện Tại Đơn (Present Simple)"`
	Level      string    `json:"level" example:"A1"`
	OrderIndex int32     `json:"order_index"`
}

// GrammarTopicResponse — chủ đề ngữ pháp kèm danh sách bài học
type GrammarTopicResponse struct {
	ID          uuid.UUID              `json:"id" swaggertype:"string" format:"uuid"`
	Code        string                 `json:"code" example:"english_12_tenses"`
	Title       string                 `json:"title" example:"12 Thì Trong Tiếng Anh"`
	Description string                 `json:"description"`
	OrderIndex  int32                  `json:"order_index"`
	Lessons     []GrammarLessonSummary `json:"lessons"`
}

type GrammarExerciseResponse struct {
	ID            uuid.UUID       `json:"id" swaggertype:"string" format:"uuid"`
	Type          string          `json:"type" example:"MULTIPLE_CHOICE"`
	Question      string          `json:"question" example:"She _______ to school every day."`
	Options       json.RawMessage `json:"options" swaggertype:"array,string"`
	CorrectAnswer string          `json:"correct_answer" example:"goes"`
	Explanation   string          `json:"explanation"`
	OrderIndex    int32           `json:"order_index"`
}

// GrammarLessonDetail — bài học đầy đủ: content (JSON) + bài tập
type GrammarLessonDetail struct {
	ID        uuid.UUID                 `json:"id" swaggertype:"string" format:"uuid"`
	Code      string                    `json:"code" example:"present_simple"`
	Title     string                    `json:"title" example:"Thì Hiện Tại Đơn (Present Simple)"`
	Level     string                    `json:"level" example:"A1"`
	Content   json.RawMessage           `json:"content" swaggertype:"object"`
	Exercises []GrammarExerciseResponse `json:"exercises"`
}

type GrammarService struct {
	repo     GrammarRepository
	missions *MissionService
}

func NewGrammarService(repo GrammarRepository, missions *MissionService) *GrammarService {
	return &GrammarService{repo: repo, missions: missions}
}

// ListTopics trả về các chủ đề ngữ pháp của một ngôn ngữ, kèm bài học đã nhóm theo chủ đề
func (s *GrammarService) ListTopics(ctx context.Context, languageID string) ([]GrammarTopicResponse, error) {
	topics, err := s.repo.ListGrammarTopicsByLanguage(ctx, languageID)
	if err != nil {
		return nil, err
	}
	lessons, err := s.repo.ListGrammarLessonsByLanguage(ctx, languageID)
	if err != nil {
		return nil, err
	}

	lessonsByTopic := make(map[uuid.UUID][]GrammarLessonSummary, len(topics))
	for _, l := range lessons {
		topicID := uuid.UUID(l.TopicID.Bytes)
		lessonsByTopic[topicID] = append(lessonsByTopic[topicID], GrammarLessonSummary{
			ID:         uuid.UUID(l.ID.Bytes),
			Code:       l.Code,
			Title:      l.Title,
			Level:      l.Level.String,
			OrderIndex: l.OrderIndex.Int32,
		})
	}

	results := make([]GrammarTopicResponse, 0, len(topics))
	for _, t := range topics {
		topicID := uuid.UUID(t.ID.Bytes)
		topicLessons := lessonsByTopic[topicID]
		if topicLessons == nil {
			topicLessons = []GrammarLessonSummary{}
		}
		results = append(results, GrammarTopicResponse{
			ID:          topicID,
			Code:        t.Code,
			Title:       t.Title,
			Description: t.Description.String,
			OrderIndex:  t.OrderIndex.Int32,
			Lessons:     topicLessons,
		})
	}
	return results, nil
}

// GetLessonByCode trả về bài học đầy đủ (content + bài tập) theo code
func (s *GrammarService) GetLessonByCode(ctx context.Context, code string) (GrammarLessonDetail, error) {
	lesson, err := s.repo.GetGrammarLessonByCode(ctx, code)
	if errors.Is(err, pgx.ErrNoRows) {
		return GrammarLessonDetail{}, ErrNotFound
	}
	if err != nil {
		return GrammarLessonDetail{}, err
	}

	exercises, err := s.repo.ListGrammarExercisesByLesson(ctx, lesson.ID)
	if err != nil {
		return GrammarLessonDetail{}, err
	}

	exerciseResponses := make([]GrammarExerciseResponse, 0, len(exercises))
	for _, e := range exercises {
		// SQL NULL (nil) lẫn JSON literal null đều trả về mảng rỗng
		options := json.RawMessage(e.Options)
		if options == nil || bytes.Equal(options, []byte("null")) {
			options = json.RawMessage("[]")
		}
		exerciseResponses = append(exerciseResponses, GrammarExerciseResponse{
			ID:            uuid.UUID(e.ID.Bytes),
			Type:          e.Type,
			Question:      e.Question,
			Options:       options,
			CorrectAnswer: e.CorrectAnswer,
			Explanation:   e.Explanation.String,
			OrderIndex:    e.OrderIndex.Int32,
		})
	}

	return GrammarLessonDetail{
		ID:        uuid.UUID(lesson.ID.Bytes),
		Code:      lesson.Code,
		Title:     lesson.Title,
		Level:     lesson.Level.String,
		Content:   json.RawMessage(lesson.Content),
		Exercises: exerciseResponses,
	}, nil
}

// SubmitExercise chấm 1 bài tập ngữ pháp — chạy SONG SONG với check client-side
// hiện có (không thay thế), chỉ để có sự kiện server-side ghi nhận tiến độ
// nhiệm vụ "grammar_exercise". Trả đúng/sai; không trả lại correct_answer vì
// client đã có sẵn (tự so sánh ở FE để phản hồi ngay).
func (s *GrammarService) SubmitExercise(ctx context.Context, userID, exerciseID uuid.UUID, answer string) (SubmitExerciseResponse, error) {
	if userID == uuid.Nil || exerciseID == uuid.Nil {
		return SubmitExerciseResponse{}, ErrInvalidInput
	}

	exercise, err := s.repo.GetGrammarExerciseByID(ctx, toPgUUID(exerciseID))
	if errors.Is(err, pgx.ErrNoRows) {
		return SubmitExerciseResponse{}, ErrNotFound
	}
	if err != nil {
		return SubmitExerciseResponse{}, err
	}

	correct := strings.EqualFold(strings.TrimSpace(answer), strings.TrimSpace(exercise.CorrectAnswer))
	if correct {
		if err := s.missions.RecordAction(ctx, userID, "grammar_exercise", 1); err != nil {
			log.Printf("❌ mission: RecordAction user=%s action=grammar_exercise: %v", userID, err)
		}
	}

	return SubmitExerciseResponse{Correct: correct}, nil
}

// ===== Admin CRUD (quản lý nội dung ngữ pháp) =====

type GrammarTopicRequest struct {
	LanguageID  string `json:"language_id" example:"en"`
	Code        string `json:"code" example:"english_12_tenses"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	OrderIndex  int32  `json:"order_index"`
}

type GrammarTopicAdminResponse struct {
	ID          uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	LanguageID  string    `json:"language_id"`
	Code        string    `json:"code"`
	Title       string    `json:"title"`
	Description string    `json:"description,omitempty"`
	OrderIndex  int32     `json:"order_index"`
}

type GrammarLessonRequest struct {
	TopicID    uuid.UUID       `json:"topic_id" swaggertype:"string" format:"uuid"`
	Code       string          `json:"code" example:"present_simple"`
	Title      string          `json:"title"`
	Level      string          `json:"level" example:"A1"`
	OrderIndex int32           `json:"order_index"`
	Content    json.RawMessage `json:"content" swaggertype:"object"`
}

type GrammarLessonAdminResponse struct {
	ID         uuid.UUID       `json:"id" swaggertype:"string" format:"uuid"`
	TopicID    uuid.UUID       `json:"topic_id" swaggertype:"string" format:"uuid"`
	Code       string          `json:"code"`
	Title      string          `json:"title"`
	Level      string          `json:"level"`
	OrderIndex int32           `json:"order_index"`
	Content    json.RawMessage `json:"content" swaggertype:"object"`
}

type GrammarExerciseRequest struct {
	LessonID      uuid.UUID       `json:"lesson_id" swaggertype:"string" format:"uuid"`
	Type          string          `json:"type" example:"MULTIPLE_CHOICE" enums:"MULTIPLE_CHOICE,FILL_BLANK"`
	Question      string          `json:"question"`
	Options       json.RawMessage `json:"options,omitempty" swaggertype:"array,string"`
	CorrectAnswer string          `json:"correct_answer"`
	Explanation   string          `json:"explanation,omitempty"`
	OrderIndex    int32           `json:"order_index"`
	Level         int32           `json:"level" minimum:"1" maximum:"4" example:"1"`
	Hint          string          `json:"hint,omitempty"`
	XPReward      int32           `json:"xp_reward" example:"10"`
}

func validateGrammarTopicRequest(req GrammarTopicRequest) error {
	if req.LanguageID == "" || req.Code == "" || req.Title == "" {
		return ErrInvalidInput
	}
	return nil
}

func toGrammarTopicAdminResponse(t db.GrammarTopic) GrammarTopicAdminResponse {
	return GrammarTopicAdminResponse{
		ID:          uuid.UUID(t.ID.Bytes),
		LanguageID:  t.LanguageID,
		Code:        t.Code,
		Title:       t.Title,
		Description: t.Description.String,
		OrderIndex:  t.OrderIndex.Int32,
	}
}

// CreateTopic tạo 1 chủ đề ngữ pháp mới
func (s *GrammarService) CreateTopic(ctx context.Context, req GrammarTopicRequest) (GrammarTopicAdminResponse, error) {
	if err := validateGrammarTopicRequest(req); err != nil {
		return GrammarTopicAdminResponse{}, err
	}
	t, err := s.repo.CreateGrammarTopic(ctx, db.CreateGrammarTopicParams{
		LanguageID:  req.LanguageID,
		Code:        req.Code,
		Title:       req.Title,
		Description: pgtype.Text{String: req.Description, Valid: req.Description != ""},
		OrderIndex:  pgtype.Int4{Int32: req.OrderIndex, Valid: true},
	})
	if isPgError(err, pgUniqueViolation) {
		return GrammarTopicAdminResponse{}, fmt.Errorf("mã chủ đề \"%s\" đã tồn tại: %w", req.Code, ErrDuplicate)
	}
	if err != nil {
		return GrammarTopicAdminResponse{}, err
	}
	return toGrammarTopicAdminResponse(t), nil
}

// ListTopicsAdmin trả về toàn bộ chủ đề của 1 ngôn ngữ (dành cho admin quản lý)
func (s *GrammarService) ListTopicsAdmin(ctx context.Context, languageID, search string, page, pageSize int32) (PageResult[GrammarTopicAdminResponse], error) {
	limit, offset := NormalizePage(page, pageSize)
	rows, err := s.repo.ListGrammarTopicsAdminPaged(ctx, db.ListGrammarTopicsAdminPagedParams{
		LanguageID: languageID,
		Search:     pgtype.Text{String: search, Valid: search != ""},
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		return PageResult[GrammarTopicAdminResponse]{}, err
	}
	results := make([]GrammarTopicAdminResponse, 0, len(rows))
	var total int64
	for _, t := range rows {
		total = t.TotalCount
		results = append(results, toGrammarTopicAdminResponse(db.GrammarTopic{
			ID: t.ID, LanguageID: t.LanguageID, Code: t.Code, Title: t.Title,
			Description: t.Description, OrderIndex: t.OrderIndex, CreatedAt: t.CreatedAt,
		}))
	}
	return PageResult[GrammarTopicAdminResponse]{Items: results, Total: total}, nil
}

// UpdateTopic sửa tiêu đề/mô tả/thứ tự 1 chủ đề (không đổi language_id/code)
func (s *GrammarService) UpdateTopic(ctx context.Context, id uuid.UUID, req GrammarTopicRequest) (GrammarTopicAdminResponse, error) {
	if req.Title == "" {
		return GrammarTopicAdminResponse{}, ErrInvalidInput
	}
	t, err := s.repo.UpdateGrammarTopic(ctx, db.UpdateGrammarTopicParams{
		ID:          toPgUUID(id),
		Title:       req.Title,
		Description: pgtype.Text{String: req.Description, Valid: req.Description != ""},
		OrderIndex:  pgtype.Int4{Int32: req.OrderIndex, Valid: true},
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return GrammarTopicAdminResponse{}, ErrNotFound
	}
	if err != nil {
		return GrammarTopicAdminResponse{}, err
	}
	return toGrammarTopicAdminResponse(t), nil
}

// DeleteTopic xoá 1 chủ đề (CASCADE xoá luôn lesson + exercise bên trong)
func (s *GrammarService) DeleteTopic(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteGrammarTopic(ctx, toPgUUID(id))
}

// BulkImportTopics nhập hàng loạt chủ đề — lỗi 1 dòng không chặn các dòng khác
func (s *GrammarService) BulkImportTopics(ctx context.Context, items []GrammarTopicRequest) []BulkImportResult {
	return runBulkImport(items, func(req GrammarTopicRequest) error {
		_, err := s.CreateTopic(ctx, req)
		return err
	})
}

func toGrammarLessonAdminResponse(l db.GrammarLesson) GrammarLessonAdminResponse {
	return GrammarLessonAdminResponse{
		ID:         uuid.UUID(l.ID.Bytes),
		TopicID:    uuid.UUID(l.TopicID.Bytes),
		Code:       l.Code,
		Title:      l.Title,
		Level:      l.Level.String,
		OrderIndex: l.OrderIndex.Int32,
		Content:    json.RawMessage(l.Content),
	}
}

// CreateLesson tạo 1 bài học ngữ pháp mới (content là JSON tự do: summary/formulas/signals)
func (s *GrammarService) CreateLesson(ctx context.Context, req GrammarLessonRequest) (GrammarLessonAdminResponse, error) {
	if req.TopicID == uuid.Nil || req.Code == "" || req.Title == "" || len(req.Content) == 0 {
		return GrammarLessonAdminResponse{}, ErrInvalidInput
	}
	l, err := s.repo.CreateGrammarLesson(ctx, db.CreateGrammarLessonParams{
		TopicID:    toPgUUID(req.TopicID),
		Code:       req.Code,
		Title:      req.Title,
		Level:      pgtype.Text{String: req.Level, Valid: req.Level != ""},
		OrderIndex: pgtype.Int4{Int32: req.OrderIndex, Valid: true},
		Content:    req.Content,
	})
	if isPgError(err, pgUniqueViolation) {
		return GrammarLessonAdminResponse{}, fmt.Errorf("mã bài học \"%s\" đã tồn tại: %w", req.Code, ErrDuplicate)
	}
	if isPgError(err, pgForeignKeyViolation) {
		return GrammarLessonAdminResponse{}, fmt.Errorf("không tìm thấy chủ đề: %w", ErrInvalidInput)
	}
	if err != nil {
		return GrammarLessonAdminResponse{}, err
	}
	return toGrammarLessonAdminResponse(l), nil
}

// ListLessonsAdmin trả về toàn bộ bài học ngữ pháp của 1 ngôn ngữ (mọi chủ đề)
func (s *GrammarService) ListLessonsAdmin(ctx context.Context, languageID, topicID, level, search string, page, pageSize int32) (PageResult[GrammarLessonAdminResponse], error) {
	limit, offset := NormalizePage(page, pageSize)
	var topicFilter pgtype.UUID
	if topicID != "" {
		if parsed, err := uuid.Parse(topicID); err == nil {
			topicFilter = toPgUUID(parsed)
		}
	}
	rows, err := s.repo.ListGrammarLessonsAdminPaged(ctx, db.ListGrammarLessonsAdminPagedParams{
		LanguageID: languageID,
		TopicID:    topicFilter,
		Level:      pgtype.Text{String: level, Valid: level != ""},
		Search:     pgtype.Text{String: search, Valid: search != ""},
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		return PageResult[GrammarLessonAdminResponse]{}, err
	}
	results := make([]GrammarLessonAdminResponse, 0, len(rows))
	var total int64
	for _, r := range rows {
		total = r.TotalCount
		results = append(results, GrammarLessonAdminResponse{
			ID:         uuid.UUID(r.ID.Bytes),
			TopicID:    uuid.UUID(r.TopicID.Bytes),
			Code:       r.Code,
			Title:      r.Title,
			Level:      r.Level.String,
			OrderIndex: r.OrderIndex.Int32,
		})
	}
	return PageResult[GrammarLessonAdminResponse]{Items: results, Total: total}, nil
}

// UpdateLesson sửa 1 bài học (không đổi topic_id/code)
func (s *GrammarService) UpdateLesson(ctx context.Context, id uuid.UUID, req GrammarLessonRequest) (GrammarLessonAdminResponse, error) {
	if req.Title == "" || len(req.Content) == 0 {
		return GrammarLessonAdminResponse{}, ErrInvalidInput
	}
	l, err := s.repo.UpdateGrammarLesson(ctx, db.UpdateGrammarLessonParams{
		ID:         toPgUUID(id),
		Title:      req.Title,
		Level:      pgtype.Text{String: req.Level, Valid: req.Level != ""},
		OrderIndex: pgtype.Int4{Int32: req.OrderIndex, Valid: true},
		Content:    req.Content,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return GrammarLessonAdminResponse{}, ErrNotFound
	}
	if err != nil {
		return GrammarLessonAdminResponse{}, err
	}
	return toGrammarLessonAdminResponse(l), nil
}

// DeleteLesson xoá 1 bài học (CASCADE xoá luôn exercise bên trong)
func (s *GrammarService) DeleteLesson(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteGrammarLesson(ctx, toPgUUID(id))
}

// BulkImportLessons nhập hàng loạt bài học
func (s *GrammarService) BulkImportLessons(ctx context.Context, items []GrammarLessonRequest) []BulkImportResult {
	return runBulkImport(items, func(req GrammarLessonRequest) error {
		_, err := s.CreateLesson(ctx, req)
		return err
	})
}

func toGrammarExerciseAdminResponse(e db.GrammarExercise) GrammarExerciseResponse {
	options := json.RawMessage(e.Options)
	if options == nil || bytes.Equal(options, []byte("null")) {
		options = json.RawMessage("[]")
	}
	return GrammarExerciseResponse{
		ID:            uuid.UUID(e.ID.Bytes),
		Type:          e.Type,
		Question:      e.Question,
		Options:       options,
		CorrectAnswer: e.CorrectAnswer,
		Explanation:   e.Explanation.String,
		OrderIndex:    e.OrderIndex.Int32,
	}
}

// CreateExercise tạo 1 bài tập ngữ pháp mới
func (s *GrammarService) CreateExercise(ctx context.Context, req GrammarExerciseRequest) (GrammarExerciseResponse, error) {
	if req.LessonID == uuid.Nil || req.Type == "" || req.Question == "" || req.CorrectAnswer == "" {
		return GrammarExerciseResponse{}, ErrInvalidInput
	}
	options := req.Options
	if len(options) == 0 {
		options = json.RawMessage("[]")
	}
	xpReward := req.XPReward
	if xpReward == 0 {
		xpReward = 10
	}
	level := req.Level
	if level == 0 {
		level = 1
	}
	e, err := s.repo.CreateGrammarExercise(ctx, db.CreateGrammarExerciseParams{
		LessonID:      toPgUUID(req.LessonID),
		Type:          req.Type,
		Question:      req.Question,
		Options:       options,
		CorrectAnswer: req.CorrectAnswer,
		Explanation:   pgtype.Text{String: req.Explanation, Valid: req.Explanation != ""},
		OrderIndex:    pgtype.Int4{Int32: req.OrderIndex, Valid: true},
		Level:         pgtype.Int4{Int32: level, Valid: true},
		Hint:          pgtype.Text{String: req.Hint, Valid: req.Hint != ""},
		XpReward:      pgtype.Int4{Int32: xpReward, Valid: true},
	})
	if isPgError(err, pgUniqueViolation) {
		return GrammarExerciseResponse{}, fmt.Errorf("câu hỏi này đã tồn tại trong bài học: %w", ErrDuplicate)
	}
	if isPgError(err, pgForeignKeyViolation) {
		return GrammarExerciseResponse{}, fmt.Errorf("không tìm thấy bài học: %w", ErrInvalidInput)
	}
	if err != nil {
		return GrammarExerciseResponse{}, err
	}
	return toGrammarExerciseAdminResponse(e), nil
}

// ListExercisesAdmin trả về bài tập của 1 bài học, CÓ correct_answer (chỉ admin dùng)
func (s *GrammarService) ListExercisesAdmin(ctx context.Context, lessonID uuid.UUID, search string, page, pageSize int32) (PageResult[GrammarExerciseResponse], error) {
	limit, offset := NormalizePage(page, pageSize)
	rows, err := s.repo.ListGrammarExercisesAdminPaged(ctx, db.ListGrammarExercisesAdminPagedParams{
		LessonID: toPgUUID(lessonID),
		Search:   pgtype.Text{String: search, Valid: search != ""},
		Limit:    limit,
		Offset:   offset,
	})
	if err != nil {
		return PageResult[GrammarExerciseResponse]{}, err
	}
	results := make([]GrammarExerciseResponse, 0, len(rows))
	var total int64
	for _, e := range rows {
		total = e.TotalCount
		results = append(results, toGrammarExerciseAdminResponse(db.GrammarExercise{
			ID: e.ID, LessonID: e.LessonID, Type: e.Type, Question: e.Question, Options: e.Options,
			CorrectAnswer: e.CorrectAnswer, Explanation: e.Explanation, OrderIndex: e.OrderIndex,
			Level: e.Level, Hint: e.Hint, XpReward: e.XpReward,
		}))
	}
	return PageResult[GrammarExerciseResponse]{Items: results, Total: total}, nil
}

// UpdateExercise sửa 1 bài tập (không đổi lesson_id)
func (s *GrammarService) UpdateExercise(ctx context.Context, id uuid.UUID, req GrammarExerciseRequest) (GrammarExerciseResponse, error) {
	if req.Type == "" || req.Question == "" || req.CorrectAnswer == "" {
		return GrammarExerciseResponse{}, ErrInvalidInput
	}
	options := req.Options
	if len(options) == 0 {
		options = json.RawMessage("[]")
	}
	e, err := s.repo.UpdateGrammarExercise(ctx, db.UpdateGrammarExerciseParams{
		ID:            toPgUUID(id),
		Type:          req.Type,
		Question:      req.Question,
		Options:       options,
		CorrectAnswer: req.CorrectAnswer,
		Explanation:   pgtype.Text{String: req.Explanation, Valid: req.Explanation != ""},
		OrderIndex:    pgtype.Int4{Int32: req.OrderIndex, Valid: true},
		Level:         pgtype.Int4{Int32: req.Level, Valid: req.Level != 0},
		Hint:          pgtype.Text{String: req.Hint, Valid: req.Hint != ""},
		XpReward:      pgtype.Int4{Int32: req.XPReward, Valid: req.XPReward != 0},
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return GrammarExerciseResponse{}, ErrNotFound
	}
	if err != nil {
		return GrammarExerciseResponse{}, err
	}
	return toGrammarExerciseAdminResponse(e), nil
}

// DeleteExercise xoá 1 bài tập
func (s *GrammarService) DeleteExercise(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteGrammarExercise(ctx, toPgUUID(id))
}

// BulkImportExercises nhập hàng loạt bài tập
func (s *GrammarService) BulkImportExercises(ctx context.Context, items []GrammarExerciseRequest) []BulkImportResult {
	return runBulkImport(items, func(req GrammarExerciseRequest) error {
		_, err := s.CreateExercise(ctx, req)
		return err
	})
}
