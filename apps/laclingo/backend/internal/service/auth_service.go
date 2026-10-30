package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	mathrand "math/rand/v2"
	"net/mail"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/crypto/bcrypt"
)

const (
	minPasswordLen        = 8
	maxPasswordLen        = 72 // giới hạn của bcrypt
	minUsernameLen        = 3
	maxUsernameLen        = 50
	maxFullNameLen        = 100
	pgUniqueViolation     = "23505"
	pgForeignKeyViolation = "23503"
	// pgInvalidParameterValue — vd AT TIME ZONE với múi giờ PostgreSQL không biết
	pgInvalidParameterValue = "22023"
)

// usernameRegex: chữ thường/số, cho phép . _ - ở giữa; không có '@' nên không
// bao giờ trùng định dạng với email khi đăng nhập bằng identifier
var usernameRegex = regexp.MustCompile(`^[a-z0-9][a-z0-9._-]*[a-z0-9]$`)

// dummyHash dùng để so sánh khi tài khoản không tồn tại — giữ thời gian phản hồi
// tương đương, tránh lộ email/username nào đã đăng ký qua timing
var dummyHash, _ = bcrypt.GenerateFromPassword([]byte("laclingo-dummy-password"), bcrypt.DefaultCost)

// AuthRepository định nghĩa Interface tiếp xúc với cơ sở dữ liệu
type AuthRepository interface {
	GetUserByIdentifier(ctx context.Context, email string) (db.User, error)
	CreateUser(ctx context.Context, arg db.CreateUserParams) (db.User, error)
	CreateRefreshToken(ctx context.Context, arg db.CreateRefreshTokenParams) (db.RefreshToken, error)
	GetRefreshTokenByHash(ctx context.Context, tokenHash string) (db.RefreshToken, error)
	RotateRefreshToken(ctx context.Context, arg db.RotateRefreshTokenParams) (db.RefreshToken, error)
	RevokeRefreshFamily(ctx context.Context, familyID pgtype.UUID) error
	RevokeRefreshToken(ctx context.Context, tokenHash string) error
	RevokeUserRefreshTokens(ctx context.Context, userID pgtype.UUID) error
	UpdateUserPassword(ctx context.Context, arg db.UpdateUserPasswordParams) error
	DeleteExpiredRefreshTokens(ctx context.Context) (int64, error)
	GetUserByID(ctx context.Context, id pgtype.UUID) (db.User, error)
	DeleteUser(ctx context.Context, id pgtype.UUID) (int64, error)
	ListUserBlogImageKeys(ctx context.Context, authorID pgtype.UUID) ([]string, error)
	ListUserAvatarKeys(ctx context.Context, userID pgtype.UUID) ([]string, error)
}

// AccountBilling dọn thanh toán trước khi xoá tài khoản — không thì cổng thanh toán vẫn trừ tiền kỳ sau
type AccountBilling interface {
	PrepareAccountDeletion(ctx context.Context, userID uuid.UUID) error
}

// ObjectDeleter xoá file đã tải lên (R2)
type ObjectDeleter interface {
	Delete(ctx context.Context, key string) error
}

// TokenIssuer phát hành access token cho user
type TokenIssuer interface {
	Issue(userID uuid.UUID) (string, time.Time, error)
	RefreshTTL() time.Duration // refresh token sống bao lâu (mỗi lần làm mới tính lại từ đầu)
}

// refreshReuseGrace — token vừa đổi xong mà bị dùng lại trong khoảng này (2 tab làm mới cùng lúc) chỉ bị từ chối;
// quá khoảng này mới coi là bị đánh cắp và thu hồi cả họ token. Trong 1 tab app đã gom các lần làm mới làm 1.
const refreshReuseGrace = 30 * time.Second

// refreshFamilyMaxAge — tuổi tối đa của 1 phiên đăng nhập (tính từ lúc đăng nhập, không gia hạn khi xoay token): refresh
// token bị đánh cắp mà kẻ gian cứ xoay đều trước khi chủ dùng lại thì vẫn hết hạn, phải đăng nhập lại bằng mật khẩu
const refreshFamilyMaxAge = 90 * 24 * time.Hour

// refreshCleanupEvery — dọn bảng refresh_tokens khoảng 1 / N lần đăng nhập (không quét bảng mỗi lần)
const refreshCleanupEvery = 50

// ErrSessionExpired — refresh token sai / hết hạn / đã thu hồi: phải đăng nhập lại (401)
var ErrSessionExpired = errors.New("phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại")

// newRefreshToken — 32 byte ngẫu nhiên (base64url) + hash SHA-256 để lưu DB
func newRefreshToken() (token, hash string, err error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", "", err
	}
	token = base64.RawURLEncoding.EncodeToString(b)
	return token, hashRefreshToken(token), nil
}

func hashRefreshToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

// RefreshRequest — làm mới phiên / đăng xuất bằng refresh token
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type RegisterRequest struct {
	Email    string `json:"email" example:"user@laclingo.vn"`
	Username string `json:"username" minLength:"3" maxLength:"50" example:"nguyenvana"`
	Password string `json:"password" minLength:"8" maxLength:"72" example:"matkhau123"`
	FullName string `json:"full_name" maxLength:"100" example:"Nguyễn Văn A"`
}

// LoginRequest — identifier nhận email HOẶC username
type LoginRequest struct {
	Identifier string `json:"identifier" example:"user@laclingo.vn"`
	Password   string `json:"password" example:"matkhau123"`
}

// AuthResponse trả về sau khi đăng ký / đăng nhập thành công
type AuthResponse struct {
	AccessToken string    `json:"access_token"`
	TokenType   string    `json:"token_type" example:"Bearer"`
	ExpiresAt   time.Time `json:"expires_at"`
	// Refresh token: đổi lấy access token mới khi hết hạn (POST /auth/refresh) — mỗi lần dùng nhận token mới
	RefreshToken     string       `json:"refresh_token"`
	RefreshExpiresAt time.Time    `json:"refresh_expires_at"`
	User             UserResponse `json:"user"`
}

// DeleteAccountRequest — nhập lại mật khẩu để xác nhận xoá tài khoản
type DeleteAccountRequest struct {
	Password string `json:"password" example:"matkhau123"`
}

type AuthService struct {
	repo    AuthRepository
	tokens  TokenIssuer
	billing AccountBilling
	files   ObjectDeleter // nil = R2 chưa cấu hình
}

func NewAuthService(repo AuthRepository, tokens TokenIssuer, billing AccountBilling, files ObjectDeleter) *AuthService {
	return &AuthService{repo: repo, tokens: tokens, billing: billing, files: files}
}

func (s *AuthService) Register(ctx context.Context, req RegisterRequest) (AuthResponse, error) {
	email, err := normalizeEmail(req.Email)
	if err != nil {
		return AuthResponse{}, err
	}
	username, err := normalizeUsername(req.Username)
	if err != nil {
		return AuthResponse{}, err
	}
	if n := len(req.Password); n < minPasswordLen || n > maxPasswordLen {
		return AuthResponse{}, ErrInvalidInput
	}
	fullName := strings.TrimSpace(req.FullName)
	if utf8.RuneCountInString(fullName) > maxFullNameLen {
		return AuthResponse{}, ErrInvalidInput
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return AuthResponse{}, err
	}

	user, err := s.repo.CreateUser(ctx, db.CreateUserParams{
		Email:        email,
		Username:     username,
		PasswordHash: string(hash),
		FullName:     pgtype.Text{String: fullName, Valid: fullName != ""},
	})
	if isPgErrorConstraint(err, pgUniqueViolation, "users_username_key") {
		return AuthResponse{}, ErrUsernameTaken
	}
	if isPgError(err, pgUniqueViolation) {
		return AuthResponse{}, ErrEmailTaken
	}
	if err != nil {
		return AuthResponse{}, err
	}

	return s.issue(ctx, user, uuid.New())
}

func (s *AuthService) Login(ctx context.Context, req LoginRequest) (AuthResponse, error) {
	identifier := strings.ToLower(strings.TrimSpace(req.Identifier))
	if identifier == "" {
		return AuthResponse{}, ErrInvalidCredentials
	}

	user, err := s.repo.GetUserByIdentifier(ctx, identifier)
	if errors.Is(err, pgx.ErrNoRows) {
		_ = bcrypt.CompareHashAndPassword(dummyHash, []byte(req.Password))
		return AuthResponse{}, ErrInvalidCredentials
	}
	if err != nil {
		return AuthResponse{}, err
	}

	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil {
		return AuthResponse{}, ErrInvalidCredentials
	}
	if !user.IsActive {
		return AuthResponse{}, ErrAccountDeactivated
	}
	if mathrand.IntN(refreshCleanupEvery) == 0 { // dọn rác — không chặn đăng nhập
		if _, err := s.repo.DeleteExpiredRefreshTokens(ctx); err != nil {
			log.Printf("⚠️  auth: dọn refresh token hết hạn: %v", err)
		}
	}
	return s.issue(ctx, user, uuid.New())
}

// Refresh đổi refresh token lấy access token + refresh token mới (cùng họ). Token đã đổi bị dùng lại sau
// refreshReuseGrace → thu hồi cả họ (phiên đăng nhập đó phải đăng nhập lại).
func (s *AuthService) Refresh(ctx context.Context, token string) (AuthResponse, error) {
	if token == "" {
		return AuthResponse{}, ErrSessionExpired
	}
	rt, err := s.repo.GetRefreshTokenByHash(ctx, hashRefreshToken(token))
	if errors.Is(err, pgx.ErrNoRows) {
		return AuthResponse{}, ErrSessionExpired
	}
	if err != nil {
		return AuthResponse{}, err
	}
	now := time.Now()
	if rt.RevokedAt.Valid {
		if rt.ReplacedAt.Valid && now.Sub(rt.ReplacedAt.Time) > refreshReuseGrace {
			log.Printf("⚠️  auth: refresh token đã đổi bị dùng lại — thu hồi phiên user=%s", uuid.UUID(rt.UserID.Bytes))
			if err := s.repo.RevokeRefreshFamily(ctx, rt.FamilyID); err != nil {
				return AuthResponse{}, err
			}
		}
		return AuthResponse{}, ErrSessionExpired
	}
	if !rt.ExpiresAt.Time.After(now) {
		return AuthResponse{}, ErrSessionExpired
	}
	if rt.FamilyCreatedAt.Valid && now.Sub(rt.FamilyCreatedAt.Time) > refreshFamilyMaxAge {
		if err := s.repo.RevokeRefreshFamily(ctx, rt.FamilyID); err != nil {
			return AuthResponse{}, err
		}
		return AuthResponse{}, ErrSessionExpired
	}
	user, err := s.repo.GetUserByID(ctx, rt.UserID)
	if errors.Is(err, pgx.ErrNoRows) {
		return AuthResponse{}, ErrSessionExpired
	}
	if err != nil {
		return AuthResponse{}, err
	}
	if !user.IsActive {
		return AuthResponse{}, ErrAccountDeactivated
	}
	refresh, hash, err := newRefreshToken()
	if err != nil {
		return AuthResponse{}, err
	}
	refreshExpires := time.Now().Add(s.tokens.RefreshTTL())
	_, err = s.repo.RotateRefreshToken(ctx, db.RotateRefreshTokenParams{
		OldID: rt.ID, TokenHash: hash, ExpiresAt: pgtype.Timestamptz{Time: refreshExpires, Valid: true},
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return AuthResponse{}, ErrSessionExpired // request khác vừa đổi token này
	}
	if err != nil {
		return AuthResponse{}, fmt.Errorf("đổi refresh token: %w", err)
	}
	return s.respond(user, refresh, refreshExpires)
}

// Logout thu hồi refresh token (cả họ) của phiên này — access token còn lại tự hết hạn sau ít phút
func (s *AuthService) Logout(ctx context.Context, token string) error {
	if token == "" {
		return nil
	}
	return s.repo.RevokeRefreshToken(ctx, hashRefreshToken(token))
}

// LogoutAll — "đăng xuất mọi thiết bị": thu hồi mọi refresh token của học viên (nghi bị lộ phiên / mất máy). Access
// token đang dùng ở máy khác tự hết hạn trong JWT_TTL
func (s *AuthService) LogoutAll(ctx context.Context, userID uuid.UUID) error {
	return s.repo.RevokeUserRefreshTokens(ctx, toPgUUID(userID))
}

// ChangePasswordRequest — đổi mật khẩu khi đang đăng nhập (phải nhập đúng mật khẩu hiện tại)
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" example:"matkhau123"`
	NewPassword     string `json:"new_password" minLength:"8" maxLength:"72" example:"matkhaumoi456"`
}

// ChangePassword đổi mật khẩu rồi thu hồi MỌI phiên đăng nhập (kẻ đang giữ phiên bị lộ mất quyền làm mới) và cấp phiên
// mới cho thiết bị đang đổi — người dùng không phải đăng nhập lại ở máy này
func (s *AuthService) ChangePassword(ctx context.Context, userID uuid.UUID, req ChangePasswordRequest) (AuthResponse, error) {
	user, err := s.repo.GetUserByID(ctx, toPgUUID(userID))
	if errors.Is(err, pgx.ErrNoRows) {
		return AuthResponse{}, ErrNotFound
	}
	if err != nil {
		return AuthResponse{}, err
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword)) != nil {
		return AuthResponse{}, fmt.Errorf("mật khẩu hiện tại không đúng: %w", ErrInvalidInput)
	}
	if n := len(req.NewPassword); n < minPasswordLen || n > maxPasswordLen {
		return AuthResponse{}, fmt.Errorf("mật khẩu mới phải từ %d đến %d ký tự: %w", minPasswordLen, maxPasswordLen, ErrInvalidInput)
	}
	if req.NewPassword == req.CurrentPassword {
		return AuthResponse{}, fmt.Errorf("mật khẩu mới phải khác mật khẩu hiện tại: %w", ErrInvalidInput)
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return AuthResponse{}, err
	}
	if err := s.repo.UpdateUserPassword(ctx, db.UpdateUserPasswordParams{ID: user.ID, PasswordHash: string(hash)}); err != nil {
		return AuthResponse{}, err
	}
	if err := s.repo.RevokeUserRefreshTokens(ctx, user.ID); err != nil {
		return AuthResponse{}, err
	}
	return s.issue(ctx, user, uuid.New())
}

// DeleteAccount — học viên tự xoá vĩnh viễn tài khoản và dữ liệu của mình. Owner không tự xoá được (hệ thống
// luôn cần owner). Gói tự gia hạn được huỷ ở cổng thanh toán TRƯỚC khi xoá: huỷ lỗi thì giữ nguyên tài khoản.
func (s *AuthService) DeleteAccount(ctx context.Context, userID uuid.UUID, req DeleteAccountRequest) error {
	user, err := s.repo.GetUserByID(ctx, toPgUUID(userID))
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}
	if user.Role == "owner" {
		return fmt.Errorf("tài khoản owner không thể tự xoá: %w", ErrForbidden)
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil {
		return fmt.Errorf("mật khẩu không đúng: %w", ErrInvalidInput)
	}
	if err := s.billing.PrepareAccountDeletion(ctx, userID); err != nil {
		return err
	}
	keys, err := s.repo.ListUserBlogImageKeys(ctx, user.ID)
	if err != nil {
		return err
	}
	avatarKeys, err := s.repo.ListUserAvatarKeys(ctx, user.ID)
	if err != nil {
		return err
	}
	keys = append(keys, avatarKeys...)
	n, err := s.repo.DeleteUser(ctx, user.ID)
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	// Ảnh blog + ảnh đại diện trên R2 — tài khoản đã xoá nên lỗi chỉ ghi log (file mồ côi, không còn link nào trỏ tới)
	if s.files != nil {
		for _, key := range keys {
			if err := s.files.Delete(context.WithoutCancel(ctx), key); err != nil {
				log.Printf("⚠️  xoá ảnh %s của tài khoản đã xoá %s: %v", key, userID, err)
			}
		}
	}
	return nil
}

// issue phát access token + refresh token mới thuộc họ family (đăng nhập / đăng ký = họ mới)
func (s *AuthService) issue(ctx context.Context, user db.User, family uuid.UUID) (AuthResponse, error) {
	refresh, hash, err := newRefreshToken()
	if err != nil {
		return AuthResponse{}, err
	}
	refreshExpires := time.Now().Add(s.tokens.RefreshTTL())
	if _, err := s.repo.CreateRefreshToken(ctx, db.CreateRefreshTokenParams{
		UserID: user.ID, FamilyID: toPgUUID(family), TokenHash: hash, ExpiresAt: pgtype.Timestamptz{Time: refreshExpires, Valid: true},
	}); err != nil {
		return AuthResponse{}, fmt.Errorf("tạo refresh token: %w", err)
	}
	return s.respond(user, refresh, refreshExpires)
}

// respond — access token mới + refresh token vừa lưu
func (s *AuthService) respond(user db.User, refresh string, refreshExpires time.Time) (AuthResponse, error) {
	token, expiresAt, err := s.tokens.Issue(uuid.UUID(user.ID.Bytes))
	if err != nil {
		return AuthResponse{}, err
	}
	return AuthResponse{
		AccessToken:      token,
		TokenType:        "Bearer",
		ExpiresAt:        expiresAt,
		RefreshToken:     refresh,
		RefreshExpiresAt: refreshExpires,
		User:             toUserResponse(user),
	}, nil
}

func normalizeEmail(raw string) (string, error) {
	email := strings.ToLower(strings.TrimSpace(raw))
	addr, err := mail.ParseAddress(email)
	if err != nil || addr.Address != email || len(email) > 255 {
		return "", ErrInvalidInput
	}
	return email, nil
}

func normalizeUsername(raw string) (string, error) {
	username := strings.ToLower(strings.TrimSpace(raw))
	if n := len(username); n < minUsernameLen || n > maxUsernameLen || !usernameRegex.MatchString(username) {
		return "", ErrInvalidInput
	}
	return username, nil
}

func isPgError(err error, code string) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == code
}

func isPgErrorConstraint(err error, code, constraint string) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == code && pgErr.ConstraintName == constraint
}
