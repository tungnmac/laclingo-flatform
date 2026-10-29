package service

import (
	"fmt"
	"strings"
	"time"
	"unicode/utf8"
)

// Quy tắc thuần của Daily note (Nhật ký học) — xem docs/superpowers/specs/2026-10-20-daily-note-design.md

const (
	defaultDailyTimezone  = "Asia/Ho_Chi_Minh"
	maxDailyTasks         = 20
	maxDailyTaskTitleLen  = 200
	maxDailyTaskMemoLen   = 500
	maxDailyJournalLen    = 5000
	maxDailyTaskTarget    = 1000
	dailyDateLayout       = "2006-01-02"
	dailyStreakLookbackDs = 400
)

// dailyTaskKinds — loại việc: "free" (tự nhập) hoặc hoạt động học được tự cập nhật qua RecordAction
var dailyTaskKinds = map[string]bool{
	"free": true, "srs_review": true, "learn_word": true, "grammar_exercise": true,
	"listening_practice": true, "speaking_practice": true, "challenge_participate": true,
}

// localDate — ngày (YYYY-MM-DD) của thời điểm now theo múi giờ tz; múi giờ sai → giờ Việt Nam
func localDate(now time.Time, tz string) string {
	loc, err := time.LoadLocation(tz)
	if err != nil || tz == "" {
		loc, err = time.LoadLocation(defaultDailyTimezone)
	}
	if err != nil || loc == nil { // máy chủ thiếu dữ liệu múi giờ → UTC+7 cố định, không để panic
		loc = time.FixedZone("ICT", 7*3600)
	}
	return now.In(loc).Format(dailyDateLayout)
}

// completedAt — thời điểm hoàn thành sau khi đổi tiến độ/trạng thái:
//   - việc có mục tiêu: đạt (progress ≥ target) thì giữ mốc cũ hoặc ghi now; dưới mục tiêu thì bỏ hoàn thành
//   - việc tích (target nil): done = true → giữ mốc cũ hoặc now; false → bỏ; nil → giữ nguyên
func completedAt(target *int32, progress int32, prev *time.Time, done *bool, now time.Time) *time.Time {
	reached := false
	if target != nil {
		reached = progress >= *target
	} else if done != nil {
		reached = *done
	} else {
		return prev
	}
	if !reached {
		return nil
	}
	if prev != nil {
		return prev
	}
	return &now
}

// carryTarget — mục tiêu của bản chuyển sang hôm nay = phần còn thiếu; việc tích giữ nil.
// Đã đủ mục tiêu mà chưa xong (còn việc con chưa tích) → nil: bản chuyển chỉ còn checklist phải làm.
func carryTarget(target *int32, progress int32) *int32 {
	if target == nil {
		return nil
	}
	remaining := *target - progress
	if remaining < 1 {
		return nil
	}
	return &remaining
}

// daySummary — tổng kết 1 ngày: số việc, số việc đã xong hoặc đã chuyển sang ngày sau
type daySummary struct {
	Total     int32
	Completed int32
}

func (d daySummary) allDone() bool { return d.Total > 0 && d.Completed >= d.Total }

// streak — số ngày liên tiếp hoàn thành hết việc, tính lùi từ hôm qua; hôm nay đã xong thì cộng thêm
// (hôm nay chưa xong không làm đứt chuỗi)
func streak(days map[string]daySummary, today string) int {
	day, err := time.Parse(dailyDateLayout, today)
	if err != nil {
		return 0
	}
	n := 0
	if days[today].allDone() {
		n++
	}
	for d := day.AddDate(0, 0, -1); days[d.Format(dailyDateLayout)].allDone(); d = d.AddDate(0, 0, -1) {
		n++
	}
	return n
}

// dailyTaskInput — dữ liệu tạo/sửa 1 việc (đã trim)
type dailyTaskInput struct {
	Title  string
	Kind   string
	Target *int32
	Memo   string
}

func validateTaskInput(in dailyTaskInput) error {
	title := strings.TrimSpace(in.Title)
	if title == "" || utf8.RuneCountInString(title) > maxDailyTaskTitleLen {
		return fmt.Errorf("tiêu đề việc cần 1–%d ký tự: %w", maxDailyTaskTitleLen, ErrInvalidInput)
	}
	if !dailyTaskKinds[in.Kind] {
		return fmt.Errorf("loại việc không hợp lệ: %w", ErrInvalidInput)
	}
	if in.Target != nil && (*in.Target < 1 || *in.Target > maxDailyTaskTarget) {
		return fmt.Errorf("mục tiêu phải từ 1 đến %d: %w", maxDailyTaskTarget, ErrInvalidInput)
	}
	if utf8.RuneCountInString(in.Memo) > maxDailyTaskMemoLen {
		return fmt.Errorf("ghi chú việc tối đa %d ký tự: %w", maxDailyTaskMemoLen, ErrInvalidInput)
	}
	return nil
}
