package service

import "testing"

func TestLevelUpGems(t *testing.T) {
	cases := []struct{ from, to, per, want int32 }{
		{1, 2, 20, 40},  // lên level 2: 2 × 20
		{4, 5, 20, 100}, // lên level 5: 5 × 20
		{1, 3, 20, 100}, // nhảy 2 level: (2 + 3) × 20
		{3, 3, 20, 0},   // không lên level
		{1, 5, 0, 0},    // mức 0 = tắt
	}
	for _, c := range cases {
		if got := levelUpGems(c.from, c.to, c.per); got != c.want {
			t.Errorf("levelUpGems(%d→%d, %d) = %d, want %d", c.from, c.to, c.per, got, c.want)
		}
	}
}
