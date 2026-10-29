package srs

import (
	"testing"
	"time"
)

func TestCalculateSM2(t *testing.T) {
	now := time.Date(2026, 1, 1, 9, 0, 0, 0, time.UTC)

	tests := []struct {
		name         string
		input        SRSInput
		wantStage    int32
		wantInterval int32
		wantEF       float64
	}{
		{
			name:         "lần đầu trả lời tốt -> 1 ngày",
			input:        SRSInput{SRSStage: 0, EaseFactor: 2.5, IntervalDays: 0, Quality: QualityPassGood},
			wantStage:    1,
			wantInterval: 1,
			wantEF:       2.5,
		},
		{
			name:         "lần hai trả lời tốt -> 6 ngày",
			input:        SRSInput{SRSStage: 1, EaseFactor: 2.5, IntervalDays: 1, Quality: QualityPassGood},
			wantStage:    2,
			wantInterval: 6,
			wantEF:       2.5,
		},
		{
			name:         "lần ba dễ -> interval * EF mới",
			input:        SRSInput{SRSStage: 2, EaseFactor: 2.5, IntervalDays: 6, Quality: QualityPassEasy},
			wantStage:    3,
			wantInterval: 16, // ceil(6 * 2.6)
			wantEF:       2.6,
		},
		{
			name:         "trả lời sai -> reset về stage 0, 1 ngày",
			input:        SRSInput{SRSStage: 4, EaseFactor: 2.5, IntervalDays: 30, Quality: QualityIncorrect},
			wantStage:    0,
			wantInterval: 1,
			wantEF:       1.96,
		},
		{
			name:         "EF không xuống dưới 1.3",
			input:        SRSInput{SRSStage: 3, EaseFactor: 1.3, IntervalDays: 10, Quality: QualityBlackout},
			wantStage:    0,
			wantInterval: 1,
			wantEF:       1.3,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := CalculateSM2(tt.input, now)

			if got.NewSRSStage != tt.wantStage {
				t.Errorf("stage = %d, want %d", got.NewSRSStage, tt.wantStage)
			}
			if got.NewIntervalDays != tt.wantInterval {
				t.Errorf("interval = %d, want %d", got.NewIntervalDays, tt.wantInterval)
			}
			if got.NewEaseFactor != tt.wantEF {
				t.Errorf("ease factor = %v, want %v", got.NewEaseFactor, tt.wantEF)
			}
			wantNext := now.AddDate(0, 0, int(tt.wantInterval))
			if !got.NextReviewAt.Equal(wantNext) {
				t.Errorf("next review = %v, want %v", got.NextReviewAt, wantNext)
			}
		})
	}
}
