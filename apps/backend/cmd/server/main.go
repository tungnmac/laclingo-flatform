package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"
	_ "time/tzdata" // dữ liệu múi giờ nhúng sẵn — Nhật ký học tính "hôm nay" theo múi giờ học viên

	_ "laclingo-backend/docs"
	"laclingo-backend/internal/auth"
	"laclingo-backend/internal/config"
	"laclingo-backend/internal/game"
	"laclingo-backend/internal/handler"
	"laclingo-backend/internal/repository"
	"laclingo-backend/internal/service"
	"laclingo-backend/internal/storage"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"

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

	notificationService := service.NewNotificationService(repo)
	missionService := service.NewMissionService(repo, notificationService)
	missionService.SetDailyRecorder(service.NewDailyNoteService(repo)) // hoạt động học → tiến độ Nhật ký học
	hub := game.NewHub(repo, missionService)

	var r2 *storage.R2Client
	if cfg.R2Configured() {
		r2 = storage.NewR2Client(cfg.R2AccountID, cfg.R2Bucket, cfg.R2AccessKeyID, cfg.R2SecretAccessKey)
		log.Println("✅ R2 storage đã cấu hình — bật tính năng upload audio luyện nghe")
	} else {
		log.Println("⚠️  R2 storage chưa cấu hình — tính năng upload audio luyện nghe tắt")
	}

	var pushSender service.PushSender
	if cfg.PushConfigured() {
		pushSender = service.NewWebPushSender(cfg.VAPIDPublicKey, cfg.VAPIDPrivateKey, cfg.VAPIDSubject)
		log.Println("✅ Web push đã cấu hình — bật nhắc học")
	} else {
		log.Println("⚠️  Web push chưa cấu hình (VAPID_*) — nhắc học chỉ hiện trong chuông thông báo")
	}
	reminderService := service.NewReminderService(repo, pushSender, cfg.VAPIDPublicKey, notificationService)
	schedulerCtx, stopScheduler := context.WithCancel(context.Background())
	defer stopScheduler()
	go reminderService.Start(schedulerCtx)
	go notificationService.StartCleanup(schedulerCtx)

	aiClient := newAIClient(cfg)
	suggester := service.NewVocabularySuggester(aiClient)
	analyzer := service.NewSentenceAnalyzer(repo, aiClient)

	handler.RegisterRoutes(app, repo, auth.NewTokenManager(cfg.JWTSecret, cfg.JWTTTL), hub, missionService, r2, reminderService, notificationService, suggester, analyzer)

	go func() {
		if err := app.Listen(":" + cfg.Port); err != nil {
			log.Fatalf("❌ Lỗi Server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Đang đóng kết nối server an toàn...")
	stopScheduler()
	_ = app.ShutdownWithTimeout(10 * time.Second)
}

// newAIClient chọn nhà cung cấp AI (gợi ý từ mới, phân tích câu) theo AI_PROVIDER (trống = theo key đang có).
// nil = không có AI: gợi ý từ mới chỉ có phiên âm/audio từ điển, phân tích câu báo chưa cấu hình.
func newAIClient(cfg *config.Config) service.AIClient {
	provider := cfg.AIProvider
	if provider == "" {
		switch {
		case cfg.AnthropicAPIKey != "":
			provider = "claude"
		case cfg.GeminiAPIKey != "":
			provider = "gemini"
		}
	}
	switch provider {
	case "claude":
		if cfg.AnthropicAPIKey == "" {
			log.Println("⚠️  AI_PROVIDER=claude nhưng ANTHROPIC_API_KEY trống — gợi ý từ mới chỉ có phiên âm/audio từ điển")
			return nil
		}
		c := anthropic.NewClient(option.WithAPIKey(cfg.AnthropicAPIKey))
		log.Println("✅ AI (gợi ý từ mới, phân tích câu) dùng Claude API")
		return service.NewClaudeClient(&c, cfg.SuggestModel)
	case "gemini":
		if cfg.GeminiAPIKey == "" {
			log.Println("⚠️  AI_PROVIDER=gemini nhưng GEMINI_API_KEY trống — gợi ý từ mới chỉ có phiên âm/audio từ điển")
			return nil
		}
		log.Println("✅ AI (gợi ý từ mới, phân tích câu) dùng Gemini API")
		return service.NewGeminiClient(cfg.GeminiAPIKey, cfg.GeminiModel)
	case "":
		log.Println("⚠️  Chưa cấu hình ANTHROPIC_API_KEY / GEMINI_API_KEY — gợi ý từ mới chỉ có phiên âm/audio từ điển")
	default:
		log.Printf("⚠️  AI_PROVIDER=%q không hợp lệ (claude|gemini) — gợi ý từ mới chỉ có phiên âm/audio từ điển", provider)
	}
	return nil
}
