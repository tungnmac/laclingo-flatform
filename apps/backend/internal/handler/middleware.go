package handler

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

const userIDKey = "userID"

// TokenParser kiểm tra access token và trả về user ID
type TokenParser interface {
	Parse(token string) (uuid.UUID, error)
}

// RequireAuth chặn request không có Bearer token hợp lệ
func RequireAuth(tokens TokenParser) fiber.Handler {
	return func(c *fiber.Ctx) error {
		header := c.Get(fiber.HeaderAuthorization)
		scheme, token, ok := strings.Cut(header, " ")
		if !ok || !strings.EqualFold(scheme, "Bearer") || token == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "thiếu access token")
		}

		userID, err := tokens.Parse(token)
		if err != nil {
			return fiber.NewError(fiber.StatusUnauthorized, err.Error())
		}

		c.Locals(userIDKey, userID)
		return c.Next()
	}
}

// currentUserID lấy user ID do RequireAuth gắn vào context
func currentUserID(c *fiber.Ctx) uuid.UUID {
	id, _ := c.Locals(userIDKey).(uuid.UUID)
	return id
}

// RequireAuthWS xác thực WebSocket qua query param ?token= — browser không set
// được header Authorization tuỳ ý trên WS handshake nên không dùng lại
// RequireAuth (chỉ đọc header, đang được nhiều route REST khác dùng).
func RequireAuthWS(tokens TokenParser) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := c.Query("token")
		if token == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "thiếu access token")
		}

		userID, err := tokens.Parse(token)
		if err != nil {
			return fiber.NewError(fiber.StatusUnauthorized, err.Error())
		}

		c.Locals(userIDKey, userID)
		return c.Next()
	}
}
