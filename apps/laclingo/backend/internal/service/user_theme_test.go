package service

import (
	"context"
	"errors"
	"testing"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
)

// fakeThemeRepo chỉ cài UpdateUserProfile — gọi hàm khác của UserRepository sẽ panic (interface nhúng nil)
type fakeThemeRepo struct {
	UserRepository
	got   *db.UpdateUserProfileParams
	theme string
}

func (f *fakeThemeRepo) UpdateUserProfile(_ context.Context, arg db.UpdateUserProfileParams) (db.User, error) {
	f.got = &arg
	if arg.Theme.Valid {
		f.theme = arg.Theme.String
	}
	return db.User{ID: arg.ID, Theme: f.theme}, nil
}

func TestUpdateProfileTheme(t *testing.T) {
	ctx := context.Background()
	id := uuid.New()

	t.Run("hợp lệ thì lưu và trả về theme", func(t *testing.T) {
		repo := &fakeThemeRepo{theme: "lac-gold"}
		theme := "cyan"
		res, err := NewUserService(repo).UpdateProfile(ctx, id, UpdateProfileRequest{Theme: &theme})
		if err != nil || res.Theme != "cyan" || !repo.got.Theme.Valid {
			t.Fatalf("res=%+v err=%v params=%+v", res, err, repo.got)
		}
	})

	t.Run("không gửi theme thì giữ nguyên", func(t *testing.T) {
		repo := &fakeThemeRepo{theme: "patina"}
		name := "A"
		res, err := NewUserService(repo).UpdateProfile(ctx, id, UpdateProfileRequest{FullName: &name})
		if err != nil || repo.got.Theme.Valid || res.Theme != "patina" {
			t.Fatalf("res=%+v err=%v params=%+v", res, err, repo.got)
		}
	})

	t.Run("theme lạ bị từ chối, không ghi DB", func(t *testing.T) {
		repo := &fakeThemeRepo{}
		bad := "neon"
		_, err := NewUserService(repo).UpdateProfile(ctx, id, UpdateProfileRequest{Theme: &bad})
		if !errors.Is(err, ErrInvalidInput) || repo.got != nil {
			t.Fatalf("err=%v params=%+v", err, repo.got)
		}
	})
}
