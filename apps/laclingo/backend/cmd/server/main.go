package main

import (
	"context"
	"errors"
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

	// Migrate trước khi nhận request — lỗi thì thoát, Render giữ bản đang chạy (bản mới không qua health check).
	// DB mới hơn bản này (rollback / bản mới migrate lỗi) thì chỉ cảnh báo, vẫn chạy.
	if cfg.MigrationsDir != "" {
		version, err := repository.Migrate(cfg.DatabaseURL, cfg.MigrationsDir)
		switch {
		case errors.Is(err, repository.ErrSchemaAhead):
			log.Printf("⚠️  %v — bỏ qua migration", err)
		case err != nil:
			log.Fatalf("❌ Migration lỗi: %v", err)
		default:
			log.Printf("✅ Database schema version %d", version)
		}
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

	// IP người dùng (giới hạn đăng nhập / tần suất, log, VNPay) — đặt trước mọi middleware dùng clientIP
	if err := handler.SetTrustedProxies(cfg.TrustedProxies); err != nil {
		log.Fatal(err)
	}
	handler.SetClientIPHeader(cfg.ClientIPHeader)
	if cfg.ClientIPHeader != "" && len(cfg.TrustedProxies) > 0 {
		log.Printf("⚠️  CLIENT_IP_HEADER và TRUSTED_PROXIES cùng được đặt — chỉ tin %s khi kết nối tới từ proxy tin cậy", cfg.ClientIPHeader)
	}

	app.Use(handler.RequestLogger())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))
	app.Use(handler.SecurityHeaders(cfg.AppEnv == "production"))
	app.Use(handler.RateLimit(cfg.RateLimitPerMinute))

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"status":  "success",
			"message": "LacLingo API đang hoạt động!",
			"mascot":  "🦩 Chim Lạc cất cánh!",
		})
	})

	// Tài liệu API chỉ bật khi chạy dev — quên đặt APP_ENV trên server cũng không lộ danh sách API
	if cfg.AppEnv == "development" {
		app.Get("/swagger/*", swagger.HandlerDefault)
	}

	notificationService := service.NewNotificationService(repo)
	missionService := service.NewMissionService(repo, notificationService)
	missionService.SetDailyRecorder(service.NewDailyNoteService(repo)) // hoạt động học → tiến độ Nhật ký học
	plans := service.NewPlanService(repo)                              // LacLingo Pro: giới hạn Free/Pro, chuỗi ngày học, Streak Freeze
	missionService.SetStreakRecorder(plans)
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
	if cfg.FCMServiceAccountFile != "" {
		if native, err := newFCMSender(cfg.FCMServiceAccountFile); err != nil {
			log.Printf("❌ FCM: %v — app iOS/Android sẽ không nhận được thông báo đẩy", err)
		} else {
			reminderService.SetNativeSender(native)
			log.Println("✅ FCM đã cấu hình — bật thông báo đẩy trên app iOS/Android")
		}
	} else {
		log.Println("⚠️  FCM_SERVICE_ACCOUNT_FILE chưa cấu hình — app iOS/Android không nhận được thông báo đẩy")
	}
	schedulerCtx, stopScheduler := context.WithCancel(context.Background())
	defer stopScheduler()
	go reminderService.Start(schedulerCtx)
	go notificationService.StartCleanup(schedulerCtx)
	go startChatCleanup(schedulerCtx, repo)

	aiClient := newAIClient(cfg)
	suggester := service.NewVocabularySuggester(aiClient)
	analyzer := service.NewSentenceAnalyzer(repo, aiClient, plans)
	languageContent := service.NewLanguageContentService(repo, aiClient, notificationService)
	go languageContent.StartSyncWorker(schedulerCtx) // hàng đợi dựng nội dung cho ngôn ngữ mới

	tokens := auth.NewTokenManager(cfg.JWTSecret, cfg.JWTTTL)
	tokens.SetRefreshTTL(cfg.RefreshTTL)
	handler.RegisterRoutes(app, repo, tokens, hub, missionService, r2, reminderService, notificationService, suggester, languageContent, analyzer, plans, newPaymentService(cfg, repo, notificationService))

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

// startChatCleanup xoá chat phòng thử thách quá 30 ngày mỗi giờ (giữ tin đang bị báo cáo) tới khi ctx bị huỷ
func startChatCleanup(ctx context.Context, repo *repository.PostgresRepository) {
	ticker := time.NewTicker(time.Hour)
	defer ticker.Stop()
	for {
		if n, err := repo.PruneGameChatMessages(ctx); err != nil && ctx.Err() == nil {
			log.Printf("❌ game: dọn chat cũ: %v", err)
		} else if n > 0 {
			log.Printf("🧹 game: đã xoá %d tin chat cũ", n)
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

// newFCMSender đọc file service account Firebase rồi tạo sender FCM
func newFCMSender(path string) (service.PushSender, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return service.NewFCMSender(data)
}

// newPaymentService — cổng thiếu key thì tắt (nil): trang bảng giá báo chưa hỗ trợ cổng đó
func newPaymentService(cfg *config.Config, repo *repository.PostgresRepository, notifier service.Notifier) *service.PaymentService {
	var vnpay *service.VNPayClient
	if cfg.VNPayTmnCode != "" && cfg.VNPayHashSecret != "" {
		vnpay = service.NewVNPayClient(cfg.VNPayTmnCode, cfg.VNPayHashSecret, cfg.VNPayPayURL)
		log.Println("✅ Thanh toán VNPay đã bật")
	} else {
		log.Println("⚠️  VNPAY_TMN_CODE / VNPAY_HASH_SECRET chưa cấu hình — tắt thanh toán VNPay")
	}
	var stripe *service.StripeClient
	if cfg.StripeSecretKey != "" {
		stripe = service.NewStripeClient(cfg.StripeSecretKey, cfg.StripeWebhookSecret, cfg.StripeAPIBase)
		log.Println("✅ Thanh toán Stripe đã bật")
		if cfg.StripeWebhookSecret == "" {
			log.Println("⚠️  STRIPE_WEBHOOK_SECRET trống — webhook Stripe sẽ bị từ chối (trang kết quả vẫn tra được đơn)")
		}
	} else {
		log.Println("⚠️  STRIPE_SECRET_KEY chưa cấu hình — tắt thanh toán Stripe")
	}
	payments := service.NewPaymentService(repo, vnpay, stripe, cfg.AppWebURL, cfg.AppAPIURL, notifier)

	// Mua trong app iOS/Android
	var apple *service.AppleVerifier
	if cfg.AppleBundleID != "" {
		apple = service.NewAppleVerifier(cfg.AppleBundleID)
		log.Println("✅ Mua trong app iOS (App Store) đã bật")
	} else {
		log.Println("⚠️  APPLE_BUNDLE_ID chưa cấu hình — tắt mua trong app iOS")
	}
	var google *service.GooglePlayClient
	if cfg.GooglePlayPackageName != "" && cfg.GooglePlayServiceAccountFile != "" {
		data, err := os.ReadFile(cfg.GooglePlayServiceAccountFile)
		if err == nil {
			google, err = service.NewGooglePlayClient(data, cfg.GooglePlayPackageName, cfg.GooglePlayAPIBase)
		}
		if err != nil {
			log.Printf("❌ Google Play: %v — tắt mua trong app Android", err)
		} else {
			log.Println("✅ Mua trong app Android (Google Play) đã bật")
			if cfg.GooglePlayRTDNToken == "" {
				log.Println("⚠️  GOOGLE_PLAY_RTDN_TOKEN trống — không nhận thông báo gia hạn/huỷ từ Google Play")
			}
		}
	} else {
		log.Println("⚠️  GOOGLE_PLAY_PACKAGE_NAME / GOOGLE_PLAY_SERVICE_ACCOUNT_FILE chưa cấu hình — tắt mua trong app Android")
	}
	payments.SetStores(apple, google, cfg.GooglePlayRTDNToken, cfg.IAPAllowSandbox)
	return payments
}
