package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

type LanguageHandler struct {
	svc *service.LanguageService
}

func NewLanguageHandler(svc *service.LanguageService) *LanguageHandler {
	return &LanguageHandler{
		svc: svc,
	}
}

func (h *LanguageHandler) RegisterRoutes(router fiber.Router) {
	api := router.Group("/languages")
	api.Get("", h.List)
	api.Get("/:id", h.GetByID)
}

// GetByID godoc
// @Summary      Lấy thông tin ngôn ngữ
// @Tags         languages
// @Produce      json
// @Param        id   path      string  true  "Language ID"  example(en)
// @Success      200  {object}  service.LanguageResponse
// @Failure      404  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /languages/{id} [get]
func (h *LanguageHandler) GetByID(c *fiber.Ctx) error {
	result, err := h.svc.GetByID(c.UserContext(), c.Params("id"))
	if err != nil {
		return err
	}

	return c.JSON(result)
}

// List godoc
// @Summary      Danh sách ngôn ngữ
// @Tags         languages
// @Produce      json
// @Success      200  {array}   service.LanguageResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /languages [get]
func (h *LanguageHandler) List(c *fiber.Ctx) error {
	results, err := h.svc.List(c.UserContext())
	if err != nil {
		return err
	}

	return c.JSON(results)
}
