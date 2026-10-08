package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ChallengeQuestionHandler struct {
	svc *service.ChallengeQuestionService
}

func NewChallengeQuestionHandler(svc *service.ChallengeQuestionService) *ChallengeQuestionHandler {
	return &ChallengeQuestionHandler{svc: svc}
}

// RegisterAdminRoutes gắn route quản lý ngân hàng câu hỏi thách đấu — PHẢI nằm
// sau RequireAdmin trong chain (đăng ký ở router.go).
func (h *ChallengeQuestionHandler) RegisterAdminRoutes(router fiber.Router) {
	q := router.Group("/admin/challenge-questions")
	q.Post("", h.Create)
	q.Get("", h.List)
	q.Put("/:id", h.Update)
	q.Delete("/:id", h.Delete)
	q.Post("/bulk", h.BulkImport)
}

// Create godoc
// @Summary      Tạo câu hỏi thách đấu (admin)
// @Tags         admin-challenge
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.ChallengeQuestionRequest  true  "Thông tin câu hỏi"
// @Success      201   {object}  service.ChallengeQuestionResponse
// @Failure      400   {object}  ErrorResponse
// @Router       /admin/challenge-questions [post]
func (h *ChallengeQuestionHandler) Create(c *fiber.Ctx) error {
	var req service.ChallengeQuestionRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.CreateQuestion(c.UserContext(), req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(result)
}

// List godoc
// @Summary      Danh sách câu hỏi thách đấu theo ngôn ngữ (admin)
// @Tags         admin-challenge
// @Produce      json
// @Security     BearerAuth
// @Param        language_id  query     string  true  "Language ID"
// @Success      200          {array}   service.ChallengeQuestionResponse
// @Router       /admin/challenge-questions [get]
func (h *ChallengeQuestionHandler) List(c *fiber.Ctx) error {
	page, pageSize := pageParams(c)
	difficulty := int32(c.QueryInt("difficulty", 0))
	results, err := h.svc.ListQuestions(c.UserContext(), c.Query("language_id"), c.Query("q"), difficulty, page, pageSize)
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// Update godoc
// @Summary      Sửa câu hỏi thách đấu (admin)
// @Tags         admin-challenge
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                             true  "Question ID"
// @Param        body  body      service.ChallengeQuestionRequest  true  "Thông tin câu hỏi"
// @Success      200   {object}  service.ChallengeQuestionResponse
// @Router       /admin/challenge-questions/{id} [put]
func (h *ChallengeQuestionHandler) Update(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	var req service.ChallengeQuestionRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.UpdateQuestion(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// Delete godoc
// @Summary      Xoá câu hỏi thách đấu (admin)
// @Tags         admin-challenge
// @Security     BearerAuth
// @Param        id   path  string  true  "Question ID"
// @Success      204
// @Router       /admin/challenge-questions/{id} [delete]
func (h *ChallengeQuestionHandler) Delete(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	if err := h.svc.DeleteQuestion(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// BulkImport godoc
// @Summary      Nhập hàng loạt câu hỏi thách đấu (admin)
// @Tags         admin-challenge
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      []service.ChallengeQuestionRequest  true  "Danh sách câu hỏi"
// @Success      200   {array}   service.BulkImportResult
// @Router       /admin/challenge-questions/bulk [post]
func (h *ChallengeQuestionHandler) BulkImport(c *fiber.Ctx) error {
	var items []service.ChallengeQuestionRequest
	if err := c.BodyParser(&items); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	return c.JSON(h.svc.BulkImportQuestions(c.UserContext(), items))
}
