package handler

import (
	"path/filepath"
	"strings"

	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type BlogHandler struct {
	svc *service.BlogService
}

func NewBlogHandler(svc *service.BlogService) *BlogHandler {
	return &BlogHandler{svc: svc}
}

// RegisterRoutes gắn route tự-phục-vụ — cần đăng nhập (mọi màn hình trong app
// đều sau dashboard login, không có bản "công khai" riêng).
func (h *BlogHandler) RegisterRoutes(router fiber.Router) {
	router.Get("/blog/posts", h.List)
	router.Post("/blog/posts", h.Create)
	router.Get("/blog/posts/:id", h.GetDetail)
	router.Put("/blog/posts/:id", h.Update)
	router.Delete("/blog/posts/:id", h.Delete)

	router.Post("/blog/posts/:id/images", h.UploadImage)
	router.Delete("/blog/posts/:id/images/:imageId", h.DeleteImage)

	router.Put("/blog/posts/:id/star", h.SetStar)
	router.Delete("/blog/posts/:id/star", h.UnsetStar)
	router.Put("/blog/posts/:id/marker", h.SetMarker)
	router.Delete("/blog/posts/:id/marker", h.UnsetMarker)
	router.Put("/blog/posts/:id/like", h.SetLike)
	router.Delete("/blog/posts/:id/like", h.UnsetLike)
	router.Put("/blog/posts/:id/dislike", h.SetDislike)
	router.Delete("/blog/posts/:id/dislike", h.UnsetDislike)

	router.Get("/blog/posts/:id/comments", h.ListComments)
	router.Post("/blog/posts/:id/comments", h.CreateComment)
	router.Put("/blog/comments/:id", h.UpdateComment)
	router.Delete("/blog/comments/:id", h.DeleteComment)
}

// RegisterAdminRoutes gắn route hậu kiểm — PHẢI nằm sau RequireModule trong
// chain (đăng ký ở router.go, không tự chặn ở đây).
func (h *BlogHandler) RegisterAdminRoutes(router fiber.Router) {
	api := router.Group("/admin/blog")
	api.Get("/posts", h.ListAdmin)
	api.Put("/posts/:id/hide", h.HidePost)
	api.Put("/posts/:id/unhide", h.UnhidePost)
	api.Delete("/posts/:id", h.AdminDeletePost)
	api.Put("/comments/:id/hide", h.HideComment)
	api.Put("/comments/:id/unhide", h.UnhideComment)
	api.Delete("/comments/:id", h.AdminDeleteComment)
}

func parseUUIDParam(c *fiber.Ctx, name string) (uuid.UUID, error) {
	id, err := uuid.Parse(c.Params(name))
	if err != nil {
		return uuid.UUID{}, fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	return id, nil
}

// List godoc
// @Summary      Danh sách bài viết (phân trang, lọc ngôn ngữ/tag/tác giả)
// @Tags         blog
// @Produce      json
// @Security     BearerAuth
// @Param        language_id  query     string  false  "Language ID"
// @Param        tag          query     string  false  "Lọc theo tag"
// @Param        mine         query     bool    false  "Chỉ bài của tôi"
// @Param        page         query     int     false  "Trang"
// @Param        page_size    query     int     false  "Số dòng/trang"
// @Success      200  {object}  service.PageResult[service.BlogPostSummary]
// @Router       /blog/posts [get]
func (h *BlogHandler) List(c *fiber.Ctx) error {
	userID := currentUserID(c)
	var authorID *uuid.UUID
	if c.QueryBool("mine") {
		authorID = &userID
	}
	page, pageSize := pageParams(c)
	result, err := h.svc.List(c.UserContext(), userID, c.Query("language_id"), c.Query("tag"), authorID, page, pageSize)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// Create godoc
// @Summary      Đăng bài viết mới (hiện công khai ngay, admin hậu kiểm)
// @Tags         blog
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.BlogPostRequest  true  "Nội dung bài viết"
// @Success      201   {object}  service.BlogPostDetail
// @Failure      400   {object}  ErrorResponse
// @Router       /blog/posts [post]
func (h *BlogHandler) Create(c *fiber.Ctx) error {
	var req service.BlogPostRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.Create(c.UserContext(), currentUserID(c), req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(result)
}

// GetDetail godoc
// @Summary      Chi tiết 1 bài viết (tăng view_count 1 lần mỗi lượt gọi)
// @Tags         blog
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "Post ID"  format(uuid)
// @Success      200  {object}  service.BlogPostDetail
// @Failure      404  {object}  ErrorResponse
// @Router       /blog/posts/{id} [get]
func (h *BlogHandler) GetDetail(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	result, err := h.svc.GetDetail(c.UserContext(), currentUserID(c), id)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// Update godoc
// @Summary      Sửa bài viết (chỉ tác giả)
// @Tags         blog
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                   true  "Post ID"  format(uuid)
// @Param        body  body      service.BlogPostRequest  true  "Nội dung bài viết"
// @Success      200   {object}  service.BlogPostDetail
// @Failure      403   {object}  ErrorResponse
// @Failure      404   {object}  ErrorResponse
// @Router       /blog/posts/{id} [put]
func (h *BlogHandler) Update(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	var req service.BlogPostRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.Update(c.UserContext(), currentUserID(c), id, req)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// Delete godoc
// @Summary      Xoá bài viết của chính mình (chỉ tác giả)
// @Tags         blog
// @Security     BearerAuth
// @Param        id   path  string  true  "Post ID"  format(uuid)
// @Success      204
// @Failure      403  {object}  ErrorResponse
// @Router       /blog/posts/{id} [delete]
func (h *BlogHandler) Delete(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	if err := h.svc.Delete(c.UserContext(), currentUserID(c), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// UploadImage godoc
// @Summary      Đính 1 ảnh vào bài viết của chính mình (tối đa 6 ảnh/bài)
// @Description  multipart/form-data, field "image".
// @Tags         blog
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        id     path      string  true  "Post ID"
// @Param        image  formData  file    true  "Ảnh (jpeg/png/webp/gif, tối đa 5MB)"
// @Success      201    {object}  service.BlogPostImageResponse
// @Failure      400    {object}  ErrorResponse
// @Router       /blog/posts/{id}/images [post]
func (h *BlogHandler) UploadImage(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	fileHeader, err := c.FormFile("image")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "thiếu file ảnh (field \"image\")")
	}
	file, err := fileHeader.Open()
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "không đọc được file ảnh")
	}
	defer file.Close()

	contentType := fileHeader.Header.Get("Content-Type")
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	result, err := h.svc.UploadImage(c.UserContext(), currentUserID(c), id, file, fileHeader.Size, contentType, ext)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(result)
}

// DeleteImage godoc
// @Summary      Gỡ 1 ảnh khỏi bài viết của chính mình
// @Tags         blog
// @Security     BearerAuth
// @Param        id       path  string  true  "Post ID"   format(uuid)
// @Param        imageId  path  string  true  "Image ID"  format(uuid)
// @Success      204
// @Router       /blog/posts/{id}/images/{imageId} [delete]
func (h *BlogHandler) DeleteImage(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	imageID, err := parseUUIDParam(c, "imageId")
	if err != nil {
		return err
	}
	if err := h.svc.DeleteImage(c.UserContext(), currentUserID(c), id, imageID); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *BlogHandler) runCounter(c *fiber.Ctx, on bool, set func(userID, postID uuid.UUID, on bool) (service.BlogToggleResponse, error)) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	result, err := set(currentUserID(c), id, on)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// SetStar/UnsetStar godoc
// @Summary      Bật/tắt đánh dấu nổi bật 1 bài viết
// @Tags         blog
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "Post ID"  format(uuid)
// @Success      200  {object}  service.BlogToggleResponse
// @Router       /blog/posts/{id}/star [put]
// @Router       /blog/posts/{id}/star [delete]
func (h *BlogHandler) SetStar(c *fiber.Ctx) error {
	return h.runCounter(c, true, func(u, p uuid.UUID, on bool) (service.BlogToggleResponse, error) {
		return h.svc.SetStar(c.UserContext(), u, p, on)
	})
}
func (h *BlogHandler) UnsetStar(c *fiber.Ctx) error {
	return h.runCounter(c, false, func(u, p uuid.UUID, on bool) (service.BlogToggleResponse, error) {
		return h.svc.SetStar(c.UserContext(), u, p, on)
	})
}

// SetMarker/UnsetMarker — bookmark lưu đọc sau, độc lập với star/like/dislike.
// @Router       /blog/posts/{id}/marker [put]
// @Router       /blog/posts/{id}/marker [delete]
func (h *BlogHandler) SetMarker(c *fiber.Ctx) error {
	return h.runCounter(c, true, func(u, p uuid.UUID, on bool) (service.BlogToggleResponse, error) {
		return h.svc.SetMarker(c.UserContext(), u, p, on)
	})
}
func (h *BlogHandler) UnsetMarker(c *fiber.Ctx) error {
	return h.runCounter(c, false, func(u, p uuid.UUID, on bool) (service.BlogToggleResponse, error) {
		return h.svc.SetMarker(c.UserContext(), u, p, on)
	})
}

// SetLike/UnsetLike — bật like tự tắt dislike (xem BlogService.SetLike).
// @Router       /blog/posts/{id}/like [put]
// @Router       /blog/posts/{id}/like [delete]
func (h *BlogHandler) SetLike(c *fiber.Ctx) error {
	return h.runCounter(c, true, func(u, p uuid.UUID, on bool) (service.BlogToggleResponse, error) {
		return h.svc.SetLike(c.UserContext(), u, p, on)
	})
}
func (h *BlogHandler) UnsetLike(c *fiber.Ctx) error {
	return h.runCounter(c, false, func(u, p uuid.UUID, on bool) (service.BlogToggleResponse, error) {
		return h.svc.SetLike(c.UserContext(), u, p, on)
	})
}

// SetDislike/UnsetDislike — bật dislike tự tắt like.
// @Router       /blog/posts/{id}/dislike [put]
// @Router       /blog/posts/{id}/dislike [delete]
func (h *BlogHandler) SetDislike(c *fiber.Ctx) error {
	return h.runCounter(c, true, func(u, p uuid.UUID, on bool) (service.BlogToggleResponse, error) {
		return h.svc.SetDislike(c.UserContext(), u, p, on)
	})
}
func (h *BlogHandler) UnsetDislike(c *fiber.Ctx) error {
	return h.runCounter(c, false, func(u, p uuid.UUID, on bool) (service.BlogToggleResponse, error) {
		return h.svc.SetDislike(c.UserContext(), u, p, on)
	})
}

// ListComments godoc
// @Summary      Cây comment đầy đủ (gốc + reply lồng nhau) của 1 bài viết
// @Tags         blog
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "Post ID"  format(uuid)
// @Success      200  {array}   service.BlogCommentNode
// @Router       /blog/posts/{id}/comments [get]
func (h *BlogHandler) ListComments(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	result, err := h.svc.ListComments(c.UserContext(), id)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// CreateComment godoc
// @Summary      Thêm comment (hoặc reply nếu có parent_comment_id)
// @Tags         blog
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                      true  "Post ID"  format(uuid)
// @Param        body  body      service.BlogCommentRequest  true  "Nội dung comment"
// @Success      201   {object}  service.BlogCommentNode
// @Failure      400   {object}  ErrorResponse
// @Router       /blog/posts/{id}/comments [post]
func (h *BlogHandler) CreateComment(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	var req service.BlogCommentRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.CreateComment(c.UserContext(), currentUserID(c), id, req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(result)
}

type updateCommentRequest struct {
	Content string `json:"content"`
}

// UpdateComment godoc
// @Summary      Sửa nội dung comment của chính mình
// @Tags         blog
// @Accept       json
// @Security     BearerAuth
// @Param        id    path  string                 true  "Comment ID"  format(uuid)
// @Param        body  body  updateCommentRequest  true  "Nội dung mới"
// @Success      204
// @Failure      403  {object}  ErrorResponse
// @Router       /blog/comments/{id} [put]
func (h *BlogHandler) UpdateComment(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	var req updateCommentRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	if err := h.svc.UpdateComment(c.UserContext(), currentUserID(c), id, req.Content); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// DeleteComment godoc
// @Summary      Xoá comment của chính mình (cascade reply con)
// @Tags         blog
// @Security     BearerAuth
// @Param        id   path  string  true  "Comment ID"  format(uuid)
// @Success      204
// @Failure      403  {object}  ErrorResponse
// @Router       /blog/comments/{id} [delete]
func (h *BlogHandler) DeleteComment(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	if err := h.svc.DeleteComment(c.UserContext(), currentUserID(c), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// ===== Admin hậu kiểm =====

// ListAdmin godoc
// @Summary      Danh sách bài viết cho admin hậu kiểm (phân trang, filter chỉ bài đã ẩn)
// @Tags         admin-blog
// @Produce      json
// @Security     BearerAuth
// @Param        hidden_only  query     bool  false  "Chỉ bài đã ẩn"
// @Param        page         query     int   false  "Trang"
// @Param        page_size    query     int   false  "Số dòng/trang"
// @Success      200  {object}  service.PageResult[service.BlogPostAdminResponse]
// @Router       /admin/blog/posts [get]
func (h *BlogHandler) ListAdmin(c *fiber.Ctx) error {
	page, pageSize := pageParams(c)
	result, err := h.svc.ListAdmin(c.UserContext(), c.QueryBool("hidden_only"), page, pageSize)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// HidePost godoc
// @Summary      Ẩn 1 bài viết (admin hậu kiểm)
// @Tags         admin-blog
// @Security     BearerAuth
// @Param        id   path  string  true  "Post ID"  format(uuid)
// @Success      204
// @Router       /admin/blog/posts/{id}/hide [put]
func (h *BlogHandler) HidePost(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	if err := h.svc.HidePost(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// UnhidePost godoc
// @Summary      Bỏ ẩn 1 bài viết (admin hậu kiểm)
// @Tags         admin-blog
// @Security     BearerAuth
// @Param        id   path  string  true  "Post ID"  format(uuid)
// @Success      204
// @Router       /admin/blog/posts/{id}/unhide [put]
func (h *BlogHandler) UnhidePost(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	if err := h.svc.UnhidePost(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// AdminDeletePost godoc
// @Summary      Xoá cứng 1 bài viết bất kỳ (admin hậu kiểm)
// @Tags         admin-blog
// @Security     BearerAuth
// @Param        id   path  string  true  "Post ID"  format(uuid)
// @Success      204
// @Router       /admin/blog/posts/{id} [delete]
func (h *BlogHandler) AdminDeletePost(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	if err := h.svc.AdminDeletePost(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// HideComment godoc
// @Summary      Ẩn 1 comment (admin hậu kiểm)
// @Tags         admin-blog
// @Security     BearerAuth
// @Param        id   path  string  true  "Comment ID"  format(uuid)
// @Success      204
// @Router       /admin/blog/comments/{id}/hide [put]
func (h *BlogHandler) HideComment(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	if err := h.svc.HideComment(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// UnhideComment godoc
// @Summary      Bỏ ẩn 1 comment (admin hậu kiểm)
// @Tags         admin-blog
// @Security     BearerAuth
// @Param        id   path  string  true  "Comment ID"  format(uuid)
// @Success      204
// @Router       /admin/blog/comments/{id}/unhide [put]
func (h *BlogHandler) UnhideComment(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	if err := h.svc.UnhideComment(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// AdminDeleteComment godoc
// @Summary      Xoá cứng 1 comment bất kỳ (admin hậu kiểm, cascade reply con)
// @Tags         admin-blog
// @Security     BearerAuth
// @Param        id   path  string  true  "Comment ID"  format(uuid)
// @Success      204
// @Router       /admin/blog/comments/{id} [delete]
func (h *BlogHandler) AdminDeleteComment(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	if err := h.svc.AdminDeleteComment(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}
