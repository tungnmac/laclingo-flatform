package service

import (
	"context"
	"encoding/json"

	"laclingo-backend/internal/repository/db"

	"github.com/jackc/pgx/v5/pgtype"
)

type DialogueLineResponse struct {
	ID          string  `json:"id"`
	Speaker     string  `json:"speaker"`
	Text        string  `json:"text"`
	Translation *string `json:"translation,omitempty"`
	AudioURL    *string `json:"audio_url,omitempty"`
	OrderIndex  int     `json:"order_index"`
}

type DialogueResponse struct {
	ID          string                 `json:"id"`
	LessonID    string                 `json:"lesson_id"`
	Title       string                 `json:"title"`
	Description *string                `json:"description,omitempty"`
	Difficulty  string                 `json:"difficulty"`
	OrderIndex  int                    `json:"order_index"`
	Lines       []DialogueLineResponse `json:"lines"`
}

type DialogueRepo interface {
	GetDialoguesByLesson(ctx context.Context, lessonID pgtype.UUID) ([]db.GetDialoguesByLessonRow, error)
}

type DialogueService struct {
	repo DialogueRepo
}

func NewDialogueService(repo DialogueRepo) *DialogueService {
	return &DialogueService{repo: repo}
}

func (s *DialogueService) GetDialoguesByLesson(ctx context.Context, lessonID string) ([]DialogueResponse, error) {
	id, err := parseUUID(lessonID)
	if err != nil {
		return nil, err
	}

	rows, err := s.repo.GetDialoguesByLesson(ctx, id)
	if err != nil {
		return nil, err
	}

	result := make([]DialogueResponse, len(rows))
	for i, r := range rows {
		var lines []DialogueLineResponse
		if len(r.Lines) > 0 {
			if err := json.Unmarshal(r.Lines, &lines); err != nil {
				return nil, err
			}
		}

		var desc *string
		if r.Description.Valid {
			desc = &r.Description.String
		}

		var diff string
		if r.Difficulty.Valid {
			diff = r.Difficulty.String
		}

		result[i] = DialogueResponse{
			ID:          r.ID.String(),
			LessonID:    r.LessonID.String(),
			Title:       r.Title,
			Description: desc,
			Difficulty:  diff,
			OrderIndex:  int(r.OrderIndex.Int32),
			Lines:       lines,
		}
	}

	return result, nil
}

func parseUUID(s string) (pgtype.UUID, error) {
	var u pgtype.UUID
	err := u.Scan(s)
	return u, err
}
