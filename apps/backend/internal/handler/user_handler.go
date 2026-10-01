package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type UserHandler struct {
	svc *service.UserService
}

func NewUserHandler(svc *service.UserService) *UserHandler {
	return &UserHandler{
		svc: svc,
	}
}

func (h *UserHandler) RegisterRoutes(router fiber.Router) {
	api := router.Group("/users")
	api.Get("", h.List)
	api.Get("/:id", h.GetByID)
}

func (h *UserHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}

	result, err := h.svc.GetByID(c.UserContext(), id)
	if err != nil {
		return err
	}

	return c.JSON(result)
}

func (h *UserHandler) List(c *fiber.Ctx) error {
	results, err := h.svc.List(c.UserContext())
	if err != nil {
		return err
	}

	return c.JSON(results)
}
