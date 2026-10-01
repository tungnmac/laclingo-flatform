package domain

import (
	"time"

	"github.com/google/uuid"
)

type VocabularyReviewRequest struct {
	UserID       uuid.UUID `json:"user_id" swaggertype:"string" format:"uuid" example:"11111111-1111-1111-1111-111111111111"`
	VocabularyID uuid.UUID `json:"vocabulary_id" swaggertype:"string" format:"uuid" example:"22222222-2222-2222-2222-222222222222"`
	Quality      int32     `json:"quality" minimum:"0" maximum:"5" example:"4"` // 0 -> 5
}

type VocabularyReviewResponse struct {
	VocabularyID uuid.UUID `json:"vocabulary_id" swaggertype:"string" format:"uuid"`
	NewStage     int32     `json:"new_stage" example:"1"`
	IntervalDays int32     `json:"interval_days" example:"1"`
	NextReviewAt time.Time `json:"next_review_at"`
}
