package service

import (
	"context"
	"errors"

	"laclingo-backend/internal/repository/db"

	"github.com/jackc/pgx/v5"
)

// LanguageRepository định nghĩa Interface tiếp xúc với cơ sở dữ liệu
type LanguageRepository interface {
	GetLanguageByID(ctx context.Context, id string) (db.Language, error)
	ListLanguages(ctx context.Context) ([]db.Language, error)
}

type LanguageService struct {
	repo LanguageRepository
}

func NewLanguageService(repo LanguageRepository) *LanguageService {
	return &LanguageService{
		repo: repo,
	}
}

func (s *LanguageService) GetByID(ctx context.Context, id string) (db.Language, error) {
	lang, err := s.repo.GetLanguageByID(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return db.Language{}, ErrNotFound
	}
	return lang, err
}

func (s *LanguageService) List(ctx context.Context) ([]db.Language, error) {
	langs, err := s.repo.ListLanguages(ctx)
	if err != nil {
		return nil, err
	}
	if langs == nil {
		langs = []db.Language{}
	}
	return langs, nil
}
