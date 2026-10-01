package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"laclingo-backend/internal/config"
	"laclingo-backend/internal/handler"
	"laclingo-backend/internal/repository"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("❌ Không thể load config: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	repo, err := repository.NewPostgresRepository(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("❌ Không thể kết nối PostgreSQL: %v", err)
	}
	defer repo.Close()

	log.Println("✅ Kết nối PostgreSQL thành công!")

	app := fiber.New(fiber.Config{
		AppName:      "LacLingo API Engine v1.0",
		ErrorHandler: handler.ErrorHandler,
	})

	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"status":  "success",
			"message": "LacLingo API đang hoạt động!",
			"mascot":  "🦩 Chim Lạc cất cánh!",
		})
	})

	handler.RegisterRoutes(app, repo)

	go func() {
		if err := app.Listen(":" + cfg.Port); err != nil {
			log.Fatalf("❌ Lỗi Server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Đang đóng kết nối server an toàn...")
	_ = app.ShutdownWithTimeout(10 * time.Second)
}
