package handler

import (
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

func (h *AuthHandler) RegisterRoutes(router fiber.Router) {
	api := router.Group("/auth")
	api.Post("/register", h.Register)
	api.Post("/login", h.Login)
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
