package handler

import (
	"errors"
	"log"

	"laclingo-backend/internal/repository"
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

// RegisterRoutes khởi tạo service/handler và gắn toàn bộ route /api/v1
func RegisterRoutes(app *fiber.App, repo *repository.PostgresRepository) {
	api := app.Group("/api/v1")

	NewUserHandler(service.NewUserService(repo)).RegisterRoutes(api)
	NewLanguageHandler(service.NewLanguageService(repo)).RegisterRoutes(api)
	NewSRSHandler(service.NewSRSService(repo)).RegisterRoutes(api)
}

// ErrorHandler map lỗi service sang HTTP status, không lộ lỗi nội bộ ra client
func ErrorHandler(c *fiber.Ctx, err error) error {
	var fiberErr *fiber.Error
	switch {
	case errors.As(err, &fiberErr):
		return c.Status(fiberErr.Code).JSON(fiber.Map{"error": fiberErr.Message})
	case errors.Is(err, service.ErrNotFound):
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	case errors.Is(err, service.ErrInvalidInput):
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	default:
		log.Printf("❌ %s %s: %v", c.Method(), c.Path(), err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "lỗi hệ thống"})
	}
}
