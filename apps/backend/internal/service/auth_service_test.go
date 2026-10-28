package service

import (
	"context"
	"errors"
	"testing"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/crypto/bcrypt"
)

type fakeAuthRepo struct {
	AuthRepository
	user    db.User
	deleted bool
}

func (f *fakeAuthRepo) GetUserByID(context.Context, pgtype.UUID) (db.User, error) { return f.user, nil }
func (f *fakeAuthRepo) ListUserBlogImageKeys(context.Context, pgtype.UUID) ([]string, error) {
	return []string{"blog/a.png"}, nil
}
func (f *fakeAuthRepo) ListUserAvatarKeys(context.Context, pgtype.UUID) ([]string, error) {
	return nil, nil
}
func (f *fakeAuthRepo) DeleteUser(context.Context, pgtype.UUID) (int64, error) {
	f.deleted = true
	return 1, nil
}

type fakeFiles struct{ deleted []string }

func (f *fakeFiles) Delete(_ context.Context, key string) error {
	f.deleted = append(f.deleted, key)
	return nil
}

type fakeCanceller struct {
	called bool
	err    error
}

func (f *fakeCanceller) PrepareAccountDeletion(context.Context, uuid.UUID) error {
	f.called = true
	return f.err
}

func TestDeleteAccount(t *testing.T) {
	hash, _ := bcrypt.GenerateFromPassword([]byte("matkhau123"), bcrypt.MinCost)
	stripeDown := errors.New("stripe down")
	cases := []struct {
		name, role, password string
		cancelErr            error
		wantErr              error
		wantCancel, wantDel  bool
	}{
		{"ok", "user", "matkhau123", nil, nil, true, true},
		{"admin ok", "admin", "matkhau123", nil, nil, true, true},
		{"wrong password", "user", "sai", nil, ErrInvalidInput, false, false},
		{"owner blocked", "owner", "sai", nil, ErrForbidden, false, false},
		{"cancel failed keeps account", "user", "matkhau123", stripeDown, stripeDown, true, false},
	}
	for _, c := range cases {
		repo := &fakeAuthRepo{user: db.User{ID: toPgUUID(uuid.New()), PasswordHash: string(hash), Role: c.role}}
		subs := &fakeCanceller{err: c.cancelErr}
		files := &fakeFiles{}
		err := NewAuthService(repo, nil, subs, files).DeleteAccount(context.Background(), uuid.New(), DeleteAccountRequest{Password: c.password})
		if !errors.Is(err, c.wantErr) || (c.wantErr == nil && err != nil) {
			t.Errorf("%s: err = %v, want %v", c.name, err, c.wantErr)
		}
		if subs.called != c.wantCancel || repo.deleted != c.wantDel || (len(files.deleted) == 1) != c.wantDel {
			t.Errorf("%s: cancel=%v delete=%v files=%v, want %v/%v", c.name, subs.called, repo.deleted, files.deleted, c.wantCancel, c.wantDel)
		}
	}
}
