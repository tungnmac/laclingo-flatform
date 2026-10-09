package service

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"time"

	"laclingo-backend/internal/repository/db"
	"laclingo-backend/internal/storage"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// BlogRepository định nghĩa Interface tiếp xúc với cơ sở dữ liệu. BeginTx +
// WithTx dùng để tạo/sửa bài viết + link YouTube trong 1 transaction thật
// (khớp pattern ClassService.ReplaceLessons) — CreateBlogPost/UpdateBlogPost/
// DeleteBlogPostYoutubeLinks/AddBlogPostYoutubeLink vì vậy KHÔNG có trong
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
	ListBlogPostYoutubeLinks(ctx context.Context, postID pgtype.UUID) ([]db.BlogPostYoutubeLink, error)

	CountBlogPostImages(ctx context.Context, postID pgtype.UUID) (int32, error)
	AddBlogPostImage(ctx context.Context, arg db.AddBlogPostImageParams) (db.BlogPostImage, error)
	ListBlogPostImages(ctx context.Context, postID pgtype.UUID) ([]db.BlogPostImage, error)
	DeleteBlogPostImage(ctx context.Context, arg db.DeleteBlogPostImageParams) (string, error)

	CreateBlogComment(ctx context.Context, arg db.CreateBlogCommentParams) (db.BlogComment, error)
	GetBlogCommentByID(ctx context.Context, id pgtype.UUID) (db.BlogComment, error)
	UpdateBlogComment(ctx context.Context, arg db.UpdateBlogCommentParams) (db.BlogComment, error)
	DeleteBlogComment(ctx context.Context, id pgtype.UUID) error
	HideBlogComment(ctx context.Context, id pgtype.UUID) error
	UnhideBlogComment(ctx context.Context, id pgtype.UUID) error
	ListBlogCommentsByPost(ctx context.Context, postID pgtype.UUID) ([]db.ListBlogCommentsByPostRow, error)

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
	r2 *storage.R2Client
}

func NewBlogService(repo BlogRepository, r2 *storage.R2Client) *BlogService {
	return &BlogService{repo: repo, r2: r2}
}

// ===== Request / response types =====

// BlogPostRequest — body tạo/sửa bài viết (tác giả tự phục vụ)
type BlogPostRequest struct {
	LanguageID  string   `json:"language_id,omitempty"`
	Title       string   `json:"title"`
	Content     string   `json:"content"`
	Tags        []string `json:"tags"`
	YoutubeURLs []string `json:"youtube_urls"`
}

type BlogPostImageResponse struct {
	ID  uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	URL string    `json:"url"`
}

// BlogPostSummary — 1 bài trong danh sách, kèm excerpt + count/flag theo user hiện tại
type BlogPostSummary struct {
	ID              uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	AuthorID        uuid.UUID `json:"author_id" swaggertype:"string" format:"uuid"`
	AuthorUsername  string    `json:"author_username"`
	AuthorFullName  string    `json:"author_full_name,omitempty"`
	AuthorAvatarURL string    `json:"author_avatar_url,omitempty"`
	LanguageID      string    `json:"language_id,omitempty"`
	Title           string    `json:"title"`
	Excerpt         string    `json:"excerpt"`
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

// BlogPostDetail — 1 bài đầy đủ (trang chi tiết)
type BlogPostDetail struct {
	ID              uuid.UUID               `json:"id" swaggertype:"string" format:"uuid"`
	AuthorID        uuid.UUID               `json:"author_id" swaggertype:"string" format:"uuid"`
	AuthorUsername  string                  `json:"author_username"`
	AuthorFullName  string                  `json:"author_full_name,omitempty"`
	AuthorAvatarURL string                  `json:"author_avatar_url,omitempty"`
	LanguageID      string                  `json:"language_id,omitempty"`
	Title           string                  `json:"title"`
	Content         string                  `json:"content"`
	Tags            []string                `json:"tags"`
	Images          []BlogPostImageResponse `json:"images"`
	YoutubeURLs     []string                `json:"youtube_urls"`
	ViewCount       int32                   `json:"view_count"`
	CommentCount    int                     `json:"comment_count"`
	StarCount       int                     `json:"star_count"`
	MarkerCount     int                     `json:"marker_count"`
	LikeCount       int                     `json:"like_count"`
	DislikeCount    int                     `json:"dislike_count"`
	Starred         bool                    `json:"starred"`
	Marked          bool                    `json:"marked"`
	Liked           bool                    `json:"liked"`
	Disliked        bool                    `json:"disliked"`
	IsHidden        bool                    `json:"is_hidden"`
	CreatedAt       time.Time               `json:"created_at"`
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

// BlogCommentNode — 1 comment kèm cây reply lồng nhau
type BlogCommentNode struct {
	ID              uuid.UUID         `json:"id" swaggertype:"string" format:"uuid"`
	AuthorID        uuid.UUID         `json:"author_id" swaggertype:"string" format:"uuid"`
	AuthorUsername  string            `json:"author_username"`
	AuthorFullName  string            `json:"author_full_name,omitempty"`
	AuthorAvatarURL string            `json:"author_avatar_url,omitempty"`
	Content         string            `json:"content"`
	IsHidden        bool              `json:"is_hidden"`
	CreatedAt       time.Time         `json:"created_at"`
	Replies         []BlogCommentNode `json:"replies"`
}

// BlogToggleResponse — kết quả 1 lần bật/tắt star/marker/like/dislike
type BlogToggleResponse struct {
	PostID uuid.UUID `json:"post_id" swaggertype:"string" format:"uuid"`
	On     bool      `json:"on"`
	Count  int       `json:"count"`
}

// excerptLen — số ký tự content giữ lại cho danh sách (cắt theo rune để không vỡ UTF-8).
const excerptLen = 200

func excerpt(content string) string {
	runes := []rune(content)
	if len(runes) <= excerptLen {
		return content
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
			LanguageID: optionalText(r.LanguageID), Title: r.Title, Excerpt: excerpt(r.Content), Tags: r.Tags,
			ViewCount: r.ViewCount, CommentCount: int(r.CommentCount),
			StarCount: int(r.StarCount), MarkerCount: int(r.MarkerCount), LikeCount: int(r.LikeCount), DislikeCount: int(r.DislikeCount),
			Starred: r.Starred, Marked: r.Marked, Liked: r.Liked, Disliked: r.Disliked,
			IsHidden: r.IsHidden, CreatedAt: r.CreatedAt.Time,
		})
	}
	return PageResult[BlogPostSummary]{Items: results, Total: total}, nil
}

func (s *BlogService) presignImageURL(ctx context.Context, key string) string {
	if s.r2 == nil || key == "" {
		return ""
	}
	url, err := s.r2.PresignGet(ctx, key, imagePresignTTL)
	if err != nil {
		log.Printf("❌ presign blog image key=%s: %v", key, err)
		return ""
	}
	return url
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
func (s *BlogService) fetchDetail(ctx context.Context, userID, postID uuid.UUID) (BlogPostDetail, error) {
	r, err := s.repo.GetBlogPostDetailByID(ctx, db.GetBlogPostDetailByIDParams{UserID: toPgUUID(userID), ID: toPgUUID(postID)})
	if errors.Is(err, pgx.ErrNoRows) {
		return BlogPostDetail{}, ErrNotFound
	}
	if err != nil {
		return BlogPostDetail{}, err
	}

	imageRows, err := s.repo.ListBlogPostImages(ctx, toPgUUID(postID))
	if err != nil {
		return BlogPostDetail{}, err
	}
	images := make([]BlogPostImageResponse, 0, len(imageRows))
	for _, img := range imageRows {
		images = append(images, BlogPostImageResponse{ID: uuid.UUID(img.ID.Bytes), URL: s.presignImageURL(ctx, img.ImageKey)})
	}

	linkRows, err := s.repo.ListBlogPostYoutubeLinks(ctx, toPgUUID(postID))
	if err != nil {
		return BlogPostDetail{}, err
	}
	links := make([]string, 0, len(linkRows))
	for _, l := range linkRows {
		links = append(links, l.Url)
	}

	return BlogPostDetail{
		ID: postID, AuthorID: uuid.UUID(r.AuthorID.Bytes),
		AuthorUsername: r.Username, AuthorFullName: optionalText(r.FullName), AuthorAvatarURL: optionalText(r.AvatarUrl),
		LanguageID: optionalText(r.LanguageID), Title: r.Title, Content: r.Content, Tags: r.Tags,
		Images: images, YoutubeURLs: links, ViewCount: r.ViewCount, CommentCount: int(r.CommentCount),
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

// replaceYoutubeLinks xoá hết link cũ rồi insert lại theo mảng mới — gọi qua
// qtx bên trong 1 transaction (khớp pattern ClassService.ReplaceLessons).
func replaceYoutubeLinks(ctx context.Context, qtx *db.Queries, postID uuid.UUID, urls []string) error {
	if err := qtx.DeleteBlogPostYoutubeLinks(ctx, toPgUUID(postID)); err != nil {
		return err
	}
	for i, url := range urls {
		if url == "" {
			continue
		}
		if err := qtx.AddBlogPostYoutubeLink(ctx, db.AddBlogPostYoutubeLinkParams{
			PostID: toPgUUID(postID), Url: url, OrderIndex: int32(i),
		}); err != nil {
			return err
		}
	}
	return nil
}

// Create tạo 1 bài viết mới (title/content/tags bắt buộc) + link YouTube
// trong 1 transaction. Ảnh đính kèm upload riêng SAU khi bài đã có ID (xem UploadImage).
func (s *BlogService) Create(ctx context.Context, authorID uuid.UUID, req BlogPostRequest) (BlogPostDetail, error) {
	if req.Title == "" || req.Content == "" {
		return BlogPostDetail{}, ErrInvalidInput
	}
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return BlogPostDetail{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)

	post, err := qtx.CreateBlogPost(ctx, db.CreateBlogPostParams{
		AuthorID: toPgUUID(authorID), LanguageID: pgtype.Text{String: req.LanguageID, Valid: req.LanguageID != ""},
		Title: req.Title, Content: req.Content, Tags: req.Tags,
	})
	if err != nil {
		return BlogPostDetail{}, err
	}
	postID := uuid.UUID(post.ID.Bytes)
	if err := replaceYoutubeLinks(ctx, qtx, postID, req.YoutubeURLs); err != nil {
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

	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return BlogPostDetail{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)

	if _, err := qtx.UpdateBlogPost(ctx, db.UpdateBlogPostParams{
		ID: toPgUUID(postID), Title: req.Title, Content: req.Content, Tags: req.Tags,
		LanguageID: pgtype.Text{String: req.LanguageID, Valid: req.LanguageID != ""},
	}); err != nil {
		return BlogPostDetail{}, err
	}
	if err := replaceYoutubeLinks(ctx, qtx, postID, req.YoutubeURLs); err != nil {
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
const maxImagesPerPost = 6
const imagePresignTTL = 24 * time.Hour

// UploadImage đính 1 ảnh vào bài viết của chính tác giả (tối đa maxImagesPerPost ảnh/bài).
func (s *BlogService) UploadImage(ctx context.Context, authorID, postID uuid.UUID, content io.Reader, size int64, contentType, ext string) (BlogPostImageResponse, error) {
	if s.r2 == nil {
		return BlogPostImageResponse{}, fmt.Errorf("chưa cấu hình lưu trữ ảnh (R2): %w", ErrInvalidInput)
	}
	if !allowedImageContentTypes[contentType] {
		return BlogPostImageResponse{}, fmt.Errorf("định dạng ảnh không hỗ trợ (%s): %w", contentType, ErrInvalidInput)
	}
	if size > maxImageBytes {
		return BlogPostImageResponse{}, fmt.Errorf("ảnh quá lớn (tối đa %dMB): %w", maxImageBytes/1024/1024, ErrInvalidInput)
	}
	if _, err := s.requireAuthor(ctx, postID, authorID); err != nil {
		return BlogPostImageResponse{}, err
	}
	count, err := s.repo.CountBlogPostImages(ctx, toPgUUID(postID))
	if err != nil {
		return BlogPostImageResponse{}, err
	}
	if count >= maxImagesPerPost {
		return BlogPostImageResponse{}, fmt.Errorf("mỗi bài tối đa %d ảnh: %w", maxImagesPerPost, ErrInvalidInput)
	}

	key := fmt.Sprintf("blog/%s/%s%s", postID, uuid.New(), ext)
	if err := s.r2.Upload(ctx, key, content, contentType); err != nil {
		return BlogPostImageResponse{}, fmt.Errorf("upload ảnh thất bại: %w", err)
	}
	img, err := s.repo.AddBlogPostImage(ctx, db.AddBlogPostImageParams{PostID: toPgUUID(postID), ImageKey: key, OrderIndex: count})
	if err != nil {
		return BlogPostImageResponse{}, err
	}
	return BlogPostImageResponse{ID: uuid.UUID(img.ID.Bytes), URL: s.presignImageURL(ctx, img.ImageKey)}, nil
}

// DeleteImage gỡ 1 ảnh khỏi bài viết của chính tác giả (xoá luôn object trên R2).
func (s *BlogService) DeleteImage(ctx context.Context, authorID, postID, imageID uuid.UUID) error {
	if _, err := s.requireAuthor(ctx, postID, authorID); err != nil {
		return err
	}
	key, err := s.repo.DeleteBlogPostImage(ctx, db.DeleteBlogPostImageParams{ID: toPgUUID(imageID), PostID: toPgUUID(postID)})
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}
	if s.r2 != nil {
		if err := s.r2.Delete(ctx, key); err != nil {
			log.Printf("❌ xoá ảnh blog key=%s: %v", key, err)
		}
	}
	return nil
}

// ===== Comment lồng nhau =====

// buildCommentTree dựng cây reply từ danh sách flat (sắp theo created_at) —
// gộp dữ liệu ở Go sau query, khớp pattern ListClassProgressByLanguage.
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

// ListComments trả về cây comment đầy đủ (gốc + reply lồng nhau) của 1 bài viết.
func (s *BlogService) ListComments(ctx context.Context, postID uuid.UUID) ([]BlogCommentNode, error) {
	rows, err := s.repo.ListBlogCommentsByPost(ctx, toPgUUID(postID))
	if err != nil {
		return nil, err
	}
	return buildCommentTree(rows), nil
}

// CreateComment thêm 1 comment (hoặc reply nếu có ParentCommentID) vào 1 bài viết.
func (s *BlogService) CreateComment(ctx context.Context, authorID, postID uuid.UUID, req BlogCommentRequest) (BlogCommentNode, error) {
	if req.Content == "" {
		return BlogCommentNode{}, ErrInvalidInput
	}
	if _, err := s.repo.GetBlogPostByID(ctx, toPgUUID(postID)); errors.Is(err, pgx.ErrNoRows) {
		return BlogCommentNode{}, ErrNotFound
	} else if err != nil {
		return BlogCommentNode{}, err
	}

	var parentArg pgtype.UUID
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
	}

	c, err := s.repo.CreateBlogComment(ctx, db.CreateBlogCommentParams{
		PostID: toPgUUID(postID), AuthorID: toPgUUID(authorID), ParentCommentID: parentArg, Content: req.Content,
	})
	if err != nil {
		return BlogCommentNode{}, err
	}
	// Lấy lại kèm thông tin tác giả (username/full_name/avatar_url) cho đồng bộ response.
	rows, err := s.repo.ListBlogCommentsByPost(ctx, toPgUUID(postID))
	if err != nil {
		return BlogCommentNode{}, err
	}
	for _, r := range rows {
		if uuid.UUID(r.ID.Bytes) == uuid.UUID(c.ID.Bytes) {
			return BlogCommentNode{
				ID: uuid.UUID(r.ID.Bytes), AuthorID: uuid.UUID(r.AuthorID.Bytes),
				AuthorUsername: r.Username, AuthorFullName: optionalText(r.FullName), AuthorAvatarURL: optionalText(r.AvatarUrl),
				Content: r.Content, IsHidden: r.IsHidden, CreatedAt: r.CreatedAt.Time, Replies: []BlogCommentNode{},
			}, nil
		}
	}
	return BlogCommentNode{}, ErrNotFound
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
	if _, err := s.requireCommentAuthor(ctx, commentID, authorID); err != nil {
		return err
	}
	_, err := s.repo.UpdateBlogComment(ctx, db.UpdateBlogCommentParams{ID: toPgUUID(commentID), Content: content})
	return err
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
