package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "laclingo-backend/docs"
	"laclingo-backend/internal/auth"
	"laclingo-backend/internal/config"
	"laclingo-backend/internal/game"
	"laclingo-backend/internal/handler"
	"laclingo-backend/internal/repository"
	"laclingo-backend/internal/service"
	"laclingo-backend/internal/storage"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/swagger"
)

// @title        LacLingo API
// @version      1.0
// @description  API học ngôn ngữ với thuật toán SRS (SM-2).
// @BasePath     /api/v1
//
// @securityDefinitions.apikey  BearerAuth
// @in                          header
// @name                        Authorization
// @description                 Nhập "Bearer <access_token>" (lấy từ /auth/login hoặc /auth/register)
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
		// Mặc định Fiber 4MB — audio luyện nghe (vài phút, nén) dễ vượt mức này.
		BodyLimit: 25 * 1024 * 1024,
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

	if cfg.AppEnv != "production" {
		app.Get("/swagger/*", swagger.HandlerDefault)
	}

	missionService := service.NewMissionService(repo)
	hub := game.NewHub(repo, missionService)

	var r2 *storage.R2Client
	if cfg.R2Configured() {
		r2 = storage.NewR2Client(cfg.R2AccountID, cfg.R2Bucket, cfg.R2AccessKeyID, cfg.R2SecretAccessKey)
		log.Println("✅ R2 storage đã cấu hình — bật tính năng upload audio luyện nghe")
	} else {
		log.Println("⚠️  R2 storage chưa cấu hình — tính năng upload audio luyện nghe tắt")
	}

	handler.RegisterRoutes(app, repo, auth.NewTokenManager(cfg.JWTSecret, cfg.JWTTTL), hub, missionService, r2)

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
