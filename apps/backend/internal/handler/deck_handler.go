package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type DeckHandler struct {
	svc *service.DeckService
}

func NewDeckHandler(svc *service.DeckService) *DeckHandler {
	return &DeckHandler{svc: svc}
}

// RegisterRoutes gắn route danh sách ôn tập — cần đăng nhập, user chỉ thao tác list của mình
func (h *DeckHandler) RegisterRoutes(router fiber.Router) {
	api := router.Group("/decks")
	api.Get("", h.List)
	api.Post("", h.Create)
	api.Get("/:id", h.Get)
	api.Put("/:id", h.Update)
	api.Delete("/:id", h.Delete)
	api.Post("/:id/vocabularies", h.AddVocabulary)
	api.Delete("/:id/vocabularies/:vocabularyId", h.RemoveVocabulary)
}

// List godoc
// @Summary      Danh sách ôn tập của tôi
// @Tags         decks
// @Produce      json
// @Security     BearerAuth
// @Param        vocabulary_id  query     string  false  "Đánh dấu list nào đã chứa từ này"  format(uuid)
// @Success      200            {array}   service.DeckSummary
// @Router       /decks [get]
func (h *DeckHandler) List(c *fiber.Ctx) error {
	var vocabularyID uuid.UUID
	if v := c.Query("vocabulary_id"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "vocabulary_id không hợp lệ")
		}
		vocabularyID = id
	}
	results, err := h.svc.ListDecks(c.UserContext(), currentUserID(c), vocabularyID)
	if err != nil {
		return err
	}
	return c.JSON(results)
}

// Create godoc
// @Summary      Tạo danh sách ôn tập
// @Tags         decks
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.DeckRequest  true  "Thông tin list"
// @Success      201   {object}  service.DeckSummary
// @Failure      400   {object}  ErrorResponse
// @Router       /decks [post]
func (h *DeckHandler) Create(c *fiber.Ctx) error {
	var req service.DeckRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.CreateDeck(c.UserContext(), currentUserID(c), req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(result)
}

// Get godoc
// @Summary      Chi tiết danh sách ôn tập (kèm các từ)
// @Tags         decks
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "Deck ID"  format(uuid)
// @Success      200  {object}  service.DeckDetail
// @Failure      404  {object}  ErrorResponse
// @Router       /decks/{id} [get]
func (h *DeckHandler) Get(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	result, err := h.svc.GetDeck(c.UserContext(), currentUserID(c), id)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// Update godoc
// @Summary      Sửa thông tin danh sách ôn tập
// @Tags         decks
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string               true  "Deck ID"  format(uuid)
// @Param        body  body      service.DeckRequest  true  "Thông tin list"
// @Success      200   {object}  service.DeckSummary
// @Failure      400   {object}  ErrorResponse
// @Failure      404   {object}  ErrorResponse
// @Router       /decks/{id} [put]
func (h *DeckHandler) Update(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	var req service.DeckRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.UpdateDeck(c.UserContext(), currentUserID(c), id, req)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// Delete godoc
// @Summary      Xoá danh sách ôn tập (từ vẫn giữ trong hàng đợi SRS)
// @Tags         decks
// @Security     BearerAuth
// @Param        id   path  string  true  "Deck ID"  format(uuid)
// @Success      204
// @Failure      404  {object}  ErrorResponse
// @Router       /decks/{id} [delete]
func (h *DeckHandler) Delete(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	if err := h.svc.DeleteDeck(c.UserContext(), currentUserID(c), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

type addDeckVocabularyRequest struct {
	VocabularyID uuid.UUID `json:"vocabulary_id" swaggertype:"string" format:"uuid"`
}

// AddVocabulary godoc
// @Summary      Thêm từ vào danh sách ôn tập (đồng thời đưa vào hàng đợi SRS)
// @Tags         decks
// @Accept       json
// @Security     BearerAuth
// @Param        id    path  string                          true  "Deck ID"  format(uuid)
// @Param        body  body  handler.addDeckVocabularyRequest  true  "Từ cần thêm"
// @Success      204
// @Failure      404  {object}  ErrorResponse
// @Router       /decks/{id}/vocabularies [post]
func (h *DeckHandler) AddVocabulary(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	var req addDeckVocabularyRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	if err := h.svc.AddVocabulary(c.UserContext(), currentUserID(c), id, req.VocabularyID); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// RemoveVocabulary godoc
// @Summary      Bỏ từ khỏi danh sách ôn tập (tiến độ SRS giữ nguyên)
// @Tags         decks
// @Security     BearerAuth
// @Param        id            path  string  true  "Deck ID"        format(uuid)
// @Param        vocabularyId  path  string  true  "Vocabulary ID"  format(uuid)
// @Success      204
// @Failure      404  {object}  ErrorResponse
// @Router       /decks/{id}/vocabularies/{vocabularyId} [delete]
func (h *DeckHandler) RemoveVocabulary(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	vocabularyID, err := parseUUIDParam(c, "vocabularyId")
	if err != nil {
		return err
	}
	if err := h.svc.RemoveVocabulary(c.UserContext(), currentUserID(c), id, vocabularyID); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}
