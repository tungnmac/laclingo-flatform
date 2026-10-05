// Package leveling tính level từ tổng EXP — hàm thuần, không phụ thuộc DB,
// giống internal/srs (SM-2) về cách tổ chức.
package leveling

import "math"

const (
	baseExp   = 100
	growth    = 1.5
	startExp  = 0
	maxLevels = 1000 // chặn trên để vòng lặp LevelForExp không bao giờ vô hạn
)

// ExpForLevel trả về tổng EXP cần có để ĐẠT level này (lũy tiến):
// level 1 = 0, level 2 = 100, level 3 = 225, level 4 = 506, ...
func ExpForLevel(level int32) int64 {
	if level <= 1 {
		return startExp
	}
	return int64(math.Round(baseExp * math.Pow(growth, float64(level-2))))
}

// LevelForExp tính level hiện tại từ tổng EXP đã tích lũy.
func LevelForExp(totalExp int64) int32 {
	level := int32(1)
	for level < maxLevels && totalExp >= ExpForLevel(level+1) {
		level++
	}
	return level
}
