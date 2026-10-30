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

// passwordRepo — refreshRepo + lưu mật khẩu mới
type passwordRepo struct {
	*refreshRepo
}

func (r passwordRepo) ExpireUserPasswordResets(context.Context, pgtype.UUID) error { return nil }

func (r passwordRepo) UpdateUserPassword(_ context.Context, a db.UpdateUserPasswordParams) error {
	r.user.PasswordHash = a.PasswordHash
	return nil
}

func TestChangePassword(t *testing.T) {
	ctx := context.Background()
	hash, _ := bcrypt.GenerateFromPassword([]byte("matkhau-cu-1"), bcrypt.MinCost)
	base := &refreshRepo{user: db.User{ID: toPgUUID(uuid.New()), IsActive: true, PasswordHash: string(hash)}, tokens: map[string]*db.RefreshToken{}}
	repo := passwordRepo{base}
	svc := NewAuthService(repo, &fakeTokens{}, nil, nil)
	userID := uuid.UUID(base.user.ID.Bytes)
	other, _ := svc.issue(ctx, base.user, uuid.New()) // phiên ở máy khác (có thể của kẻ gian)

	for _, bad := range []ChangePasswordRequest{
		{CurrentPassword: "sai-mat-khau", NewPassword: "matkhau-moi-2"},
		{CurrentPassword: "matkhau-cu-1", NewPassword: "ngan"},
		{CurrentPassword: "matkhau-cu-1", NewPassword: "matkhau-cu-1"},
	} {
		if _, err := svc.ChangePassword(ctx, userID, bad); !errors.Is(err, ErrInvalidInput) {
			t.Fatalf("%+v phải bị từ chối, err=%v", bad, err)
		}
	}
	if bcrypt.CompareHashAndPassword([]byte(base.user.PasswordHash), []byte("matkhau-cu-1")) != nil {
		t.Fatal("đổi lỗi thì không được đổi mật khẩu")
	}

	res, err := svc.ChangePassword(ctx, userID, ChangePasswordRequest{CurrentPassword: "matkhau-cu-1", NewPassword: "matkhau-moi-2"})
	if err != nil || res.RefreshToken == "" {
		t.Fatalf("đổi mật khẩu: %+v %v", res, err)
	}
	if bcrypt.CompareHashAndPassword([]byte(base.user.PasswordHash), []byte("matkhau-moi-2")) != nil {
		t.Fatal("phải lưu mật khẩu mới")
	}
	if _, err := svc.Refresh(ctx, other.RefreshToken); !errors.Is(err, ErrSessionExpired) {
		t.Fatalf("phiên cũ ở máy khác phải bị thu hồi: %v", err)
	}
	if _, err := svc.Refresh(ctx, res.RefreshToken); err != nil {
		t.Fatalf("phiên mới của máy đang đổi phải dùng được: %v", err)
	}
}
