package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/netip"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
)

// Giới hạn thử đăng nhập / mật khẩu (chống dò mật khẩu). Bộ đếm nằm trong bộ nhớ của từng tiến trình — chạy nhiều
// instance thì mỗi instance đếm riêng (vẫn chặn được dò mật khẩu hàng loạt).

// failureLimiter — đếm request THẤT BẠI (status >= 400) theo key trong cửa sổ trượt `window`; quá `max` → 429 kèm
// Retry-After. respondNow đặt ngay sau limiter để lỗi handler thành response trước khi limiter đọc status
// (mặc định lỗi chỉ được ErrorHandler ghi sau khi đi hết chuỗi middleware → limiter luôn thấy 200).
func failureLimiter(max int, window time.Duration, key func(*fiber.Ctx) string, msg string) []fiber.Handler {
	return []fiber.Handler{
		limiter.New(limiter.Config{
			Max: max, Expiration: window, KeyGenerator: key, SkipSuccessfulRequests: true,
			LimiterMiddleware: limiter.SlidingWindow{}, LimitReached: tooManyRequests(msg),
		}),
		respondNow,
	}
}

// requestLimiter — đếm mọi request theo key (vd đăng ký tài khoản mỗi IP)
func requestLimiter(max int, window time.Duration, key func(*fiber.Ctx) string, msg string) fiber.Handler {
	return limiter.New(limiter.Config{
		Max: max, Expiration: window, KeyGenerator: key, LimiterMiddleware: limiter.SlidingWindow{}, LimitReached: tooManyRequests(msg),
	})
}

func respondNow(c *fiber.Ctx) error {
	if err := c.Next(); err != nil {
		return ErrorHandler(c, err)
	}
	return nil
}

func tooManyRequests(msg string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusTooManyRequests).JSON(ErrorResponse{Error: msg})
	}
}

func keyByIP(prefix string) func(*fiber.Ctx) string {
	return func(c *fiber.Ctx) string { return prefix + ":" + limiterIP(c) }
}

// limiterIP — IP dùng làm key giới hạn: IPv6 gom theo dải /64 (1 đường mạng / VPS có cả dải /64, đổi địa chỉ để lách
// giới hạn và làm phình bộ đếm). Log / VNPay vẫn dùng IP đầy đủ (clientIP).
func limiterIP(c *fiber.Ctx) string {
	ip := clientIP(c)
	addr, err := netip.ParseAddr(ip)
	if err != nil || !addr.Is6() {
		return ip
	}
	return netip.PrefixFrom(addr, 64).Masked().String()
}

// loginIdentifier — email / username trong body đăng nhập, chuẩn hoá như AuthService.Login rồi băm (key luôn ngắn:
// gửi identifier rất dài không làm phình bộ nhớ của limiter)
func loginIdentifier(c *fiber.Ctx) string {
	var body struct {
		Identifier string `json:"identifier"`
	}
	_ = json.Unmarshal(c.Body(), &body)
	sum := sha256.Sum256([]byte(strings.ToLower(strings.TrimSpace(body.Identifier))))
	return hex.EncodeToString(sum[:16])
}

// keyByIPAndIdentifier — 1 IP dò mật khẩu 1 tài khoản (ngưỡng chặt)
func keyByIPAndIdentifier(c *fiber.Ctx) string {
	return "login-ip-id:" + limiterIP(c) + ":" + loginIdentifier(c)
}

// keyByIdentifier — 1 tài khoản bị dò từ nhiều IP (ngưỡng rộng: kẻ xấu không dễ khoá tài khoản của người khác)
func keyByIdentifier(c *fiber.Ctx) string {
	return "login-id:" + loginIdentifier(c)
}

func keyByUser(prefix string) func(*fiber.Ctx) string {
	return func(c *fiber.Ctx) string { return prefix + ":" + currentUserID(c).String() }
}
