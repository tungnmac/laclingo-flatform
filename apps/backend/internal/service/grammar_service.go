package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
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
