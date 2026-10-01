package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
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
