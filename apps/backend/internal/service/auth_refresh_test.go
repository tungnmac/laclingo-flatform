package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// refreshRepo — kho refresh token trong bộ nhớ (đủ cho AuthService.Refresh / Logout / issue)
type refreshRepo struct {
	AuthRepository
	user   db.User
	tokens map[string]*db.RefreshToken // hash → token
}

func (r *refreshRepo) GetUserByID(context.Context, pgtype.UUID) (db.User, error) { return r.user, nil }
func (r *refreshRepo) CreateRefreshToken(_ context.Context, a db.CreateRefreshTokenParams) (db.RefreshToken, error) {
	t := &db.RefreshToken{ID: toPgUUID(uuid.New()), UserID: a.UserID, FamilyID: a.FamilyID, TokenHash: a.TokenHash, ExpiresAt: a.ExpiresAt}
	r.tokens[a.TokenHash] = t
	return *t, nil
}
func (r *refreshRepo) GetRefreshTokenByHash(_ context.Context, h string) (db.RefreshToken, error) {
	if t, ok := r.tokens[h]; ok {
		return *t, nil
	}
	return db.RefreshToken{}, pgx.ErrNoRows
}
func (r *refreshRepo) RotateRefreshToken(ctx context.Context, a db.RotateRefreshTokenParams) (db.RefreshToken, error) {
	for _, t := range r.tokens {
		if t.ID == a.OldID && !t.RevokedAt.Valid {
			now := pgtype.Timestamptz{Time: time.Now(), Valid: true}
			t.RevokedAt, t.ReplacedAt = now, now
			return r.CreateRefreshToken(ctx, db.CreateRefreshTokenParams{UserID: t.UserID, FamilyID: t.FamilyID, TokenHash: a.TokenHash, ExpiresAt: a.ExpiresAt})
		}
	}
	return db.RefreshToken{}, pgx.ErrNoRows
}
func (r *refreshRepo) RevokeRefreshFamily(_ context.Context, family pgtype.UUID) error {
	for _, t := range r.tokens {
		if t.FamilyID == family && !t.RevokedAt.Valid {
			t.RevokedAt = pgtype.Timestamptz{Time: time.Now(), Valid: true}
		}
	}
	return nil
}
func (r *refreshRepo) RevokeRefreshToken(ctx context.Context, h string) error {
	if t, ok := r.tokens[h]; ok {
		return r.RevokeRefreshFamily(ctx, t.FamilyID)
	}
	return nil
}

type fakeTokens struct{ n int }

func (f *fakeTokens) Issue(uuid.UUID) (string, time.Time, error) {
	f.n++
	return "access-" + string(rune('0'+f.n)), time.Now().Add(time.Hour), nil
}
func (f *fakeTokens) RefreshTTL() time.Duration { return 24 * time.Hour }

func TestRefreshRotation(t *testing.T) {
	ctx := context.Background()
	repo := &refreshRepo{user: db.User{ID: toPgUUID(uuid.New()), IsActive: true}, tokens: map[string]*db.RefreshToken{}}
	svc := NewAuthService(repo, &fakeTokens{}, nil, nil)

	first, err := svc.issue(ctx, repo.user, uuid.New())
	if err != nil || first.RefreshToken == "" || !first.RefreshExpiresAt.After(time.Now()) {
		t.Fatalf("issue: %+v %v", first, err)
	}
	if _, ok := repo.tokens[first.RefreshToken]; ok {
		t.Fatal("DB không được lưu token gốc, chỉ lưu hash")
	}

	second, err := svc.Refresh(ctx, first.RefreshToken)
	if err != nil || second.RefreshToken == first.RefreshToken || second.AccessToken == first.AccessToken {
		t.Fatalf("làm mới phải trả token mới: %+v %v", second, err)
	}
	// Token cũ dùng lại ngay (2 tab cùng làm mới): từ chối nhưng KHÔNG thu hồi phiên
	if _, err := svc.Refresh(ctx, first.RefreshToken); !errors.Is(err, ErrSessionExpired) {
		t.Fatalf("token đã đổi phải bị từ chối: %v", err)
	}
	third, err := svc.Refresh(ctx, second.RefreshToken)
	if err != nil {
		t.Fatalf("token mới vẫn dùng được sau khi token cũ bị dùng lại trong khoảng ân hạn: %v", err)
	}
	// Token cũ dùng lại sau khoảng ân hạn → bị đánh cắp: thu hồi cả họ
	old := repo.tokens[hashRefreshToken(first.RefreshToken)]
	old.ReplacedAt.Time = time.Now().Add(-2 * refreshReuseGrace)
	if _, err := svc.Refresh(ctx, first.RefreshToken); !errors.Is(err, ErrSessionExpired) {
		t.Fatalf("dùng lại token cũ: %v", err)
	}
	if _, err := svc.Refresh(ctx, third.RefreshToken); !errors.Is(err, ErrSessionExpired) {
		t.Fatalf("họ token phải bị thu hồi sau khi phát hiện dùng lại: %v", err)
	}

	// Hết hạn / tài khoản bị khoá / token lạ / đăng xuất
	fresh, _ := svc.issue(ctx, repo.user, uuid.New())
	repo.tokens[hashRefreshToken(fresh.RefreshToken)].ExpiresAt.Time = time.Now().Add(-time.Minute)
	if _, err := svc.Refresh(ctx, fresh.RefreshToken); !errors.Is(err, ErrSessionExpired) {
		t.Errorf("token hết hạn: %v", err)
	}
	if _, err := svc.Refresh(ctx, "khong-ton-tai"); !errors.Is(err, ErrSessionExpired) {
		t.Errorf("token lạ: %v", err)
	}
	locked, _ := svc.issue(ctx, repo.user, uuid.New())
	repo.user.IsActive = false
	if _, err := svc.Refresh(ctx, locked.RefreshToken); !errors.Is(err, ErrAccountDeactivated) {
		t.Errorf("tài khoản bị khoá: %v", err)
	}
	repo.user.IsActive = true
	out, _ := svc.issue(ctx, repo.user, uuid.New())
	if err := svc.Logout(ctx, out.RefreshToken); err != nil {
		t.Fatal(err)
	}
	if _, err := svc.Refresh(ctx, out.RefreshToken); !errors.Is(err, ErrSessionExpired) {
		t.Errorf("đã đăng xuất: %v", err)
	}
}
