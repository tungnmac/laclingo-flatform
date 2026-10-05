package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type GrammarHandler struct {
	svc          *service.GrammarService
	dialogueSvc  *service.DialogueService
}

func NewGrammarHandler(svc *service.GrammarService, dialogueSvc *service.DialogueService) *GrammarHandler {
	return &GrammarHandler{
		svc:          svc,
		dialogueSvc:  dialogueSvc,
	}
}

func (h *GrammarHandler) RegisterRoutes(router fiber.Router) {
	router.Get("/languages/:id/grammar", h.ListTopics)
	router.Get("/grammar/lessons/:code", h.GetLesson)
	router.Get("/grammar/:id/dialogues", h.GetDialogues)
}

// RegisterProtectedRoutes gắn route cần đăng nhập (submit cần biết user để
// ghi nhận nhiệm vụ) — tách riêng khỏi RegisterRoutes vì phần đọc bài học là public.
func (h *GrammarHandler) RegisterProtectedRoutes(router fiber.Router) {
	router.Post("/grammar/exercises/:id/submit", h.SubmitExercise)
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

// GetDialogues godoc
// @Summary      Lấy danh sách dialogues của một bài ngữ pháp
// @Tags         grammar
// @Produce      json
// @Param        id   path      string  true  "Lesson ID"
// @Success      200  {array}   service.DialogueResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /grammar/{id}/dialogues [get]
func (h *GrammarHandler) GetDialogues(c *fiber.Ctx) error {
	result, err := h.dialogueSvc.GetDialoguesByLesson(c.UserContext(), c.Params("id"))
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
