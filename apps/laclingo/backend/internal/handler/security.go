package handler

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

// SecurityHeaders — header bảo mật cho mọi response API. Không đặt Cross-Origin-Resource-Policy: web (domain khác) nạp
// ảnh / audio trực tiếp từ API (avatar, ảnh từ vựng, audio luyện nghe).
func SecurityHeaders(production bool) fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Set(fiber.HeaderXContentTypeOptions, "nosniff")
		c.Set(fiber.HeaderXFrameOptions, "DENY")
		c.Set(fiber.HeaderReferrerPolicy, "strict-origin-when-cross-origin")
		if production {
			c.Set(fiber.HeaderStrictTransportSecurity, "max-age=31536000; includeSubDomains")
		}
		return c.Next()
	}
}

// rateLimitedResponse — 429 của giới hạn chung, code riêng để web không nhầm với hết lượt dùng trong ngày (daily_limit)
type rateLimitedResponse struct {
	Error string `json:"error"`
	Code  string `json:"code" enums:"rate_limited"`
}

// RateLimit — giới hạn chung mỗi IP mỗi phút (chống 1 máy dồn request làm chậm cả server). Bỏ qua /health (Render
// kiểm tra sức khoẻ) và preflight CORS. perMinute <= 0 = tắt. Bộ đếm trong bộ nhớ từng instance như failureLimiter.
func RateLimit(perMinute int) fiber.Handler {
	if perMinute <= 0 {
		return func(c *fiber.Ctx) error { return c.Next() }
	}
	return limiter.New(limiter.Config{
		Max:               perMinute,
		Expiration:        time.Minute,
		Next:              func(c *fiber.Ctx) bool { return c.Path() == "/health" || c.Method() == fiber.MethodOptions },
		KeyGenerator:      keyByIP("all"),
		LimiterMiddleware: limiter.SlidingWindow{},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(rateLimitedResponse{Error: "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút", Code: "rate_limited"})
		},
	})
}

// RequestLogger — log truy cập ghi IP thật của người dùng (clientIP) thay cho IP proxy
func RequestLogger() fiber.Handler {
	return logger.New(logger.Config{
		Format: "${time} | ${status} | ${latency} | ${client} | ${method} | ${path} | ${error}\n",
		CustomTags: map[string]logger.LogFunc{
			"client": func(output logger.Buffer, c *fiber.Ctx, _ *logger.Data, _ string) (int, error) {
				return output.WriteString(clientIP(c))
			},
		},
	})
}
