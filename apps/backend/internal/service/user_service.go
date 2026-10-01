package service

import (
	"context"
	"errors"
	"time"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// UserRepository định nghĩa Interface tiếp xúc với cơ sở dữ liệu
type UserRepository interface {
	GetUserByID(ctx context.Context, id pgtype.UUID) (db.User, error)
	ListUsers(ctx context.Context) ([]db.User, error)
}

// UserResponse là dữ liệu trả ra API — không bao gồm password_hash
type UserResponse struct {
	ID          uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	Email       string    `json:"email" example:"user@laclingo.vn"`
	FullName    string    `json:"full_name"`
	AvatarURL   string    `json:"avatar_url"`
	StreakCount int32     `json:"streak_count"`
	CreatedAt   time.Time `json:"created_at"`
}

func toUserResponse(u db.User) UserResponse {
	return UserResponse{
		ID:          uuid.UUID(u.ID.Bytes),
		Email:       u.Email,
		FullName:    u.FullName.String,
		AvatarURL:   u.AvatarUrl.String,
		StreakCount: u.StreakCount.Int32,
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
