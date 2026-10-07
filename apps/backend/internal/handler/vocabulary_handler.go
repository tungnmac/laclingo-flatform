package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

type VocabularyHandler struct {
	svc *service.VocabularyService
}

func NewVocabularyHandler(svc *service.VocabularyService) *VocabularyHandler {
	return &VocabularyHandler{svc: svc}
}

func (h *VocabularyHandler) RegisterRoutes(router fiber.Router) {
	api := router.Group("/vocabulary")
	api.Get("/topics", h.ListTopics)
	api.Get("/topics/:topic", h.ListByTopic)
}

// ListTopics trả về danh sách topics với số từ chưa học
//
// @Summary      Danh sách topics từ vựng
// @Tags         vocabulary
// @Produce      json
// @Security     BearerAuth
// @Param        language  query    string  false  "Mã ngôn ngữ (mặc định en)"  example(en)
// @Success      200      {array}   service.VocabularyTopic
// @Failure      401      {object}  ErrorResponse
// @Failure      500      {object}  ErrorResponse
// @Router       /vocabulary/topics [get]
func (h *VocabularyHandler) ListTopics(c *fiber.Ctx) error {
	language := c.Query("language", "en")
	topics, err := h.svc.ListTopics(c.UserContext(), currentUserID(c), language)
	if err != nil {
		return err
	}

	return c.JSON(topics)
}

// ListByTopic trả về vocabularies theo topic
//
// @Summary      Từ vựng theo topic
// @Tags         vocabulary
// @Produce      json
// @Security     BearerAuth
// @Param        language  query    string  true   "Mã ngôn ngữ"  example(en)
// @Param        topic    path     string  true   "Tên topic"
// @Success      200      {array}  service.VocabularyWithDetails
// @Failure      401      {object}  ErrorResponse
// @Failure      500      {object}  ErrorResponse
// @Router       /vocabulary/topics/{topic} [get]
func (h *VocabularyHandler) ListByTopic(c *fiber.Ctx) error {
	language := c.Query("language", "en")
	topic := c.Params("topic")
	if topic == "" {
		return fiber.NewError(fiber.StatusBadRequest, "topic is required")
	}

	vocabs, err := h.svc.ListByTopic(c.UserContext(), currentUserID(c), language, topic)
	if err != nil {
		return err
	}

	return c.JSON(vocabs)
}
