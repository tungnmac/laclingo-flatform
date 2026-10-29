package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

// AppVersionHandler — phiên bản app iOS/Android: app hỏi lúc mở (công khai), admin module "app_versions" chỉnh
type AppVersionHandler struct {
	svc *service.AppVersionService
}

func NewAppVersionHandler(svc *service.AppVersionService) *AppVersionHandler {
	return &AppVersionHandler{svc: svc}
}

// RegisterPublicRoutes — không cần đăng nhập (app kiểm tra trước cả màn đăng nhập)
func (h *AppVersionHandler) RegisterPublicRoutes(router fiber.Router) {
	router.Get("/app/version", h.Get)
}

// RegisterAdminRoutes — PHẢI nằm sau RequireModule (prefix /admin/app-versions → module "app_versions")
func (h *AppVersionHandler) RegisterAdminRoutes(router fiber.Router) {
	api := router.Group("/admin/app-versions")
	api.Get("", h.List)
	api.Put("/:platform", h.Update)
}

// Get godoc
// @Summary      Phiên bản app tối thiểu / mới nhất của 1 nền tảng
// @Description  App so với phiên bản đang cài: dưới min_version → bắt buộc cập nhật; dưới latest_version → nhắc cập nhật.
// @Tags         app
// @Produce      json
// @Param        platform  query     string  true  "ios | android"
// @Success      200       {object}  service.AppVersionInfo
// @Failure      400       {object}  ErrorResponse
// @Router       /app/version [get]
func (h *AppVersionHandler) Get(c *fiber.Ctx) error {
	res, err := h.svc.Get(c.UserContext(), c.Query("platform"))
	if err != nil {
		return err
	}
	// Cache ngắn — admin sửa nhầm phiên bản tối thiểu thì gỡ được nhanh
	c.Set(fiber.HeaderCacheControl, "public, max-age=60")
	return c.JSON(res)
}

// List godoc
// @Summary      Cấu hình phiên bản app iOS + Android (admin)
// @Tags         admin-app
// @Produce      json
// @Security     BearerAuth
// @Success      200  {array}  service.AppVersionInfo
// @Router       /admin/app-versions [get]
func (h *AppVersionHandler) List(c *fiber.Ctx) error {
	res, err := h.svc.List(c.UserContext())
	if err != nil {
		return err
	}
	return c.JSON(res)
}

// Update godoc
// @Summary      Đặt phiên bản tối thiểu / mới nhất + link store (admin)
// @Tags         admin-app
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        platform  path      string                     true  "ios | android"
// @Param        body      body      service.AppVersionRequest  true  "Phiên bản"
// @Success      200       {object}  service.AppVersionInfo
// @Failure      400       {object}  ErrorResponse
// @Router       /admin/app-versions/{platform} [put]
func (h *AppVersionHandler) Update(c *fiber.Ctx) error {
	var req service.AppVersionRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	res, err := h.svc.Update(c.UserContext(), currentUserID(c), c.Params("platform"), req)
	if err != nil {
		return err
	}
	return c.JSON(res)
}
