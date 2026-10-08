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

// ListeningRepository định nghĩa Interface tiếp xúc với cơ sở dữ liệu
type ListeningRepository interface {
	ListListeningPassagesByLanguage(ctx context.Context, languageID string) ([]db.ListListeningPassagesByLanguageRow, error)
	GetListeningPassageByID(ctx context.Context, id pgtype.UUID) (db.ListeningPassage, error)
	ListListeningQuestionsByPassage(ctx context.Context, passageID pgtype.UUID) ([]db.ListListeningQuestionsByPassageRow, error)
	GetListeningQuestionByID(ctx context.Context, id pgtype.UUID) (db.ListeningQuestion, error)
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
