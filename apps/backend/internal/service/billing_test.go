package service

import (
	"strings"
	"testing"
	"time"

	"laclingo-backend/internal/repository/db"

	"github.com/jackc/pgx/v5/pgtype"
)

func day(s string) pgtype.Date {
	t, _ := time.Parse("2006-01-02", s)
	return pgtype.Date{Time: t, Valid: true}
}

func TestNextStreak(t *testing.T) {
	today := day("2026-10-23")
	cases := []struct {
		name          string
		count         int32
		last          pgtype.Date
		freezes       int32
		pro           bool
		want, wantUse int32
	}{
		{"first study", 0, pgtype.Date{}, 0, false, 1, 0},
		{"already today", 5, today, 0, false, 5, 0},
		{"yesterday +1", 5, day("2026-10-22"), 0, false, 6, 0},
		{"missed 1 day, no freeze → reset", 5, day("2026-10-21"), 0, false, 1, 0},
		{"missed 1 day, free user bought a freeze", 5, day("2026-10-21"), 1, false, 6, 1},
		{"missed 1 day, pro with freeze", 5, day("2026-10-21"), 2, true, 6, 1},
		{"missed 2 days, pro 2 freezes", 5, day("2026-10-20"), 2, true, 6, 2},
		{"missed 3 days, pro only 2 freezes → reset", 5, day("2026-10-19"), 2, true, 1, 0},
		{"month boundary yesterday", 9, day("2026-09-30"), 0, false, 10, 0},
	}
	for _, c := range cases {
		today := today
		if c.name == "month boundary yesterday" {
			today = day("2026-10-01")
		}
		got, use := nextStreak(c.count, c.last, today, c.freezes)
		if got != c.want || use != c.wantUse {
			t.Errorf("%s: got (%d, use %d), want (%d, use %d)", c.name, got, use, c.want, c.wantUse)
		}
	}
}

func TestEffectiveStreak(t *testing.T) {
	today := day("2026-10-23")
	if got := effectiveStreak(7, day("2026-10-22"), today, 0); got != 7 {
		t.Errorf("studied yesterday → still 7, got %d", got)
	}
	if got := effectiveStreak(7, day("2026-10-21"), today, 0); got != 0 {
		t.Errorf("no freeze, missed a day → broken (0), got %d", got)
	}
	if got := effectiveStreak(7, day("2026-10-21"), today, 1); got != 7 {
		t.Errorf("with a freeze for the missed day → 7, got %d", got)
	}
	if got := effectiveStreak(3, pgtype.Date{}, today, 0); got != 0 {
		t.Errorf("never studied → 0, got %d", got)
	}
}

func TestDailyLimitsAndLimitError(t *testing.T) {
	if dailyLimit(FeatureSRSReview, false) != 15 || dailyLimit(FeatureSRSReview, true) != 0 {
		t.Error("SRS: free 15/day, pro unlimited")
	}
	if dailyLimit(FeatureSpeaking, false) != 10 || dailyLimit(FeatureSpeaking, true) != 0 {
		t.Error("speaking: free 10/day, pro unlimited")
	}
	if dailyLimit(FeatureSentenceAnalysis, false) != 5 || dailyLimit(FeatureSentenceAnalysis, true) != 30 {
		t.Error("sentence analysis: free 5, pro 30")
	}
	if msg := (&LimitError{Feature: FeatureSRSReview, Limit: 15}).Error(); !strings.Contains(msg, "Pro") || !strings.Contains(msg, "15") {
		t.Errorf("free message should invite upgrading: %q", msg)
	}
	if msg := (&LimitError{Feature: FeatureSentenceAnalysis, Limit: 30, Pro: true}).Error(); strings.Contains(msg, "nâng cấp") {
		t.Errorf("pro message must not ask to upgrade: %q", msg)
	}
}

func TestAvailableFreezes(t *testing.T) {
	month := day("2026-11-01")
	inv := func(freezes int32, granted string) db.UserInventory {
		i := db.UserInventory{StreakFreezes: freezes}
		if granted != "" {
			i.FreezesGrantedMonth = day(granted)
		}
		return i
	}
	if got := availableFreezes(inv(0, "2026-10-01"), true, month); got != ProStreakFreezesPerMonth {
		t.Errorf("pro, not refilled this month → will get %d, got %d", ProStreakFreezesPerMonth, got)
	}
	if got := availableFreezes(inv(0, "2026-11-01"), true, month); got != 0 {
		t.Errorf("pro, already refilled and used → 0, got %d", got)
	}
	if got := availableFreezes(inv(0, ""), false, month); got != 0 {
		t.Errorf("free never gets freezes, got %d", got)
	}
	if got := availableFreezes(inv(3, "2026-10-01"), true, month); got != 3 {
		t.Errorf("refill tops up, never lowers: got %d", got)
	}
}
