package handler

import (
	"errors"
	"log"

	"laclingo-backend/internal/auth"
	"laclingo-backend/internal/game"
	"laclingo-backend/internal/repository"
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

// ErrorResponse là định dạng lỗi chung của API
type ErrorResponse struct {
	Error string `json:"error" example:"không tìm thấy dữ liệu"`
}

// RegisterRoutes khởi tạo service/handler và gắn toàn bộ route /api/v1
func RegisterRoutes(app *fiber.App, repo *repository.PostgresRepository, tokens *auth.TokenManager, hub *game.Hub) {
	api := app.Group("/api/v1")

	// Public
	NewAuthHandler(service.NewAuthService(repo, tokens)).RegisterRoutes(api)
	NewLanguageHandler(service.NewLanguageService(repo)).RegisterRoutes(api)
	NewGrammarHandler(service.NewGrammarService(repo)).RegisterRoutes(api)

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
	protected := api.Group("", RequireAuth(tokens))
	NewUserHandler(service.NewUserService(repo)).RegisterRoutes(protected)
	NewSRSHandler(service.NewSRSService(repo)).RegisterRoutes(protected)
	challengeHandler.RegisterRoutes(protected)
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
	case errors.Is(err, service.ErrEmailTaken), errors.Is(err, service.ErrUsernameTaken):
		return c.Status(fiber.StatusConflict).JSON(ErrorResponse{Error: err.Error()})
	case errors.Is(err, service.ErrRoomNotFound):
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse{Error: err.Error()})
	case errors.Is(err, service.ErrRoomFull), errors.Is(err, service.ErrGameAlreadyStarted), errors.Is(err, service.ErrGameFinished):
		return c.Status(fiber.StatusConflict).JSON(ErrorResponse{Error: err.Error()})
	default:
		log.Printf("❌ %s %s: %v", c.Method(), c.Path(), err)
		return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "lỗi hệ thống"})
	}
}
