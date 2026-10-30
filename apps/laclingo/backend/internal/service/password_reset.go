package service

import (
	"context"
	"errors"
	"fmt"
	"html"
	"log"
	"net/url"
	"strings"
	"time"

	"laclingo-backend/internal/repository/db"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/crypto/bcrypt"
)

// passwordResetTTL — link đặt lại mật khẩu trong email còn hiệu lực bao lâu
const passwordResetTTL = 30 * time.Minute

// ErrResetLinkInvalid — mã sai / hết hạn / đã dùng (không nói rõ trường hợp nào)
var ErrResetLinkInvalid = fmt.Errorf("%w: link đặt lại mật khẩu sai hoặc đã hết hạn", ErrInvalidInput)

type PasswordResetRepository interface {
	GetUserByIdentifier(ctx context.Context, email string) (db.User, error)
	CountRecentPasswordResets(ctx context.Context, userID pgtype.UUID) (int64, error)
	ExpireUserPasswordResets(ctx context.Context, userID pgtype.UUID) error
	DeleteOldPasswordResets(ctx context.Context) error
	CreatePasswordReset(ctx context.Context, arg db.CreatePasswordResetParams) error
	ResetPasswordWithToken(ctx context.Context, arg db.ResetPasswordWithTokenParams) (pgtype.UUID, error)
}

// maxResetEmailsPerHour — mỗi tài khoản nhận tối đa bấy nhiêu email đặt lại / giờ; vượt thì im lặng không gửi (vẫn trả
// thành công: kẻ xấu không spam được hộp thư nạn nhân, cũng không làm chính chủ bị chặn bằng lỗi 429)
const maxResetEmailsPerHour = 3

// ForgotPasswordRequest — email hoặc tên đăng nhập; link gửi tới email của tài khoản
type ForgotPasswordRequest struct {
	Identifier string `json:"identifier" example:"user@laclingo.vn"`
}

// ResetPasswordRequest — mã trong link email + mật khẩu mới
type ResetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"new_password" minLength:"8" maxLength:"72" example:"matkhaumoi456"`
}

// PasswordResetService — quên mật khẩu qua email. mailer nil = server chưa cấu hình gửi email (tính năng tắt)
type PasswordResetService struct {
	repo   PasswordResetRepository
	mailer Mailer
	webURL string
	// chạy gửi email nền — test thay bằng chạy ngay
	background func(func())
}

func NewPasswordResetService(repo PasswordResetRepository, mailer Mailer, webURL string) *PasswordResetService {
	return &PasswordResetService{repo: repo, mailer: mailer, webURL: strings.TrimRight(webURL, "/"), background: func(f func()) { go f() }}
}

// Enabled — server đã cấu hình gửi email chưa
func (s *PasswordResetService) Enabled() bool { return s.mailer != nil }

// Forgot gửi link đặt lại qua email (mã cũ chưa dùng hết hiệu lực). Không có tài khoản / tài khoản bị khoá / vượt giới
// hạn gửi cũng trả nil như có — không lộ email nào đã đăng ký. Sau bước tra tài khoản, mọi việc (tạo mã, gửi email)
// chạy nền nên thời gian phản hồi các trường hợp như nhau
func (s *PasswordResetService) Forgot(ctx context.Context, req ForgotPasswordRequest, locale string) error {
	identifier := strings.ToLower(strings.TrimSpace(req.Identifier))
	if identifier == "" {
		return ErrInvalidInput
	}
	user, err := s.repo.GetUserByIdentifier(ctx, identifier)
	if errors.Is(err, pgx.ErrNoRows) || (err == nil && !user.IsActive) {
		return nil
	}
	if err != nil {
		return err
	}
	s.background(func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("❌ quên mật khẩu: panic user=%x: %v", user.ID.Bytes, r)
			}
		}()
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		if err := s.sendResetLink(ctx, user, locale); err != nil {
			log.Printf("❌ quên mật khẩu: user=%x: %v", user.ID.Bytes, err)
		}
	})
	return nil
}

func (s *PasswordResetService) sendResetLink(ctx context.Context, user db.User, locale string) error {
	recent, err := s.repo.CountRecentPasswordResets(ctx, user.ID)
	if err != nil {
		return err
	}
	if recent >= maxResetEmailsPerHour {
		return nil
	}
	token, hash, err := newRefreshToken() // 256 bit ngẫu nhiên, DB chỉ lưu SHA-256
	if err != nil {
		return err
	}
	if err := s.repo.ExpireUserPasswordResets(ctx, user.ID); err != nil {
		return err
	}
	if err := s.repo.DeleteOldPasswordResets(ctx); err != nil {
		return err
	}
	if err := s.repo.CreatePasswordReset(ctx, db.CreatePasswordResetParams{
		UserID: user.ID, TokenHash: hash, ExpiresAt: pgtype.Timestamptz{Time: time.Now().Add(passwordResetTTL), Valid: true},
	}); err != nil {
		return err
	}
	link := s.webURL + "/reset-password?token=" + url.QueryEscape(token)
	subject, htmlBody, text := resetEmail(locale, displayNameOf(user.FullName, user.Username), link)
	return s.mailer.Send(ctx, user.Email, subject, htmlBody, text)
}

// Reset đặt mật khẩu mới bằng mã trong email — 1 câu lệnh nguyên tử: đốt mã, lưu mật khẩu, thu hồi mọi phiên đăng nhập,
// huỷ mã khác. Mã sai / hết hạn / đã dùng / tài khoản bị khoá → ErrResetLinkInvalid
func (s *PasswordResetService) Reset(ctx context.Context, req ResetPasswordRequest) error {
	if n := len(req.NewPassword); n < minPasswordLen || n > maxPasswordLen {
		return fmt.Errorf("mật khẩu mới phải từ %d đến %d ký tự: %w", minPasswordLen, maxPasswordLen, ErrInvalidInput)
	}
	if req.Token == "" {
		return ErrResetLinkInvalid
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	_, err = s.repo.ResetPasswordWithToken(ctx, db.ResetPasswordWithTokenParams{TokenHash: hashRefreshToken(req.Token), PasswordHash: string(hash)})
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrResetLinkInvalid
	}
	return err
}

// resetEmail — nội dung email theo ngôn ngữ giao diện (vi; còn lại tiếng Anh)
func resetEmail(locale, name, link string) (subject, htmlBody, text string) {
	n, l := html.EscapeString(name), html.EscapeString(link)
	minutes := int(passwordResetTTL.Minutes())
	if locale == "vi" {
		subject = "Đặt lại mật khẩu LacLingo"
		text = fmt.Sprintf("Chào %s,\n\nBấm link sau để đặt mật khẩu mới (hiệu lực %d phút, dùng 1 lần):\n%s\n\nKhông phải bạn yêu cầu? Bỏ qua email này — mật khẩu của bạn không đổi.\n\nLacLingo", name, minutes, link)
		htmlBody = fmt.Sprintf(`<p>Chào %s,</p><p>Bấm nút dưới đây để đặt mật khẩu mới cho tài khoản LacLingo (hiệu lực %d phút, dùng 1 lần):</p><p><a href="%s" style="display:inline-block;padding:12px 20px;background:#b07d12;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Đặt lại mật khẩu</a></p><p style="color:#64748b;font-size:13px">Không phải bạn yêu cầu? Bỏ qua email này — mật khẩu của bạn không đổi.</p>`, n, minutes, l)
		return
	}
	subject = "Reset your LacLingo password"
	text = fmt.Sprintf("Hi %s,\n\nOpen this link to set a new password (valid for %d minutes, one use):\n%s\n\nDidn't ask for this? Ignore this email — your password stays the same.\n\nLacLingo", name, minutes, link)
	htmlBody = fmt.Sprintf(`<p>Hi %s,</p><p>Tap the button below to set a new password for your LacLingo account (valid for %d minutes, one use):</p><p><a href="%s" style="display:inline-block;padding:12px 20px;background:#b07d12;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a></p><p style="color:#64748b;font-size:13px">Didn't ask for this? Ignore this email — your password stays the same.</p>`, n, minutes, l)
	return
}
