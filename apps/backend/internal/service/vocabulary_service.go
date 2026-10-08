package service

import (
	"context"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

const defaultVocabularyLanguage = "en"

// VocabularyRepository định nghĩa truy vấn cho flow "Học từ mới theo chủ đề"
type VocabularyRepository interface {
	ListVocabularyTopics(ctx context.Context, arg db.ListVocabularyTopicsParams) ([]db.ListVocabularyTopicsRow, error)
	ListVocabulariesByTopic(ctx context.Context, arg db.ListVocabulariesByTopicParams) ([]db.ListVocabulariesByTopicRow, error)
	ListFavoriteVocabularies(ctx context.Context, arg db.ListFavoriteVocabulariesParams) ([]db.ListFavoriteVocabulariesRow, error)
	LikeVocabulary(ctx context.Context, arg db.LikeVocabularyParams) error
	UnlikeVocabulary(ctx context.Context, arg db.UnlikeVocabularyParams) error
	CountVocabularyLikes(ctx context.Context, vocabularyID pgtype.UUID) (int32, error)
	FavoriteVocabulary(ctx context.Context, arg db.FavoriteVocabularyParams) error
	UnfavoriteVocabulary(ctx context.Context, arg db.UnfavoriteVocabularyParams) error
}

// VocabularyTopic là một chủ đề từ vựng kèm tiến độ học của user
type VocabularyTopic struct {
	Name    string `json:"name" example:"Đồ ăn & Thức uống"`
	Icon    string `json:"icon" example:"🍜"`
	Total   int32  `json:"total" example:"25"`
	Learned int32  `json:"learned" example:"12"` // số từ đã vào hàng đợi SRS
}

// VocabularyCard là một từ hiển thị ở trang học theo chủ đề / trang yêu thích
type VocabularyCard struct {
	VocabularyID uuid.UUID `json:"vocabulary_id" swaggertype:"string" format:"uuid"`
	LanguageID   string    `json:"language_id" example:"en"`
	Term         string    `json:"term" example:"apple"`
	Phonetic     string    `json:"phonetic"`
	Meaning      string    `json:"meaning"`
	Example      string    `json:"example"`
	Topic        string    `json:"topic"`
	Level        string    `json:"level" example:"A1"`
	AudioURL     string    `json:"audio_url"`
	ImageURL     string    `json:"image_url"`
	ImageEmoji   string    `json:"image_emoji" example:"🍎"` // từ không có emoji riêng thì lấy icon chủ đề
	LikeCount    int32     `json:"like_count"`
	Liked        bool      `json:"liked"`
	Favorited    bool      `json:"favorited"`
	InReview     bool      `json:"in_review"` // đã có trong hàng đợi ôn tập SRS
}

// LikeResponse là trạng thái like sau khi like/bỏ like
type LikeResponse struct {
	VocabularyID uuid.UUID `json:"vocabulary_id" swaggertype:"string" format:"uuid"`
	Liked        bool      `json:"liked"`
	LikeCount    int32     `json:"like_count"`
}

// FavoriteResponse là trạng thái yêu thích sau khi thêm/bỏ
type FavoriteResponse struct {
	VocabularyID uuid.UUID `json:"vocabulary_id" swaggertype:"string" format:"uuid"`
	Favorited    bool      `json:"favorited"`
}

type VocabularyService struct {
	repo VocabularyRepository
}

func NewVocabularyService(repo VocabularyRepository) *VocabularyService {
	return &VocabularyService{repo: repo}
}

// ListTopics trả về các chủ đề của 1 ngôn ngữ (mặc định en) kèm tiến độ của user
func (s *VocabularyService) ListTopics(ctx context.Context, userID uuid.UUID, languageID string) ([]VocabularyTopic, error) {
	if languageID == "" {
		languageID = defaultVocabularyLanguage
	}
	rows, err := s.repo.ListVocabularyTopics(ctx, db.ListVocabularyTopicsParams{
		UserID:     toPgUUID(userID),
		LanguageID: languageID,
	})
	if err != nil {
		return nil, err
	}

	results := make([]VocabularyTopic, 0, len(rows))
	for _, r := range rows {
		results = append(results, VocabularyTopic{Name: r.Name, Icon: r.Icon, Total: r.Total, Learned: r.Learned})
	}
	return results, nil
}

// ListWordsByTopic trả về toàn bộ từ của 1 chủ đề kèm trạng thái like/yêu thích/ôn tập của user
func (s *VocabularyService) ListWordsByTopic(ctx context.Context, userID uuid.UUID, languageID, topic string) ([]VocabularyCard, error) {
	if topic == "" {
		return nil, ErrInvalidInput
	}
	if languageID == "" {
		languageID = defaultVocabularyLanguage
	}
	rows, err := s.repo.ListVocabulariesByTopic(ctx, db.ListVocabulariesByTopicParams{
		UserID:     toPgUUID(userID),
		LanguageID: languageID,
		Topic:      pgtype.Text{String: topic, Valid: true},
	})
	if err != nil {
		return nil, err
	}

	results := make([]VocabularyCard, 0, len(rows))
	for _, r := range rows {
		results = append(results, toVocabularyCard(r))
	}
	return results, nil
}

// ListFavorites trả về từ yêu thích của user, mới nhất trước. languageID rỗng = mọi ngôn ngữ.
func (s *VocabularyService) ListFavorites(ctx context.Context, userID uuid.UUID, languageID string) ([]VocabularyCard, error) {
	var languageFilter pgtype.Text
	if languageID != "" {
		languageFilter = pgtype.Text{String: languageID, Valid: true}
	}
	rows, err := s.repo.ListFavoriteVocabularies(ctx, db.ListFavoriteVocabulariesParams{
		UserID:     toPgUUID(userID),
		LanguageID: languageFilter,
	})
	if err != nil {
		return nil, err
	}

	results := make([]VocabularyCard, 0, len(rows))
	for _, r := range rows {
		// 2 query cố ý chọn cùng danh sách cột nên 2 kiểu Row convert được cho nhau
		results = append(results, toVocabularyCard(db.ListVocabulariesByTopicRow(r)))
	}
	return results, nil
}

// SetLike like (liked=true) hoặc bỏ like một từ — idempotent, gọi lặp không đếm sai
func (s *VocabularyService) SetLike(ctx context.Context, userID, vocabularyID uuid.UUID, liked bool) (LikeResponse, error) {
	if userID == uuid.Nil || vocabularyID == uuid.Nil {
		return LikeResponse{}, ErrInvalidInput
	}

	var err error
	if liked {
		err = s.repo.LikeVocabulary(ctx, db.LikeVocabularyParams{UserID: toPgUUID(userID), VocabularyID: toPgUUID(vocabularyID)})
	} else {
		err = s.repo.UnlikeVocabulary(ctx, db.UnlikeVocabularyParams{UserID: toPgUUID(userID), VocabularyID: toPgUUID(vocabularyID)})
	}
	if isPgError(err, pgForeignKeyViolation) {
		return LikeResponse{}, ErrNotFound
	}
	if err != nil {
		return LikeResponse{}, err
	}

	count, err := s.repo.CountVocabularyLikes(ctx, toPgUUID(vocabularyID))
	if err != nil {
		return LikeResponse{}, err
	}
	return LikeResponse{VocabularyID: vocabularyID, Liked: liked, LikeCount: count}, nil
}

// SetFavorite thêm (favorited=true) hoặc bỏ một từ khỏi danh sách yêu thích — idempotent
func (s *VocabularyService) SetFavorite(ctx context.Context, userID, vocabularyID uuid.UUID, favorited bool) (FavoriteResponse, error) {
	if userID == uuid.Nil || vocabularyID == uuid.Nil {
		return FavoriteResponse{}, ErrInvalidInput
	}

	var err error
	if favorited {
		err = s.repo.FavoriteVocabulary(ctx, db.FavoriteVocabularyParams{UserID: toPgUUID(userID), VocabularyID: toPgUUID(vocabularyID)})
	} else {
		err = s.repo.UnfavoriteVocabulary(ctx, db.UnfavoriteVocabularyParams{UserID: toPgUUID(userID), VocabularyID: toPgUUID(vocabularyID)})
	}
	if isPgError(err, pgForeignKeyViolation) {
		return FavoriteResponse{}, ErrNotFound
	}
	if err != nil {
		return FavoriteResponse{}, err
	}
	return FavoriteResponse{VocabularyID: vocabularyID, Favorited: favorited}, nil
}

func toVocabularyCard(r db.ListVocabulariesByTopicRow) VocabularyCard {
	emoji := r.ImageEmoji.String
	if emoji == "" {
		emoji = r.TopicIcon
	}
	return VocabularyCard{
		VocabularyID: uuid.UUID(r.ID.Bytes),
		LanguageID:   r.LanguageID,
		Term:         r.Term,
		Phonetic:     r.Phonetic.String,
		Meaning:      r.Meaning,
		Example:      r.Example.String,
		Topic:        r.Topic.String,
		Level:        r.Level.String,
		AudioURL:     r.AudioUrl.String,
		ImageURL:     r.ImageUrl.String,
		ImageEmoji:   emoji,
		LikeCount:    r.LikeCount,
		Liked:        r.Liked,
		Favorited:    r.Favorited,
		InReview:     r.InReview,
	}
}
