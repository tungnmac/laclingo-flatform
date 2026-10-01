package domain

import (
	"time"

	"github.com/google/uuid"
)

// VocabularyReviewRequest — user được lấy từ access token, không nhận từ body
type VocabularyReviewRequest struct {
	VocabularyID uuid.UUID `json:"vocabulary_id" swaggertype:"string" format:"uuid" example:"22222222-2222-2222-2222-222222222222"`
	Quality      int32     `json:"quality" minimum:"0" maximum:"5" example:"4"` // 0 -> 5
}

type VocabularyReviewResponse struct {
	VocabularyID uuid.UUID `json:"vocabulary_id" swaggertype:"string" format:"uuid"`
	NewStage     int32     `json:"new_stage" example:"1"`
	IntervalDays int32     `json:"interval_days" example:"1"`
	NextReviewAt time.Time `json:"next_review_at"`
}

// LearnVocabularyRequest — đánh dấu đã học một từ mới, đưa vào hàng đợi SRS
type LearnVocabularyRequest struct {
	VocabularyID uuid.UUID `json:"vocabulary_id" swaggertype:"string" format:"uuid" example:"22222222-2222-2222-2222-222222222222"`
}

type LearnVocabularyResponse struct {
	VocabularyID uuid.UUID `json:"vocabulary_id" swaggertype:"string" format:"uuid"`
	Learned      bool      `json:"learned" example:"true"`
}
