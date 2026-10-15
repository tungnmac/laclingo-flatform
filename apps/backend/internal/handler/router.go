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
func RegisterRoutes(app *fiber.App, repo *repository.PostgresRepository, tokens *auth.TokenManager, hub *game.Hub, missions *service.MissionService, r2 *storage.R2Client) {
	api := app.Group("/api/v1")

	// Public
	NewAuthHandler(service.NewAuthService(repo, tokens)).RegisterRoutes(api)
	NewLanguageHandler(service.NewLanguageService(repo)).RegisterRoutes(api)
	grammarHandler := NewGrammarHandler(service.NewGrammarService(repo, missions))
	grammarHandler.RegisterRoutes(api)
	listeningHandler := NewListeningHandler(service.NewListeningService(repo, missions, r2))
	listeningHandler.RegisterRoutes(api)
	classHandler := NewClassHandler(service.NewClassService(repo))
	blogHandler := NewBlogHandler(service.NewBlogService(repo, r2))
	blogHandler.RegisterPublicRoutes(api)

	challengeHandler := NewChallengeHandler(service.NewChallengeService(repo), hub)
	// WS đăng ký trên "api", TRƯỚC khi tạo "protected": Fiber lưu route theo 1
	// danh sách tuần tự dùng chung cho mọi group — middleware RequireAuth (Use,
	// khớp theo prefix "/api/v1") sẽ chặn MỌI request dưới /api/v1 nếu nó được
	// đăng ký trước route WS trong danh sách này, bất kể route WS nằm ở group
	// nào. Đăng ký trước để route/middleware WS (RequireAuthWS, qua query
	// ?token= vì browser không set được header trên WS handshake) khớp và xử lý
	// xong request trước khi tới lượt RequireAuth.
	challengeHandler.RegisterWSRoute(api, tokens)

	// Cần đăng nhập
	userService := service.NewUserService(repo)
	userHandler := NewUserHandler(userService)
	protected := api.Group("", RequireAuth(tokens))
	userHandler.RegisterRoutes(protected)
	NewSRSHandler(service.NewSRSService(repo, missions)).RegisterRoutes(protected)
	vocabularyHandler := NewVocabularyHandler(service.NewVocabularyService(repo))
	vocabularyHandler.RegisterRoutes(protected)
	challengeHandler.RegisterRoutes(protected)
	grammarHandler.RegisterProtectedRoutes(protected)
	listeningHandler.RegisterProtectedRoutes(protected)
	NewMissionHandler(missions).RegisterRoutes(protected)
	classHandler.RegisterRoutes(protected)
	blogHandler.RegisterRoutes(protected)

	// Cần đăng nhập + được cấp module /admin tương ứng — 1 group DUY NHẤT,
	// RequireModule tự suy module cần thiết từ path (xem lý do ở
	// modulePathPrefixes trong middleware.go — tách nhiều group cùng prefix
	// rỗng sẽ cộng dồn hết các điều kiện module lên nhau).
	admin := api.Group("", RequireAuth(tokens), RequireModule(userService))
	userHandler.RegisterAdminRoutes(admin)
	NewMissionHandler(missions).RegisterAdminRoutes(admin)
	vocabularyHandler.RegisterAdminRoutes(admin)
	grammarHandler.RegisterAdminRoutes(admin)
	NewChallengeQuestionHandler(service.NewChallengeQuestionService(repo)).RegisterAdminRoutes(admin)
	listeningHandler.RegisterAdminRoutes(admin)
	classHandler.RegisterAdminRoutes(admin)
	blogHandler.RegisterAdminRoutes(admin)
}

// ErrorHandler map lỗi service sang HTTP status, không lộ lỗi nội bộ ra client
func ErrorHandler(c *fiber.Ctx, err error) error {
	var fiberErr *fiber.Error
	switch {
	case errors.As(err, &fiberErr):
		return c.Status(fiberErr.Code).JSON(ErrorResponse{Error: fiberErr.Message})
	case errors.Is(err, service.ErrNotFound):
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse{Error: err.Error()})
	case errors.Is(err, service.ErrInvalidInput):
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	case errors.Is(err, service.ErrInvalidCredentials):
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
