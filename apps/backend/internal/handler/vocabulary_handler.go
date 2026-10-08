package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type VocabularyHandler struct {
	svc *service.VocabularyService
}

func NewVocabularyHandler(svc *service.VocabularyService) *VocabularyHandler {
	return &VocabularyHandler{svc: svc}
}

func (h *VocabularyHandler) RegisterRoutes(router fiber.Router) {
	api := router.Group("/vocab")
	api.Get("/topics", h.ListTopics)
	api.Get("/words", h.ListWords)
	api.Get("/favorites", h.ListFavorites)
	api.Put("/:id/like", h.Like)
	api.Delete("/:id/like", h.Unlike)
	api.Put("/:id/favorite", h.Favorite)
	api.Delete("/:id/favorite", h.Unfavorite)
}

// ListTopics godoc
// @Summary      Chủ đề từ vựng
// @Description  Danh sách chủ đề của 1 ngôn ngữ kèm số từ user đã đưa vào ôn tập.
// @Tags         vocab
// @Produce      json
// @Security     BearerAuth
// @Param        language  query     string  false  "Mã ngôn ngữ (mặc định en)"  example(en)
// @Success      200       {array}   service.VocabularyTopic
// @Failure      401       {object}  ErrorResponse
// @Router       /vocab/topics [get]
func (h *VocabularyHandler) ListTopics(c *fiber.Ctx) error {
	results, err := h.svc.ListTopics(c.UserContext(), currentUserID(c), c.Query("language"))
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// ListWords godoc
// @Summary      Từ vựng theo chủ đề
// @Description  Topic truyền qua query vì tên chủ đề có dấu cách/ký tự đặc biệt.
// @Tags         vocab
// @Produce      json
// @Security     BearerAuth
// @Param        language  query     string  false  "Mã ngôn ngữ (mặc định en)"  example(en)
// @Param        topic     query     string  true   "Tên chủ đề"  example(Đồ ăn & Thức uống)
// @Success      200       {array}   service.VocabularyCard
// @Failure      400       {object}  ErrorResponse
// @Failure      401       {object}  ErrorResponse
// @Router       /vocab/words [get]
func (h *VocabularyHandler) ListWords(c *fiber.Ctx) error {
	results, err := h.svc.ListWordsByTopic(c.UserContext(), currentUserID(c), c.Query("language"), c.Query("topic"))
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// ListFavorites godoc
// @Summary      Từ vựng yêu thích
// @Tags         vocab
// @Produce      json
// @Security     BearerAuth
// @Param        language  query     string  false  "Chỉ lấy 1 ngôn ngữ (bỏ trống = tất cả)"  example(en)
// @Success      200       {array}   service.VocabularyCard
// @Failure      401       {object}  ErrorResponse
// @Router       /vocab/favorites [get]
func (h *VocabularyHandler) ListFavorites(c *fiber.Ctx) error {
	results, err := h.svc.ListFavorites(c.UserContext(), currentUserID(c), c.Query("language"))
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// Like godoc
// @Summary      Like từ vựng
// @Tags         vocab
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "Vocabulary ID"  format(uuid)
// @Success      200  {object}  service.LikeResponse
// @Failure      400  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Router       /vocab/{id}/like [put]
func (h *VocabularyHandler) Like(c *fiber.Ctx) error { return h.setLike(c, true) }

// Unlike godoc
// @Summary      Bỏ like từ vựng
// @Tags         vocab
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "Vocabulary ID"  format(uuid)
// @Success      200  {object}  service.LikeResponse
// @Failure      400  {object}  ErrorResponse
// @Router       /vocab/{id}/like [delete]
func (h *VocabularyHandler) Unlike(c *fiber.Ctx) error { return h.setLike(c, false) }

// Favorite godoc
// @Summary      Thêm từ vào yêu thích
// @Tags         vocab
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "Vocabulary ID"  format(uuid)
// @Success      200  {object}  service.FavoriteResponse
// @Failure      400  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Router       /vocab/{id}/favorite [put]
func (h *VocabularyHandler) Favorite(c *fiber.Ctx) error { return h.setFavorite(c, true) }

// Unfavorite godoc
// @Summary      Bỏ từ khỏi yêu thích
// @Tags         vocab
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "Vocabulary ID"  format(uuid)
// @Success      200  {object}  service.FavoriteResponse
// @Failure      400  {object}  ErrorResponse
// @Router       /vocab/{id}/favorite [delete]
func (h *VocabularyHandler) Unfavorite(c *fiber.Ctx) error { return h.setFavorite(c, false) }

func (h *VocabularyHandler) setLike(c *fiber.Ctx, liked bool) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "id không hợp lệ")
	}
	result, err := h.svc.SetLike(c.UserContext(), currentUserID(c), id, liked)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

func (h *VocabularyHandler) setFavorite(c *fiber.Ctx, favorited bool) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "id không hợp lệ")
	}
	result, err := h.svc.SetFavorite(c.UserContext(), currentUserID(c), id, favorited)
	if err != nil {
		return err
	}
	return c.JSON(result)
}
