package leveling

import "testing"

func TestExpForLevel(t *testing.T) {
	cases := []struct {
		level int32
		want  int64
	}{
		{1, 0},
		{2, 100},
		{3, 150},
	}
	for _, tc := range cases {
		if got := ExpForLevel(tc.level); got != tc.want {
			t.Errorf("ExpForLevel(%d) = %d, want %d", tc.level, got, tc.want)
		}
	}
}

func TestLevelForExp(t *testing.T) {
	cases := []struct {
		exp  int64
		want int32
	}{
		{0, 1},
		{99, 1},
		{100, 2},
		{149, 2},
		{150, 3},
		{1_000_000, ExpLevelCeilingFor(1_000_000)},
	}
	for _, tc := range cases {
		if got := LevelForExp(tc.exp); got != tc.want {
			t.Errorf("LevelForExp(%d) = %d, want %d", tc.exp, got, tc.want)
		}
	}
}

// ExpLevelCeilingFor là helper CHỈ DÙNG TRONG TEST để tính độc lập mức level
// kỳ vọng cho 1 số EXP lớn, tránh hard-code 1 con số dễ sai khi đổi hằng số.
func ExpLevelCeilingFor(totalExp int64) int32 {
	level := int32(1)
	for ExpForLevel(level+1) <= totalExp {
		level++
	}
	return level
}

func TestLevelForExp_MonotonicRoundTrip(t *testing.T) {
	for level := int32(1); level < 30; level++ {
		exp := ExpForLevel(level)
		if got := LevelForExp(exp); got != level {
			t.Errorf("LevelForExp(ExpForLevel(%d)=%d) = %d, want %d", level, exp, got, level)
		}
	}
}
