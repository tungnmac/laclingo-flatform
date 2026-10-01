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

func (h *LanguageHandler) GetByID(c *fiber.Ctx) error {
	result, err := h.svc.GetByID(c.UserContext(), c.Params("id"))
	if err != nil {
		return err
	}

	return c.JSON(result)
}

func (h *LanguageHandler) List(c *fiber.Ctx) error {
	results, err := h.svc.List(c.UserContext())
	if err != nil {
		return err
	}

	return c.JSON(results)
}
