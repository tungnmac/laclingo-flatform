package service

import (
	"context"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// VocabularyTopic represents a vocabulary topic with count of unlearned words
type VocabularyTopic struct {
	Topic           string `json:"topic"`
	VocabularyCount int64  `json:"vocabulary_count"`
}

// VocabularyWithDetails represents a vocabulary with all details
type VocabularyWithDetails struct {
	ID         uuid.UUID `json:"id"`
	LanguageID string    `json:"language_id"`
	Term       string    `json:"term"`
	Phonetic   string    `json:"phonetic"`
	Meaning    string    `json:"meaning"`
	Example    string    `json:"example"`
	Topic      string    `json:"topic"`
	Level      string    `json:"level"`
	ImageURL   string    `json:"image_url"`
	AudioURL   string    `json:"audio_url"`
}

type VocabularyService struct {
	repo *db.Queries
}

func NewVocabularyService(repo *db.Queries) *VocabularyService {
	return &VocabularyService{repo: repo}
}

// ListTopics returns topics with count of unlearned vocabularies
func (s *VocabularyService) ListTopics(ctx context.Context, userID uuid.UUID, languageID string) ([]VocabularyTopic, error) {
	rows, err := s.repo.ListVocabularyTopics(ctx, db.ListVocabularyTopicsParams{
		LanguageID: languageID,
		UserID:     pgtype.UUID{Bytes: userID, Valid: true},
	})
	if err != nil {
		return nil, err
	}

	topics := make([]VocabularyTopic, 0, len(rows))
	for _, r := range rows {
		topics = append(topics, VocabularyTopic{
			Topic:           r.Topic,
			VocabularyCount: r.VocabularyCount,
		})
	}
	return topics, nil
}

// ListByTopic returns vocabularies by topic for user who hasn't learned them
func (s *VocabularyService) ListByTopic(ctx context.Context, userID uuid.UUID, languageID, topic string) ([]VocabularyWithDetails, error) {
	rows, err := s.repo.ListVocabulariesByTopic(ctx, db.ListVocabulariesByTopicParams{
		LanguageID: languageID,
		Topic:      topic,
		UserID:     pgtype.UUID{Bytes: userID, Valid: true},
	})
	if err != nil {
		return nil, err
	}

	vocabs := make([]VocabularyWithDetails, 0, len(rows))
	for _, r := range rows {
		vocabs = append(vocabs, VocabularyWithDetails{
			ID:         uuid.UUID(r.ID.Bytes),
			LanguageID: r.LanguageID,
			Term:       r.Term,
			Phonetic:   r.Phonetic.String,
			Meaning:    r.Meaning,
			Example:    r.Example.String,
			Topic:      r.Topic,
			Level:      r.Level,
			ImageURL:   r.ImageUrl.String,
			AudioURL:   r.AudioUrl.String,
		})
	}
	return vocabs, nil
}
