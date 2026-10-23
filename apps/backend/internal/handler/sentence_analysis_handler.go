package handler

import (
	"errors"

	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

// SentenceAnalysisHandler — phân tích câu bằng AI cho học viên (giới hạn lượt/ngày)
type SentenceAnalysisHandler struct {
	svc *service.SentenceAnalyzer
}

func NewSentenceAnalysisHandler(svc *service.SentenceAnalyzer) *SentenceAnalysisHandler {
	return &SentenceAnalysisHandler{svc: svc}
}

func (h *SentenceAnalysisHandler) RegisterRoutes(router fiber.Router) {
	api := router.Group("/sentences")
	api.Post("/analyze", h.Analyze)
	api.Get("/analyze/quota", h.Quota)
}

// Analyze godoc
// @Summary      Phân tích 1 câu: đúng/sai, lỗi + sửa, cấu trúc câu, ngữ pháp, từ vựng
// @Description  Tiếng Anh / tiếng Trung, tối đa 300 ký tự. Lượt/ngày theo gói (Free 5, Pro 30); câu đã có người phân tích (cache) không tính lượt.
// @Tags         sentences
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.SentenceAnalyzeRequest  true  "Ngôn ngữ + câu"
// @Success      200   {object}  service.SentenceAnalysis
// @Failure      400   {object}  ErrorResponse
// @Failure      402   {object}  LimitErrorResponse  "Gói Free hết lượt hôm nay — nâng cấp Pro"
// @Failure      429   {object}  LimitErrorResponse  "Pro hết lượt hôm nay"
// @Failure      502   {object}  ErrorResponse  "AI đang lỗi (lượt được hoàn lại)"
// @Failure      503   {object}  ErrorResponse  "Server chưa cấu hình AI"
// @Router       /sentences/analyze [post]
func (h *SentenceAnalysisHandler) Analyze(c *fiber.Ctx) error {
	var req service.SentenceAnalyzeRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	out, err := h.svc.Analyze(c.UserContext(), currentUserID(c), req)
	switch {
	case errors.Is(err, service.ErrAINotConfigured):
		return fiber.NewError(fiber.StatusServiceUnavailable, err.Error())
	case errors.Is(err, service.ErrAnalysisAIFailed):
		return fiber.NewError(fiber.StatusBadGateway, err.Error())
	case err != nil:
		return err
	}
	return c.JSON(out)
}

// Quota godoc
// @Summary      Lượt phân tích câu còn lại hôm nay
// @Tags         sentences
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  service.SentenceAnalysisQuota
// @Router       /sentences/analyze/quota [get]
func (h *SentenceAnalysisHandler) Quota(c *fiber.Ctx) error {
	out, err := h.svc.Quota(c.UserContext(), currentUserID(c))
	if err != nil {
		return err
	}
	return c.JSON(out)
}
