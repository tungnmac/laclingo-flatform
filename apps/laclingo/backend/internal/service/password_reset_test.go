package service

import (
	"context"
	"errors"
	"net/url"
	"strings"
	"testing"
	"time"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/crypto/bcrypt"
)

// resetRepo — 1 user + bảng password_resets trong bộ nhớ
type resetRepo struct {
	user    db.User
	resets  map[string]*db.PasswordReset // hash → mã
	revoked bool
}

func (r *resetRepo) GetUserByIdentifier(_ context.Context, id string) (db.User, error) {
	if id == r.user.Email || id == r.user.Username {
		return r.user, nil
	}
	return db.User{}, pgx.ErrNoRows
}
func (r *resetRepo) InvalidateUserPasswordResets(_ context.Context, userID pgtype.UUID) error {
	for h, t := range r.resets {
		if t.UserID == userID && !t.UsedAt.Valid {
			delete(r.resets, h)
		}
	}
	return nil
}
func (r *resetRepo) CreatePasswordReset(_ context.Context, a db.CreatePasswordResetParams) error {
	r.resets[a.TokenHash] = &db.PasswordReset{UserID: a.UserID, TokenHash: a.TokenHash, ExpiresAt: a.ExpiresAt}
	return nil
}
func (r *resetRepo) UsePasswordReset(_ context.Context, hash string) (pgtype.UUID, error) {
	t, ok := r.resets[hash]
	if !ok || t.UsedAt.Valid || !t.ExpiresAt.Time.After(time.Now()) {
		return pgtype.UUID{}, pgx.ErrNoRows
	}
	t.UsedAt = pgtype.Timestamptz{Time: time.Now(), Valid: true}
	return t.UserID, nil
}
func (r *resetRepo) UpdateUserPassword(_ context.Context, a db.UpdateUserPasswordParams) error {
	r.user.PasswordHash = a.PasswordHash
	return nil
}
func (r *resetRepo) RevokeUserRefreshTokens(context.Context, pgtype.UUID) error {
	r.revoked = true
	return nil
}

type sentMail struct{ to, subject, text string }
type fakeMailer struct{ sent []sentMail }

func (m *fakeMailer) Send(_ context.Context, to, subject, _, text string) error {
	m.sent = append(m.sent, sentMail{to, subject, text})
	return nil
}

// mã trong link email cuối cùng
func tokenFromMail(t *testing.T, m *fakeMailer) string {
	t.Helper()
	text := m.sent[len(m.sent)-1].text
	i := strings.Index(text, "https://app.test/reset-password?token=")
	if i < 0 {
		t.Fatalf("email không có link đặt lại: %q", text)
	}
	u, _ := url.Parse(strings.Fields(text[i:])[0])
	return u.Query().Get("token")
}

func TestPasswordReset(t *testing.T) {
	ctx := context.Background()
	hash, _ := bcrypt.GenerateFromPassword([]byte("matkhau-cu-1"), bcrypt.MinCost)
	repo := &resetRepo{user: db.User{ID: toPgUUID(uuid.New()), Email: "an@test.vn", Username: "an", IsActive: true, PasswordHash: string(hash)},
		resets: map[string]*db.PasswordReset{}}
	mailer := &fakeMailer{}
	svc := NewPasswordResetService(repo, mailer, "https://app.test/")
	svc.background = func(f func()) { f() }

	// Email chưa đăng ký: vẫn trả nil (không lộ), không gửi gì
	if err := svc.Forgot(ctx, ForgotPasswordRequest{Identifier: "la@test.vn"}, "vi"); err != nil || len(mailer.sent) != 0 {
		t.Fatalf("email lạ: err=%v gửi=%d", err, len(mailer.sent))
	}
	// Tài khoản có thật (gõ hoa + khoảng trắng): gửi link tới email của tài khoản
	if err := svc.Forgot(ctx, ForgotPasswordRequest{Identifier: "  AN@test.vn "}, "vi"); err != nil || len(mailer.sent) != 1 || mailer.sent[0].to != "an@test.vn" {
		t.Fatalf("gửi link: err=%v %+v", err, mailer.sent)
	}
	first := tokenFromMail(t, mailer)
	// Yêu cầu lần 2: link cũ hết hiệu lực
	_ = svc.Forgot(ctx, ForgotPasswordRequest{Identifier: "an"}, "en")
	second := tokenFromMail(t, mailer)
	if !strings.Contains(mailer.sent[1].subject, "Reset") {
		t.Errorf("email tiếng Anh: %q", mailer.sent[1].subject)
	}
	if err := svc.Reset(ctx, ResetPasswordRequest{Token: first, NewPassword: "matkhau-moi-2"}); !errors.Is(err, ErrResetLinkInvalid) {
		t.Fatalf("link cũ phải hết hiệu lực: %v", err)
	}
	// Mật khẩu ngắn: từ chối, KHÔNG tiêu mã
	if err := svc.Reset(ctx, ResetPasswordRequest{Token: second, NewPassword: "ngan"}); !errors.Is(err, ErrInvalidInput) || errors.Is(err, ErrResetLinkInvalid) {
		t.Fatalf("mật khẩu ngắn: %v", err)
	}
	if err := svc.Reset(ctx, ResetPasswordRequest{Token: second, NewPassword: "matkhau-moi-2"}); err != nil {
		t.Fatalf("đặt lại: %v", err)
	}
	if bcrypt.CompareHashAndPassword([]byte(repo.user.PasswordHash), []byte("matkhau-moi-2")) != nil || !repo.revoked {
		t.Fatal("phải lưu mật khẩu mới và thu hồi mọi phiên")
	}
	if err := svc.Reset(ctx, ResetPasswordRequest{Token: second, NewPassword: "matkhau-moi-3"}); !errors.Is(err, ErrResetLinkInvalid) {
		t.Fatalf("link chỉ dùng 1 lần: %v", err)
	}

	// Tài khoản bị khoá: không gửi
	repo.user.IsActive = false
	before := len(mailer.sent)
	if err := svc.Forgot(ctx, ForgotPasswordRequest{Identifier: "an"}, "vi"); err != nil || len(mailer.sent) != before {
		t.Fatalf("tài khoản khoá: err=%v", err)
	}
}
