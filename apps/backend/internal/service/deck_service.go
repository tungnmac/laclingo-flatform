package service

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

const (
	defaultDeckColor = "#6366f1"
	defaultDeckIcon  = "📚"
	maxDeckNameLen   = 100 // user_decks.name VARCHAR(100)
	maxDeckIconLen   = 20  // user_decks.icon VARCHAR(20)
)

var deckColorPattern = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`) // user_decks.color VARCHAR(7)

// DeckRepository — danh sách ôn tập do user tự quản lý
type DeckRepository interface {
	ListDecksForUser(ctx context.Context, arg db.ListDecksForUserParams) ([]db.ListDecksForUserRow, error)
	GetDeckForUser(ctx context.Context, arg db.GetDeckForUserParams) (db.UserDeck, error)
	CreateDeck(ctx context.Context, arg db.CreateDeckParams) (db.UserDeck, error)
	UpdateDeck(ctx context.Context, arg db.UpdateDeckParams) (db.UserDeck, error)
	DeleteDeck(ctx context.Context, arg db.DeleteDeckParams) (int64, error)
	AddVocabularyToDeck(ctx context.Context, arg db.AddVocabularyToDeckParams) (int64, error)
	RemoveVocabularyFromDeck(ctx context.Context, arg db.RemoveVocabularyFromDeckParams) (int64, error)
	ListDeckVocabularies(ctx context.Context, arg db.ListDeckVocabulariesParams) ([]db.ListDeckVocabulariesRow, error)
}

// DeckRequest — tạo/sửa thông tin danh sách ôn tập
type DeckRequest struct {
	Name        string `json:"name" example:"Từ khó tuần này"`
	Description string `json:"description,omitempty"`
	Color       string `json:"color,omitempty" example:"#6366f1"`
	Icon        string `json:"icon,omitempty" example:"📚"`
}

// DeckSummary — 1 danh sách ôn tập kèm số từ / số từ đến hạn
type DeckSummary struct {
	ID          uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Color       string    `json:"color"`
	Icon        string    `json:"icon"`
	WordCount   int32     `json:"word_count"`
	DueCount    int32     `json:"due_count"`
	// ContainsVocabulary — list có chứa từ được hỏi (?vocabulary_id=) không
	ContainsVocabulary bool      `json:"contains_vocabulary"`
	CreatedAt          time.Time `json:"created_at"`
}

// DeckWord — 1 từ trong danh sách ôn tập
type DeckWord struct {
	VocabularyID  uuid.UUID  `json:"vocabulary_id" swaggertype:"string" format:"uuid"`
	LanguageID    string     `json:"language_id"`
	Term          string     `json:"term"`
	Phonetic      string     `json:"phonetic"`
	Meaning       string     `json:"meaning"`
	Topic         string     `json:"topic"`
	Level         string     `json:"level"`
	ImageURL      string     `json:"image_url"`
	ImageEmoji    string     `json:"image_emoji"`
	PracticeCount int32      `json:"practice_count"`
	NextReviewAt  *time.Time `json:"next_review_at,omitempty"`
	AddedAt       time.Time  `json:"added_at"`
}

// DeckDetail — thông tin list + các từ trong list
type DeckDetail struct {
	DeckSummary
	Words []DeckWord `json:"words"`
}

type DeckService struct {
	repo DeckRepository
	srs  *SRSService
}

func NewDeckService(repo DeckRepository, srs *SRSService) *DeckService {
	return &DeckService{repo: repo, srs: srs}
}

// ListDecks trả về list của user, mới tạo trước. vocabularyID khác Nil thì
// đánh dấu list nào đã chứa từ đó (hộp "Thêm vào ôn tập").
func (s *DeckService) ListDecks(ctx context.Context, userID, vocabularyID uuid.UUID) ([]DeckSummary, error) {
	var vocabFilter pgtype.UUID
	if vocabularyID != uuid.Nil {
		vocabFilter = toPgUUID(vocabularyID)
	}
	rows, err := s.repo.ListDecksForUser(ctx, db.ListDecksForUserParams{UserID: toPgUUID(userID), VocabularyID: vocabFilter})
	if err != nil {
		return nil, err
	}
	results := make([]DeckSummary, 0, len(rows))
	for _, r := range rows {
		results = append(results, DeckSummary{
			ID: uuid.UUID(r.ID.Bytes), Name: r.Name, Description: r.Description.String,
			Color: r.Color.String, Icon: r.Icon.String, WordCount: r.WordCount, DueCount: r.DueCount,
			ContainsVocabulary: r.ContainsVocabulary, CreatedAt: r.CreatedAt.Time,
		})
	}
	return results, nil
}

// GetDeck trả về 1 list của user kèm các từ, mới thêm trước
func (s *DeckService) GetDeck(ctx context.Context, userID, deckID uuid.UUID) (DeckDetail, error) {
	deck, err := s.getOwnedDeck(ctx, userID, deckID)
	if err != nil {
		return DeckDetail{}, err
	}
	rows, err := s.repo.ListDeckVocabularies(ctx, db.ListDeckVocabulariesParams{DeckID: toPgUUID(deckID), UserID: toPgUUID(userID)})
	if err != nil {
		return DeckDetail{}, err
	}

	detail := DeckDetail{DeckSummary: toDeckSummary(deck), Words: make([]DeckWord, 0, len(rows))}
	detail.WordCount = int32(len(rows))
	now := time.Now()
	for _, r := range rows {
		w := DeckWord{
			VocabularyID: uuid.UUID(r.ID.Bytes), LanguageID: r.LanguageID, Term: r.Term,
			Phonetic: r.Phonetic.String, Meaning: r.Meaning, Topic: r.Topic.String, Level: r.Level.String,
			ImageURL: r.ImageUrl.String, ImageEmoji: r.ImageEmoji.String, PracticeCount: r.PracticeCount,
			AddedAt: r.AddedAt.Time,
		}
		if r.NextReviewAt.Valid {
			t := r.NextReviewAt.Time
			w.NextReviewAt = &t
			if !t.After(now) {
				detail.DueCount++
			}
		}
		detail.Words = append(detail.Words, w)
	}
	return detail, nil
}

// CreateDeck tạo list mới (tên bắt buộc, màu/icon có mặc định)
func (s *DeckService) CreateDeck(ctx context.Context, userID uuid.UUID, req DeckRequest) (DeckSummary, error) {
	params, err := normalizeDeckRequest(req)
	if err != nil {
		return DeckSummary{}, err
	}
	deck, err := s.repo.CreateDeck(ctx, db.CreateDeckParams{
		UserID: toPgUUID(userID), Name: params.Name, Description: params.Description, Color: params.Color, Icon: params.Icon,
	})
	if err != nil {
		return DeckSummary{}, err
	}
	return toDeckSummary(deck), nil
}

// UpdateDeck sửa thông tin list (tên/mô tả/màu/icon)
func (s *DeckService) UpdateDeck(ctx context.Context, userID, deckID uuid.UUID, req DeckRequest) (DeckSummary, error) {
	params, err := normalizeDeckRequest(req)
	if err != nil {
		return DeckSummary{}, err
	}
	deck, err := s.repo.UpdateDeck(ctx, db.UpdateDeckParams{
		ID: toPgUUID(deckID), UserID: toPgUUID(userID),
		Name: params.Name, Description: params.Description, Color: params.Color, Icon: params.Icon,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return DeckSummary{}, ErrNotFound
	}
	if err != nil {
		return DeckSummary{}, err
	}
	return toDeckSummary(deck), nil
}

// DeleteDeck xoá list — các từ vẫn giữ nguyên trong hàng đợi SRS
func (s *DeckService) DeleteDeck(ctx context.Context, userID, deckID uuid.UUID) error {
	n, err := s.repo.DeleteDeck(ctx, db.DeleteDeckParams{ID: toPgUUID(deckID), UserID: toPgUUID(userID)})
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

// AddVocabulary thêm từ vào list — đồng thời đưa từ vào hàng đợi SRS (nếu
// chưa có) để "học lại list" luyện được ngay. Thêm lại từ đã có: không lỗi.
func (s *DeckService) AddVocabulary(ctx context.Context, userID, deckID, vocabularyID uuid.UUID) error {
	if vocabularyID == uuid.Nil {
		return ErrInvalidInput
	}
	if _, err := s.getOwnedDeck(ctx, userID, deckID); err != nil {
		return err
	}
	if err := s.srs.LearnVocabulary(ctx, userID, vocabularyID); err != nil {
		return err
	}
	_, err := s.repo.AddVocabularyToDeck(ctx, db.AddVocabularyToDeckParams{
		VocabularyID: toPgUUID(vocabularyID), DeckID: toPgUUID(deckID), UserID: toPgUUID(userID),
	})
	return err
}

// RemoveVocabulary bỏ từ khỏi list — chỉ gỡ khỏi list, tiến độ SRS giữ nguyên
func (s *DeckService) RemoveVocabulary(ctx context.Context, userID, deckID, vocabularyID uuid.UUID) error {
	n, err := s.repo.RemoveVocabularyFromDeck(ctx, db.RemoveVocabularyFromDeckParams{
		DeckID: toPgUUID(deckID), UserID: toPgUUID(userID), VocabularyID: toPgUUID(vocabularyID),
	})
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *DeckService) getOwnedDeck(ctx context.Context, userID, deckID uuid.UUID) (db.UserDeck, error) {
	deck, err := s.repo.GetDeckForUser(ctx, db.GetDeckForUserParams{ID: toPgUUID(deckID), UserID: toPgUUID(userID)})
	if errors.Is(err, pgx.ErrNoRows) {
		return db.UserDeck{}, ErrNotFound
	}
	return deck, err
}

type deckParams struct {
	Name        string
	Description pgtype.Text
	Color       pgtype.Text
	Icon        pgtype.Text
}

func normalizeDeckRequest(req DeckRequest) (deckParams, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" || len([]rune(name)) > maxDeckNameLen {
		return deckParams{}, ErrInvalidInput
	}
	color := strings.TrimSpace(req.Color)
	if color == "" {
		color = defaultDeckColor
	}
	icon := strings.TrimSpace(req.Icon)
	if icon == "" {
		icon = defaultDeckIcon
	}
	if !deckColorPattern.MatchString(color) || len([]rune(icon)) > maxDeckIconLen {
		return deckParams{}, ErrInvalidInput
	}
	description := strings.TrimSpace(req.Description)
	return deckParams{
		Name:        name,
		Description: pgtype.Text{String: description, Valid: description != ""},
		Color:       pgtype.Text{String: color, Valid: true},
		Icon:        pgtype.Text{String: icon, Valid: true},
	}, nil
}

func toDeckSummary(d db.UserDeck) DeckSummary {
	return DeckSummary{
		ID: uuid.UUID(d.ID.Bytes), Name: d.Name, Description: d.Description.String,
		Color: d.Color.String, Icon: d.Icon.String, CreatedAt: d.CreatedAt.Time,
	}
}
