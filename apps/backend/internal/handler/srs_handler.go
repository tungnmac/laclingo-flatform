package handler

import (
	"laclingo-backend/internal/domain"
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
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
	api.Get("/new", h.GetNew)
	api.Post("/learn", h.Learn)
}

// GetDue trả về danh sách từ vựng đến hạn ôn tập của user đang đăng nhập.
//
// @Summary      Từ vựng đến hạn ôn tập
// @Tags         srs
// @Produce      json
// @Security     BearerAuth
// @Param        limit    query     int     false  "Số lượng tối đa (mặc định 20, tối đa 100)"
// @Success      200      {array}   service.DueVocabulary
// @Failure      401      {object}  ErrorResponse
// @Failure      500      {object}  ErrorResponse
// @Router       /srs/due [get]
func (h *SRSHandler) GetDue(c *fiber.Ctx) error {
	results, err := h.svc.GetDueVocabularies(c.UserContext(), currentUserID(c), int32(c.QueryInt("limit", 0)))
	if err != nil {
		return err
	}

	return c.JSON(results)
}

// GetNew trả về các từ user chưa học để bắt đầu học mới.
//
// @Summary      Từ vựng mới chưa học
// @Tags         srs
// @Produce      json
// @Security     BearerAuth
// @Param        language  query     string  false  "Mã ngôn ngữ (mặc định en)"  example(en)
// @Param        limit     query     int     false  "Số lượng tối đa (mặc định 10, tối đa 100)"
// @Success      200       {array}   service.NewVocabulary
// @Failure      401       {object}  ErrorResponse
// @Failure      500       {object}  ErrorResponse
// @Router       /srs/new [get]
func (h *SRSHandler) GetNew(c *fiber.Ctx) error {
	language := c.Query("language", "en")
	results, err := h.svc.GetNewVocabularies(c.UserContext(), currentUserID(c), language, int32(c.QueryInt("limit", 0)))
	if err != nil {
		return err
	}

	return c.JSON(results)
}

// Learn đánh dấu user đã học một từ mới — từ đó vào hàng đợi ôn tập SRS.
//
// @Summary      Đánh dấu đã học từ mới
// @Description  Tạo review row stage 0, đến hạn ôn ngay. Gọi lại với từ đã học thì giữ nguyên tiến độ.
// @Tags         srs
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      domain.LearnVocabularyRequest  true  "Từ vựng đã học"
// @Success      200   {object}  domain.LearnVocabularyResponse
// @Failure      400   {object}  ErrorResponse
// @Failure      401   {object}  ErrorResponse
// @Failure      404   {object}  ErrorResponse
// @Failure      500   {object}  ErrorResponse
// @Router       /srs/learn [post]
func (h *SRSHandler) Learn(c *fiber.Ctx) error {
	var req domain.LearnVocabularyRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}

	if err := h.svc.LearnVocabulary(c.UserContext(), currentUserID(c), req.VocabularyID); err != nil {
		return err
	}

	return c.JSON(domain.LearnVocabularyResponse{VocabularyID: req.VocabularyID, Learned: true})
}

// Review ghi nhận kết quả một lần ôn tập (quality 0 -> 5) của user đang đăng nhập.
//
// @Summary      Ghi nhận kết quả ôn tập (SM-2)
// @Tags         srs
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      domain.VocabularyReviewRequest  true  "Kết quả ôn tập"
// @Success      200   {object}  domain.VocabularyReviewResponse
// @Failure      400   {object}  ErrorResponse
// @Failure      401   {object}  ErrorResponse
// @Failure      404   {object}  ErrorResponse
// @Failure      500   {object}  ErrorResponse
// @Router       /srs/reviews [post]
func (h *SRSHandler) Review(c *fiber.Ctx) error {
	var req domain.VocabularyReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}

	result, err := h.svc.ReviewVocabulary(c.UserContext(), currentUserID(c), req)
	if err != nil {
		return err
	}

	return c.JSON(result)
}
