package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type MissionHandler struct {
	svc *service.MissionService
}

func NewMissionHandler(svc *service.MissionService) *MissionHandler {
	return &MissionHandler{svc: svc}
}

// RegisterRoutes gắn route learner-facing (cần đăng nhập, không cần admin).
func (h *MissionHandler) RegisterRoutes(router fiber.Router) {
	router.Get("/missions", h.ListMyMissions)
}

// RegisterAdminRoutes gắn route quản lý nhiệm vụ — PHẢI nằm sau RequireModule
// trong chain (đăng ký ở router.go, không tự chặn ở đây).
func (h *MissionHandler) RegisterAdminRoutes(router fiber.Router) {
	api := router.Group("/admin/missions")
	api.Post("", h.Create)
	api.Get("", h.ListAll)
	api.Put("/:id", h.Update)
	api.Delete("/:id", h.Deactivate)
}

// ListMyMissions godoc
// @Summary      Nhiệm vụ của tôi
// @Description  Danh sách nhiệm vụ đang active kèm tiến độ của user hiện tại trong kỳ hiện tại.
// @Tags         missions
// @Produce      json
// @Security     BearerAuth
// @Success      200  {array}   service.MyMissionResponse
// @Router       /missions [get]
func (h *MissionHandler) ListMyMissions(c *fiber.Ctx) error {
	results, err := h.svc.ListMyMissions(c.UserContext(), currentUserID(c))
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// Create godoc
// @Summary      Tạo nhiệm vụ mới (admin)
// @Tags         admin-missions
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.MissionRequest  true  "Thông tin nhiệm vụ"
// @Success      201   {object}  service.MissionResponse
// @Failure      400   {object}  ErrorResponse
// @Failure      403   {object}  ErrorResponse
// @Router       /admin/missions [post]
func (h *MissionHandler) Create(c *fiber.Ctx) error {
	var req service.MissionRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}

	result, err := h.svc.CreateMission(c.UserContext(), currentUserID(c), req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(result)
}

// ListAll godoc
// @Summary      Danh sách toàn bộ nhiệm vụ (admin, kể cả đã tắt)
// @Tags         admin-missions
// @Produce      json
// @Security     BearerAuth
// @Success      200  {array}   service.MissionResponse
// @Failure      403  {object}  ErrorResponse
// @Router       /admin/missions [get]
func (h *MissionHandler) ListAll(c *fiber.Ctx) error {
	results, err := h.svc.ListAllMissions(c.UserContext())
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// Update godoc
// @Summary      Sửa nhiệm vụ (admin)
// @Tags         admin-missions
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                   true  "Mission ID (UUID)"  format(uuid)
// @Param        body  body      service.MissionRequest  true  "Thông tin nhiệm vụ"
// @Success      200   {object}  service.MissionResponse
// @Failure      400   {object}  ErrorResponse
// @Failure      403   {object}  ErrorResponse
// @Failure      404   {object}  ErrorResponse
// @Router       /admin/missions/{id} [put]
func (h *MissionHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}

	var req service.MissionRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}

	result, err := h.svc.UpdateMission(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// Deactivate godoc
// @Summary      Tắt nhiệm vụ (admin, xoá mềm — giữ lịch sử tiến độ)
// @Tags         admin-missions
// @Security     BearerAuth
// @Param        id   path  string  true  "Mission ID (UUID)"  format(uuid)
// @Success      204
// @Failure      400  {object}  ErrorResponse
// @Failure      403  {object}  ErrorResponse
// @Router       /admin/missions/{id} [delete]
func (h *MissionHandler) Deactivate(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}

	if err := h.svc.DeactivateMission(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}
