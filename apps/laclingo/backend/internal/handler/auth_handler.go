package handler

import (
	"time"

	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	svc *service.AuthService
}

func NewAuthHandler(svc *service.AuthService) *AuthHandler {
	return &AuthHandler{
		svc: svc,
	}
}

const (
	msgTooManyLogins   = "Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau ít phút."
	msgTooManyRegister = "Bạn đã tạo quá nhiều tài khoản. Vui lòng thử lại sau."
)

func (h *AuthHandler) RegisterRoutes(router fiber.Router) {
	api := router.Group("/auth")
	// Ngưỡng theo IP rộng (cả trường / lớp học dùng chung 1 IP); chống dò mật khẩu chủ yếu nhờ ngưỡng theo tài khoản
	api.Post("/register", requestLimiter(30, time.Hour, keyByIP("register"), msgTooManyRegister), h.Register)
	// Sai mật khẩu trong 15 phút: 5 lần / (IP + tài khoản), 50 lần / tài khoản (mọi IP), 100 lần / IP
	login := append(failureLimiter(100, 15*time.Minute, keyByIP("login"), msgTooManyLogins),
		failureLimiter(5, 15*time.Minute, keyByIPAndIdentifier, msgTooManyLogins)[0],
		failureLimiter(50, 15*time.Minute, keyByIdentifier, msgTooManyLogins)[0])
	login = append(login, respondNow, h.Login)
	api.Post("/login", login...)
	api.Post("/refresh", append(failureLimiter(100, 15*time.Minute, keyByIP("refresh"), msgTooManyLogins), h.Refresh)...)
	api.Post("/logout", h.Logout)
}

// RegisterProtectedRoutes — route cần đăng nhập (đăng ký trên group đã có RequireAuth)
func (h *AuthHandler) RegisterProtectedRoutes(router fiber.Router) {
	// Xoá tài khoản cần mật khẩu — token bị lộ cũng không dò được mật khẩu qua đây
	router.Delete("/users/me", append(failureLimiter(5, 15*time.Minute, keyByUser("delete-account"), msgTooManyLogins), h.DeleteAccount)...)
	router.Post("/auth/logout-all", h.LogoutAll)
}

// LogoutAll godoc
// @Summary      Đăng xuất mọi thiết bị (thu hồi mọi phiên đăng nhập của tài khoản)
// @Tags         auth
// @Security     BearerAuth
// @Success      204
// @Failure      401  {object}  ErrorResponse
// @Router       /auth/logout-all [post]
func (h *AuthHandler) LogoutAll(c *fiber.Ctx) error {
	if err := h.svc.LogoutAll(c.UserContext(), currentUserID(c)); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// Register godoc
// @Summary      Đăng ký tài khoản
// @Description  Mật khẩu 8-72 ký tự. Trả về access token để đăng nhập luôn.
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body  body      service.RegisterRequest  true  "Thông tin đăng ký"
// @Success      201   {object}  service.AuthResponse
// @Failure      400   {object}  ErrorResponse
// @Failure      409   {object}  ErrorResponse
// @Failure      500   {object}  ErrorResponse
// @Router       /auth/register [post]
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req service.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}

	result, err := h.svc.Register(c.UserContext(), req)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(result)
}

// Login godoc
// @Summary      Đăng nhập
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body  body      service.LoginRequest  true  "Email hoặc username, và mật khẩu"
// @Success      200   {object}  service.AuthResponse
// @Failure      400   {object}  ErrorResponse
// @Failure      401   {object}  ErrorResponse
// @Failure      500   {object}  ErrorResponse
// @Router       /auth/login [post]
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req service.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}

	result, err := h.svc.Login(c.UserContext(), req)
	if err != nil {
		return err
	}

	return c.JSON(result)
}

// DeleteAccount godoc
// @Summary      Xoá tài khoản của mình
// @Description  Xoá vĩnh viễn tài khoản và toàn bộ dữ liệu cá nhân, cần nhập lại mật khẩu. Gói Stripe tự gia hạn được huỷ trước. Owner không tự xoá được.
// @Tags         users
// @Accept       json
// @Security     BearerAuth
// @Param        body  body      service.DeleteAccountRequest  true  "Mật khẩu hiện tại"
// @Success      204
// @Failure      400   {object}  ErrorResponse
// @Failure      403   {object}  ErrorResponse
// @Failure      503   {object}  ErrorResponse
// @Router       /users/me [delete]
func (h *AuthHandler) DeleteAccount(c *fiber.Ctx) error {
	var req service.DeleteAccountRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	if err := h.svc.DeleteAccount(c.UserContext(), currentUserID(c), req); err != nil {
		return paymentError(err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// Refresh godoc
// @Summary      Làm mới phiên đăng nhập
// @Description  Đổi refresh token lấy access token + refresh token mới (token cũ hết hiệu lực). Không cần access token.
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body  body      service.RefreshRequest  true  "Refresh token"
// @Success      200   {object}  service.AuthResponse
// @Failure      401   {object}  ErrorResponse
// @Failure      429   {object}  ErrorResponse
// @Router       /auth/refresh [post]
func (h *AuthHandler) Refresh(c *fiber.Ctx) error {
	var req service.RefreshRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	res, err := h.svc.Refresh(c.UserContext(), req.RefreshToken)
	if err != nil {
		return err
	}
	return c.JSON(res)
}

// Logout godoc
// @Summary      Đăng xuất (thu hồi refresh token của phiên này)
// @Tags         auth
// @Accept       json
// @Param        body  body  service.RefreshRequest  true  "Refresh token"
// @Success      204
// @Router       /auth/logout [post]
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	var req service.RefreshRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	if err := h.svc.Logout(c.UserContext(), req.RefreshToken); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}
