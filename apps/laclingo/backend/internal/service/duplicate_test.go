package service

import (
	"errors"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgconn"
)

func TestAsDuplicate(t *testing.T) {
	unique := &pgconn.PgError{Code: pgUniqueViolation}
	err := asDuplicate(unique, `List "Từ khó" đã tồn tại`)
	if !errors.Is(err, ErrDuplicate) || err.Error() != `List "Từ khó" đã tồn tại` {
		t.Fatalf("unique violation → %v", err)
	}
	other := errors.New("boom")
	if got := asDuplicate(other, "x"); got != other {
		t.Fatalf("other errors must pass through, got %v", got)
	}
	if asDuplicate(nil, "x") != nil {
		t.Fatal("nil must stay nil")
	}
}

func TestShortText(t *testing.T) {
	if got := shortText("  ngắn  "); got != "ngắn" {
		t.Fatalf("got %q", got)
	}
	long := strings.Repeat("á", 70)
	if got := shortText(long); got != strings.Repeat("á", 60)+"…" {
		t.Fatalf("got %q", got)
	}
}
