package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ListeningHandler struct {
	svc *service.ListeningService
}

func NewListeningHandler(svc *service.ListeningService) *ListeningHandler {
	return &ListeningHandler{svc: svc}
}

func (h *ListeningHandler) RegisterRoutes(router fiber.Router) {
	router.Get("/languages/:id/listening", h.ListPassages)
	router.Get("/listening/passages/:id", h.GetPassage)
}

// RegisterProtectedRoutes gắn route cần đăng nhập (submit cần biết user để ghi nhận nhiệm vụ).
func (h *ListeningHandler) RegisterProtectedRoutes(router fiber.Router) {
	router.Post("/listening/questions/:id/submit", h.SubmitAnswer)
}

// RegisterAdminRoutes gắn route quản lý nội dung luyện nghe — PHẢI nằm sau
// RequireAdmin trong chain (đăng ký ở router.go).
func (h *ListeningHandler) RegisterAdminRoutes(router fiber.Router) {
	passages := router.Group("/admin/listening/passages")
	passages.Post("", h.CreatePassage)
	passages.Get("", h.ListPassagesAdmin)
	passages.Put("/:id", h.UpdatePassage)
	passages.Delete("/:id", h.DeletePassage)
	passages.Post("/bulk", h.BulkImportPassages)

	questions := router.Group("/admin/listening/questions")
	questions.Post("", h.CreateQuestionAdmin)
	questions.Get("", h.ListQuestionsAdmin)
	questions.Put("/:id", h.UpdateQuestionAdmin)
	questions.Delete("/:id", h.DeleteQuestionAdmin)
	questions.Post("/bulk", h.BulkImportQuestions)
}

// CreatePassage godoc
// @Summary      Tạo bài luyện nghe (admin)
// @Tags         admin-listening
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.ListeningPassageRequest  true  "Thông tin bài luyện nghe"
// @Success      201   {object}  service.ListeningPassageAdminResponse
// @Router       /admin/listening/passages [post]
func (h *ListeningHandler) CreatePassage(c *fiber.Ctx) error {
	var req service.ListeningPassageRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.CreatePassage(c.UserContext(), req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(result)
}

// ListPassagesAdmin godoc
// @Summary      Danh sách bài luyện nghe theo ngôn ngữ (admin, có script đầy đủ)
// @Tags         admin-listening
// @Produce      json
// @Security     BearerAuth
// @Param        language_id  query     string  true  "Language ID"
// @Success      200          {array}   service.ListeningPassageAdminResponse
// @Router       /admin/listening/passages [get]
func (h *ListeningHandler) ListPassagesAdmin(c *fiber.Ctx) error {
	results, err := h.svc.ListPassagesAdmin(c.UserContext(), c.Query("language_id"))
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// UpdatePassage godoc
// @Summary      Sửa bài luyện nghe (admin)
// @Tags         admin-listening
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                            true  "Passage ID"
// @Param        body  body      service.ListeningPassageRequest  true  "Thông tin bài luyện nghe"
// @Success      200   {object}  service.ListeningPassageAdminResponse
// @Router       /admin/listening/passages/{id} [put]
func (h *ListeningHandler) UpdatePassage(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	var req service.ListeningPassageRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.UpdatePassage(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// DeletePassage godoc
// @Summary      Xoá bài luyện nghe (admin, cascade xoá câu hỏi bên trong)
// @Tags         admin-listening
// @Security     BearerAuth
// @Param        id   path  string  true  "Passage ID"
// @Success      204
// @Router       /admin/listening/passages/{id} [delete]
func (h *ListeningHandler) DeletePassage(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	if err := h.svc.DeletePassage(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// BulkImportPassages godoc
// @Summary      Nhập hàng loạt bài luyện nghe (admin)
// @Tags         admin-listening
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      []service.ListeningPassageRequest  true  "Danh sách bài luyện nghe"
// @Success      200   {array}   service.BulkImportResult
// @Router       /admin/listening/passages/bulk [post]
func (h *ListeningHandler) BulkImportPassages(c *fiber.Ctx) error {
	var items []service.ListeningPassageRequest
	if err := c.BodyParser(&items); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	return c.JSON(h.svc.BulkImportPassages(c.UserContext(), items))
}

// CreateQuestionAdmin godoc
// @Summary      Tạo câu hỏi nghe hiểu (admin)
// @Tags         admin-listening
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.ListeningQuestionRequest  true  "Thông tin câu hỏi"
// @Success      201   {object}  service.ListeningQuestionAdminResponse
// @Router       /admin/listening/questions [post]
func (h *ListeningHandler) CreateQuestionAdmin(c *fiber.Ctx) error {
	var req service.ListeningQuestionRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.CreateQuestion(c.UserContext(), req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(result)
}

// ListQuestionsAdmin godoc
// @Summary      Danh sách câu hỏi của 1 bài luyện nghe (admin, CÓ đáp án đúng)
// @Tags         admin-listening
// @Produce      json
// @Security     BearerAuth
// @Param        passage_id  query     string  true  "Passage ID"
// @Success      200         {array}   service.ListeningQuestionAdminResponse
// @Router       /admin/listening/questions [get]
func (h *ListeningHandler) ListQuestionsAdmin(c *fiber.Ctx) error {
	passageID, err := uuid.Parse(c.Query("passage_id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "passage_id không hợp lệ")
	}
	results, err := h.svc.ListQuestionsAdmin(c.UserContext(), passageID)
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// UpdateQuestionAdmin godoc
// @Summary      Sửa câu hỏi nghe hiểu (admin)
// @Tags         admin-listening
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                             true  "Question ID"
// @Param        body  body      service.ListeningQuestionRequest  true  "Thông tin câu hỏi"
// @Success      200   {object}  service.ListeningQuestionAdminResponse
// @Router       /admin/listening/questions/{id} [put]
func (h *ListeningHandler) UpdateQuestionAdmin(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	var req service.ListeningQuestionRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.UpdateQuestion(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// DeleteQuestionAdmin godoc
// @Summary      Xoá câu hỏi nghe hiểu (admin)
// @Tags         admin-listening
// @Security     BearerAuth
// @Param        id   path  string  true  "Question ID"
// @Success      204
// @Router       /admin/listening/questions/{id} [delete]
func (h *ListeningHandler) DeleteQuestionAdmin(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	if err := h.svc.DeleteQuestion(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// BulkImportQuestions godoc
// @Summary      Nhập hàng loạt câu hỏi nghe hiểu (admin)
// @Tags         admin-listening
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      []service.ListeningQuestionRequest  true  "Danh sách câu hỏi"
// @Success      200   {array}   service.BulkImportResult
// @Router       /admin/listening/questions/bulk [post]
func (h *ListeningHandler) BulkImportQuestions(c *fiber.Ctx) error {
	var items []service.ListeningQuestionRequest
	if err := c.BodyParser(&items); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	return c.JSON(h.svc.BulkImportQuestions(c.UserContext(), items))
}

// ListPassages godoc
// @Summary      Danh sách bài luyện nghe của một ngôn ngữ
// @Tags         listening
// @Produce      json
// @Param        id   path      string  true  "Language ID"  example(en)
// @Success      200  {array}   service.ListeningPassageSummary
// @Failure      500  {object}  ErrorResponse
// @Router       /languages/{id}/listening [get]
func (h *ListeningHandler) ListPassages(c *fiber.Ctx) error {
	results, err := h.svc.ListPassages(c.UserContext(), c.Params("id"))
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// GetPassage godoc
// @Summary      Chi tiết bài luyện nghe
// @Description  Trả về script (FE tự phát bằng Web Speech TTS) và câu hỏi (không kèm đáp án đúng).
// @Tags         listening
// @Produce      json
// @Param        id   path      string  true  "Passage ID (UUID)"  format(uuid)
// @Success      200  {object}  service.ListeningPassageDetail
// @Failure      400  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Router       /listening/passages/{id} [get]
func (h *ListeningHandler) GetPassage(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}

	result, err := h.svc.GetPassageDetail(c.UserContext(), id)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

type submitListeningAnswerRequest struct {
	Answer string `json:"answer" example:"At the market"`
}

// SubmitAnswer godoc
// @Summary      Chấm 1 câu hỏi nghe hiểu
// @Description  Trả đúng/sai + đáp án đúng + giải thích; đúng thì ghi nhận tiến độ nhiệm vụ.
// @Tags         listening
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                         true  "Question ID (UUID)"
// @Param        body  body      submitListeningAnswerRequest  true  "Câu trả lời"
// @Success      200   {object}  service.SubmitListeningAnswerResponse
// @Failure      400   {object}  ErrorResponse
// @Failure      404   {object}  ErrorResponse
// @Router       /listening/questions/{id}/submit [post]
func (h *ListeningHandler) SubmitAnswer(c *fiber.Ctx) error {
	questionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}

	var req submitListeningAnswerRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}

	result, err := h.svc.SubmitAnswer(c.UserContext(), currentUserID(c), questionID, req.Answer)
	if err != nil {
		return err
	}
	return c.JSON(result)
}
