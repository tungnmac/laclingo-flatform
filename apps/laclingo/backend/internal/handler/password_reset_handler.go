package handler

import (
	"errors"
	"time"

	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

const msgTooManyResets = "Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau."

type PasswordResetHandler struct {
	svc *service.PasswordResetService
}

func NewPasswordResetHandler(svc *service.PasswordResetService) *PasswordResetHandler {
	return &PasswordResetHandler{svc: svc}
}

// RegisterRoutes — công khai (chưa đăng nhập). Giới hạn: 10 yêu cầu / giờ / IP, 3 email / giờ / tài khoản (chống spam
// hộp thư người khác); đặt lại sai mã 20 lần / 15 phút / IP
func (h *PasswordResetHandler) RegisterRoutes(router fiber.Router) {
	api := router.Group("/auth")
	api.Post("/forgot-password",
		requestLimiter(10, time.Hour, keyByIP("forgot"), msgTooManyResets),
		requestLimiter(3, time.Hour, func(c *fiber.Ctx) string { return "forgot-id:" + loginIdentifier(c) }, msgTooManyResets),
		h.Forgot)
	api.Post("/reset-password", append(failureLimiter(20, 15*time.Minute, keyByIP("reset"), msgTooManyResets), h.Reset)...)
}

// Forgot godoc
// @Summary      Quên mật khẩu — gửi link đặt lại qua email
// @Description  Luôn trả 204 dù email / tên đăng nhập có tồn tại hay không (không lộ tài khoản đã đăng ký). 503 khi server chưa cấu hình gửi email.
// @Tags         auth
// @Accept       json
// @Param        body  body  service.ForgotPasswordRequest  true  "Email hoặc tên đăng nhập"
// @Success      204
// @Failure      429   {object}  ErrorResponse
// @Failure      503   {object}  ErrorResponse
// @Router       /auth/forgot-password [post]
func (h *PasswordResetHandler) Forgot(c *fiber.Ctx) error {
	if !h.svc.Enabled() {
		return fiber.NewError(fiber.StatusServiceUnavailable, "máy chủ chưa bật gửi email, vui lòng liên hệ quản trị viên")
	}
	var req service.ForgotPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	if err := h.svc.Forgot(c.UserContext(), req, service.ParseContentLocale(c.Get(fiber.HeaderAcceptLanguage))); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// Reset godoc
// @Summary      Đặt mật khẩu mới bằng link trong email (dùng 1 lần) — mọi phiên đăng nhập bị thu hồi
// @Tags         auth
// @Accept       json
// @Param        body  body  service.ResetPasswordRequest  true  "Mã trong link + mật khẩu mới"
// @Success      204
// @Failure      400   {object}  ErrorResponse
// @Failure      429   {object}  ErrorResponse
// @Router       /auth/reset-password [post]
func (h *PasswordResetHandler) Reset(c *fiber.Ctx) error {
	var req service.ResetPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	if err := h.svc.Reset(c.UserContext(), req); err != nil {
		if errors.Is(err, service.ErrResetLinkInvalid) {
			return fiber.NewError(fiber.StatusBadRequest, "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn, vui lòng gửi yêu cầu mới.")
		}
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}
