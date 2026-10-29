package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type GrammarHandler struct {
	svc *service.GrammarService
}

func NewGrammarHandler(svc *service.GrammarService) *GrammarHandler {
	return &GrammarHandler{
		svc: svc,
	}
}

func (h *GrammarHandler) RegisterRoutes(router fiber.Router) {
	router.Get("/languages/:id/grammar", h.ListTopics)
	router.Get("/grammar/lessons/:code", h.GetLesson)
}

// RegisterProtectedRoutes gắn route cần đăng nhập (submit cần biết user để
// ghi nhận nhiệm vụ) — tách riêng khỏi RegisterRoutes vì phần đọc bài học là public.
func (h *GrammarHandler) RegisterProtectedRoutes(router fiber.Router) {
	router.Post("/grammar/exercises/:id/submit", h.SubmitExercise)
}

// RegisterAdminRoutes gắn route quản lý nội dung ngữ pháp — PHẢI nằm sau
// RequireModule trong chain (đăng ký ở router.go).
func (h *GrammarHandler) RegisterAdminRoutes(router fiber.Router) {
	topics := router.Group("/admin/grammar/topics")
	topics.Post("", h.CreateTopic)
	topics.Get("", h.ListTopicsAdmin)
	topics.Put("/:id", h.UpdateTopic)
	topics.Delete("/:id", h.DeleteTopic)
	topics.Post("/bulk", h.BulkImportTopics)

	lessons := router.Group("/admin/grammar/lessons")
	lessons.Post("", h.CreateLesson)
	lessons.Get("", h.ListLessonsAdmin)
	lessons.Put("/:id", h.UpdateLesson)
	lessons.Delete("/:id", h.DeleteLesson)
	lessons.Post("/bulk", h.BulkImportLessons)

	exercises := router.Group("/admin/grammar/exercises")
	exercises.Post("", h.CreateExercise)
	exercises.Get("", h.ListExercisesAdmin)
	exercises.Put("/:id", h.UpdateExercise)
	exercises.Delete("/:id", h.DeleteExercise)
	exercises.Post("/bulk", h.BulkImportExercises)
}

// CreateTopic godoc
// @Summary      Tạo chủ đề ngữ pháp (admin)
// @Tags         admin-grammar
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.GrammarTopicRequest  true  "Thông tin chủ đề"
// @Success      201   {object}  service.GrammarTopicAdminResponse
// @Failure      400   {object}  ErrorResponse
// @Failure      409   {object}  ErrorResponse
// @Router       /admin/grammar/topics [post]
func (h *GrammarHandler) CreateTopic(c *fiber.Ctx) error {
	var req service.GrammarTopicRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.CreateTopic(c.UserContext(), req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(result)
}

// ListTopicsAdmin godoc
// @Summary      Danh sách chủ đề ngữ pháp theo ngôn ngữ (admin)
// @Tags         admin-grammar
// @Produce      json
// @Security     BearerAuth
// @Param        language_id  query     string  true  "Language ID"  example(en)
// @Success      200          {array}   service.GrammarTopicAdminResponse
// @Router       /admin/grammar/topics [get]
func (h *GrammarHandler) ListTopicsAdmin(c *fiber.Ctx) error {
	page, pageSize := pageParams(c)
	results, err := h.svc.ListTopicsAdmin(c.UserContext(), c.Query("language_id"), c.Query("q"), page, pageSize)
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// UpdateTopic godoc
// @Summary      Sửa chủ đề ngữ pháp (admin)
// @Tags         admin-grammar
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                       true  "Topic ID"
// @Param        body  body      service.GrammarTopicRequest  true  "Thông tin chủ đề"
// @Success      200   {object}  service.GrammarTopicAdminResponse
// @Router       /admin/grammar/topics/{id} [put]
func (h *GrammarHandler) UpdateTopic(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	var req service.GrammarTopicRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.UpdateTopic(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// DeleteTopic godoc
// @Summary      Xoá chủ đề ngữ pháp (admin, cascade xoá lesson+exercise bên trong)
// @Tags         admin-grammar
// @Security     BearerAuth
// @Param        id   path  string  true  "Topic ID"
// @Success      204
// @Router       /admin/grammar/topics/{id} [delete]
func (h *GrammarHandler) DeleteTopic(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	if err := h.svc.DeleteTopic(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// BulkImportTopics godoc
// @Summary      Nhập hàng loạt chủ đề ngữ pháp (admin)
// @Tags         admin-grammar
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      []service.GrammarTopicRequest  true  "Danh sách chủ đề"
// @Success      200   {array}   service.BulkImportResult
// @Router       /admin/grammar/topics/bulk [post]
func (h *GrammarHandler) BulkImportTopics(c *fiber.Ctx) error {
	var items []service.GrammarTopicRequest
	if err := c.BodyParser(&items); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	return c.JSON(h.svc.BulkImportTopics(c.UserContext(), items))
}

// CreateLesson godoc
// @Summary      Tạo bài học ngữ pháp (admin)
// @Tags         admin-grammar
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.GrammarLessonRequest  true  "Thông tin bài học"
// @Success      201   {object}  service.GrammarLessonAdminResponse
// @Router       /admin/grammar/lessons [post]
func (h *GrammarHandler) CreateLesson(c *fiber.Ctx) error {
	var req service.GrammarLessonRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.CreateLesson(c.UserContext(), req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(result)
}

// ListLessonsAdmin godoc
// @Summary      Danh sách bài học ngữ pháp theo ngôn ngữ (admin, mọi chủ đề)
// @Tags         admin-grammar
// @Produce      json
// @Security     BearerAuth
// @Param        language_id  query     string  true  "Language ID"
// @Success      200          {array}   service.GrammarLessonAdminResponse
// @Router       /admin/grammar/lessons [get]
func (h *GrammarHandler) ListLessonsAdmin(c *fiber.Ctx) error {
	page, pageSize := pageParams(c)
	results, err := h.svc.ListLessonsAdmin(c.UserContext(), c.Query("language_id"), c.Query("topic_id"), c.Query("level"), c.Query("q"), page, pageSize)
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// UpdateLesson godoc
// @Summary      Sửa bài học ngữ pháp (admin)
// @Tags         admin-grammar
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                        true  "Lesson ID"
// @Param        body  body      service.GrammarLessonRequest  true  "Thông tin bài học"
// @Success      200   {object}  service.GrammarLessonAdminResponse
// @Router       /admin/grammar/lessons/{id} [put]
func (h *GrammarHandler) UpdateLesson(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	var req service.GrammarLessonRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.UpdateLesson(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// DeleteLesson godoc
// @Summary      Xoá bài học ngữ pháp (admin, cascade xoá exercise bên trong)
// @Tags         admin-grammar
// @Security     BearerAuth
// @Param        id   path  string  true  "Lesson ID"
// @Success      204
// @Router       /admin/grammar/lessons/{id} [delete]
func (h *GrammarHandler) DeleteLesson(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	if err := h.svc.DeleteLesson(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// BulkImportLessons godoc
// @Summary      Nhập hàng loạt bài học ngữ pháp (admin)
// @Tags         admin-grammar
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      []service.GrammarLessonRequest  true  "Danh sách bài học"
// @Success      200   {array}   service.BulkImportResult
// @Router       /admin/grammar/lessons/bulk [post]
func (h *GrammarHandler) BulkImportLessons(c *fiber.Ctx) error {
	var items []service.GrammarLessonRequest
	if err := c.BodyParser(&items); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	return c.JSON(h.svc.BulkImportLessons(c.UserContext(), items))
}

// CreateExercise godoc
// @Summary      Tạo bài tập ngữ pháp (admin)
// @Tags         admin-grammar
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.GrammarExerciseRequest  true  "Thông tin bài tập"
// @Success      201   {object}  service.GrammarExerciseResponse
// @Router       /admin/grammar/exercises [post]
func (h *GrammarHandler) CreateExercise(c *fiber.Ctx) error {
	var req service.GrammarExerciseRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.CreateExercise(c.UserContext(), req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(result)
}

// ListExercisesAdmin godoc
// @Summary      Danh sách bài tập của 1 bài học (admin, CÓ đáp án đúng)
// @Tags         admin-grammar
// @Produce      json
// @Security     BearerAuth
// @Param        lesson_id  query     string  true  "Lesson ID"
// @Success      200        {array}   service.GrammarExerciseResponse
// @Router       /admin/grammar/exercises [get]
func (h *GrammarHandler) ListExercisesAdmin(c *fiber.Ctx) error {
	lessonID, err := uuid.Parse(c.Query("lesson_id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "lesson_id không hợp lệ")
	}
	page, pageSize := pageParams(c)
	results, err := h.svc.ListExercisesAdmin(c.UserContext(), lessonID, c.Query("q"), page, pageSize)
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// UpdateExercise godoc
// @Summary      Sửa bài tập ngữ pháp (admin)
// @Tags         admin-grammar
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                          true  "Exercise ID"
// @Param        body  body      service.GrammarExerciseRequest  true  "Thông tin bài tập"
// @Success      200   {object}  service.GrammarExerciseResponse
// @Router       /admin/grammar/exercises/{id} [put]
func (h *GrammarHandler) UpdateExercise(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	var req service.GrammarExerciseRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.UpdateExercise(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// DeleteExercise godoc
// @Summary      Xoá bài tập ngữ pháp (admin)
// @Tags         admin-grammar
// @Security     BearerAuth
// @Param        id   path  string  true  "Exercise ID"
// @Success      204
// @Router       /admin/grammar/exercises/{id} [delete]
func (h *GrammarHandler) DeleteExercise(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	if err := h.svc.DeleteExercise(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// BulkImportExercises godoc
// @Summary      Nhập hàng loạt bài tập ngữ pháp (admin)
// @Tags         admin-grammar
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      []service.GrammarExerciseRequest  true  "Danh sách bài tập"
// @Success      200   {array}   service.BulkImportResult
// @Router       /admin/grammar/exercises/bulk [post]
func (h *GrammarHandler) BulkImportExercises(c *fiber.Ctx) error {
	var items []service.GrammarExerciseRequest
	if err := c.BodyParser(&items); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	return c.JSON(h.svc.BulkImportExercises(c.UserContext(), items))
}

// ListTopics godoc
// @Summary      Danh sách chủ đề ngữ pháp của một ngôn ngữ
// @Description  Mỗi chủ đề kèm danh sách bài học (không gồm nội dung chi tiết).
// @Tags         grammar
// @Produce      json
// @Param        id   path      string  true  "Language ID"  example(en)
// @Success      200  {array}   service.GrammarTopicResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /languages/{id}/grammar [get]
func (h *GrammarHandler) ListTopics(c *fiber.Ctx) error {
	results, err := h.svc.ListTopics(c.UserContext(), c.Params("id"))
	if err != nil {
		return err
	}

	return c.JSON(results)
}

// GetLesson godoc
// @Summary      Chi tiết bài học ngữ pháp
// @Description  Nội dung bài học (summary, công thức, dấu hiệu) và danh sách bài tập.
// @Tags         grammar
// @Produce      json
// @Param        code  path      string  true  "Lesson code"  example(present_simple)
// @Success      200   {object}  service.GrammarLessonDetail
// @Failure      404   {object}  ErrorResponse
// @Failure      500   {object}  ErrorResponse
// @Router       /grammar/lessons/{code} [get]
func (h *GrammarHandler) GetLesson(c *fiber.Ctx) error {
	result, err := h.svc.GetLessonByCode(c.UserContext(), c.Params("code"))
	if err != nil {
		return err
	}

	return c.JSON(result)
}

// submitExerciseRequest — body cho SubmitExercise
type submitExerciseRequest struct {
	Answer string `json:"answer" example:"goes"`
}

// SubmitExercise godoc
// @Summary      Chấm 1 bài tập ngữ pháp
// @Description  Chạy song song với check client-side hiện có — chỉ để ghi nhận tiến độ nhiệm vụ.
// @Tags         grammar
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                  true  "Exercise ID (UUID)"  format(uuid)
// @Param        body  body      submitExerciseRequest  true  "Câu trả lời"
// @Success      200   {object}  service.SubmitExerciseResponse
// @Failure      400   {object}  ErrorResponse
// @Failure      404   {object}  ErrorResponse
// @Router       /grammar/exercises/{id}/submit [post]
func (h *GrammarHandler) SubmitExercise(c *fiber.Ctx) error {
	exerciseID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}

	var req submitExerciseRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}

	result, err := h.svc.SubmitExercise(c.UserContext(), currentUserID(c), exerciseID, req.Answer)
	if err != nil {
		return err
	}

	return c.JSON(result)
}
