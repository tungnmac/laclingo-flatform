package service

import (
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestNotificationCursorRoundTrip(t *testing.T) {
	at := time.Date(2026, 10, 16, 8, 30, 15, 123456000, time.FixedZone("ICT", 7*3600))
	id := uuid.New()
	gotAt, gotID, err := parseNotificationCursor(formatNotificationCursor(at, id))
	if err != nil || !gotAt.Equal(at) || gotID != id {
		t.Fatalf("round trip sai: %v %v %v", gotAt, gotID, err)
	}
	for _, bad := range []string{"x", "2026-10-16T01:30:15Z", "notatime_" + id.String(), "2026-10-16T01:30:15Z_not-a-uuid"} {
		if _, _, err := parseNotificationCursor(bad); !errors.Is(err, ErrInvalidInput) {
			t.Errorf("%q: muốn ErrInvalidInput, nhận %v", bad, err)
		}
	}
}

func TestIsInAppPath(t *testing.T) {
	for _, ok := range []string{"/", "/blog", "/review?language=en"} {
		if !isInAppPath(ok) {
			t.Errorf("%q phải hợp lệ", ok)
		}
	}
	for _, bad := range []string{"", "blog", "//evil.com", "https://evil.com", "/\\evil.com", "/a b"} {
		if isInAppPath(bad) {
			t.Errorf("%q phải bị chặn", bad)
		}
	}
}

func TestTruncateRunes(t *testing.T) {
	if got := truncateRunes("Xin chào", 20); got != "Xin chào" {
		t.Errorf("chuỗi ngắn bị cắt: %q", got)
	}
	if got := truncateRunes("Tiếng Việt có dấu", 6); got != "Tiếng…" {
		t.Errorf("cắt theo rune sai: %q", got)
	}
}
