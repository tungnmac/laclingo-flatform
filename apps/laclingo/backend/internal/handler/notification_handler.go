package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type NotificationHandler struct {
	svc *service.NotificationService
}

func NewNotificationHandler(svc *service.NotificationService) *NotificationHandler {
	return &NotificationHandler{svc: svc}
}

// RegisterRoutes gắn route chuông thông báo — cần đăng nhập, user chỉ thao tác thông báo của mình
func (h *NotificationHandler) RegisterRoutes(router fiber.Router) {
	api := router.Group("/notifications")
	api.Get("", h.List)
	api.Get("/unread-count", h.UnreadCount)
	api.Put("/read-all", h.MarkAllRead)
	api.Put("/:id/read", h.MarkRead)
	api.Delete("", h.Clear)
	api.Delete("/:id", h.Delete)
}

// RegisterAdminRoutes — thông báo chung, PHẢI nằm sau RequireModule (module "announcements")
func (h *NotificationHandler) RegisterAdminRoutes(router fiber.Router) {
	router.Get("/admin/announcements", h.ListAnnouncements)
	router.Post("/admin/announcements", h.CreateAnnouncement)
	router.Delete("/admin/announcements/:id", h.DeleteAnnouncement)
}

func notificationIDParam(c *fiber.Ctx) (uuid.UUID, error) {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return uuid.Nil, fiber.NewError(fiber.StatusBadRequest, "id không hợp lệ")
	}
	return id, nil
}

// List godoc
// @Summary      Thông báo của tôi (mới nhất trước)
// @Tags         notifications
// @Produce      json
// @Security     BearerAuth
// @Param        cursor  query     string  false  "next_cursor của trang trước"
// @Param        limit   query     int     false  "Số thông báo/trang (mặc định 20, tối đa 50)"
// @Success      200     {object}  service.NotificationPage
// @Router       /notifications [get]
func (h *NotificationHandler) List(c *fiber.Ctx) error {
	page, err := h.svc.List(c.UserContext(), currentUserID(c), c.Query("cursor"), int32(c.QueryInt("limit")))
	if err != nil {
		return err
	}
	return c.JSON(page)
}

type unreadCountResponse struct {
	Count int32 `json:"count"`
}

// UnreadCount godoc
// @Summary      Số thông báo chưa đọc
// @Tags         notifications
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  unreadCountResponse
// @Router       /notifications/unread-count [get]
func (h *NotificationHandler) UnreadCount(c *fiber.Ctx) error {
	n, err := h.svc.UnreadCount(c.UserContext(), currentUserID(c))
	if err != nil {
		return err
	}
	return c.JSON(unreadCountResponse{Count: n})
}

// MarkRead godoc
// @Summary      Đánh dấu 1 thông báo đã đọc
// @Tags         notifications
// @Security     BearerAuth
// @Param        id  path  string  true  "ID thông báo"  format(uuid)
// @Success      204
// @Failure      404  {object}  ErrorResponse
// @Router       /notifications/{id}/read [put]
func (h *NotificationHandler) MarkRead(c *fiber.Ctx) error {
	id, err := notificationIDParam(c)
	if err != nil {
		return err
	}
	if err := h.svc.MarkRead(c.UserContext(), currentUserID(c), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// MarkAllRead godoc
// @Summary      Đánh dấu tất cả đã đọc
// @Tags         notifications
// @Security     BearerAuth
// @Success      204
// @Router       /notifications/read-all [put]
func (h *NotificationHandler) MarkAllRead(c *fiber.Ctx) error {
	if err := h.svc.MarkAllRead(c.UserContext(), currentUserID(c)); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// Delete godoc
// @Summary      Xoá 1 thông báo
// @Tags         notifications
// @Security     BearerAuth
// @Param        id  path  string  true  "ID thông báo"  format(uuid)
// @Success      204
// @Failure      404  {object}  ErrorResponse
// @Router       /notifications/{id} [delete]
func (h *NotificationHandler) Delete(c *fiber.Ctx) error {
	id, err := notificationIDParam(c)
	if err != nil {
		return err
	}
	if err := h.svc.Delete(c.UserContext(), currentUserID(c), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// Clear godoc
// @Summary      Xoá tất cả thông báo của tôi
// @Tags         notifications
// @Security     BearerAuth
// @Success      204
// @Router       /notifications [delete]
func (h *NotificationHandler) Clear(c *fiber.Ctx) error {
	if err := h.svc.Clear(c.UserContext(), currentUserID(c)); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// ListAnnouncements godoc
// @Summary      Thông báo chung đã gửi (admin)
// @Tags         admin-announcements
// @Produce      json
// @Security     BearerAuth
// @Param        page       query     int  false  "Trang (từ 1)"
// @Param        page_size  query     int  false  "Số dòng/trang"
// @Success      200        {object}  service.PageResult[service.Announcement]
// @Router       /admin/announcements [get]
func (h *NotificationHandler) ListAnnouncements(c *fiber.Ctx) error {
	page, pageSize := pageParams(c)
	result, err := h.svc.ListAnnouncements(c.UserContext(), page, pageSize)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// CreateAnnouncement godoc
// @Summary      Gửi thông báo chung tới mọi học viên (admin)
// @Tags         admin-announcements
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.AnnouncementRequest  true  "Nội dung thông báo"
// @Success      201   {object}  service.Announcement
// @Failure      400   {object}  ErrorResponse
// @Router       /admin/announcements [post]
func (h *NotificationHandler) CreateAnnouncement(c *fiber.Ctx) error {
	var req service.AnnouncementRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.CreateAnnouncement(c.UserContext(), currentUserID(c), req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(result)
}

// DeleteAnnouncement godoc
// @Summary      Xoá thông báo chung — thu hồi khỏi chuông của mọi học viên (admin)
// @Tags         admin-announcements
// @Security     BearerAuth
// @Param        id  path  string  true  "ID thông báo chung"  format(uuid)
// @Success      204
// @Failure      404  {object}  ErrorResponse
// @Router       /admin/announcements/{id} [delete]
func (h *NotificationHandler) DeleteAnnouncement(c *fiber.Ctx) error {
	id, err := notificationIDParam(c)
	if err != nil {
		return err
	}
	if err := h.svc.DeleteAnnouncement(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}
