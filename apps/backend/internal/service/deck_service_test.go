package service

import (
	"context"
	"errors"
	"testing"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// fakeDeckRepo — chỉ cài các method test cần; method khác panic (interface nhúng nil)
type fakeDeckRepo struct {
	DeckRepository
	counts map[uuid.UUID]int32 // deckID → practice_count, chỉ list của owner
	owner  uuid.UUID
}

func (f *fakeDeckRepo) IncrementDeckPracticeCount(_ context.Context, arg db.IncrementDeckPracticeCountParams) (int32, error) {
	id := uuid.UUID(arg.ID.Bytes)
	if _, ok := f.counts[id]; !ok || uuid.UUID(arg.UserID.Bytes) != f.owner {
		return 0, pgx.ErrNoRows
	}
	f.counts[id]++
	return f.counts[id], nil
}

func TestCompletePracticeIncrementsOwnDeck(t *testing.T) {
	owner, deck := uuid.New(), uuid.New()
	repo := &fakeDeckRepo{counts: map[uuid.UUID]int32{deck: 2}, owner: owner}
	svc := NewDeckService(repo, nil)

	n, err := svc.CompletePractice(context.Background(), owner, deck)
	if err != nil || n != 3 {
		t.Fatalf("got %d, %v; want 3, nil", n, err)
	}
}

func TestCompletePracticeOtherUsersDeckIsNotFound(t *testing.T) {
	owner, deck := uuid.New(), uuid.New()
	repo := &fakeDeckRepo{counts: map[uuid.UUID]int32{deck: 0}, owner: owner}
	svc := NewDeckService(repo, nil)

	if _, err := svc.CompletePractice(context.Background(), uuid.New(), deck); !errors.Is(err, ErrNotFound) {
		t.Fatalf("other user: err = %v, want ErrNotFound", err)
	}
	if _, err := svc.CompletePractice(context.Background(), owner, uuid.New()); !errors.Is(err, ErrNotFound) {
		t.Fatalf("missing deck: err = %v, want ErrNotFound", err)
	}
	if repo.counts[deck] != 0 {
		t.Fatalf("count changed to %d", repo.counts[deck])
	}
}
