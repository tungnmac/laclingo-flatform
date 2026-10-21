package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

// DailyNoteHandler — Daily note (Nhật ký học) của CHÍNH học viên đang đăng nhập. Riêng tư: không có route admin.
type DailyNoteHandler struct {
	svc *service.DailyNoteService
}

func NewDailyNoteHandler(svc *service.DailyNoteService) *DailyNoteHandler {
	return &DailyNoteHandler{svc: svc}
}

func (h *DailyNoteHandler) RegisterRoutes(router fiber.Router) {
	api := router.Group("/daily-notes")
	api.Get("", h.Month)
	api.Get("/today", h.Today)
	api.Put("/today/journal", h.SaveJournal)
	api.Post("/today/tasks", h.CreateTask)
	api.Patch("/tasks/:id", h.UpdateTask)
	api.Delete("/tasks/:id", h.DeleteTask)
	api.Post("/tasks/:id/move", h.MoveTask)
	api.Post("/tasks/:id/carry-over", h.CarryOver)
	api.Post("/tasks/:id/items", h.AddTaskItem)
	api.Patch("/items/:id", h.UpdateTaskItem)
	api.Delete("/items/:id", h.DeleteTaskItem)
	api.Get("/:date", h.Day)
}

// Today godoc
// @Summary      Nhật ký học hôm nay (tạo nếu chưa có, kèm việc lặp lại)
// @Tags         daily-notes
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  service.DailyNoteResponse
// @Router       /daily-notes/today [get]
func (h *DailyNoteHandler) Today(c *fiber.Ctx) error {
	res, err := h.svc.Today(c.UserContext(), currentUserID(c))
	if err != nil {
		return err
	}
	return c.JSON(res)
}

// Day godoc
// @Summary      Nhật ký học của 1 ngày (ngày cũ chỉ xem)
// @Tags         daily-notes
// @Produce      json
// @Security     BearerAuth
// @Param        date  path      string  true  "YYYY-MM-DD"
// @Success      200   {object}  service.DailyNoteResponse
// @Failure      400   {object}  ErrorResponse
// @Router       /daily-notes/{date} [get]
func (h *DailyNoteHandler) Day(c *fiber.Ctx) error {
	res, err := h.svc.Day(c.UserContext(), currentUserID(c), c.Params("date"))
	if err != nil {
		return err
	}
	return c.JSON(res)
}

// Month godoc
// @Summary      Tổng kết từng ngày trong tháng (lịch)
// @Tags         daily-notes
// @Produce      json
// @Security     BearerAuth
// @Param        month  query     string  true  "YYYY-MM"
// @Success      200    {array}   service.DailyNoteDay
// @Router       /daily-notes [get]
func (h *DailyNoteHandler) Month(c *fiber.Ctx) error {
	res, err := h.svc.Month(c.UserContext(), currentUserID(c), c.Query("month"))
	if err != nil {
		return err
	}
	return c.JSON(res)
}

type dailyJournalRequest struct {
	Journal string `json:"journal"`
}

// SaveJournal godoc
// @Summary      Lưu ghi chú trong ngày (hôm nay)
// @Tags         daily-notes
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      handler.dailyJournalRequest  true  "Ghi chú"
// @Success      200   {object}  service.DailyNoteResponse
// @Router       /daily-notes/today/journal [put]
func (h *DailyNoteHandler) SaveJournal(c *fiber.Ctx) error {
	var req dailyJournalRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	res, err := h.svc.SaveJournal(c.UserContext(), currentUserID(c), req.Journal)
	if err != nil {
		return err
	}
	return c.JSON(res)
}

// CreateTask godoc
// @Summary      Thêm việc vào nhật ký hôm nay
// @Tags         daily-notes
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.DailyTaskCreateRequest  true  "Việc"
// @Success      201   {object}  service.DailyTask
// @Failure      400   {object}  ErrorResponse
// @Failure      409   {object}  ErrorResponse
// @Router       /daily-notes/today/tasks [post]
func (h *DailyNoteHandler) CreateTask(c *fiber.Ctx) error {
	var req service.DailyTaskCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	res, err := h.svc.CreateTask(c.UserContext(), currentUserID(c), req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(res)
}

// UpdateTask godoc
// @Summary      Sửa 1 việc hôm nay (tiến độ, tích xong, mục tiêu, ghi chú, lặp lại)
// @Tags         daily-notes
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                          true  "Task ID"  format(uuid)
// @Param        body  body      service.DailyTaskUpdateRequest  true  "Thay đổi"
// @Success      200   {object}  service.DailyTask
// @Failure      404   {object}  ErrorResponse
// @Failure      409   {object}  ErrorResponse
// @Router       /daily-notes/tasks/{id} [patch]
func (h *DailyNoteHandler) UpdateTask(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	var req service.DailyTaskUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	res, err := h.svc.UpdateTask(c.UserContext(), currentUserID(c), id, req)
	if err != nil {
		return err
	}
	return c.JSON(res)
}

// DeleteTask godoc
// @Summary      Xoá 1 việc hôm nay
// @Tags         daily-notes
// @Security     BearerAuth
// @Param        id  path  string  true  "Task ID"  format(uuid)
// @Success      204
// @Failure      404  {object}  ErrorResponse
// @Router       /daily-notes/tasks/{id} [delete]
func (h *DailyNoteHandler) DeleteTask(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	if err := h.svc.DeleteTask(c.UserContext(), currentUserID(c), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

type dailyMoveRequest struct {
	Direction string `json:"direction" enums:"up,down"`
}

// MoveTask godoc
// @Summary      Đổi thứ tự 1 việc hôm nay
// @Tags         daily-notes
// @Accept       json
// @Security     BearerAuth
// @Param        id    path  string                    true  "Task ID"  format(uuid)
// @Param        body  body  handler.dailyMoveRequest  true  "Hướng"
// @Success      204
// @Router       /daily-notes/tasks/{id}/move [post]
func (h *DailyNoteHandler) MoveTask(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	var req dailyMoveRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	if err := h.svc.MoveTask(c.UserContext(), currentUserID(c), id, req.Direction); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// CarryOver godoc
// @Summary      Chuyển 1 việc dở của ngày trước sang hôm nay
// @Tags         daily-notes
// @Produce      json
// @Security     BearerAuth
// @Param        id  path      string  true  "Task ID"  format(uuid)
// @Success      201 {object}  service.DailyTask
// @Failure      404 {object}  ErrorResponse
// @Failure      409 {object}  ErrorResponse
// @Router       /daily-notes/tasks/{id}/carry-over [post]
func (h *DailyNoteHandler) CarryOver(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	res, err := h.svc.CarryOver(c.UserContext(), currentUserID(c), id)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(res)
}

// AddTaskItem godoc
// @Summary      Thêm 1 việc con vào checklist của việc hôm nay
// @Tags         daily-notes
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                        true  "Task ID"  format(uuid)
// @Param        body  body      service.DailyTaskItemRequest  true  "Việc con (title)"
// @Success      201   {object}  service.DailyTask  "Việc cha kèm checklist"
// @Failure      400   {object}  ErrorResponse
// @Failure      404   {object}  ErrorResponse
// @Failure      409   {object}  ErrorResponse
// @Router       /daily-notes/tasks/{id}/items [post]
func (h *DailyNoteHandler) AddTaskItem(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	var req service.DailyTaskItemRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	res, err := h.svc.AddTaskItem(c.UserContext(), currentUserID(c), id, req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(res)
}

// UpdateTaskItem godoc
// @Summary      Đổi tên / tích xong 1 việc con hôm nay
// @Tags         daily-notes
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                        true  "Item ID"  format(uuid)
// @Param        body  body      service.DailyTaskItemRequest  true  "Thay đổi"
// @Success      200   {object}  service.DailyTask  "Việc cha kèm checklist"
// @Failure      404   {object}  ErrorResponse
// @Failure      409   {object}  ErrorResponse
// @Router       /daily-notes/items/{id} [patch]
func (h *DailyNoteHandler) UpdateTaskItem(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	var req service.DailyTaskItemRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	res, err := h.svc.UpdateTaskItem(c.UserContext(), currentUserID(c), id, req)
	if err != nil {
		return err
	}
	return c.JSON(res)
}

// DeleteTaskItem godoc
// @Summary      Xoá 1 việc con hôm nay
// @Tags         daily-notes
// @Produce      json
// @Security     BearerAuth
// @Param        id  path      string  true  "Item ID"  format(uuid)
// @Success      200 {object}  service.DailyTask  "Việc cha kèm checklist"
// @Failure      404 {object}  ErrorResponse
// @Router       /daily-notes/items/{id} [delete]
func (h *DailyNoteHandler) DeleteTaskItem(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	res, err := h.svc.DeleteTaskItem(c.UserContext(), currentUserID(c), id)
	if err != nil {
		return err
	}
	return c.JSON(res)
}
