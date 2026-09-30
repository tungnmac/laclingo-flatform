package domain

import (
	"time"

	"github.com/google/uuid"
)

type VocabularyReviewRequest struct {
	UserID       uuid.UUID `json:"user_id"`
	VocabularyID uuid.UUID `json:"vocabulary_id"`
	Quality      int32     `json:"quality"` // 0 -> 5
}

type VocabularyReviewResponse struct {
	VocabularyID uuid.UUID `json:"vocabulary_id"`
	NewStage     int32     `json:"new_stage"`
	IntervalDays int32     `json:"interval_days"`
	NextReviewAt time.Time `json:"next_review_at"`
}
