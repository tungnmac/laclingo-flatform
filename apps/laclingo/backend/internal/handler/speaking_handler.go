package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type SpeakingHandler struct {
	svc *service.SpeakingService
}

func NewSpeakingHandler(svc *service.SpeakingService) *SpeakingHandler {
	return &SpeakingHandler{svc: svc}
}

// RegisterRoutes gắn route luyện nói của học viên — cần đăng nhập
func (h *SpeakingHandler) RegisterRoutes(router fiber.Router) {
	api := router.Group("/speaking")
	api.Get("/topics", h.ListTopics)
	api.Get("/items", h.ListItems)
	api.Post("/items/:id/attempts", h.SubmitAttempt)
}

// RegisterAdminRoutes — PHẢI nằm sau RequireModule (module "speaking")
func (h *SpeakingHandler) RegisterAdminRoutes(router fiber.Router) {
	router.Get("/admin/speaking-topics", h.ListTopicsAdmin)
	router.Post("/admin/speaking-topics", h.UpsertTopic)
	router.Delete("/admin/speaking-topics", h.DeleteTopic)
	router.Get("/admin/speaking-items", h.ListItemsAdmin)
	router.Post("/admin/speaking-items", h.CreateItem)
	router.Put("/admin/speaking-items/:id", h.UpdateItem)
	router.Delete("/admin/speaking-items/:id", h.DeleteItem)
}

func speakingIDParam(c *fiber.Ctx) (uuid.UUID, error) {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return uuid.Nil, fiber.NewError(fiber.StatusBadRequest, "id không hợp lệ")
	}
	return id, nil
}

// ListTopics godoc
// @Summary      Chủ đề luyện nói (kèm tiến độ của tôi)
// @Tags         speaking
// @Produce      json
// @Security     BearerAuth
// @Param        language  query     string  false  "Mã ngôn ngữ (mặc định en)"  example(en)
// @Success      200       {array}   service.SpeakingTopic
// @Router       /speaking/topics [get]
func (h *SpeakingHandler) ListTopics(c *fiber.Ctx) error {
	out, err := h.svc.ListTopics(c.UserContext(), currentUserID(c), c.Query("language"))
	if err != nil {
		return err
	}
	return c.JSON(out)
}

// ListItems godoc
// @Summary      Các câu luyện nói của 1 chủ đề
// @Tags         speaking
// @Produce      json
// @Security     BearerAuth
// @Param        language  query     string  false  "Mã ngôn ngữ (mặc định en)"  example(en)
// @Param        topic     query     string  true   "Tên chủ đề"  example(Phỏng vấn CNTT)
// @Success      200       {array}   service.SpeakingItem
// @Router       /speaking/items [get]
func (h *SpeakingHandler) ListItems(c *fiber.Ctx) error {
	out, err := h.svc.ListItems(c.UserContext(), currentUserID(c), c.Query("language"), c.Query("topic"))
	if err != nil {
		return err
	}
	return c.JSON(out)
}

// SubmitAttempt godoc
// @Summary      Nộp 1 lần nói — chấm điểm theo transcript
// @Tags         speaking
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                          true  "ID câu luyện"  format(uuid)
// @Param        body  body      service.SpeakingAttemptRequest  true  "Transcript + thời lượng"
// @Success      200   {object}  service.SpeakingAttemptResult
// @Failure      404   {object}  ErrorResponse
// @Router       /speaking/items/{id}/attempts [post]
func (h *SpeakingHandler) SubmitAttempt(c *fiber.Ctx) error {
	id, err := speakingIDParam(c)
	if err != nil {
		return err
	}
	var req service.SpeakingAttemptRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	out, err := h.svc.SubmitAttempt(c.UserContext(), currentUserID(c), id, req)
	if err != nil {
		return err
	}
	return c.JSON(out)
}

// ListTopicsAdmin godoc
// @Summary      Chủ đề luyện nói (admin)
// @Tags         admin-speaking
// @Produce      json
// @Security     BearerAuth
// @Param        language_id  query     string  true  "Mã ngôn ngữ"  example(en)
// @Success      200          {array}   service.SpeakingTopicAdmin
// @Router       /admin/speaking-topics [get]
func (h *SpeakingHandler) ListTopicsAdmin(c *fiber.Ctx) error {
	out, err := h.svc.ListTopicsAdmin(c.UserContext(), c.Query("language_id"))
	if err != nil {
		return err
	}
	return c.JSON(out)
}

// UpsertTopic godoc
// @Summary      Tạo/sửa chủ đề luyện nói (admin)
// @Tags         admin-speaking
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.SpeakingTopicRequest  true  "Chủ đề"
// @Success      200   {object}  service.SpeakingTopicRequest
// @Router       /admin/speaking-topics [post]
func (h *SpeakingHandler) UpsertTopic(c *fiber.Ctx) error {
	var req service.SpeakingTopicRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	out, err := h.svc.UpsertTopic(c.UserContext(), req)
	if err != nil {
		return err
	}
	return c.JSON(out)
}

type deleteSpeakingTopicRequest struct {
	LanguageID string `json:"language_id"`
	Name       string `json:"name"`
}

// DeleteTopic godoc
// @Summary      Xoá chủ đề luyện nói và mọi câu luyện của nó (admin)
// @Tags         admin-speaking
// @Accept       json
// @Security     BearerAuth
// @Param        body  body  deleteSpeakingTopicRequest  true  "language_id + name"
// @Success      204
// @Router       /admin/speaking-topics [delete]
func (h *SpeakingHandler) DeleteTopic(c *fiber.Ctx) error {
	var req deleteSpeakingTopicRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	if err := h.svc.DeleteTopic(c.UserContext(), req.LanguageID, req.Name); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// ListItemsAdmin godoc
// @Summary      Câu luyện nói (admin, phân trang)
// @Tags         admin-speaking
// @Produce      json
// @Security     BearerAuth
// @Param        language_id  query     string  true   "Mã ngôn ngữ"  example(en)
// @Param        topic        query     string  false  "Lọc theo chủ đề"
// @Param        q            query     string  false  "Tìm theo nội dung"
// @Param        page         query     int     false  "Trang (từ 1)"
// @Param        page_size    query     int     false  "Số dòng/trang"
// @Success      200          {object}  service.PageResult[service.SpeakingItemAdmin]
// @Router       /admin/speaking-items [get]
func (h *SpeakingHandler) ListItemsAdmin(c *fiber.Ctx) error {
	page, pageSize := pageParams(c)
	out, err := h.svc.ListItemsAdmin(c.UserContext(), c.Query("language_id"), c.Query("topic"), c.Query("q"), page, pageSize)
	if err != nil {
		return err
	}
	return c.JSON(out)
}

// CreateItem godoc
// @Summary      Thêm câu luyện nói (admin)
// @Tags         admin-speaking
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.SpeakingItemRequest  true  "Câu luyện"
// @Success      201   {object}  service.SpeakingItemAdmin
// @Failure      400   {object}  ErrorResponse
// @Router       /admin/speaking-items [post]
func (h *SpeakingHandler) CreateItem(c *fiber.Ctx) error {
	var req service.SpeakingItemRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	out, err := h.svc.CreateItem(c.UserContext(), req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(out)
}

// UpdateItem godoc
// @Summary      Sửa câu luyện nói (admin)
// @Tags         admin-speaking
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                       true  "ID câu luyện"  format(uuid)
// @Param        body  body      service.SpeakingItemRequest  true  "Câu luyện"
// @Success      200   {object}  service.SpeakingItemAdmin
// @Router       /admin/speaking-items/{id} [put]
func (h *SpeakingHandler) UpdateItem(c *fiber.Ctx) error {
	id, err := speakingIDParam(c)
	if err != nil {
		return err
	}
	var req service.SpeakingItemRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	out, err := h.svc.UpdateItem(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return c.JSON(out)
}

// DeleteItem godoc
// @Summary      Xoá câu luyện nói (admin)
// @Tags         admin-speaking
// @Security     BearerAuth
// @Param        id  path  string  true  "ID câu luyện"  format(uuid)
// @Success      204
// @Router       /admin/speaking-items/{id} [delete]
func (h *SpeakingHandler) DeleteItem(c *fiber.Ctx) error {
	id, err := speakingIDParam(c)
	if err != nil {
		return err
	}
	if err := h.svc.DeleteItem(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}
