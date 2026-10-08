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
