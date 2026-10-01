package handler

import (
	"laclingo-backend/internal/domain"
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type SRSHandler struct {
	svc *service.SRSService
}

func NewSRSHandler(svc *service.SRSService) *SRSHandler {
	return &SRSHandler{
		svc: svc,
	}
}

func (h *SRSHandler) RegisterRoutes(router fiber.Router) {
	api := router.Group("/srs")
	api.Get("/due", h.GetDue)
	api.Post("/reviews", h.Review)
}

// GetDue trả về danh sách từ vựng đến hạn ôn tập.
// TODO: lấy user_id từ token xác thực thay vì query param.
//
// @Summary      Từ vựng đến hạn ôn tập
// @Tags         srs
// @Produce      json
// @Param        user_id  query     string  true   "User ID (UUID)"  format(uuid)
// @Param        limit    query     int     false  "Số lượng tối đa (mặc định 20, tối đa 100)"
// @Success      200      {array}   service.DueVocabulary
// @Failure      400      {object}  ErrorResponse
// @Failure      500      {object}  ErrorResponse
// @Router       /srs/due [get]
func (h *SRSHandler) GetDue(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Query("user_id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "user_id không hợp lệ")
	}

	results, err := h.svc.GetDueVocabularies(c.UserContext(), userID, int32(c.QueryInt("limit", 0)))
	if err != nil {
		return err
	}

	return c.JSON(results)
}

// Review ghi nhận kết quả một lần ôn tập (quality 0 -> 5).
// TODO: lấy user_id từ token xác thực thay vì body.
//
// @Summary      Ghi nhận kết quả ôn tập (SM-2)
// @Tags         srs
// @Accept       json
// @Produce      json
// @Param        body  body      domain.VocabularyReviewRequest  true  "Kết quả ôn tập"
// @Success      200   {object}  domain.VocabularyReviewResponse
// @Failure      400   {object}  ErrorResponse
// @Failure      500   {object}  ErrorResponse
// @Router       /srs/reviews [post]
func (h *SRSHandler) Review(c *fiber.Ctx) error {
	var req domain.VocabularyReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}

	result, err := h.svc.ReviewVocabulary(c.UserContext(), req)
	if err != nil {
		return err
	}

	return c.JSON(result)
}
