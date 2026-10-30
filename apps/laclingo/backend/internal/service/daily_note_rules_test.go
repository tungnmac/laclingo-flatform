package service

import (
	"errors"
	"strings"
	"testing"
	"time"
)

func i32(v int32) *int32 { return &v }

func TestLocalDate(t *testing.T) {
	// 17:30 UTC = 00:30 hôm sau ở Việt Nam
	now := time.Date(2026, 10, 20, 17, 30, 0, 0, time.UTC)
	if got := localDate(now, "Asia/Ho_Chi_Minh"); got != "2026-10-21" {
		t.Fatalf("VN = %s", got)
	}
	if got := localDate(now, "America/New_York"); got != "2026-10-20" {
		t.Fatalf("NY = %s", got)
	}
	if got := localDate(now, "Not/AZone"); got != "2026-10-21" { // sai múi giờ → mặc định giờ VN
		t.Fatalf("fallback = %s", got)
	}
}

func TestCompletedAt(t *testing.T) {
	now := time.Date(2026, 10, 20, 8, 0, 0, 0, time.UTC)
	earlier := now.Add(-time.Hour)
	yes, no := true, false
	cases := []struct {
		name     string
		target   *int32
		progress int32
		prev     *time.Time
		done     *bool
		want     *time.Time
	}{
		{"chưa đạt", i32(20), 12, nil, nil, nil},
		{"vừa đạt", i32(20), 20, nil, nil, &now},
		{"đạt rồi giữ mốc cũ", i32(20), 25, &earlier, nil, &earlier},
		{"sửa tay xuống dưới mục tiêu → bỏ hoàn thành", i32(20), 5, &earlier, nil, nil},
		{"việc tích: tích xong", nil, 0, nil, &yes, &now},
		{"việc tích: giữ trạng thái khi không gửi done", nil, 0, &earlier, nil, &earlier},
		{"việc tích: bỏ tích", nil, 0, &earlier, &no, nil},
	}
	for _, c := range cases {
		got := completedAt(c.target, c.progress, c.prev, c.done, now)
		if (got == nil) != (c.want == nil) || (got != nil && !got.Equal(*c.want)) {
			t.Errorf("%s: got %v want %v", c.name, got, c.want)
		}
	}
}

func TestCarryTarget(t *testing.T) {
	if got := carryTarget(i32(20), 12); got == nil || *got != 8 {
		t.Fatalf("remaining = %v", got)
	}
	if carryTarget(nil, 0) != nil {
		t.Fatal("checkbox task keeps nil target")
	}
	if got := carryTarget(i32(5), 5); got != nil { // đủ mục tiêu, chỉ còn checklist → việc tích
		t.Fatalf("target reached → nil, got %v", *got)
	}
}

func TestStreak(t *testing.T) {
	done := daySummary{Total: 2, Completed: 2}
	part := daySummary{Total: 2, Completed: 1}
	days := map[string]daySummary{"2026-10-17": done, "2026-10-18": done, "2026-10-19": done, "2026-10-20": part}
	if got := streak(days, "2026-10-20"); got != 3 { // hôm nay chưa xong không cắt chuỗi
		t.Fatalf("streak = %d", got)
	}
	days["2026-10-20"] = done
	if got := streak(days, "2026-10-20"); got != 4 {
		t.Fatalf("streak with today = %d", got)
	}
	days["2026-10-18"] = part
	if got := streak(days, "2026-10-20"); got != 2 {
		t.Fatalf("broken streak = %d", got)
	}
	if got := streak(map[string]daySummary{"2026-10-19": {Total: 0}}, "2026-10-20"); got != 0 { // ngày không có việc không tính
		t.Fatalf("empty day = %d", got)
	}
}

func TestValidateTaskInput(t *testing.T) {
	ok := dailyTaskInput{Title: "Ôn 30 từ", Kind: "srs_review", Target: i32(30)}
	if err := validateTaskInput(ok); err != nil {
		t.Fatalf("valid: %v", err)
	}
	bad := []dailyTaskInput{
		{Title: "  ", Kind: "free"},
		{Title: strings.Repeat("a", 201), Kind: "free"},
		{Title: "x", Kind: "challenge_win"},
		{Title: "x", Kind: "free", Target: i32(0)},
		{Title: "x", Kind: "free", Target: i32(1001)},
		{Title: "x", Kind: "free", Memo: strings.Repeat("m", maxDailyTaskMemoLen+1)},
	}
	for _, b := range bad {
		if err := validateTaskInput(b); !errors.Is(err, ErrInvalidInput) {
			t.Errorf("%+v: err = %v", b, err)
		}
	}
}
