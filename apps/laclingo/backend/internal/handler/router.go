package handler

import (
	"errors"
	"log"

	"laclingo-backend/internal/auth"
	"laclingo-backend/internal/game"
	"laclingo-backend/internal/repository"
	"laclingo-backend/internal/service"
	"laclingo-backend/internal/storage"

	"github.com/gofiber/fiber/v2"
)

// ErrorResponse là định dạng lỗi chung của API
type ErrorResponse struct {
	Error string `json:"error" example:"không tìm thấy dữ liệu"`
}

// RegisterRoutes khởi tạo service/handler và gắn toàn bộ route /api/v1. r2 có
// thể nil (R2 chưa cấu hình) — tính năng upload audio tắt, còn lại không ảnh hưởng.
// reminders/notifications do main tạo (dùng chung với bộ lập lịch nhắc học và
// MissionService) — luôn khác nil. translator dịch nội dung học theo ngôn ngữ giao diện (dùng chung với languageContent).
func RegisterRoutes(app *fiber.App, repo *repository.PostgresRepository, tokens *auth.TokenManager, hub *game.Hub, missions *service.MissionService, r2 *storage.R2Client, reminders *service.ReminderService, notifications *service.NotificationService, suggester *service.VocabularySuggester, languageContent *service.LanguageContentService, analyzer *service.SentenceAnalyzer, plans *service.PlanService, payments *service.PaymentService, translator *service.ContentTranslator) {
	// Trước mọi route: ngôn ngữ giao diện (Accept-Language) → ctx, service dịch nội dung học theo đó
	app.Use(ContentLocale())
	api := app.Group("/api/v1")

	// Public
	var files service.ObjectDeleter // để nil (không phải *R2Client nil) khi R2 chưa cấu hình
	if r2 != nil {
		files = r2
	}
	authHandler := NewAuthHandler(service.NewAuthService(repo, tokens, payments, files))
	authHandler.RegisterRoutes(api)
	NewLanguageHandler(service.NewLanguageService(repo)).RegisterRoutes(api)
	grammarHandler := NewGrammarHandler(service.NewGrammarService(repo, missions, translator))
	grammarHandler.RegisterRoutes(api)
	listeningHandler := NewListeningHandler(service.NewListeningService(repo, missions, r2, translator))
	listeningHandler.RegisterRoutes(api)
	classHandler := NewClassHandler(service.NewClassService(repo, translator))
	blogHandler := NewBlogHandler(service.NewBlogService(repo, r2, notifications))
	blogHandler.RegisterPublicRoutes(api)
	vocabularyHandler := NewVocabularyHandler(service.NewVocabularyService(repo, r2, translator))
	vocabularyHandler.RegisterPublicRoutes(api)
	onboardingHandler := NewOnboardingHandler(service.NewOnboardingService(repo, r2, translator), languageContent)
	onboardingHandler.RegisterPublicRoutes(api)

	challengeHandler := NewChallengeHandler(service.NewChallengeService(repo), hub)
	// WS đăng ký trên "api", TRƯỚC khi tạo "protected": Fiber lưu route theo 1
	// danh sách tuần tự dùng chung cho mọi group — middleware RequireAuth (Use,
	// khớp theo prefix "/api/v1") sẽ chặn MỌI request dưới /api/v1 nếu nó được
	// đăng ký trước route WS trong danh sách này, bất kể route WS nằm ở group
	// nào. Đăng ký trước để route/middleware WS (RequireAuthWS, qua query
	// ?token= vì browser không set được header trên WS handshake) khớp và xử lý
	// xong request trước khi tới lượt RequireAuth.
	challengeHandler.RegisterWSRoute(api, tokens)
	// Cổng thanh toán gọi về (IPN, Return URL, webhook) — công khai, xác thực bằng chữ ký; đăng ký trước RequireAuth
	paymentHandler := NewPaymentHandler(payments)
	paymentHandler.RegisterPublicRoutes(api)
	appVersionHandler := NewAppVersionHandler(service.NewAppVersionService(repo))
	appVersionHandler.RegisterPublicRoutes(api)

	// Cần đăng nhập
	userService := service.NewUserService(repo)
	userHandler := NewUserHandler(userService, plans)
	protected := api.Group("", RequireAuth(tokens))
	// Trước userHandler: /users/me/onboarding không bị /users/:id bắt nhầm (khác số đoạn nhưng giữ thứ tự cho chắc)
	onboardingHandler.RegisterRoutes(protected)
	userHandler.RegisterRoutes(protected)
	authHandler.RegisterProtectedRoutes(protected)
	srsService := service.NewSRSService(repo, missions, plans, translator)
	NewSRSHandler(srsService).RegisterRoutes(protected)
	NewDeckHandler(service.NewDeckService(repo, srsService, translator)).RegisterRoutes(protected)
	vocabularyHandler.RegisterRoutes(protected)
	challengeHandler.RegisterRoutes(protected)
	grammarHandler.RegisterProtectedRoutes(protected)
	listeningHandler.RegisterProtectedRoutes(protected)
	NewMissionHandler(missions).RegisterRoutes(protected)
	// Nhật ký học — riêng tư của từng học viên, KHÔNG đăng ký route admin nào
	NewDailyNoteHandler(service.NewDailyNoteService(repo)).RegisterRoutes(protected)
	NewSentenceAnalysisHandler(analyzer).RegisterRoutes(protected)
	billingHandler := NewBillingHandler(plans)
	billingHandler.RegisterRoutes(protected)
	paymentHandler.RegisterRoutes(protected)
	classHandler.RegisterRoutes(protected)
	blogHandler.RegisterRoutes(protected)
	moderationHandler := NewModerationHandler(service.NewModerationService(repo))
	moderationHandler.RegisterRoutes(protected)
	reminderHandler := NewReminderHandler(reminders)
	reminderHandler.RegisterRoutes(protected)
	// SAU reminderHandler: /notifications/push/* phải khớp trước /notifications/:id
	notificationHandler := NewNotificationHandler(notifications)
	notificationHandler.RegisterRoutes(protected)
	speakingHandler := NewSpeakingHandler(service.NewSpeakingService(repo, missions, plans, translator))
	speakingHandler.RegisterRoutes(protected)

	// Cần đăng nhập + được cấp module /admin tương ứng — 1 group DUY NHẤT,
	// RequireModule tự suy module cần thiết từ path (xem lý do ở
	// modulePathPrefixes trong middleware.go — tách nhiều group cùng prefix
	// rỗng sẽ cộng dồn hết các điều kiện module lên nhau).
	admin := api.Group("", RequireAuth(tokens), RequireModule(userService))
	userHandler.RegisterAdminRoutes(admin)
	billingHandler.RegisterAdminRoutes(admin)
	NewMissionHandler(missions).RegisterAdminRoutes(admin)
	vocabularyHandler.RegisterAdminRoutes(admin)
	NewVocabularySuggestHandler(suggester).RegisterAdminRoutes(admin)
	grammarHandler.RegisterAdminRoutes(admin)
	NewChallengeQuestionHandler(service.NewChallengeQuestionService(repo)).RegisterAdminRoutes(admin)
	listeningHandler.RegisterAdminRoutes(admin)
	classHandler.RegisterAdminRoutes(admin)
	blogHandler.RegisterAdminRoutes(admin)
	moderationHandler.RegisterAdminRoutes(admin)
	reminderHandler.RegisterAdminRoutes(admin)
	notificationHandler.RegisterAdminRoutes(admin)
	speakingHandler.RegisterAdminRoutes(admin)
	appVersionHandler.RegisterAdminRoutes(admin)
}

// ErrorHandler map lỗi service sang HTTP status, không lộ lỗi nội bộ ra client
func ErrorHandler(c *fiber.Ctx, err error) error {
	var fiberErr *fiber.Error
	var limitErr *service.LimitError
	switch {
	case errors.As(err, &limitErr):
		// Gói Free hết lượt → 402 + code để FE hiện màn nâng cấp Pro; Pro hết lượt (vd phân tích câu) → 429
		status, code := fiber.StatusPaymentRequired, "pro_required"
		if limitErr.Pro {
			status, code = fiber.StatusTooManyRequests, "daily_limit"
		}
		return c.Status(status).JSON(LimitErrorResponse{Error: limitErr.Error(), Code: code, Feature: limitErr.Feature, Limit: limitErr.Limit})
	case errors.As(err, &fiberErr):
		return c.Status(fiberErr.Code).JSON(ErrorResponse{Error: fiberErr.Message})
	case errors.Is(err, service.ErrNotFound):
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse{Error: err.Error()})
	case errors.Is(err, service.ErrInvalidInput):
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	case errors.Is(err, service.ErrInvalidCredentials), errors.Is(err, service.ErrSessionExpired):
		return c.Status(fiber.StatusUnauthorized).JSON(ErrorResponse{Error: err.Error()})
	case errors.Is(err, service.ErrEmailTaken), errors.Is(err, service.ErrUsernameTaken), errors.Is(err, service.ErrDuplicate):
		return c.Status(fiber.StatusConflict).JSON(ErrorResponse{Error: err.Error()})
	case errors.Is(err, service.ErrRoomNotFound):
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse{Error: err.Error()})
	case errors.Is(err, service.ErrRoomFull), errors.Is(err, service.ErrGameAlreadyStarted), errors.Is(err, service.ErrGameFinished):
		return c.Status(fiber.StatusConflict).JSON(ErrorResponse{Error: err.Error()})
	case errors.Is(err, service.ErrBanned), errors.Is(err, service.ErrForbidden), errors.Is(err, service.ErrAccountDeactivated):
		return c.Status(fiber.StatusForbidden).JSON(ErrorResponse{Error: err.Error()})
	default:
		log.Printf("❌ %s %s: %v", c.Method(), c.Path(), err)
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "lỗi hệ thống"})
	}
}
