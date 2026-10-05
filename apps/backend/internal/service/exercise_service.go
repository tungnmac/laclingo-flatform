package service

import (
	"context"

	"laclingo-backend/internal/repository"
	"laclingo-backend/internal/repository/db"

	"github.com/jackc/pgx/v5/pgtype"
)

// ExerciseRepository defines the database operations for exercises
type ExerciseRepository interface {
	GetActiveExerciseTypes(ctx context.Context) ([]db.ExerciseType, error)
	ListUserDecks(ctx context.Context, userID pgtype.UUID) ([]db.UserDeck, error)
	CreateDeck(ctx context.Context, arg db.CreateDeckParams) (db.UserDeck, error)
	GetDeck(ctx context.Context, arg db.GetDeckParams) (db.UserDeck, error)
	UpdateDeck(ctx context.Context, arg db.UpdateDeckParams) (db.UserDeck, error)
	DeleteDeck(ctx context.Context, arg db.DeleteDeckParams) (int64, error)
	GetDeckVocabularies(ctx context.Context, deckID pgtype.UUID) ([]db.Vocabulary, error)
	AddVocabularyToDeck(ctx context.Context, arg db.AddVocabularyToDeckParams) (int64, error)
	RemoveVocabularyFromDeck(ctx context.Context, arg db.RemoveVocabularyFromDeckParams) (int64, error)
	GetLessonProgressAllLevels(ctx context.Context, arg db.GetLessonProgressAllLevelsParams) ([]db.UserGrammarProgress, error)
	UpsertGrammarProgress(ctx context.Context, arg db.UpsertGrammarProgressParams) (db.UserGrammarProgress, error)
	GetUserExerciseSessions(ctx context.Context, arg db.GetUserExerciseSessionsParams) ([]db.ExerciseSession, error)
}

// ExerciseService handles exercise, deck, and progress operations
type ExerciseService struct {
	repo ExerciseRepository
}

// NewExerciseService creates a new exercise service
func NewExerciseService(repo ExerciseRepository) *ExerciseService {
	return &ExerciseService{repo: repo}
}

// GetExerciseTypes returns all active exercise types
func (s *ExerciseService) GetExerciseTypes(ctx context.Context) ([]db.ExerciseType, error) {
	return s.repo.GetActiveExerciseTypes(ctx)
}

// ListUserDecks returns all decks for a user
func (s *ExerciseService) ListUserDecks(ctx context.Context, userID pgtype.UUID) ([]db.UserDeck, error) {
	return s.repo.ListUserDecks(ctx, userID)
}

// CreateDeck creates a new deck
func (s *ExerciseService) CreateDeck(ctx context.Context, arg db.CreateDeckParams) (db.UserDeck, error) {
	return s.repo.CreateDeck(ctx, arg)
}

// GetDeck returns a deck by ID
func (s *ExerciseService) GetDeck(ctx context.Context, arg db.GetDeckParams) (db.UserDeck, error) {
	return s.repo.GetDeck(ctx, arg)
}

// UpdateDeck updates a deck
func (s *ExerciseService) UpdateDeck(ctx context.Context, arg db.UpdateDeckParams) (db.UserDeck, error) {
	return s.repo.UpdateDeck(ctx, arg)
}

// DeleteDeck deletes a deck
func (s *ExerciseService) DeleteDeck(ctx context.Context, arg db.DeleteDeckParams) (int64, error) {
	return s.repo.DeleteDeck(ctx, arg)
}

// GetDeckVocabularies returns all vocabularies in a deck
func (s *ExerciseService) GetDeckVocabularies(ctx context.Context, deckID pgtype.UUID) ([]db.Vocabulary, error) {
	return s.repo.GetDeckVocabularies(ctx, deckID)
}

// AddVocabularyToDeck adds a vocabulary to a deck
func (s *ExerciseService) AddVocabularyToDeck(ctx context.Context, arg db.AddVocabularyToDeckParams) (int64, error) {
	return s.repo.AddVocabularyToDeck(ctx, arg)
}

// RemoveVocabularyFromDeck removes a vocabulary from a deck
func (s *ExerciseService) RemoveVocabularyFromDeck(ctx context.Context, arg db.RemoveVocabularyFromDeckParams) (int64, error) {
	return s.repo.RemoveVocabularyFromDeck(ctx, arg)
}

// GetGrammarProgress returns grammar progress for a lesson at all levels
func (s *ExerciseService) GetGrammarProgress(ctx context.Context, arg db.GetLessonProgressAllLevelsParams) ([]db.UserGrammarProgress, error) {
	return s.repo.GetLessonProgressAllLevels(ctx, arg)
}

// UpsertGrammarProgress updates or inserts grammar progress
func (s *ExerciseService) UpsertGrammarProgress(ctx context.Context, arg db.UpsertGrammarProgressParams) (db.UserGrammarProgress, error) {
	return s.repo.UpsertGrammarProgress(ctx, arg)
}

// GetUserExerciseSessions returns exercise sessions for a user
func (s *ExerciseService) GetUserExerciseSessions(ctx context.Context, arg db.GetUserExerciseSessionsParams) ([]db.ExerciseSession, error) {
	return s.repo.GetUserExerciseSessions(ctx, arg)
}

// Repository returns the underlying repository for handler access
func (s *ExerciseService) Repository() ExerciseRepository {
	return s.repo
}

// Ensure repository.PostgresRepository implements ExerciseRepository
var _ ExerciseRepository = (*repository.PostgresRepository)(nil)
