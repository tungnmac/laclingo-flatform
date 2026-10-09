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
	ListVocabulariesByLanguageAdmin(ctx context.Context, arg db.ListVocabulariesByLanguageAdminParams) ([]db.ListVocabulariesByLanguageAdminRow, error)
	UpdateVocabulary(ctx context.Context, arg db.UpdateVocabularyParams) (db.Vocabulary, error)
	DeleteVocabulary(ctx context.Context, id pgtype.UUID) error
	CreateVocabularyTopic(ctx context.Context, arg db.CreateVocabularyTopicParams) (db.VocabularyTopic, error)
	ListVocabularyTopicsByLanguageAdmin(ctx context.Context, arg db.ListVocabularyTopicsByLanguageAdminParams) ([]db.ListVocabularyTopicsByLanguageAdminRow, error)
	DeleteVocabularyTopic(ctx context.Context, arg db.DeleteVocabularyTopicParams) error
	GetVocabularyTopic(ctx context.Context, arg db.GetVocabularyTopicParams) (db.VocabularyTopic, error)
	CountVocabularyTopicChildren(ctx context.Context, arg db.CountVocabularyTopicChildrenParams) (int64, error)
	ListVocabularyTopicRelations(ctx context.Context, languageID string) ([]db.ListVocabularyTopicRelationsRow, error)
	ListVocabularyChildTopics(ctx context.Context, arg db.ListVocabularyChildTopicsParams) ([]db.ListVocabularyChildTopicsRow, error)
	GetVocabularyTopicOwnStats(ctx context.Context, arg db.GetVocabularyTopicOwnStatsParams) (db.GetVocabularyTopicOwnStatsRow, error)
}

// VocabularyTopic là một chủ đề từ vựng kèm tiến độ học của user. Total/Learned
// của chủ đề CẤP CAO NHẤT cộng gộp cả từ gắn trực tiếp (từ chung) và từ của
// các chủ đề con (nếu có) — xem VocabularyService.ListTopics.
type VocabularyTopic struct {
	Name        string `json:"name" example:"Đồ ăn & Thức uống"`
	Icon        string `json:"icon" example:"🍜"`
	Total       int32  `json:"total" example:"25"`
	Learned     int32  `json:"learned" example:"12"` // số từ đã vào hàng đợi SRS
	HasChildren bool   `json:"has_children"`         // có chủ đề con hay không — xem GET /vocab/topics/children
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

// ListTopics trả về các chủ đề CẤP CAO NHẤT của 1 ngôn ngữ (mặc định en) kèm
// tiến độ của user. ListVocabularyTopics trả về từng chủ đề PHẲNG (gộp theo
// vocabularies.topic, kể cả chủ đề con lẫn chủ đề chưa khai báo trong
// vocabulary_topics — tương thích ngược với dữ liệu cũ trước khi có cây 2
// cấp). Ở đây cộng gộp: nếu 1 chủ đề phẳng là CON đã khai báo (có parent_name)
// thì dồn total/learned của nó vào chủ đề cha; ngược lại giữ nguyên là chủ đề
// cấp cao nhất. Chủ đề cha hiện ra ngay cả khi chính nó không có từ trực
// tiếp, miễn tổng (qua con) > 0 — ẩn hẳn chủ đề rỗng hoàn toàn.
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
	relations, err := s.repo.ListVocabularyTopicRelations(ctx, languageID)
	if err != nil {
		return nil, err
	}

	childParent := make(map[string]string, len(relations))
	icons := make(map[string]string, len(relations))
	hasChildren := make(map[string]bool, len(relations))
	for _, rel := range relations {
		icons[rel.Name] = rel.Icon
		if rel.ParentName.Valid {
			childParent[rel.Name] = rel.ParentName.String
			hasChildren[rel.ParentName.String] = true
		}
	}

	type bucket struct {
		icon    string
		total   int32
		learned int32
	}
	order := make([]string, 0, len(rows))
	buckets := make(map[string]*bucket, len(rows))
	bucketFor := func(name string) *bucket {
		b, ok := buckets[name]
		if !ok {
			icon := icons[name]
			if icon == "" {
				icon = "📘"
			}
			b = &bucket{icon: icon}
			buckets[name] = b
			order = append(order, name)
		}
		return b
	}

	for _, r := range rows {
		target := r.Name
		if parent, ok := childParent[r.Name]; ok {
			target = parent
		}
		b := bucketFor(target)
		if target == r.Name {
			b.icon = r.Icon // chủ đề tự đóng góp trực tiếp — icon của chính nó (COALESCE sẵn trong ListVocabularyTopics)
		}
		b.total += r.Total
		b.learned += r.Learned
	}

	results := make([]VocabularyTopic, 0, len(order))
	for _, name := range order {
		b := buckets[name]
		if b.total == 0 {
			continue
		}
		results = append(results, VocabularyTopic{Name: name, Icon: b.icon, Total: b.total, Learned: b.learned, HasChildren: hasChildren[name]})
	}
	return results, nil
}

// ListChildTopics trả về chủ đề con của 1 chủ đề cha (learner drill-down —
// xem ListTopics). total/learned của từng con chỉ tính từ gắn trực tiếp vào
// con đó. Nếu chủ đề cha CŨNG có từ gắn trực tiếp (từ chung, "ngoài các từ
// chung thì chia theo mục con"), phần tử ĐẦU danh sách là chính chủ đề cha
// (cùng Name = parentName) — FE nhận biết qua so khớp parentName để hiển thị
// riêng (vd nhãn "Từ chung") thay vì lẫn vào các chủ đề con.
func (s *VocabularyService) ListChildTopics(ctx context.Context, userID uuid.UUID, languageID, parentName string) ([]VocabularyTopic, error) {
	if languageID == "" {
		languageID = defaultVocabularyLanguage
	}
	results := make([]VocabularyTopic, 0, 8)

	own, err := s.repo.GetVocabularyTopicOwnStats(ctx, db.GetVocabularyTopicOwnStatsParams{
		UserID:     toPgUUID(userID),
		LanguageID: languageID,
		Topic:      pgtype.Text{String: parentName, Valid: true},
	})
	if err != nil {
		return nil, err
	}
	if own.Total > 0 {
		icon := "📘"
		if parent, err := s.repo.GetVocabularyTopic(ctx, db.GetVocabularyTopicParams{LanguageID: languageID, Name: parentName}); err == nil {
			icon = parent.Icon
		}
		results = append(results, VocabularyTopic{Name: parentName, Icon: icon, Total: own.Total, Learned: own.Learned})
	}

	rows, err := s.repo.ListVocabularyChildTopics(ctx, db.ListVocabularyChildTopicsParams{
		UserID:     toPgUUID(userID),
		LanguageID: languageID,
		ParentName: pgtype.Text{String: parentName, Valid: true},
	})
	if err != nil {
		return nil, err
	}
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
	LanguageID string  `json:"language_id" example:"en"`
	Name       string  `json:"name" example:"Công nghệ thông tin"`
	Icon       string  `json:"icon" example:"🍜"`
	OrderIndex int32   `json:"order_index"`
	// ParentName — chủ đề cha (vd "Công việc & Nghề nghiệp"), để trống/null =
	// chủ đề cấp cao nhất. Chủ đề cha phải là chủ đề cấp cao nhất và chưa có
	// con nào khác lồng trên nó — không lồng quá 2 cấp (xem CreateOrUpdateTopic).
	ParentName *string `json:"parent_name,omitempty" example:"Công việc & Nghề nghiệp"`
}

type VocabularyTopicAdminResponse struct {
	LanguageID string  `json:"language_id"`
	Name       string  `json:"name"`
	Icon       string  `json:"icon"`
	OrderIndex int32   `json:"order_index"`
	ParentName *string `json:"parent_name,omitempty"`
}

func toVocabularyTopicAdminResponse(t db.VocabularyTopic) VocabularyTopicAdminResponse {
	resp := VocabularyTopicAdminResponse{LanguageID: t.LanguageID, Name: t.Name, Icon: t.Icon, OrderIndex: t.OrderIndex}
	if t.ParentName.Valid {
		resp.ParentName = &t.ParentName.String
	}
	return resp
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

// ListVocabulariesAdmin trả về 1 trang từ vựng của 1 ngôn ngữ (admin quản lý),
// lọc theo search (khớp term/meaning)/topic/level, phân trang server-side.
func (s *VocabularyService) ListVocabulariesAdmin(ctx context.Context, languageID, search, topic, level string, page, pageSize int32) (PageResult[VocabularyAdminResponse], error) {
	limit, offset := NormalizePage(page, pageSize)
	rows, err := s.repo.ListVocabulariesByLanguageAdmin(ctx, db.ListVocabulariesByLanguageAdminParams{
		LanguageID: languageID,
		Search:     pgtype.Text{String: search, Valid: search != ""},
		Topic:      pgtype.Text{String: topic, Valid: topic != ""},
		Level:      pgtype.Text{String: level, Valid: level != ""},
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		return PageResult[VocabularyAdminResponse]{}, err
	}
	results := make([]VocabularyAdminResponse, 0, len(rows))
	var total int64
	for _, v := range rows {
		total = v.TotalCount
		results = append(results, toVocabularyAdminResponse(db.Vocabulary{
			ID: v.ID, LanguageID: v.LanguageID, Term: v.Term, Phonetic: v.Phonetic, Meaning: v.Meaning,
			Example: v.Example, Topic: v.Topic, Level: v.Level, AudioUrl: v.AudioUrl, ImageUrl: v.ImageUrl,
			ImageEmoji: v.ImageEmoji, CreatedAt: v.CreatedAt,
		}))
	}
	return PageResult[VocabularyAdminResponse]{Items: results, Total: total}, nil
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

// CreateOrUpdateTopic tạo chủ đề mới hoặc cập nhật icon/thứ tự/chủ đề cha nếu
// đã tồn tại (natural key là language_id+name, nên create/update dùng chung 1
// upsert). ParentName tối đa lồng 2 cấp — ép bằng 2 điều kiện: (1) chủ đề cha
// phải đang là chủ đề cấp cao nhất (parent_name riêng của nó phải NULL), (2)
// chủ đề này (req.Name) chưa có con nào — nếu đã có con thì không thể trở
// thành con của chủ đề khác (sẽ tạo ra 3 cấp).
func (s *VocabularyService) CreateOrUpdateTopic(ctx context.Context, req VocabularyTopicRequest) (VocabularyTopicAdminResponse, error) {
	if req.LanguageID == "" || req.Name == "" {
		return VocabularyTopicAdminResponse{}, ErrInvalidInput
	}
	icon := req.Icon
	if icon == "" {
		icon = "📘"
	}

	var parentName pgtype.Text
	if req.ParentName != nil && *req.ParentName != "" {
		parent := *req.ParentName
		if parent == req.Name {
			return VocabularyTopicAdminResponse{}, fmt.Errorf("chủ đề không thể là cha của chính nó: %w", ErrInvalidInput)
		}
		parentRow, err := s.repo.GetVocabularyTopic(ctx, db.GetVocabularyTopicParams{LanguageID: req.LanguageID, Name: parent})
		if errors.Is(err, pgx.ErrNoRows) {
			return VocabularyTopicAdminResponse{}, fmt.Errorf("không tìm thấy chủ đề cha \"%s\": %w", parent, ErrInvalidInput)
		}
		if err != nil {
			return VocabularyTopicAdminResponse{}, err
		}
		if parentRow.ParentName.Valid {
			return VocabularyTopicAdminResponse{}, fmt.Errorf("chủ đề cha phải là chủ đề cấp cao nhất, không lồng quá 2 cấp: %w", ErrInvalidInput)
		}
		childCount, err := s.repo.CountVocabularyTopicChildren(ctx, db.CountVocabularyTopicChildrenParams{
			LanguageID: req.LanguageID,
			ParentName: pgtype.Text{String: req.Name, Valid: true},
		})
		if err != nil {
			return VocabularyTopicAdminResponse{}, err
		}
		if childCount > 0 {
			return VocabularyTopicAdminResponse{}, fmt.Errorf("chủ đề đã có chủ đề con, không thể trở thành con của chủ đề khác: %w", ErrInvalidInput)
		}
		parentName = pgtype.Text{String: parent, Valid: true}
	}

	t, err := s.repo.CreateVocabularyTopic(ctx, db.CreateVocabularyTopicParams{
		LanguageID: req.LanguageID,
		Name:       req.Name,
		Icon:       icon,
		OrderIndex: req.OrderIndex,
		ParentName: parentName,
	})
	if isPgError(err, pgForeignKeyViolation) {
		return VocabularyTopicAdminResponse{}, fmt.Errorf("không tìm thấy ngôn ngữ: %w", ErrInvalidInput)
	}
	if err != nil {
		return VocabularyTopicAdminResponse{}, err
	}
	return toVocabularyTopicAdminResponse(t), nil
}

// ListTopicsAdmin trả về toàn bộ chủ đề từ vựng của 1 ngôn ngữ (icon/thứ tự/
// chủ đề cha) — FE tự dựng cây 2 cấp từ danh sách phẳng này (dữ liệu nhỏ).
func (s *VocabularyService) ListTopicsAdmin(ctx context.Context, languageID, search string, page, pageSize int32) (PageResult[VocabularyTopicAdminResponse], error) {
	limit, offset := NormalizePage(page, pageSize)
	rows, err := s.repo.ListVocabularyTopicsByLanguageAdmin(ctx, db.ListVocabularyTopicsByLanguageAdminParams{
		LanguageID: languageID,
		Search:     pgtype.Text{String: search, Valid: search != ""},
		Limit:      limit,
		Offset:     offset,
	})
	if err != nil {
		return PageResult[VocabularyTopicAdminResponse]{}, err
	}
	results := make([]VocabularyTopicAdminResponse, 0, len(rows))
	var total int64
	for _, t := range rows {
		total = t.TotalCount
		results = append(results, toVocabularyTopicAdminResponse(db.VocabularyTopic{
			LanguageID: t.LanguageID, Name: t.Name, Icon: t.Icon, OrderIndex: t.OrderIndex, ParentName: t.ParentName,
		}))
	}
	return PageResult[VocabularyTopicAdminResponse]{Items: results, Total: total}, nil
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
