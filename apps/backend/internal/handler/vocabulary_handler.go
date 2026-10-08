package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type VocabularyHandler struct {
	svc *service.VocabularyService
}

func NewVocabularyHandler(svc *service.VocabularyService) *VocabularyHandler {
	return &VocabularyHandler{svc: svc}
}

func (h *VocabularyHandler) RegisterRoutes(router fiber.Router) {
	api := router.Group("/vocab")
	api.Get("/topics", h.ListTopics)
	api.Get("/words", h.ListWords)
	api.Get("/favorites", h.ListFavorites)
	api.Put("/:id/like", h.Like)
	api.Delete("/:id/like", h.Unlike)
	api.Put("/:id/favorite", h.Favorite)
	api.Delete("/:id/favorite", h.Unfavorite)
}

// RegisterAdminRoutes gắn route quản lý nội dung từ vựng — PHẢI nằm sau
// RequireAdmin trong chain (đăng ký ở router.go).
func (h *VocabularyHandler) RegisterAdminRoutes(router fiber.Router) {
	vocab := router.Group("/admin/vocabularies")
	vocab.Post("", h.CreateVocabulary)
	vocab.Get("", h.ListVocabulariesAdmin)
	vocab.Put("/:id", h.UpdateVocabulary)
	vocab.Delete("/:id", h.DeleteVocabulary)
	vocab.Post("/bulk", h.BulkImportVocabularies)

	topics := router.Group("/admin/vocabulary-topics")
	topics.Post("", h.CreateOrUpdateTopic)
	topics.Get("", h.ListTopicsAdmin)
	topics.Delete("", h.DeleteTopic)
	topics.Post("/bulk", h.BulkImportTopics)
}

// CreateVocabulary godoc
// @Summary      Thêm từ vựng mới (admin)
// @Tags         admin-vocab
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.VocabularyRequest  true  "Thông tin từ vựng"
// @Success      201   {object}  service.VocabularyAdminResponse
// @Failure      409   {object}  ErrorResponse
// @Router       /admin/vocabularies [post]
func (h *VocabularyHandler) CreateVocabulary(c *fiber.Ctx) error {
	var req service.VocabularyRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.CreateVocabulary(c.UserContext(), req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(result)
}

// ListVocabulariesAdmin godoc
// @Summary      Danh sách từ vựng theo ngôn ngữ (admin)
// @Tags         admin-vocab
// @Produce      json
// @Security     BearerAuth
// @Param        language_id  query     string  true  "Language ID"
// @Success      200          {array}   service.VocabularyAdminResponse
// @Router       /admin/vocabularies [get]
func (h *VocabularyHandler) ListVocabulariesAdmin(c *fiber.Ctx) error {
	results, err := h.svc.ListVocabulariesAdmin(c.UserContext(), c.Query("language_id"))
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// UpdateVocabulary godoc
// @Summary      Sửa từ vựng (admin)
// @Tags         admin-vocab
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                      true  "Vocabulary ID"
// @Param        body  body      service.VocabularyRequest  true  "Thông tin từ vựng"
// @Success      200   {object}  service.VocabularyAdminResponse
// @Router       /admin/vocabularies/{id} [put]
func (h *VocabularyHandler) UpdateVocabulary(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	var req service.VocabularyRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.UpdateVocabulary(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// DeleteVocabulary godoc
// @Summary      Xoá từ vựng (admin)
// @Tags         admin-vocab
// @Security     BearerAuth
// @Param        id   path  string  true  "Vocabulary ID"
// @Success      204
// @Router       /admin/vocabularies/{id} [delete]
func (h *VocabularyHandler) DeleteVocabulary(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	if err := h.svc.DeleteVocabulary(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// BulkImportVocabularies godoc
// @Summary      Nhập hàng loạt từ vựng (admin)
// @Tags         admin-vocab
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      []service.VocabularyRequest  true  "Danh sách từ vựng"
// @Success      200   {array}   service.BulkImportResult
// @Router       /admin/vocabularies/bulk [post]
func (h *VocabularyHandler) BulkImportVocabularies(c *fiber.Ctx) error {
	var items []service.VocabularyRequest
	if err := c.BodyParser(&items); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	return c.JSON(h.svc.BulkImportVocabularies(c.UserContext(), items))
}

// CreateOrUpdateTopic godoc
// @Summary      Tạo/sửa chủ đề từ vựng (admin, upsert theo language_id+name)
// @Tags         admin-vocab
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.VocabularyTopicRequest  true  "Thông tin chủ đề"
// @Success      200   {object}  service.VocabularyTopicAdminResponse
// @Router       /admin/vocabulary-topics [post]
func (h *VocabularyHandler) CreateOrUpdateTopic(c *fiber.Ctx) error {
	var req service.VocabularyTopicRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.CreateOrUpdateTopic(c.UserContext(), req)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// ListTopicsAdmin godoc
// @Summary      Danh sách chủ đề từ vựng theo ngôn ngữ (admin)
// @Tags         admin-vocab
// @Produce      json
// @Security     BearerAuth
// @Param        language_id  query     string  true  "Language ID"
// @Success      200          {array}   service.VocabularyTopicAdminResponse
// @Router       /admin/vocabulary-topics [get]
func (h *VocabularyHandler) ListTopicsAdmin(c *fiber.Ctx) error {
	results, err := h.svc.ListTopicsAdmin(c.UserContext(), c.Query("language_id"))
	if err != nil {
		return err
	}
	return c.JSON(results)
}

type deleteVocabularyTopicRequest struct {
	LanguageID string `json:"language_id"`
	Name       string `json:"name"`
}

// DeleteTopic godoc
// @Summary      Xoá chủ đề từ vựng (admin, chỉ xoá metadata icon/thứ tự)
// @Tags         admin-vocab
// @Accept       json
// @Security     BearerAuth
// @Param        body  body  deleteVocabularyTopicRequest  true  "language_id + name"
// @Success      204
// @Router       /admin/vocabulary-topics [delete]
func (h *VocabularyHandler) DeleteTopic(c *fiber.Ctx) error {
	var req deleteVocabularyTopicRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	if err := h.svc.DeleteTopic(c.UserContext(), req.LanguageID, req.Name); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// BulkImportTopics godoc
// @Summary      Nhập hàng loạt chủ đề từ vựng (admin)
// @Tags         admin-vocab
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      []service.VocabularyTopicRequest  true  "Danh sách chủ đề"
// @Success      200   {array}   service.BulkImportResult
// @Router       /admin/vocabulary-topics/bulk [post]
func (h *VocabularyHandler) BulkImportTopics(c *fiber.Ctx) error {
	var items []service.VocabularyTopicRequest
	if err := c.BodyParser(&items); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	return c.JSON(h.svc.BulkImportTopics(c.UserContext(), items))
}

// ListTopics godoc
// @Summary      Chủ đề từ vựng
// @Description  Danh sách chủ đề của 1 ngôn ngữ kèm số từ user đã đưa vào ôn tập.
// @Tags         vocab
// @Produce      json
// @Security     BearerAuth
// @Param        language  query     string  false  "Mã ngôn ngữ (mặc định en)"  example(en)
// @Success      200       {array}   service.VocabularyTopic
// @Failure      401       {object}  ErrorResponse
// @Router       /vocab/topics [get]
func (h *VocabularyHandler) ListTopics(c *fiber.Ctx) error {
	results, err := h.svc.ListTopics(c.UserContext(), currentUserID(c), c.Query("language"))
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// ListWords godoc
// @Summary      Từ vựng theo chủ đề
// @Description  Topic truyền qua query vì tên chủ đề có dấu cách/ký tự đặc biệt.
// @Tags         vocab
// @Produce      json
// @Security     BearerAuth
// @Param        language  query     string  false  "Mã ngôn ngữ (mặc định en)"  example(en)
// @Param        topic     query     string  true   "Tên chủ đề"  example(Đồ ăn & Thức uống)
// @Success      200       {array}   service.VocabularyCard
// @Failure      400       {object}  ErrorResponse
// @Failure      401       {object}  ErrorResponse
// @Router       /vocab/words [get]
func (h *VocabularyHandler) ListWords(c *fiber.Ctx) error {
	results, err := h.svc.ListWordsByTopic(c.UserContext(), currentUserID(c), c.Query("language"), c.Query("topic"))
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// ListFavorites godoc
// @Summary      Từ vựng yêu thích
// @Tags         vocab
// @Produce      json
// @Security     BearerAuth
// @Param        language  query     string  false  "Chỉ lấy 1 ngôn ngữ (bỏ trống = tất cả)"  example(en)
// @Success      200       {array}   service.VocabularyCard
// @Failure      401       {object}  ErrorResponse
// @Router       /vocab/favorites [get]
func (h *VocabularyHandler) ListFavorites(c *fiber.Ctx) error {
	results, err := h.svc.ListFavorites(c.UserContext(), currentUserID(c), c.Query("language"))
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// Like godoc
// @Summary      Like từ vựng
// @Tags         vocab
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "Vocabulary ID"  format(uuid)
// @Success      200  {object}  service.LikeResponse
// @Failure      400  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Router       /vocab/{id}/like [put]
func (h *VocabularyHandler) Like(c *fiber.Ctx) error { return h.setLike(c, true) }

// Unlike godoc
// @Summary      Bỏ like từ vựng
// @Tags         vocab
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "Vocabulary ID"  format(uuid)
// @Success      200  {object}  service.LikeResponse
// @Failure      400  {object}  ErrorResponse
// @Router       /vocab/{id}/like [delete]
func (h *VocabularyHandler) Unlike(c *fiber.Ctx) error { return h.setLike(c, false) }

// Favorite godoc
// @Summary      Thêm từ vào yêu thích
// @Tags         vocab
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "Vocabulary ID"  format(uuid)
// @Success      200  {object}  service.FavoriteResponse
// @Failure      400  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Router       /vocab/{id}/favorite [put]
func (h *VocabularyHandler) Favorite(c *fiber.Ctx) error { return h.setFavorite(c, true) }

// Unfavorite godoc
// @Summary      Bỏ từ khỏi yêu thích
// @Tags         vocab
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "Vocabulary ID"  format(uuid)
// @Success      200  {object}  service.FavoriteResponse
// @Failure      400  {object}  ErrorResponse
// @Router       /vocab/{id}/favorite [delete]
func (h *VocabularyHandler) Unfavorite(c *fiber.Ctx) error { return h.setFavorite(c, false) }

func (h *VocabularyHandler) setLike(c *fiber.Ctx, liked bool) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "id không hợp lệ")
	}
	result, err := h.svc.SetLike(c.UserContext(), currentUserID(c), id, liked)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

func (h *VocabularyHandler) setFavorite(c *fiber.Ctx, favorited bool) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "id không hợp lệ")
	}
	result, err := h.svc.SetFavorite(c.UserContext(), currentUserID(c), id, favorited)
	if err != nil {
		return err
	}
	return c.JSON(result)
}
