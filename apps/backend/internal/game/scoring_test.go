package game

import (
	"testing"
	"time"
)

func TestComputePoints(t *testing.T) {
	limit := 20 * time.Second

	cases := []struct {
		name      string
		isCorrect bool
		elapsed   time.Duration
		want      int
	}{
		{"wrong answer scores zero", false, 0, 0},
		{"instant correct answer scores max", true, 0, basePoints},
		{"correct at deadline scores min", true, limit, minPoints},
		{"correct past deadline clamps to min", true, 30 * time.Second, minPoints},
		{"negative elapsed clamps to max", true, -time.Second, basePoints},
		{"halfway correct scores midpoint", true, 10 * time.Second, (basePoints + minPoints) / 2},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := ComputePoints(tc.isCorrect, tc.elapsed, limit)
			if got != tc.want {
				t.Errorf("ComputePoints(%v, %v, %v) = %d, want %d", tc.isCorrect, tc.elapsed, limit, got, tc.want)
			}
		})
	}
}

func TestComputePoints_ZeroLimit(t *testing.T) {
	if got := ComputePoints(true, 0, 0); got != basePoints {
		t.Errorf("ComputePoints with zero limit = %d, want %d", got, basePoints)
	}
}
