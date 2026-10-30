package service

import (
	"context"
	"errors"
	"time"

	"laclingo-backend/internal/repository/db"

	"github.com/jackc/pgx/v5"
)

// LanguageRepository định nghĩa Interface tiếp xúc với cơ sở dữ liệu
type LanguageRepository interface {
	GetLanguageByID(ctx context.Context, id string) (db.Language, error)
	ListLanguages(ctx context.Context) ([]db.Language, error)
}

// LanguageResponse là dữ liệu ngôn ngữ trả ra API
type LanguageResponse struct {
	ID        string    `json:"id" example:"en"`
	Name      string    `json:"name" example:"English"`
	Code      string    `json:"code" example:"en-US"`
	CreatedAt time.Time `json:"created_at"`
	// LevelScale — thang trình độ của ngôn ngữ, thấp → cao (vd ja: N5..N1) — web vẽ ô chọn trình độ theo đây
	LevelScale []string `json:"level_scale" example:"A1,A2,B1,B2,C1,C2"`
}

func toLanguageResponse(l db.Language) LanguageResponse {
	return LanguageResponse{
		ID:         l.ID,
		Name:       l.Name,
		Code:       l.Code,
		CreatedAt:  l.CreatedAt.Time,
		LevelScale: LevelScale(l.ID),
	}
}

type LanguageService struct {
	repo LanguageRepository
}

func NewLanguageService(repo LanguageRepository) *LanguageService {
	return &LanguageService{
		repo: repo,
	}
}

func (s *LanguageService) GetByID(ctx context.Context, id string) (LanguageResponse, error) {
	lang, err := s.repo.GetLanguageByID(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return LanguageResponse{}, ErrNotFound
	}
	if err != nil {
		return LanguageResponse{}, err
	}
	return toLanguageResponse(lang), nil
}

func (s *LanguageService) List(ctx context.Context) ([]LanguageResponse, error) {
	langs, err := s.repo.ListLanguages(ctx)
	if err != nil {
		return nil, err
	}
	results := make([]LanguageResponse, 0, len(langs))
	for _, l := range langs {
		results = append(results, toLanguageResponse(l))
	}
	return results, nil
}
