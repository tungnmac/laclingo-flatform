package game

import (
	"math"
	"time"
)

const (
	basePoints = 1000
	minPoints  = 500
)

// ComputePoints tính điểm kiểu Kahoot: trả lời sai = 0 điểm; trả lời đúng = tối
// đa basePoints, giảm dần tuyến tính theo thời gian đã dùng, sàn ở minPoints
// (trả lời ngay lập tức ~basePoints, trả lời sát giờ ~minPoints).
func ComputePoints(isCorrect bool, elapsed, limit time.Duration) int {
	if !isCorrect {
		return 0
	}
	if limit <= 0 {
		return basePoints
	}
	if elapsed < 0 {
		elapsed = 0
	}
	if elapsed > limit {
		elapsed = limit
	}

	ratio := 1 - float64(elapsed)/float64(limit)
	return int(math.Round(float64(minPoints) + ratio*float64(basePoints-minPoints)))
}
