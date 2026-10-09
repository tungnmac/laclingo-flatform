package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ClassHandler struct {
	svc *service.ClassService
}

func NewClassHandler(svc *service.ClassService) *ClassHandler {
	return &ClassHandler{svc: svc}
}

// RegisterRoutes gắn route learner-facing — cần đăng nhập vì danh sách/chi
// tiết lớp kèm luôn ghi danh + % tiến độ của user hiện tại (không có bản
// "công khai" riêng, nên gọi ở đây thay vì tách route public).
func (h *ClassHandler) RegisterRoutes(router fiber.Router) {
	router.Get("/languages/:id/classes", h.ListByLanguage)
	router.Get("/classes/:id", h.GetDetail)
	router.Post("/classes/:id/enroll", h.Enroll)
}

// RegisterAdminRoutes gắn route quản lý lớp — PHẢI nằm sau RequireModule
// trong chain (đăng ký ở router.go, không tự chặn ở đây).
func (h *ClassHandler) RegisterAdminRoutes(router fiber.Router) {
	api := router.Group("/admin/classes")
	api.Post("", h.Create)
	api.Get("", h.ListAdmin)
	api.Put("/:id", h.Update)
	api.Delete("/:id", h.Delete)
	api.Get("/:id/lessons", h.GetLessonsAdmin)
	api.Put("/:id/lessons", h.ReplaceLessons)
}

// ListByLanguage godoc
// @Summary      Danh sách lớp của 1 ngôn ngữ (kèm ghi danh + % tiến độ)
// @Tags         classes
// @Produce      json
// @Security     BearerAuth
// @Param        id  path      string  true  "Language ID"
// @Success      200  {array}   service.ClassSummary
// @Router       /languages/{id}/classes [get]
func (h *ClassHandler) ListByLanguage(c *fiber.Ctx) error {
	results, err := h.svc.ListByLanguage(c.UserContext(), currentUserID(c), c.Params("id"))
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// GetDetail godoc
// @Summary      Chi tiết 1 lớp (giáo án kèm bài đã hoàn thành của tôi)
// @Tags         classes
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "Class ID"  format(uuid)
// @Success      200  {object}  service.ClassDetail
// @Failure      404  {object}  ErrorResponse
// @Router       /classes/{id} [get]
func (h *ClassHandler) GetDetail(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	result, err := h.svc.GetDetail(c.UserContext(), currentUserID(c), id)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// Enroll godoc
// @Summary      Ghi danh vào 1 lớp (idempotent)
// @Tags         classes
// @Security     BearerAuth
// @Param        id   path  string  true  "Class ID"  format(uuid)
// @Success      204
// @Failure      404  {object}  ErrorResponse
// @Router       /classes/{id}/enroll [post]
func (h *ClassHandler) Enroll(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	if err := h.svc.Enroll(c.UserContext(), currentUserID(c), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// Create godoc
// @Summary      Tạo lớp mới (admin)
// @Tags         admin-classes
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.ClassRequest  true  "Thông tin lớp"
// @Success      201   {object}  service.ClassAdminResponse
// @Failure      400   {object}  ErrorResponse
// @Router       /admin/classes [post]
func (h *ClassHandler) Create(c *fiber.Ctx) error {
	var req service.ClassRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.Create(c.UserContext(), req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(result)
}

// ListAdmin godoc
// @Summary      Danh sách lớp theo ngôn ngữ (admin, có phân trang + tìm kiếm)
// @Tags         admin-classes
// @Produce      json
// @Security     BearerAuth
// @Param        language_id  query     string  true   "Language ID"
// @Param        q            query     string  false  "Tìm theo tiêu đề"
// @Param        page         query     int     false  "Trang"
// @Param        page_size    query     int     false  "Số dòng/trang"
// @Success      200  {object}  service.PageResult[service.ClassAdminResponse]
// @Router       /admin/classes [get]
func (h *ClassHandler) ListAdmin(c *fiber.Ctx) error {
	result, err := h.svc.ListAdmin(c.UserContext(), c.Query("language_id"), c.Query("q"), int32(c.QueryInt("page")), int32(c.QueryInt("page_size")))
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// Update godoc
// @Summary      Sửa lớp (admin)
// @Tags         admin-classes
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                 true  "Class ID"  format(uuid)
// @Param        body  body      service.ClassRequest  true  "Thông tin lớp"
// @Success      200   {object}  service.ClassAdminResponse
// @Failure      404   {object}  ErrorResponse
// @Router       /admin/classes/{id} [put]
func (h *ClassHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	var req service.ClassRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.Update(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// Delete godoc
// @Summary      Xoá lớp (admin, cascade giáo án + ghi danh, không đụng bài học gốc)
// @Tags         admin-classes
// @Security     BearerAuth
// @Param        id   path  string  true  "Class ID"  format(uuid)
// @Success      204
// @Router       /admin/classes/{id} [delete]
func (h *ClassHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	if err := h.svc.Delete(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// GetLessonsAdmin godoc
// @Summary      Giáo án hiện tại của 1 lớp (admin, tiền-điền form sửa)
// @Tags         admin-classes
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "Class ID"  format(uuid)
// @Success      200  {array}   service.ClassLessonAdmin
// @Router       /admin/classes/{id}/lessons [get]
func (h *ClassHandler) GetLessonsAdmin(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	result, err := h.svc.GetLessonsAdmin(c.UserContext(), id)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

type replaceLessonsRequest struct {
	LessonIDs []uuid.UUID `json:"lesson_ids"`
}

// ReplaceLessons godoc
// @Summary      Set lại toàn bộ giáo án của 1 lớp theo thứ tự (admin)
// @Description  Thay TOÀN BỘ danh sách bài — gửi mảng rỗng để xoá hết giáo án.
// @Tags         admin-classes
// @Accept       json
// @Security     BearerAuth
// @Param        id    path  string                 true  "Class ID"  format(uuid)
// @Param        body  body  replaceLessonsRequest  true  "Danh sách lesson_id theo đúng thứ tự học"
// @Success      204
// @Failure      400  {object}  ErrorResponse
// @Router       /admin/classes/{id}/lessons [put]
func (h *ClassHandler) ReplaceLessons(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	var req replaceLessonsRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	if err := h.svc.ReplaceLessons(c.UserContext(), id, req.LessonIDs); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}
