package srs

import (
	"math"
	"time"
)

type ReviewQuality int

const (
	QualityBlackout  ReviewQuality = 0
	QualityIncorrect ReviewQuality = 1
	QualityHardFail  ReviewQuality = 2
	QualityPassHard  ReviewQuality = 3
	QualityPassGood  ReviewQuality = 4
	QualityPassEasy  ReviewQuality = 5
)

type SRSInput struct {
	SRSStage     int32         `json:"srs_stage"`
	EaseFactor   float64       `json:"ease_factor"`
	IntervalDays int32         `json:"interval_days"`
	Quality      ReviewQuality `json:"quality"`
}

type SRSOutput struct {
	NewSRSStage     int32     `json:"new_srs_stage"`
	NewEaseFactor   float64   `json:"new_ease_factor"`
	NewIntervalDays int32     `json:"new_interval_days"`
	NextReviewAt    time.Time `json:"next_review_at"`
}

func CalculateSM2(input SRSInput, now time.Time) SRSOutput {
	q := float64(input.Quality)

	newEF := input.EaseFactor + (0.1 - (5.0-q)*(0.08+(5.0-q)*0.02))
	if newEF < 1.3 {
		newEF = 1.3
	}

	var newStage int32
	var newInterval int32

	if input.Quality >= QualityPassHard {
		newStage = input.SRSStage + 1
		switch newStage {
		case 1:
			newInterval = 1
		case 2:
			newInterval = 6
		default:
			calculatedInterval := float64(input.IntervalDays) * newEF
			newInterval = int32(math.Ceil(calculatedInterval))
		}
	} else {
		newStage = 0
		newInterval = 1
	}

	nextReviewAt := now.AddDate(0, 0, int(newInterval))

	return SRSOutput{
		NewSRSStage:     newStage,
		NewEaseFactor:   math.Round(newEF*100) / 100,
		NewIntervalDays: newInterval,
		NextReviewAt:    nextReviewAt,
	}
}
