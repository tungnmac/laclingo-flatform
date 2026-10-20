package service

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"regexp"
	"strings"
	"time"

	"laclingo-backend/internal/repository/db"
	"laclingo-backend/internal/storage"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/microcosm-cc/bluemonday"
)

// BlogRepository định nghĩa Interface tiếp xúc với cơ sở dữ liệu. BeginTx +
// WithTx dùng để tạo/sửa bài viết + "nhận" ảnh chèn trong content trong 1
// transaction thật (khớp pattern ClassService.ReplaceLessons) —
// CreateBlogPost/UpdateBlogPost/AdoptBlogImages vì vậy KHÔNG có trong
// interface này, chỉ gọi qua qtx bên trong transaction.
type BlogRepository interface {
	BeginTx(ctx context.Context) (pgx.Tx, error)
	WithTx(tx pgx.Tx) *db.Queries

	GetBlogPostByID(ctx context.Context, id pgtype.UUID) (db.BlogPost, error)
	GetBlogPostDetailByID(ctx context.Context, arg db.GetBlogPostDetailByIDParams) (db.GetBlogPostDetailByIDRow, error)
	DeleteBlogPost(ctx context.Context, id pgtype.UUID) error
	IncrementBlogPostViewCount(ctx context.Context, id pgtype.UUID) error
	HideBlogPost(ctx context.Context, id pgtype.UUID) error
	UnhideBlogPost(ctx context.Context, id pgtype.UUID) error
	ListBlogPostsPaged(ctx context.Context, arg db.ListBlogPostsPagedParams) ([]db.ListBlogPostsPagedRow, error)
	ListBlogPostsAdminPaged(ctx context.Context, arg db.ListBlogPostsAdminPagedParams) ([]db.ListBlogPostsAdminPagedRow, error)

	CreateBlogImage(ctx context.Context, arg db.CreateBlogImageParams) (db.BlogPostImage, error)
	GetBlogImageByID(ctx context.Context, id pgtype.UUID) (db.BlogPostImage, error)
	ListBlogPostImages(ctx context.Context, postID pgtype.UUID) ([]db.BlogPostImage, error)

	CreateBlogComment(ctx context.Context, arg db.CreateBlogCommentParams) (db.BlogComment, error)
	GetBlogCommentByID(ctx context.Context, id pgtype.UUID) (db.BlogComment, error)
	GetUserByID(ctx context.Context, id pgtype.UUID) (db.User, error)
	GetUserByUsername(ctx context.Context, username string) (db.User, error)
	MarkCommentLikeNoticed(ctx context.Context, arg db.MarkCommentLikeNoticedParams) (int64, error)
	MarkMentionNoticed(ctx context.Context, arg db.MarkMentionNoticedParams) (int64, error)
	CountRecentMentionNotices(ctx context.Context, arg db.CountRecentMentionNoticesParams) (int64, error)
	HasRecentMentionNotice(ctx context.Context, arg db.HasRecentMentionNoticeParams) (bool, error)
	UpdateBlogComment(ctx context.Context, arg db.UpdateBlogCommentParams) (db.BlogComment, error)
	DeleteBlogComment(ctx context.Context, id pgtype.UUID) error
	HideBlogComment(ctx context.Context, id pgtype.UUID) error
	UnhideBlogComment(ctx context.Context, id pgtype.UUID) error
	ListBlogCommentsByPost(ctx context.Context, arg db.ListBlogCommentsByPostParams) ([]db.ListBlogCommentsByPostRow, error)

	LikeBlogComment(ctx context.Context, arg db.LikeBlogCommentParams) (int64, error)
	UnlikeBlogComment(ctx context.Context, arg db.UnlikeBlogCommentParams) error
	CountBlogCommentLikes(ctx context.Context, commentID pgtype.UUID) (int32, error)
	DislikeBlogComment(ctx context.Context, arg db.DislikeBlogCommentParams) error
	UndislikeBlogComment(ctx context.Context, arg db.UndislikeBlogCommentParams) error
	CountBlogCommentDislikes(ctx context.Context, commentID pgtype.UUID) (int32, error)

	StarBlogPost(ctx context.Context, arg db.StarBlogPostParams) error
	UnstarBlogPost(ctx context.Context, arg db.UnstarBlogPostParams) error
	CountBlogPostStars(ctx context.Context, postID pgtype.UUID) (int32, error)
	MarkBlogPost(ctx context.Context, arg db.MarkBlogPostParams) error
	UnmarkBlogPost(ctx context.Context, arg db.UnmarkBlogPostParams) error
	CountBlogPostMarkers(ctx context.Context, postID pgtype.UUID) (int32, error)
	LikeBlogPost(ctx context.Context, arg db.LikeBlogPostParams) error
	UnlikeBlogPost(ctx context.Context, arg db.UnlikeBlogPostParams) error
	CountBlogPostLikes(ctx context.Context, postID pgtype.UUID) (int32, error)
	DislikeBlogPost(ctx context.Context, arg db.DislikeBlogPostParams) error
	UndislikeBlogPost(ctx context.Context, arg db.UndislikeBlogPostParams) error
	CountBlogPostDislikes(ctx context.Context, postID pgtype.UUID) (int32, error)
}

type BlogService struct {
	repo BlogRepository
	// r2 có thể nil (R2 chưa cấu hình) — tính năng upload ảnh tắt, còn lại
	// không ảnh hưởng (giống ListeningService.r2).
	r2       *storage.R2Client
	notifier Notifier
}

func NewBlogService(repo BlogRepository, r2 *storage.R2Client, notifier Notifier) *BlogService {
	return &BlogService{repo: repo, r2: r2, notifier: notifier}
}

// ===== Request / response types =====

// BlogPostRequest — body tạo/sửa bài viết (tác giả tự phục vụ). Content là
// HTML rich text (Tiptap) — ảnh/video YouTube đã nhúng NGAY TRONG content,
// không còn field riêng.
type BlogPostRequest struct {
	LanguageID string   `json:"language_id,omitempty"`
	Title      string   `json:"title"`
	Content    string   `json:"content"`
	Tags       []string `json:"tags"`
}

// BlogImageResponse — kết quả 1 lần upload ảnh (chưa gắn bài nào tới khi Create/Update "nhận")
type BlogImageResponse struct {
	ID  uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	URL string    `json:"url"`
}

// BlogPostSummary — 1 bài trong danh sách, kèm excerpt (plain text) + count/flag theo user hiện tại
type BlogPostSummary struct {
	ID              uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	AuthorID        uuid.UUID `json:"author_id" swaggertype:"string" format:"uuid"`
	AuthorUsername  string    `json:"author_username"`
	AuthorFullName  string    `json:"author_full_name,omitempty"`
	AuthorAvatarURL string    `json:"author_avatar_url,omitempty"`
	LanguageID      string    `json:"language_id,omitempty"`
	Title           string    `json:"title"`
	Excerpt         string    `json:"excerpt"`
	ThumbnailURL    string    `json:"thumbnail_url,omitempty"`
	Tags            []string  `json:"tags"`
	ViewCount       int32     `json:"view_count"`
	CommentCount    int       `json:"comment_count"`
	StarCount       int       `json:"star_count"`
	MarkerCount     int       `json:"marker_count"`
	LikeCount       int       `json:"like_count"`
	DislikeCount    int       `json:"dislike_count"`
	Starred         bool      `json:"starred"`
	Marked          bool      `json:"marked"`
	Liked           bool      `json:"liked"`
	Disliked        bool      `json:"disliked"`
	IsHidden        bool      `json:"is_hidden"`
	CreatedAt       time.Time `json:"created_at"`
}

// BlogPostDetail — 1 bài đầy đủ (trang chi tiết). Content là HTML rich text
// đã sanitize — tự chứa ảnh/video, không cần field Images/YoutubeURLs riêng.
type BlogPostDetail struct {
	ID              uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	AuthorID        uuid.UUID `json:"author_id" swaggertype:"string" format:"uuid"`
	AuthorUsername  string    `json:"author_username"`
	AuthorFullName  string    `json:"author_full_name,omitempty"`
	AuthorAvatarURL string    `json:"author_avatar_url,omitempty"`
	LanguageID      string    `json:"language_id,omitempty"`
	Title           string    `json:"title"`
	Content         string    `json:"content"`
	Tags            []string  `json:"tags"`
	ViewCount       int32     `json:"view_count"`
	CommentCount    int       `json:"comment_count"`
	StarCount       int       `json:"star_count"`
	MarkerCount     int       `json:"marker_count"`
	LikeCount       int       `json:"like_count"`
	DislikeCount    int       `json:"dislike_count"`
	Starred         bool      `json:"starred"`
	Marked          bool      `json:"marked"`
	Liked           bool      `json:"liked"`
	Disliked        bool      `json:"disliked"`
	IsHidden        bool      `json:"is_hidden"`
	CreatedAt       time.Time `json:"created_at"`
}

// BlogPostAdminResponse — 1 bài nhìn từ phía admin hậu kiểm (không cần flag theo user)
type BlogPostAdminResponse struct {
	ID             uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	AuthorID       uuid.UUID `json:"author_id" swaggertype:"string" format:"uuid"`
	AuthorUsername string    `json:"author_username"`
	AuthorFullName string    `json:"author_full_name,omitempty"`
	LanguageID     string    `json:"language_id,omitempty"`
	Title          string    `json:"title"`
	ViewCount      int32     `json:"view_count"`
	CommentCount   int       `json:"comment_count"`
	IsHidden       bool      `json:"is_hidden"`
	CreatedAt      time.Time `json:"created_at"`
}

// BlogCommentRequest — body tạo/sửa comment. ParentCommentID rỗng = comment gốc.
type BlogCommentRequest struct {
	ParentCommentID *uuid.UUID `json:"parent_comment_id,omitempty"`
	Content         string     `json:"content"`
}

// BlogCommentNode — 1 comment kèm reply (trải phẳng, tối đa 2 cấp — xem CreateComment)
type BlogCommentNode struct {
	ID              uuid.UUID         `json:"id" swaggertype:"string" format:"uuid"`
	AuthorID        uuid.UUID         `json:"author_id" swaggertype:"string" format:"uuid"`
	AuthorUsername  string            `json:"author_username"`
	AuthorFullName  string            `json:"author_full_name,omitempty"`
	AuthorAvatarURL string            `json:"author_avatar_url,omitempty"`
	Content         string            `json:"content"`
	IsHidden        bool              `json:"is_hidden"`
	CreatedAt       time.Time         `json:"created_at"`
	LikeCount       int               `json:"like_count"`
	DislikeCount    int               `json:"dislike_count"`
	Liked           bool              `json:"liked"`
	Disliked        bool              `json:"disliked"`
	Replies         []BlogCommentNode `json:"replies"`
}

// BlogToggleResponse — kết quả 1 lần bật/tắt star/marker/like/dislike (bài viết)
type BlogToggleResponse struct {
	PostID uuid.UUID `json:"post_id" swaggertype:"string" format:"uuid"`
	On     bool      `json:"on"`
	Count  int       `json:"count"`
}

// BlogCommentToggleResponse — kết quả 1 lần bật/tắt like/dislike của 1 comment
type BlogCommentToggleResponse struct {
	CommentID uuid.UUID `json:"comment_id" swaggertype:"string" format:"uuid"`
	On        bool      `json:"on"`
	Count     int       `json:"count"`
}

// blogSanitizePolicy — nền UGCPolicy (thẻ format cơ bản: p/h1-h6/ul/ol/li/
// blockquote/pre/code/a[href]/img[src,alt]...) + mở riêng 1 lỗ nhỏ cho
// <iframe> nhúng YouTube (Tiptap extension-youtube bọc trong
// <div data-youtube-video>) — src PHẢI khớp domain youtube, chặn mọi iframe
// khác (vector XSS/clickjacking phổ biến nhất nếu mở iframe tuỳ ý).
var youtubeEmbedSrc = regexp.MustCompile(`^https://(www\.)?youtube(-nocookie)?\.com/embed/[\w-]+(\?.*)?$`)

// blogImageIDPattern khớp UUID ngay sau "/blog/images/" bất kể origin đứng
// trước (dev/prod khác domain) — dùng để tìm ảnh được tham chiếu trong content.
var blogImageIDPattern = regexp.MustCompile(`/blog/images/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})`)

var stripTagsPattern = regexp.MustCompile(`<[^>]+>`)

func newBlogSanitizePolicy() *bluemonday.Policy {
	p := bluemonday.UGCPolicy()
	p.AllowAttrs("data-youtube-video").OnElements("div")
	p.AllowAttrs("src").Matching(youtubeEmbedSrc).OnElements("iframe")
	p.AllowAttrs("width", "height", "frameborder", "allow", "allowfullscreen", "title").OnElements("iframe")
	return p
}

var blogSanitizePolicy = newBlogSanitizePolicy()

func sanitizeBlogContent(html string) string {
	return blogSanitizePolicy.Sanitize(html)
}

// extractBlogImageIDs tìm mọi id ảnh (/blog/images/{id}) được tham chiếu
// trong content HTML — dùng để "nhận" (adopt) ảnh vào bài khi lưu.
func extractBlogImageIDs(html string) []uuid.UUID {
	matches := blogImageIDPattern.FindAllStringSubmatch(html, -1)
	seen := make(map[uuid.UUID]bool, len(matches))
	ids := make([]uuid.UUID, 0, len(matches))
	for _, m := range matches {
		id, err := uuid.Parse(m[1])
		if err != nil || seen[id] {
			continue
		}
		seen[id] = true
		ids = append(ids, id)
	}
	return ids
}

// firstImageURL trả về src của <img> đầu tiên trong content (đã là URL ổn
// định /blog/images/{id}, dùng thẳng làm thumbnail) — "" nếu bài không có ảnh.
var firstImgSrcPattern = regexp.MustCompile(`<img[^>]+src="([^"]+)"`)

func firstImageURL(content string) string {
	m := firstImgSrcPattern.FindStringSubmatch(content)
	if m == nil {
		return ""
	}
	return m[1]
}

// excerptLen — số ký tự plain-text giữ lại cho danh sách (cắt theo rune để không vỡ UTF-8).
const excerptLen = 200

// excerpt bỏ hết thẻ HTML, gộp khoảng trắng rồi cắt ngắn — content giờ là rich HTML.
func excerpt(content string) string {
	plain := strings.Join(strings.Fields(stripTagsPattern.ReplaceAllString(content, " ")), " ")
	runes := []rune(plain)
	if len(runes) <= excerptLen {
		return plain
	}
	return string(runes[:excerptLen]) + "…"
}

func optionalText(v pgtype.Text) string {
	if !v.Valid {
		return ""
	}
	return v.String
}

// ===== Learner-facing =====

// List trả về danh sách bài viết (phân trang), lọc theo ngôn ngữ/tag/tác giả (mine).
func (s *BlogService) List(ctx context.Context, userID uuid.UUID, languageID, tag string, authorID *uuid.UUID, page, pageSize int32) (PageResult[BlogPostSummary], error) {
	limit, offset := NormalizePage(page, pageSize)
	arg := db.ListBlogPostsPagedParams{
		UserID:     toPgUUID(userID),
		LanguageID: pgtype.Text{String: languageID, Valid: languageID != ""},
		Tag:        pgtype.Text{String: tag, Valid: tag != ""},
		Limit:      limit, Offset: offset,
	}
	if authorID != nil {
		arg.AuthorID = toPgUUID(*authorID)
	}
	rows, err := s.repo.ListBlogPostsPaged(ctx, arg)
	if err != nil {
		return PageResult[BlogPostSummary]{}, err
	}
	results := make([]BlogPostSummary, 0, len(rows))
	var total int64
	for _, r := range rows {
		total = r.TotalCount
		results = append(results, BlogPostSummary{
			ID: uuid.UUID(r.ID.Bytes), AuthorID: uuid.UUID(r.AuthorID.Bytes),
			AuthorUsername: r.Username, AuthorFullName: optionalText(r.FullName), AuthorAvatarURL: optionalText(r.AvatarUrl),
			LanguageID: optionalText(r.LanguageID), Title: r.Title, Excerpt: excerpt(r.Content), ThumbnailURL: firstImageURL(r.Content), Tags: r.Tags,
			ViewCount: r.ViewCount, CommentCount: int(r.CommentCount),
			StarCount: int(r.StarCount), MarkerCount: int(r.MarkerCount), LikeCount: int(r.LikeCount), DislikeCount: int(r.DislikeCount),
			Starred: r.Starred, Marked: r.Marked, Liked: r.Liked, Disliked: r.Disliked,
			IsHidden: r.IsHidden, CreatedAt: r.CreatedAt.Time,
		})
	}
	return PageResult[BlogPostSummary]{Items: results, Total: total}, nil
}

// GetDetail trả về 1 bài đầy đủ, tăng view_count 1 lần mỗi lượt gọi (không dedupe per-user).
func (s *BlogService) GetDetail(ctx context.Context, userID, postID uuid.UUID) (BlogPostDetail, error) {
	if err := s.repo.IncrementBlogPostViewCount(ctx, toPgUUID(postID)); err != nil {
		return BlogPostDetail{}, err
	}
	return s.fetchDetail(ctx, userID, postID)
}

// fetchDetail trả về 1 bài đầy đủ KHÔNG tăng view_count — dùng cho response
// ngay sau Create/Update (vừa tạo/sửa xong thì không tính là 1 lượt xem).
// Content tự chứa ảnh/video (URL ổn định /blog/images/:id, iframe youtube),
// không cần join thêm bảng ảnh/link nào để dựng response.
func (s *BlogService) fetchDetail(ctx context.Context, userID, postID uuid.UUID) (BlogPostDetail, error) {
	r, err := s.repo.GetBlogPostDetailByID(ctx, db.GetBlogPostDetailByIDParams{UserID: toPgUUID(userID), ID: toPgUUID(postID)})
	if errors.Is(err, pgx.ErrNoRows) {
		return BlogPostDetail{}, ErrNotFound
	}
	if err != nil {
		return BlogPostDetail{}, err
	}

	return BlogPostDetail{
		ID: postID, AuthorID: uuid.UUID(r.AuthorID.Bytes),
		AuthorUsername: r.Username, AuthorFullName: optionalText(r.FullName), AuthorAvatarURL: optionalText(r.AvatarUrl),
		LanguageID: optionalText(r.LanguageID), Title: r.Title, Content: r.Content, Tags: r.Tags,
		ViewCount: r.ViewCount, CommentCount: int(r.CommentCount),
		StarCount: int(r.StarCount), MarkerCount: int(r.MarkerCount), LikeCount: int(r.LikeCount), DislikeCount: int(r.DislikeCount),
		Starred: r.Starred, Marked: r.Marked, Liked: r.Liked, Disliked: r.Disliked,
		IsHidden: r.IsHidden, CreatedAt: r.CreatedAt.Time,
	}, nil
}

// requireAuthor trả về bài viết nếu tồn tại VÀ authorID đúng là tác giả, nếu
// không trả ErrForbidden (không phải tác giả) hoặc ErrNotFound (không tồn tại).
func (s *BlogService) requireAuthor(ctx context.Context, postID, authorID uuid.UUID) (db.BlogPost, error) {
	post, err := s.repo.GetBlogPostByID(ctx, toPgUUID(postID))
	if errors.Is(err, pgx.ErrNoRows) {
		return db.BlogPost{}, ErrNotFound
	}
	if err != nil {
		return db.BlogPost{}, err
	}
	if uuid.UUID(post.AuthorID.Bytes) != authorID {
		return db.BlogPost{}, ErrForbidden
	}
	return post, nil
}

// adoptContentImages "nhận" các ảnh được tham chiếu trong content (đã upload
// bởi đúng authorID, chưa gắn bài nào) vào postID — gọi qua qtx bên trong 1
// transaction (khớp pattern ClassService.ReplaceLessons). Ảnh KHÔNG còn được
// tham chiếu nữa (user xoá khỏi content khi sửa bài) vẫn giữ post_id cũ,
// chấp nhận là rác mồ côi trên R2 — bản này chưa có cơ chế dọn tự động.
func adoptContentImages(ctx context.Context, qtx *db.Queries, content string, postID, authorID uuid.UUID) error {
	ids := extractBlogImageIDs(content)
	if len(ids) == 0 {
		return nil
	}
	pgIDs := make([]pgtype.UUID, len(ids))
	for i, id := range ids {
		pgIDs[i] = toPgUUID(id)
	}
	return qtx.AdoptBlogImages(ctx, db.AdoptBlogImagesParams{PostID: toPgUUID(postID), Ids: pgIDs, AuthorID: toPgUUID(authorID)})
}

// Create tạo 1 bài viết mới (title/content/tags bắt buộc) — content được
// sanitize rồi "nhận" các ảnh đã tham chiếu trong 1 transaction.
func (s *BlogService) Create(ctx context.Context, authorID uuid.UUID, req BlogPostRequest) (BlogPostDetail, error) {
	if req.Title == "" || req.Content == "" {
		return BlogPostDetail{}, ErrInvalidInput
	}
	content := sanitizeBlogContent(req.Content)

	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return BlogPostDetail{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)

	post, err := qtx.CreateBlogPost(ctx, db.CreateBlogPostParams{
		AuthorID: toPgUUID(authorID), LanguageID: pgtype.Text{String: req.LanguageID, Valid: req.LanguageID != ""},
		Title: req.Title, Content: content, Tags: req.Tags,
	})
	if err != nil {
		return BlogPostDetail{}, err
	}
	postID := uuid.UUID(post.ID.Bytes)
	if err := adoptContentImages(ctx, qtx, content, postID, authorID); err != nil {
		return BlogPostDetail{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return BlogPostDetail{}, err
	}
	return s.fetchDetail(ctx, authorID, postID)
}

// Update sửa 1 bài viết — chỉ tác giả được sửa (ErrForbidden nếu không).
func (s *BlogService) Update(ctx context.Context, authorID, postID uuid.UUID, req BlogPostRequest) (BlogPostDetail, error) {
	if req.Title == "" || req.Content == "" {
		return BlogPostDetail{}, ErrInvalidInput
	}
	if _, err := s.requireAuthor(ctx, postID, authorID); err != nil {
		return BlogPostDetail{}, err
	}
	content := sanitizeBlogContent(req.Content)

	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return BlogPostDetail{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)

	if _, err := qtx.UpdateBlogPost(ctx, db.UpdateBlogPostParams{
		ID: toPgUUID(postID), Title: req.Title, Content: content, Tags: req.Tags,
		LanguageID: pgtype.Text{String: req.LanguageID, Valid: req.LanguageID != ""},
	}); err != nil {
		return BlogPostDetail{}, err
	}
	if err := adoptContentImages(ctx, qtx, content, postID, authorID); err != nil {
		return BlogPostDetail{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return BlogPostDetail{}, err
	}
	return s.fetchDetail(ctx, authorID, postID)
}

// Delete xoá 1 bài viết của chính tác giả — xoá luôn ảnh trên R2 trước khi
// xoá hàng DB (cascade tự xoá comment/counter/image row/youtube link).
func (s *BlogService) Delete(ctx context.Context, authorID, postID uuid.UUID) error {
	if _, err := s.requireAuthor(ctx, postID, authorID); err != nil {
		return err
	}
	return s.deletePostAndImages(ctx, postID)
}

func (s *BlogService) deletePostAndImages(ctx context.Context, postID uuid.UUID) error {
	if s.r2 != nil {
		images, err := s.repo.ListBlogPostImages(ctx, toPgUUID(postID))
		if err != nil {
			return err
		}
		for _, img := range images {
			if err := s.r2.Delete(ctx, img.ImageKey); err != nil {
				log.Printf("❌ xoá ảnh blog key=%s: %v", img.ImageKey, err)
			}
		}
	}
	return s.repo.DeleteBlogPost(ctx, toPgUUID(postID))
}

var allowedImageContentTypes = map[string]bool{
	"image/jpeg": true, "image/png": true, "image/webp": true, "image/gif": true,
}

const maxImageBytes = 5 * 1024 * 1024 // 5MB/ảnh
const imagePresignTTL = 1 * time.Hour // ngắn vì /blog/images/:id presign lại mỗi lần phục vụ, không lộ lâu

// UploadImage upload 1 ảnh lên R2, trả về id + URL phục vụ ổn định
// (/blog/images/:id) để chèn vào content ngay lúc soạn — chưa gắn bài nào
// (post_id NULL), Create/Update sẽ "nhận" ảnh khi lưu (xem adoptContentImages).
// KHÔNG cần postId — giải quyết việc soạn bài MỚI chưa có id vẫn chèn ảnh được.
func (s *BlogService) UploadImage(ctx context.Context, authorID uuid.UUID, content io.Reader, size int64, contentType, ext string) (BlogImageResponse, error) {
	if s.r2 == nil {
		return BlogImageResponse{}, fmt.Errorf("chưa cấu hình lưu trữ ảnh (R2): %w", ErrInvalidInput)
	}
	if !allowedImageContentTypes[contentType] {
		return BlogImageResponse{}, fmt.Errorf("định dạng ảnh không hỗ trợ (%s): %w", contentType, ErrInvalidInput)
	}
	if size > maxImageBytes {
		return BlogImageResponse{}, fmt.Errorf("ảnh quá lớn (tối đa %dMB): %w", maxImageBytes/1024/1024, ErrInvalidInput)
	}

	key := fmt.Sprintf("blog/%s/%s%s", authorID, uuid.New(), ext)
	if err := s.r2.Upload(ctx, key, content, contentType); err != nil {
		return BlogImageResponse{}, fmt.Errorf("upload ảnh thất bại: %w", err)
	}
	img, err := s.repo.CreateBlogImage(ctx, db.CreateBlogImageParams{AuthorID: toPgUUID(authorID), ImageKey: key})
	if err != nil {
		return BlogImageResponse{}, err
	}
	imgID := uuid.UUID(img.ID.Bytes)
	return BlogImageResponse{ID: imgID, URL: fmt.Sprintf("/blog/images/%s", imgID)}, nil
}

// ResolveImageURL tra key theo imageID rồi presign — dùng cho route public
// GET /blog/images/:id (redirect sang URL thật, xem BlogHandler.ServeImage).
func (s *BlogService) ResolveImageURL(ctx context.Context, imageID uuid.UUID) (string, error) {
	if s.r2 == nil {
		return "", ErrNotFound
	}
	img, err := s.repo.GetBlogImageByID(ctx, toPgUUID(imageID))
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	if err != nil {
		return "", err
	}
	url, err := s.r2.PresignGet(ctx, img.ImageKey, imagePresignTTL)
	if err != nil {
		return "", err
	}
	return url, nil
}

// ===== Comment (trải phẳng tối đa 2 cấp: root + reply, xem CreateComment) =====

// buildCommentTree dựng cây reply từ danh sách flat (sắp theo created_at) —
// gộp dữ liệu ở Go sau query, khớp pattern ListClassProgressByLanguage. Dữ
// liệu ghi vào luôn tối đa 2 cấp (CreateComment tự trải phẳng) nên cây dựng
// ra ở đây cũng chỉ sâu tối đa 2 cấp trên thực tế, nhưng hàm vẫn viết tổng
// quát (không giả định độ sâu) cho đơn giản, không cần xử lý riêng.
// commentTreeNode — nút trung gian dùng con trỏ để nối quan hệ cha/con trước
// khi chuyển hẳn sang giá trị (BlogCommentNode) — PHẢI nối xong toàn bộ cây
// rồi mới "đóng băng" sang giá trị ở dưới lên, nếu convert ngay khi gặp dòng
// root sẽ chụp nhầm Replies rỗng (root luôn đứng trước reply của nó trong thứ
// tự created_at nên reply luôn được xử lý ở 1 lần lặp SAU root).
type commentTreeNode struct {
	data     BlogCommentNode
	children []*commentTreeNode
}

func (n *commentTreeNode) toValue() BlogCommentNode {
	v := n.data
	v.Replies = make([]BlogCommentNode, 0, len(n.children))
	for _, c := range n.children {
		v.Replies = append(v.Replies, c.toValue())
	}
	return v
}

func buildCommentTree(rows []db.ListBlogCommentsByPostRow) []BlogCommentNode {
	nodes := make(map[uuid.UUID]*commentTreeNode, len(rows))
	for _, r := range rows {
		id := uuid.UUID(r.ID.Bytes)
		nodes[id] = &commentTreeNode{data: BlogCommentNode{
			ID: id, AuthorID: uuid.UUID(r.AuthorID.Bytes),
			AuthorUsername: r.Username, AuthorFullName: optionalText(r.FullName), AuthorAvatarURL: optionalText(r.AvatarUrl),
			Content: r.Content, IsHidden: r.IsHidden, CreatedAt: r.CreatedAt.Time,
			LikeCount: int(r.LikeCount), DislikeCount: int(r.DislikeCount), Liked: r.Liked, Disliked: r.Disliked,
		}}
	}
	var roots []*commentTreeNode
	for _, r := range rows {
		n := nodes[uuid.UUID(r.ID.Bytes)]
		if r.ParentCommentID.Valid {
			if parent, ok := nodes[uuid.UUID(r.ParentCommentID.Bytes)]; ok {
				parent.children = append(parent.children, n)
				continue
			}
		}
		roots = append(roots, n)
	}
	results := make([]BlogCommentNode, 0, len(roots))
	for _, r := range roots {
		results = append(results, r.toValue())
	}
	return results
}

// ListComments trả về danh sách comment đầy đủ (root + reply trải phẳng dưới
// mỗi root) của 1 bài viết, kèm like/dislike flag theo userID hiện tại.
func (s *BlogService) ListComments(ctx context.Context, userID, postID uuid.UUID) ([]BlogCommentNode, error) {
	rows, err := s.repo.ListBlogCommentsByPost(ctx, db.ListBlogCommentsByPostParams{UserID: toPgUUID(userID), PostID: toPgUUID(postID)})
	if err != nil {
		return nil, err
	}
	return buildCommentTree(rows), nil
}

// CreateComment thêm 1 comment (hoặc reply nếu có ParentCommentID) vào 1 bài
// viết. Reply luôn TRẢI PHẲNG về đúng 1 cấp: trả lời 1 reply khác (không phải
// root) thì tự gắn vào root của reply đó thay vì lồng tiếp — FE tự chèn
// "@username " vào content khi trả lời 1 reply để biết đang nhắc tới ai
// (xem CommentThread.tsx), backend chỉ chịu trách nhiệm trải phẳng.
func (s *BlogService) CreateComment(ctx context.Context, authorID, postID uuid.UUID, req BlogCommentRequest) (BlogCommentNode, error) {
	if req.Content == "" {
		return BlogCommentNode{}, ErrInvalidInput
	}
	post, err := s.repo.GetBlogPostByID(ctx, toPgUUID(postID))
	if errors.Is(err, pgx.ErrNoRows) {
		return BlogCommentNode{}, ErrNotFound
	} else if err != nil {
		return BlogCommentNode{}, err
	}

	var parentArg pgtype.UUID
	var parentAuthorID uuid.UUID // tác giả comment được trả lời trực tiếp (nhận thông báo blog_reply)
	if req.ParentCommentID != nil {
		parent, err := s.repo.GetBlogCommentByID(ctx, toPgUUID(*req.ParentCommentID))
		if errors.Is(err, pgx.ErrNoRows) {
			return BlogCommentNode{}, fmt.Errorf("comment cha không tồn tại: %w", ErrInvalidInput)
		}
		if err != nil {
			return BlogCommentNode{}, err
		}
		if uuid.UUID(parent.PostID.Bytes) != postID {
			return BlogCommentNode{}, fmt.Errorf("comment cha không thuộc bài viết này: %w", ErrInvalidInput)
		}
		parentArg = toPgUUID(*req.ParentCommentID)
		parentAuthorID = uuid.UUID(parent.AuthorID.Bytes)
		if parent.ParentCommentID.Valid {
			parentArg = parent.ParentCommentID // parent đã là 1 reply — trải phẳng về root của nó
		}
	}

	c, err := s.repo.CreateBlogComment(ctx, db.CreateBlogCommentParams{
		PostID: toPgUUID(postID), AuthorID: toPgUUID(authorID), ParentCommentID: parentArg, Content: req.Content,
	})
	if err != nil {
		return BlogCommentNode{}, err
	}
	// Lấy lại kèm thông tin tác giả (username/full_name/avatar_url) cho đồng bộ
	// response — dùng authorID (người vừa đăng) để tính liked/disliked, vừa
	// đăng thì chưa tự like/dislike nên cả 2 đều false.
	rows, err := s.repo.ListBlogCommentsByPost(ctx, db.ListBlogCommentsByPostParams{UserID: toPgUUID(authorID), PostID: toPgUUID(postID)})
	if err != nil {
		return BlogCommentNode{}, err
	}
	for _, r := range rows {
		if uuid.UUID(r.ID.Bytes) == uuid.UUID(c.ID.Bytes) {
			s.notifyNewComment(ctx, post, uuid.UUID(c.ID.Bytes), authorID, parentAuthorID, displayNameOf(r.FullName, r.Username), req.Content)
			return BlogCommentNode{
				ID: uuid.UUID(r.ID.Bytes), AuthorID: uuid.UUID(r.AuthorID.Bytes),
				AuthorUsername: r.Username, AuthorFullName: optionalText(r.FullName), AuthorAvatarURL: optionalText(r.AvatarUrl),
				Content: r.Content, IsHidden: r.IsHidden, CreatedAt: r.CreatedAt.Time,
				LikeCount: int(r.LikeCount), DislikeCount: int(r.DislikeCount), Liked: r.Liked, Disliked: r.Disliked,
				Replies: []BlogCommentNode{},
			}, nil
		}
	}
	return BlogCommentNode{}, ErrNotFound
}

// notifyNewComment báo tác giả bài viết có bình luận mới, và tác giả comment
// được trả lời có reply mới — không tự báo cho chính người vừa bình luận, mỗi
// người nhận tối đa 1 thông báo cho 1 bình luận.
func (s *BlogService) notifyNewComment(ctx context.Context, post db.BlogPost, commentID, commenterID, parentAuthorID uuid.UUID, commenterName, content string) {
	postAuthorID := uuid.UUID(post.AuthorID.Bytes)
	url := "/blog/" + uuid.UUID(post.ID.Bytes).String()
	preview := truncateRunes(strings.TrimSpace(content), 120)
	if parentAuthorID != uuid.Nil && parentAuthorID != commenterID {
		s.notifier.Notify(ctx, parentAuthorID, NotificationInput{
			Type: NotificationBlogReply, Icon: "↩️", URL: url,
			Title: commenterName + " đã trả lời bình luận của bạn", Body: preview,
		})
	}
	if postAuthorID != commenterID && postAuthorID != parentAuthorID {
		s.notifier.Notify(ctx, postAuthorID, NotificationInput{
			Type: NotificationBlogComment, Icon: "💬", URL: url,
			Title: commenterName + " đã bình luận bài viết \"" + post.Title + "\"", Body: preview,
		})
	}
	// Người được @nhắc tên — trừ người bình luận và người đã nhận thông báo ở trên (mỗi người tối đa 1)
	notified := map[uuid.UUID]bool{commenterID: true, parentAuthorID: true, postAuthorID: true}
	s.notifyMentions(ctx, commentID, commenterID, extractMentions(content), notified, mentionNotice(commenterName, url, preview))
	s.markMentionHandled(ctx, commentID, commenterID, postAuthorID, parentAuthorID)
}

func mentionNotice(commenterName, url, preview string) NotificationInput {
	return NotificationInput{
		Type: NotificationBlogMention, Icon: "📣", URL: url,
		Title: commenterName + " đã nhắc đến bạn trong một bình luận", Body: preview,
	}
}

// notifyMentions gửi n cho từng username trong mentions (đã tách từ nội dung comment commentID).
// Mỗi (comment, người được tag) chỉ xử lý 1 lần (blog_mention_notices) → sửa comment chỉ báo người MỚI được tag.
// Không gửi (nhưng vẫn ghi nhận, notified = false) cho: user trong skip (đã nhận thông báo khác), người vừa được
// chính mentioner tag trong mentionPairWindow, hoặc khi mentioner đã gửi đủ maxMentionNoticesPerHour / giờ.
// Bỏ qua hẳn: username không tồn tại, tài khoản bị khoá.
func (s *BlogService) notifyMentions(ctx context.Context, commentID, mentionerID uuid.UUID, mentions []string, skip map[uuid.UUID]bool, n NotificationInput) {
	if len(mentions) == 0 {
		return
	}
	sent, err := s.repo.CountRecentMentionNotices(ctx, db.CountRecentMentionNoticesParams{
		MentionerID: toPgUUID(mentionerID), WindowSeconds: int32(time.Hour / time.Second),
	})
	if err != nil {
		log.Printf("❌ blog: đếm thông báo tag của %s: %v", mentionerID, err)
		return
	}
	for _, username := range mentions {
		u, err := s.repo.GetUserByUsername(ctx, username)
		if err != nil {
			if !errors.Is(err, pgx.ErrNoRows) {
				log.Printf("❌ blog: tìm user @%s để báo nhắc tên: %v", username, err)
			}
			continue
		}
		if !u.IsActive { // tài khoản bị khoá không nhận thông báo
			continue
		}
		id := uuid.UUID(u.ID.Bytes)
		notify := !skip[id] && sent < maxMentionNoticesPerHour
		if notify {
			recent, err := s.repo.HasRecentMentionNotice(ctx, db.HasRecentMentionNoticeParams{
				MentionerID: toPgUUID(mentionerID), UserID: u.ID, WindowSeconds: int32(mentionPairWindow / time.Second),
			})
			if err != nil {
				log.Printf("❌ blog: kiểm tra tag gần đây %s→%s: %v", mentionerID, id, err)
				continue
			}
			notify = !recent
		}
		added, err := s.repo.MarkMentionNoticed(ctx, db.MarkMentionNoticedParams{
			CommentID: toPgUUID(commentID), UserID: u.ID, MentionerID: toPgUUID(mentionerID), Notified: notify,
		})
		if err != nil {
			log.Printf("❌ blog: ghi nhận tag %s trong comment %s: %v", id, commentID, err)
			continue
		}
		if added == 1 && notify {
			s.notifier.Notify(ctx, id, n)
			sent++
		}
	}
}

// markMentionHandled ghi nhận các user đã nhận thông báo khác của comment (chủ bài, người được trả lời) —
// sửa comment để tag họ sau này không báo thêm lần nữa
func (s *BlogService) markMentionHandled(ctx context.Context, commentID, mentionerID uuid.UUID, users ...uuid.UUID) {
	for _, id := range users {
		if id == uuid.Nil || id == mentionerID {
			continue
		}
		if _, err := s.repo.MarkMentionNoticed(ctx, db.MarkMentionNoticedParams{
			CommentID: toPgUUID(commentID), UserID: toPgUUID(id), MentionerID: toPgUUID(mentionerID), Notified: false,
		}); err != nil {
			log.Printf("❌ blog: ghi nhận đã báo %s cho comment %s: %v", id, commentID, err)
		}
	}
}

// notifyCommentLiked báo tác giả comment khi có người ♥ — không báo khi tự ♥ comment của mình
func (s *BlogService) notifyCommentLiked(ctx context.Context, comment db.BlogComment, likerID uuid.UUID) {
	authorID := uuid.UUID(comment.AuthorID.Bytes)
	if authorID == likerID {
		return
	}
	// Mỗi người ♥ 1 bình luận chỉ báo 1 lần — ♥ / bỏ ♥ / ♥ lại không spam tác giả
	n, err := s.repo.MarkCommentLikeNoticed(ctx, db.MarkCommentLikeNoticedParams{UserID: toPgUUID(likerID), CommentID: comment.ID})
	if err != nil {
		log.Printf("❌ blog: ghi nhận đã báo ♥ bình luận %s: %v", uuid.UUID(comment.ID.Bytes), err)
		return
	}
	if n == 0 {
		return
	}
	liker, err := s.repo.GetUserByID(ctx, toPgUUID(likerID))
	if err != nil {
		log.Printf("❌ blog: đọc user %s để báo ♥ bình luận: %v", likerID, err)
		return
	}
	s.notifier.Notify(ctx, authorID, NotificationInput{
		Type: NotificationBlogCommentLike, Icon: "❤️", URL: "/blog/" + uuid.UUID(comment.PostID.Bytes).String(),
		Title: displayNameOf(liker.FullName, liker.Username) + " đã thích bình luận của bạn",
		Body:  truncateRunes(strings.TrimSpace(comment.Content), 120),
	})
}

// displayNameOf — họ tên nếu có, không thì username
func displayNameOf(fullName pgtype.Text, username string) string {
	if name := strings.TrimSpace(fullName.String); name != "" {
		return name
	}
	return username
}

// requireCommentAuthor trả comment nếu đúng tác giả, không thì ErrForbidden/ErrNotFound.
func (s *BlogService) requireCommentAuthor(ctx context.Context, commentID, authorID uuid.UUID) (db.BlogComment, error) {
	c, err := s.repo.GetBlogCommentByID(ctx, toPgUUID(commentID))
	if errors.Is(err, pgx.ErrNoRows) {
		return db.BlogComment{}, ErrNotFound
	}
	if err != nil {
		return db.BlogComment{}, err
	}
	if uuid.UUID(c.AuthorID.Bytes) != authorID {
		return db.BlogComment{}, ErrForbidden
	}
	return c, nil
}

// UpdateComment sửa nội dung 1 comment của chính tác giả.
func (s *BlogService) UpdateComment(ctx context.Context, authorID, commentID uuid.UUID, content string) error {
	if content == "" {
		return ErrInvalidInput
	}
	comment, err := s.requireCommentAuthor(ctx, commentID, authorID)
	if err != nil {
		return err
	}
	if _, err := s.repo.UpdateBlogComment(ctx, db.UpdateBlogCommentParams{ID: toPgUUID(commentID), Content: content}); err != nil {
		return err
	}
	s.notifyEditedMentions(ctx, comment, authorID, content)
	return nil
}

// notifyEditedMentions — sửa comment có thêm @tag: báo người MỚI được tag (so với nội dung cũ). Người đã xử lý trong comment này
// (đã được báo, bị chặn spam, hoặc là chủ bài / người được trả lời — ghi lúc đăng) tự bị bỏ qua.
func (s *BlogService) notifyEditedMentions(ctx context.Context, comment db.BlogComment, authorID uuid.UUID, content string) {
	// Chỉ tag MỚI so với nội dung trước khi sửa — người đã có trong nội dung cũ không bị báo lại
	mentions := addedMentions(comment.Content, content)
	if len(mentions) == 0 {
		return
	}
	post, err := s.repo.GetBlogPostByID(ctx, comment.PostID)
	if err != nil {
		log.Printf("❌ blog: đọc bài viết để báo tag khi sửa comment %s: %v", uuid.UUID(comment.ID.Bytes), err)
		return
	}
	if post.IsHidden || comment.IsHidden { // link không xem được → không báo
		return
	}
	author, err := s.repo.GetUserByID(ctx, toPgUUID(authorID))
	if err != nil {
		log.Printf("❌ blog: đọc user %s để báo tag: %v", authorID, err)
		return
	}
	url := "/blog/" + uuid.UUID(post.ID.Bytes).String()
	preview := truncateRunes(strings.TrimSpace(content), 120)
	skip := map[uuid.UUID]bool{authorID: true, uuid.UUID(post.AuthorID.Bytes): true}
	s.notifyMentions(ctx, uuid.UUID(comment.ID.Bytes), authorID, mentions, skip, mentionNotice(displayNameOf(author.FullName, author.Username), url, preview))
}

// DeleteComment xoá 1 comment của chính tác giả — cascade xoá luôn reply con.
func (s *BlogService) DeleteComment(ctx context.Context, authorID, commentID uuid.UUID) error {
	if _, err := s.requireCommentAuthor(ctx, commentID, authorID); err != nil {
		return err
	}
	return s.repo.DeleteBlogComment(ctx, toPgUUID(commentID))
}

// ===== 4 counter độc lập =====

func (s *BlogService) ensurePostExists(ctx context.Context, postID uuid.UUID) error {
	if _, err := s.repo.GetBlogPostByID(ctx, toPgUUID(postID)); errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	} else if err != nil {
		return err
	}
	return nil
}

func (s *BlogService) SetStar(ctx context.Context, userID, postID uuid.UUID, on bool) (BlogToggleResponse, error) {
	if err := s.ensurePostExists(ctx, postID); err != nil {
		return BlogToggleResponse{}, err
	}
	arg := db.StarBlogPostParams{UserID: toPgUUID(userID), PostID: toPgUUID(postID)}
	var err error
	if on {
		err = s.repo.StarBlogPost(ctx, arg)
	} else {
		err = s.repo.UnstarBlogPost(ctx, db.UnstarBlogPostParams(arg))
	}
	if err != nil {
		return BlogToggleResponse{}, err
	}
	count, err := s.repo.CountBlogPostStars(ctx, toPgUUID(postID))
	if err != nil {
		return BlogToggleResponse{}, err
	}
	return BlogToggleResponse{PostID: postID, On: on, Count: int(count)}, nil
}

func (s *BlogService) SetMarker(ctx context.Context, userID, postID uuid.UUID, on bool) (BlogToggleResponse, error) {
	if err := s.ensurePostExists(ctx, postID); err != nil {
		return BlogToggleResponse{}, err
	}
	arg := db.MarkBlogPostParams{UserID: toPgUUID(userID), PostID: toPgUUID(postID)}
	var err error
	if on {
		err = s.repo.MarkBlogPost(ctx, arg)
	} else {
		err = s.repo.UnmarkBlogPost(ctx, db.UnmarkBlogPostParams(arg))
	}
	if err != nil {
		return BlogToggleResponse{}, err
	}
	count, err := s.repo.CountBlogPostMarkers(ctx, toPgUUID(postID))
	if err != nil {
		return BlogToggleResponse{}, err
	}
	return BlogToggleResponse{PostID: postID, On: on, Count: int(count)}, nil
}

// SetLike/SetDislike loại trừ nhau — bật 1 bên thì tự tắt bên kia trong 1
// transaction, tránh 1 user vừa like vừa dislike cùng lúc.
func (s *BlogService) SetLike(ctx context.Context, userID, postID uuid.UUID, on bool) (BlogToggleResponse, error) {
	if err := s.ensurePostExists(ctx, postID); err != nil {
		return BlogToggleResponse{}, err
	}
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return BlogToggleResponse{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	arg := db.LikeBlogPostParams{UserID: toPgUUID(userID), PostID: toPgUUID(postID)}
	if on {
		if err := qtx.UndislikeBlogPost(ctx, db.UndislikeBlogPostParams(arg)); err != nil {
			return BlogToggleResponse{}, err
		}
		if err := qtx.LikeBlogPost(ctx, arg); err != nil {
			return BlogToggleResponse{}, err
		}
	} else if err := qtx.UnlikeBlogPost(ctx, db.UnlikeBlogPostParams(arg)); err != nil {
		return BlogToggleResponse{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return BlogToggleResponse{}, err
	}
	count, err := s.repo.CountBlogPostLikes(ctx, toPgUUID(postID))
	if err != nil {
		return BlogToggleResponse{}, err
	}
	return BlogToggleResponse{PostID: postID, On: on, Count: int(count)}, nil
}

func (s *BlogService) SetDislike(ctx context.Context, userID, postID uuid.UUID, on bool) (BlogToggleResponse, error) {
	if err := s.ensurePostExists(ctx, postID); err != nil {
		return BlogToggleResponse{}, err
	}
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return BlogToggleResponse{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	arg := db.DislikeBlogPostParams{UserID: toPgUUID(userID), PostID: toPgUUID(postID)}
	if on {
		if err := qtx.UnlikeBlogPost(ctx, db.UnlikeBlogPostParams(arg)); err != nil {
			return BlogToggleResponse{}, err
		}
		if err := qtx.DislikeBlogPost(ctx, arg); err != nil {
			return BlogToggleResponse{}, err
		}
	} else if err := qtx.UndislikeBlogPost(ctx, db.UndislikeBlogPostParams(arg)); err != nil {
		return BlogToggleResponse{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return BlogToggleResponse{}, err
	}
	count, err := s.repo.CountBlogPostDislikes(ctx, toPgUUID(postID))
	if err != nil {
		return BlogToggleResponse{}, err
	}
	return BlogToggleResponse{PostID: postID, On: on, Count: int(count)}, nil
}

// ===== Like/dislike cho comment (độc lập với like/dislike bài viết) =====

func (s *BlogService) ensureCommentExists(ctx context.Context, commentID uuid.UUID) error {
	if _, err := s.repo.GetBlogCommentByID(ctx, toPgUUID(commentID)); errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	} else if err != nil {
		return err
	}
	return nil
}

// SetCommentLike/SetCommentDislike loại trừ nhau — khớp pattern SetLike/SetDislike (bài viết).
func (s *BlogService) SetCommentLike(ctx context.Context, userID, commentID uuid.UUID, on bool) (BlogCommentToggleResponse, error) {
	comment, err := s.repo.GetBlogCommentByID(ctx, toPgUUID(commentID))
	if errors.Is(err, pgx.ErrNoRows) {
		return BlogCommentToggleResponse{}, ErrNotFound
	} else if err != nil {
		return BlogCommentToggleResponse{}, err
	}
	newlyLiked := false
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return BlogCommentToggleResponse{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	arg := db.LikeBlogCommentParams{UserID: toPgUUID(userID), CommentID: toPgUUID(commentID)}
	if on {
		if err := qtx.UndislikeBlogComment(ctx, db.UndislikeBlogCommentParams(arg)); err != nil {
			return BlogCommentToggleResponse{}, err
		}
		n, err := qtx.LikeBlogComment(ctx, arg)
		if err != nil {
			return BlogCommentToggleResponse{}, err
		}
		newlyLiked = n == 1
	} else if err := qtx.UnlikeBlogComment(ctx, db.UnlikeBlogCommentParams(arg)); err != nil {
		return BlogCommentToggleResponse{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return BlogCommentToggleResponse{}, err
	}
	if newlyLiked { // bấm ♥ lại khi đã ♥ (hoặc mạng gửi trùng) → không báo lần nữa
		s.notifyCommentLiked(ctx, comment, userID)
	}
	count, err := s.repo.CountBlogCommentLikes(ctx, toPgUUID(commentID))
	if err != nil {
		return BlogCommentToggleResponse{}, err
	}
	return BlogCommentToggleResponse{CommentID: commentID, On: on, Count: int(count)}, nil
}

func (s *BlogService) SetCommentDislike(ctx context.Context, userID, commentID uuid.UUID, on bool) (BlogCommentToggleResponse, error) {
	if err := s.ensureCommentExists(ctx, commentID); err != nil {
		return BlogCommentToggleResponse{}, err
	}
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return BlogCommentToggleResponse{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	arg := db.DislikeBlogCommentParams{UserID: toPgUUID(userID), CommentID: toPgUUID(commentID)}
	if on {
		if err := qtx.UnlikeBlogComment(ctx, db.UnlikeBlogCommentParams(arg)); err != nil {
			return BlogCommentToggleResponse{}, err
		}
		if err := qtx.DislikeBlogComment(ctx, arg); err != nil {
			return BlogCommentToggleResponse{}, err
		}
	} else if err := qtx.UndislikeBlogComment(ctx, db.UndislikeBlogCommentParams(arg)); err != nil {
		return BlogCommentToggleResponse{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return BlogCommentToggleResponse{}, err
	}
	count, err := s.repo.CountBlogCommentDislikes(ctx, toPgUUID(commentID))
	if err != nil {
		return BlogCommentToggleResponse{}, err
	}
	return BlogCommentToggleResponse{CommentID: commentID, On: on, Count: int(count)}, nil
}

// ===== Admin hậu kiểm =====

func toBlogPostAdminResponse(r db.ListBlogPostsAdminPagedRow) BlogPostAdminResponse {
	return BlogPostAdminResponse{
		ID: uuid.UUID(r.ID.Bytes), AuthorID: uuid.UUID(r.AuthorID.Bytes),
		AuthorUsername: r.Username, AuthorFullName: optionalText(r.FullName),
		LanguageID: optionalText(r.LanguageID), Title: r.Title, ViewCount: r.ViewCount,
		CommentCount: int(r.CommentCount), IsHidden: r.IsHidden, CreatedAt: r.CreatedAt.Time,
	}
}

func (s *BlogService) ListAdmin(ctx context.Context, hiddenOnly bool, page, pageSize int32) (PageResult[BlogPostAdminResponse], error) {
	limit, offset := NormalizePage(page, pageSize)
	rows, err := s.repo.ListBlogPostsAdminPaged(ctx, db.ListBlogPostsAdminPagedParams{HiddenOnly: hiddenOnly, Limit: limit, Offset: offset})
	if err != nil {
		return PageResult[BlogPostAdminResponse]{}, err
	}
	results := make([]BlogPostAdminResponse, 0, len(rows))
	var total int64
	for _, r := range rows {
		total = r.TotalCount
		results = append(results, toBlogPostAdminResponse(r))
	}
	return PageResult[BlogPostAdminResponse]{Items: results, Total: total}, nil
}

func (s *BlogService) HidePost(ctx context.Context, postID uuid.UUID) error {
	if err := s.ensurePostExists(ctx, postID); err != nil {
		return err
	}
	return s.repo.HideBlogPost(ctx, toPgUUID(postID))
}

func (s *BlogService) UnhidePost(ctx context.Context, postID uuid.UUID) error {
	if err := s.ensurePostExists(ctx, postID); err != nil {
		return err
	}
	return s.repo.UnhideBlogPost(ctx, toPgUUID(postID))
}

// AdminDeletePost xoá cứng 1 bài viết bất kỳ (khác Delete — không check ownership).
func (s *BlogService) AdminDeletePost(ctx context.Context, postID uuid.UUID) error {
	if err := s.ensurePostExists(ctx, postID); err != nil {
		return err
	}
	return s.deletePostAndImages(ctx, postID)
}

func (s *BlogService) HideComment(ctx context.Context, commentID uuid.UUID) error {
	if _, err := s.repo.GetBlogCommentByID(ctx, toPgUUID(commentID)); errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	} else if err != nil {
		return err
	}
	return s.repo.HideBlogComment(ctx, toPgUUID(commentID))
}

func (s *BlogService) UnhideComment(ctx context.Context, commentID uuid.UUID) error {
	if _, err := s.repo.GetBlogCommentByID(ctx, toPgUUID(commentID)); errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	} else if err != nil {
		return err
	}
	return s.repo.UnhideBlogComment(ctx, toPgUUID(commentID))
}

// AdminDeleteComment xoá cứng 1 comment bất kỳ (cascade reply con) — khác DeleteComment, không check ownership.
func (s *BlogService) AdminDeleteComment(ctx context.Context, commentID uuid.UUID) error {
	if _, err := s.repo.GetBlogCommentByID(ctx, toPgUUID(commentID)); errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	} else if err != nil {
		return err
	}
	return s.repo.DeleteBlogComment(ctx, toPgUUID(commentID))
}
