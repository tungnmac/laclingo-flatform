package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

// ModerationHandler — báo cáo nội dung vi phạm, chặn người dùng (học viên) + hàng chờ báo cáo (admin module "blog")
type ModerationHandler struct {
	svc *service.ModerationService
}

func NewModerationHandler(svc *service.ModerationService) *ModerationHandler {
	return &ModerationHandler{svc: svc}
}

func (h *ModerationHandler) RegisterRoutes(router fiber.Router) {
	router.Post("/reports", h.Report)
	router.Get("/users/me/blocks", h.ListBlocked)
	router.Put("/users/:id/block", h.Block)
	router.Delete("/users/:id/block", h.Unblock)
}

// RegisterAdminRoutes — PHẢI nằm sau RequireModule (prefix /admin/blog → module "blog", xem router.go)
func (h *ModerationHandler) RegisterAdminRoutes(router fiber.Router) {
	api := router.Group("/admin/blog/reports")
	api.Get("", h.ListReports)
	api.Put("/:type/:id", h.Resolve)
}

// Report godoc
// @Summary      Báo cáo bài viết / bình luận vi phạm
// @Description  Mỗi người 1 báo cáo đang mở cho 1 nội dung; đủ 3 người báo cáo thì nội dung tự ẩn chờ admin xem xét.
// @Tags         moderation
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.ReportRequest  true  "Nội dung + lý do"
// @Success      201   {object}  service.ReportResult
// @Failure      400   {object}  ErrorResponse
// @Failure      404   {object}  ErrorResponse
// @Failure      409   {object}  ErrorResponse
// @Router       /reports [post]
func (h *ModerationHandler) Report(c *fiber.Ctx) error {
	var req service.ReportRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	res, err := h.svc.Report(c.UserContext(), currentUserID(c), req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(res)
}

// ListBlocked godoc
// @Summary      Danh sách người tôi đã chặn
// @Tags         moderation
// @Produce      json
// @Security     BearerAuth
// @Success      200  {array}  service.BlockedUser
// @Router       /users/me/blocks [get]
func (h *ModerationHandler) ListBlocked(c *fiber.Ctx) error {
	res, err := h.svc.ListBlocked(c.UserContext(), currentUserID(c))
	if err != nil {
		return err
	}
	return c.JSON(res)
}

// Block godoc
// @Summary      Chặn 1 người dùng
// @Description  Không còn thấy bài viết / bình luận của họ, không nhận thông báo do họ gây ra.
// @Tags         moderation
// @Security     BearerAuth
// @Param        id   path  string  true  "User ID"
// @Success      204
// @Router       /users/{id}/block [put]
func (h *ModerationHandler) Block(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	if err := h.svc.Block(c.UserContext(), currentUserID(c), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// Unblock godoc
// @Summary      Bỏ chặn 1 người dùng
// @Tags         moderation
// @Security     BearerAuth
// @Param        id   path  string  true  "User ID"
// @Success      204
// @Router       /users/{id}/block [delete]
func (h *ModerationHandler) Unblock(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	if err := h.svc.Unblock(c.UserContext(), currentUserID(c), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// ListReports godoc
// @Summary      Hàng chờ báo cáo nội dung (admin)
// @Description  Gom báo cáo theo nội dung, mới nhất trước.
// @Tags         admin-blog
// @Produce      json
// @Security     BearerAuth
// @Param        status  query     string  false  "OPEN (mặc định) | RESOLVED | DISMISSED"
// @Param        page    query     int     false  "Trang (mặc định 1)"
// @Success      200     {object}  service.PageResult[service.ReportedContent]
// @Router       /admin/blog/reports [get]
func (h *ModerationHandler) ListReports(c *fiber.Ctx) error {
	page, pageSize := pageParams(c)
	res, err := h.svc.ListReports(c.UserContext(), c.Query("status"), page, pageSize)
	if err != nil {
		return err
	}
	return c.JSON(res)
}

// Resolve godoc
// @Summary      Xử lý báo cáo 1 nội dung (admin)
// @Description  hide = vi phạm, ẩn nội dung; dismiss = không vi phạm, bỏ qua (bỏ ẩn nếu đã tự ẩn).
// @Tags         admin-blog
// @Accept       json
// @Security     BearerAuth
// @Param        type  path  string                  true  "post | comment"
// @Param        id    path  string                  true  "ID nội dung"
// @Param        body  body  service.ResolveRequest  true  "Thao tác"
// @Success      204
// @Router       /admin/blog/reports/{type}/{id} [put]
func (h *ModerationHandler) Resolve(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	var req service.ResolveRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	if err := h.svc.Resolve(c.UserContext(), currentUserID(c), c.Params("type"), id, req); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}
