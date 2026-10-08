package service

import (
	"context"
	"errors"
	"fmt"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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

	CreateVocabulary(ctx context.Context, arg db.CreateVocabularyParams) (db.Vocabulary, error)
	ListVocabulariesByLanguageAdmin(ctx context.Context, languageID string) ([]db.Vocabulary, error)
	UpdateVocabulary(ctx context.Context, arg db.UpdateVocabularyParams) (db.Vocabulary, error)
	DeleteVocabulary(ctx context.Context, id pgtype.UUID) error
	CreateVocabularyTopic(ctx context.Context, arg db.CreateVocabularyTopicParams) (db.VocabularyTopic, error)
	ListVocabularyTopicsByLanguageAdmin(ctx context.Context, languageID string) ([]db.VocabularyTopic, error)
	DeleteVocabularyTopic(ctx context.Context, arg db.DeleteVocabularyTopicParams) error
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

// ===== Admin CRUD (quản lý nội dung từ vựng) =====

type VocabularyRequest struct {
	LanguageID string `json:"language_id" example:"en"`
	Term       string `json:"term" example:"apple"`
	Phonetic   string `json:"phonetic,omitempty"`
	Meaning    string `json:"meaning"`
	Example    string `json:"example,omitempty"`
	Topic      string `json:"topic,omitempty"`
	Level      string `json:"level" example:"A1"`
	AudioURL   string `json:"audio_url,omitempty"`
	ImageURL   string `json:"image_url,omitempty"`
	ImageEmoji string `json:"image_emoji,omitempty"`
}

// VocabularyAdminResponse — từ vựng nhìn từ admin (không kèm like/favorite/in_review của user nào cả)
type VocabularyAdminResponse struct {
	ID         uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	LanguageID string    `json:"language_id"`
	Term       string    `json:"term"`
	Phonetic   string    `json:"phonetic,omitempty"`
	Meaning    string    `json:"meaning"`
	Example    string    `json:"example,omitempty"`
	Topic      string    `json:"topic,omitempty"`
	Level      string    `json:"level"`
	AudioURL   string    `json:"audio_url,omitempty"`
	ImageURL   string    `json:"image_url,omitempty"`
	ImageEmoji string    `json:"image_emoji,omitempty"`
}

type VocabularyTopicRequest struct {
	LanguageID string `json:"language_id" example:"en"`
	Name       string `json:"name" example:"Đồ ăn & Thức uống"`
	Icon       string `json:"icon" example:"🍜"`
	OrderIndex int32  `json:"order_index"`
}

type VocabularyTopicAdminResponse struct {
	LanguageID string `json:"language_id"`
	Name       string `json:"name"`
	Icon       string `json:"icon"`
	OrderIndex int32  `json:"order_index"`
}

func toVocabularyAdminResponse(v db.Vocabulary) VocabularyAdminResponse {
	return VocabularyAdminResponse{
		ID:         uuid.UUID(v.ID.Bytes),
		LanguageID: v.LanguageID,
		Term:       v.Term,
		Phonetic:   v.Phonetic.String,
		Meaning:    v.Meaning,
		Example:    v.Example.String,
		Topic:      v.Topic.String,
		Level:      v.Level.String,
		AudioURL:   v.AudioUrl.String,
		ImageURL:   v.ImageUrl.String,
		ImageEmoji: v.ImageEmoji.String,
	}
}

// CreateVocabulary thêm 1 từ vựng mới
func (s *VocabularyService) CreateVocabulary(ctx context.Context, req VocabularyRequest) (VocabularyAdminResponse, error) {
	if req.LanguageID == "" || req.Term == "" || req.Meaning == "" {
		return VocabularyAdminResponse{}, ErrInvalidInput
	}
	v, err := s.repo.CreateVocabulary(ctx, db.CreateVocabularyParams{
		LanguageID: req.LanguageID,
		Term:       req.Term,
		Phonetic:   pgtype.Text{String: req.Phonetic, Valid: req.Phonetic != ""},
		Meaning:    req.Meaning,
		Example:    pgtype.Text{String: req.Example, Valid: req.Example != ""},
		Topic:      pgtype.Text{String: req.Topic, Valid: req.Topic != ""},
		Level:      pgtype.Text{String: req.Level, Valid: req.Level != ""},
		AudioUrl:   pgtype.Text{String: req.AudioURL, Valid: req.AudioURL != ""},
		ImageUrl:   pgtype.Text{String: req.ImageURL, Valid: req.ImageURL != ""},
		ImageEmoji: pgtype.Text{String: req.ImageEmoji, Valid: req.ImageEmoji != ""},
	})
	if isPgError(err, pgUniqueViolation) {
		return VocabularyAdminResponse{}, fmt.Errorf("từ \"%s\" đã tồn tại trong ngôn ngữ này: %w", req.Term, ErrDuplicate)
	}
	if isPgError(err, pgForeignKeyViolation) {
		return VocabularyAdminResponse{}, fmt.Errorf("không tìm thấy ngôn ngữ: %w", ErrInvalidInput)
	}
	if err != nil {
		return VocabularyAdminResponse{}, err
	}
	return toVocabularyAdminResponse(v), nil
}

// ListVocabulariesAdmin trả về toàn bộ từ vựng của 1 ngôn ngữ (admin quản lý)
func (s *VocabularyService) ListVocabulariesAdmin(ctx context.Context, languageID string) ([]VocabularyAdminResponse, error) {
	rows, err := s.repo.ListVocabulariesByLanguageAdmin(ctx, languageID)
	if err != nil {
		return nil, err
	}
	results := make([]VocabularyAdminResponse, 0, len(rows))
	for _, v := range rows {
		results = append(results, toVocabularyAdminResponse(v))
	}
	return results, nil
}

// UpdateVocabulary sửa 1 từ vựng (không đổi language_id)
func (s *VocabularyService) UpdateVocabulary(ctx context.Context, id uuid.UUID, req VocabularyRequest) (VocabularyAdminResponse, error) {
	if req.Term == "" || req.Meaning == "" {
		return VocabularyAdminResponse{}, ErrInvalidInput
	}
	v, err := s.repo.UpdateVocabulary(ctx, db.UpdateVocabularyParams{
		ID:         toPgUUID(id),
		Term:       req.Term,
		Phonetic:   pgtype.Text{String: req.Phonetic, Valid: req.Phonetic != ""},
		Meaning:    req.Meaning,
		Example:    pgtype.Text{String: req.Example, Valid: req.Example != ""},
		Topic:      pgtype.Text{String: req.Topic, Valid: req.Topic != ""},
		Level:      pgtype.Text{String: req.Level, Valid: req.Level != ""},
		AudioUrl:   pgtype.Text{String: req.AudioURL, Valid: req.AudioURL != ""},
		ImageUrl:   pgtype.Text{String: req.ImageURL, Valid: req.ImageURL != ""},
		ImageEmoji: pgtype.Text{String: req.ImageEmoji, Valid: req.ImageEmoji != ""},
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return VocabularyAdminResponse{}, ErrNotFound
	}
	if isPgError(err, pgUniqueViolation) {
		return VocabularyAdminResponse{}, fmt.Errorf("từ \"%s\" đã tồn tại trong ngôn ngữ này: %w", req.Term, ErrDuplicate)
	}
	if err != nil {
		return VocabularyAdminResponse{}, err
	}
	return toVocabularyAdminResponse(v), nil
}

// DeleteVocabulary xoá 1 từ vựng
func (s *VocabularyService) DeleteVocabulary(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteVocabulary(ctx, toPgUUID(id))
}

// BulkImportVocabularies nhập hàng loạt từ vựng — lỗi 1 dòng không chặn các dòng khác
func (s *VocabularyService) BulkImportVocabularies(ctx context.Context, items []VocabularyRequest) []BulkImportResult {
	return runBulkImport(items, func(req VocabularyRequest) error {
		_, err := s.CreateVocabulary(ctx, req)
		return err
	})
}

// CreateOrUpdateTopic tạo chủ đề mới hoặc cập nhật icon/thứ tự nếu đã tồn tại
// (natural key là language_id+name, nên create/update dùng chung 1 upsert).
func (s *VocabularyService) CreateOrUpdateTopic(ctx context.Context, req VocabularyTopicRequest) (VocabularyTopicAdminResponse, error) {
	if req.LanguageID == "" || req.Name == "" {
		return VocabularyTopicAdminResponse{}, ErrInvalidInput
	}
	icon := req.Icon
	if icon == "" {
		icon = "📘"
	}
	t, err := s.repo.CreateVocabularyTopic(ctx, db.CreateVocabularyTopicParams{
		LanguageID: req.LanguageID,
		Name:       req.Name,
		Icon:       icon,
		OrderIndex: req.OrderIndex,
	})
	if isPgError(err, pgForeignKeyViolation) {
		return VocabularyTopicAdminResponse{}, fmt.Errorf("không tìm thấy ngôn ngữ: %w", ErrInvalidInput)
	}
	if err != nil {
		return VocabularyTopicAdminResponse{}, err
	}
	return VocabularyTopicAdminResponse{
		LanguageID: t.LanguageID,
		Name:       t.Name,
		Icon:       t.Icon,
		OrderIndex: t.OrderIndex,
	}, nil
}

// ListTopicsAdmin trả về toàn bộ chủ đề từ vựng của 1 ngôn ngữ (icon/thứ tự hiển thị)
func (s *VocabularyService) ListTopicsAdmin(ctx context.Context, languageID string) ([]VocabularyTopicAdminResponse, error) {
	rows, err := s.repo.ListVocabularyTopicsByLanguageAdmin(ctx, languageID)
	if err != nil {
		return nil, err
	}
	results := make([]VocabularyTopicAdminResponse, 0, len(rows))
	for _, t := range rows {
		results = append(results, VocabularyTopicAdminResponse{
			LanguageID: t.LanguageID,
			Name:       t.Name,
			Icon:       t.Icon,
			OrderIndex: t.OrderIndex,
		})
	}
	return results, nil
}

// DeleteTopic xoá 1 chủ đề (chỉ xoá metadata hiển thị — từ vựng có topic trùng
// tên vẫn giữ nguyên, chỉ không còn icon/thứ tự riêng).
func (s *VocabularyService) DeleteTopic(ctx context.Context, languageID, name string) error {
	return s.repo.DeleteVocabularyTopic(ctx, db.DeleteVocabularyTopicParams{LanguageID: languageID, Name: name})
}

// BulkImportTopics nhập hàng loạt chủ đề từ vựng
func (s *VocabularyService) BulkImportTopics(ctx context.Context, items []VocabularyTopicRequest) []BulkImportResult {
	return runBulkImport(items, func(req VocabularyTopicRequest) error {
		_, err := s.CreateOrUpdateTopic(ctx, req)
		return err
	})
}
