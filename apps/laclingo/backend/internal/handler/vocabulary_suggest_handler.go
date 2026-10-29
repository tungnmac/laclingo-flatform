package handler

import (
	"errors"

	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

type VocabularySuggestHandler struct {
	svc *service.VocabularySuggester
}

func NewVocabularySuggestHandler(svc *service.VocabularySuggester) *VocabularySuggestHandler {
	return &VocabularySuggestHandler{svc: svc}
}

// RegisterAdminRoutes — PHẢI nằm sau RequireModule (prefix /admin/vocabularies → module "vocabulary")
func (h *VocabularySuggestHandler) RegisterAdminRoutes(router fiber.Router) {
	router.Post("/admin/vocabularies/suggest", h.Suggest)
}

// Suggest godoc
// @Summary      Gợi ý tự động khi thêm từ (admin)
// @Description  Phiên âm + audio từ Free Dictionary API (tiếng Anh), nghĩa tiếng Việt / câu ví dụ / từ loại / trình độ / emoji từ AI — Claude hoặc Gemini (nếu server có ANTHROPIC_API_KEY / GEMINI_API_KEY). Chỉ trả gợi ý, không lưu.
// @Tags         admin-vocab
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.VocabularySuggestRequest  true  "Ngôn ngữ + từ"
// @Success      200   {object}  service.VocabularySuggestion
// @Failure      502   {object}  ErrorResponse  "AI đã cấu hình nhưng đang lỗi" (sources rỗng = không tìm được gợi ý)
// @Router       /admin/vocabularies/suggest [post]
func (h *VocabularySuggestHandler) Suggest(c *fiber.Ctx) error {
	var req service.VocabularySuggestRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	out, err := h.svc.Suggest(c.UserContext(), req)
	if errors.Is(err, service.ErrSuggestAIFailed) {
		return fiber.NewError(fiber.StatusBadGateway, err.Error())
	}
	if err != nil {
		return err
	}
	return c.JSON(out)
}
