package service

import (
	"context"
	"errors"
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
}

// TokenIssuer phát hành access token cho user
type TokenIssuer interface {
	Issue(userID uuid.UUID) (string, time.Time, error)
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
	AccessToken string       `json:"access_token"`
	TokenType   string       `json:"token_type" example:"Bearer"`
	ExpiresAt   time.Time    `json:"expires_at"`
	User        UserResponse `json:"user"`
}

type AuthService struct {
	repo   AuthRepository
	tokens TokenIssuer
}

func NewAuthService(repo AuthRepository, tokens TokenIssuer) *AuthService {
	return &AuthService{repo: repo, tokens: tokens}
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

	return s.issue(user)
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

	return s.issue(user)
}

func (s *AuthService) issue(user db.User) (AuthResponse, error) {
	token, expiresAt, err := s.tokens.Issue(uuid.UUID(user.ID.Bytes))
	if err != nil {
		return AuthResponse{}, err
	}
	return AuthResponse{
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresAt:   expiresAt,
		User:        toUserResponse(user),
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
