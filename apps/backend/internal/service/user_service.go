package service

import (
	"context"
	"errors"
	"net/url"
	"strings"
	"time"
	"unicode/utf8"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// UserRepository định nghĩa Interface tiếp xúc với cơ sở dữ liệu
type UserRepository interface {
	GetUserByID(ctx context.Context, id pgtype.UUID) (db.User, error)
	ListUsers(ctx context.Context) ([]db.User, error)
	UpdateUserProfile(ctx context.Context, arg db.UpdateUserProfileParams) (db.User, error)
	ListUsersByStreak(ctx context.Context, limit int32) ([]db.User, error)
	ListUsersByLevel(ctx context.Context, limit int32) ([]db.User, error)
	ListUsersByPoints(ctx context.Context, limit int32) ([]db.User, error)
}

// UserResponse là dữ liệu trả ra API — không bao gồm password_hash
type UserResponse struct {
	ID          uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	Email       string    `json:"email" example:"user@laclingo.vn"`
	Username    string    `json:"username" example:"nguyenvana"`
	FullName    string    `json:"full_name"`
	AvatarURL   string    `json:"avatar_url"`
	StreakCount int32     `json:"streak_count"`
	Role        string    `json:"role" example:"user"`
	Level       int32     `json:"level"`
	Exp         int64     `json:"exp"`
	Points      int64     `json:"points"`
	CreatedAt   time.Time `json:"created_at"`
}

// LeaderboardEntry — 1 dòng trong bảng xếp hạng, đã kèm thứ hạng (rank =
// vị trí trong danh sách đã sort theo `by`, không cần window function vì luôn
// LIMIT cố định).
type LeaderboardEntry struct {
	Rank        int32     `json:"rank"`
	UserID      uuid.UUID `json:"user_id" swaggertype:"string" format:"uuid"`
	Username    string    `json:"username"`
	FullName    string    `json:"full_name,omitempty"`
	AvatarURL   string    `json:"avatar_url,omitempty"`
	Level       int32     `json:"level"`
	Exp         int64     `json:"exp"`
	Points      int64     `json:"points"`
	StreakCount int32     `json:"streak_count"`
}

const defaultLeaderboardLimit = 50

// UpdateProfileRequest — field nào không gửi (null) thì giữ nguyên
type UpdateProfileRequest struct {
	FullName  *string `json:"full_name" maxLength:"100" example:"Nguyễn Văn A"`
	AvatarURL *string `json:"avatar_url" example:"https://example.com/avatar.png"`
}

func toUserResponse(u db.User) UserResponse {
	return UserResponse{
		ID:          uuid.UUID(u.ID.Bytes),
		Email:       u.Email,
		Username:    u.Username,
		FullName:    u.FullName.String,
		AvatarURL:   u.AvatarUrl.String,
		StreakCount: u.StreakCount.Int32,
		Role:        u.Role,
		Level:       u.Level,
		Exp:         u.Exp,
		Points:      u.Points,
		CreatedAt:   u.CreatedAt.Time,
	}
}

type UserService struct {
	repo UserRepository
}

func NewUserService(repo UserRepository) *UserService {
	return &UserService{
		repo: repo,
	}
}

func (s *UserService) GetByID(ctx context.Context, id uuid.UUID) (UserResponse, error) {
	u, err := s.repo.GetUserByID(ctx, toPgUUID(id))
	if errors.Is(err, pgx.ErrNoRows) {
		return UserResponse{}, ErrNotFound
	}
	if err != nil {
		return UserResponse{}, err
	}
	return toUserResponse(u), nil
}

func (s *UserService) List(ctx context.Context) ([]UserResponse, error) {
	users, err := s.repo.ListUsers(ctx)
	if err != nil {
		return nil, err
	}
	results := make([]UserResponse, 0, len(users))
	for _, u := range users {
		results = append(results, toUserResponse(u))
	}
	return results, nil
}

func (s *UserService) UpdateProfile(ctx context.Context, id uuid.UUID, req UpdateProfileRequest) (UserResponse, error) {
	params := db.UpdateUserProfileParams{ID: toPgUUID(id)}

	if req.FullName != nil {
		name := strings.TrimSpace(*req.FullName)
		if utf8.RuneCountInString(name) > maxFullNameLen {
			return UserResponse{}, ErrInvalidInput
		}
		params.FullName = pgtype.Text{String: name, Valid: true}
	}
	if req.AvatarURL != nil {
		avatar := strings.TrimSpace(*req.AvatarURL)
		if avatar != "" && !isHTTPURL(avatar) {
			return UserResponse{}, ErrInvalidInput
		}
		params.AvatarUrl = pgtype.Text{String: avatar, Valid: true}
	}

	u, err := s.repo.UpdateUserProfile(ctx, params)
	if errors.Is(err, pgx.ErrNoRows) {
		return UserResponse{}, ErrNotFound
	}
	if err != nil {
		return UserResponse{}, err
	}
	return toUserResponse(u), nil
}

// GetLeaderboard trả về top user theo tiêu chí `by` (level|points|streak,
// mặc định streak để tương thích hành vi cũ — FE trước đây tự sort client-side
// theo streak_count). Rank tính theo vị trí trong danh sách (đã LIMIT, sort ở DB).
func (s *UserService) GetLeaderboard(ctx context.Context, by string) ([]LeaderboardEntry, error) {
	var users []db.User
	var err error
	switch by {
	case "level":
		users, err = s.repo.ListUsersByLevel(ctx, defaultLeaderboardLimit)
	case "points":
		users, err = s.repo.ListUsersByPoints(ctx, defaultLeaderboardLimit)
	case "", "streak":
		users, err = s.repo.ListUsersByStreak(ctx, defaultLeaderboardLimit)
	default:
		return nil, ErrInvalidInput
	}
	if err != nil {
		return nil, err
	}

	results := make([]LeaderboardEntry, 0, len(users))
	for i, u := range users {
		results = append(results, LeaderboardEntry{
			Rank:        int32(i + 1),
			UserID:      uuid.UUID(u.ID.Bytes),
			Username:    u.Username,
			FullName:    u.FullName.String,
			AvatarURL:   u.AvatarUrl.String,
			Level:       u.Level,
			Exp:         u.Exp,
			Points:      u.Points,
			StreakCount: u.StreakCount.Int32,
		})
	}
	return results, nil
}

func isHTTPURL(raw string) bool {
	u, err := url.Parse(raw)
	return err == nil && (u.Scheme == "http" || u.Scheme == "https") && u.Host != ""
}
