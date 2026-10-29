package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

type OnboardingHandler struct {
	svc *service.OnboardingService
}

func NewOnboardingHandler(svc *service.OnboardingService) *OnboardingHandler {
	return &OnboardingHandler{svc: svc}
}

// RegisterPublicRoutes — ảnh đại diện phải public (thẻ <img> không gửi được Bearer token)
func (h *OnboardingHandler) RegisterPublicRoutes(router fiber.Router) {
	router.Get("/users/avatars/:id", h.ServeAvatar)
}

func (h *OnboardingHandler) RegisterRoutes(router fiber.Router) {
	router.Get("/users/me/onboarding", h.Get)
	router.Put("/users/me/onboarding", h.Save)
	router.Post("/users/me/onboarding/skip", h.Skip)
	router.Post("/users/me/avatar", h.UploadAvatar)
}

// Get godoc
// @Summary      Dữ liệu onboarding hiện tại (thông tin cơ bản, ngôn ngữ học + trình độ, chủ đề yêu thích)
// @Tags         onboarding
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  service.OnboardingResponse
// @Router       /users/me/onboarding [get]
func (h *OnboardingHandler) Get(c *fiber.Ctx) error {
	res, err := h.svc.Get(c.UserContext(), currentUserID(c))
	if err != nil {
		return err
	}
	return c.JSON(res)
}

// Save godoc
// @Summary      Lưu onboarding (ghi đè toàn bộ); complete=true đánh dấu đã hoàn tất
// @Tags         onboarding
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.SaveOnboardingRequest  true  "Dữ liệu onboarding"
// @Success      200   {object}  service.OnboardingResponse
// @Failure      400   {object}  ErrorResponse
// @Router       /users/me/onboarding [put]
func (h *OnboardingHandler) Save(c *fiber.Ctx) error {
	var req service.SaveOnboardingRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	res, err := h.svc.Save(c.UserContext(), currentUserID(c), req)
	if err != nil {
		return err
	}
	return c.JSON(res)
}

// Skip godoc
// @Summary      "Để sau" — không hiện onboarding nữa (mở lại được từ Hồ sơ)
// @Tags         onboarding
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  service.UserResponse
// @Router       /users/me/onboarding/skip [post]
func (h *OnboardingHandler) Skip(c *fiber.Ctx) error {
	res, err := h.svc.Skip(c.UserContext(), currentUserID(c))
	if err != nil {
		return err
	}
	return c.JSON(res)
}

// UploadAvatar godoc
// @Summary      Tải ảnh đại diện lên (chưa đổi avatar — lưu onboarding / hồ sơ với url trả về)
// @Tags         onboarding
// @Accept       multipart/form-data
// @Produce      json
// @Security     BearerAuth
// @Param        image  formData  file  true  "Ảnh (jpeg/png/webp/gif, tối đa 5MB)"
// @Success      201    {object}  service.AvatarUploadResponse
// @Failure      400    {object}  ErrorResponse
// @Router       /users/me/avatar [post]
func (h *OnboardingHandler) UploadAvatar(c *fiber.Ctx) error {
	fileHeader, err := c.FormFile("image")
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "thiếu file ảnh (field \"image\")")
	}
	file, err := fileHeader.Open()
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "không đọc được file ảnh")
	}
	defer file.Close()

	res, err := h.svc.UploadAvatar(c.UserContext(), currentUserID(c), file, fileHeader.Size)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(res)
}

// ServeAvatar godoc
// @Summary      Redirect sang URL thật của ảnh đại diện đã tải lên (public)
// @Tags         onboarding
// @Param        id   path  string  true  "Avatar ID"  format(uuid)
// @Success      302
// @Failure      404  {object}  ErrorResponse
// @Router       /users/avatars/{id} [get]
func (h *OnboardingHandler) ServeAvatar(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	url, err := h.svc.ResolveAvatarURL(c.UserContext(), id)
	if err != nil {
		return err
	}
	return c.Redirect(url, fiber.StatusFound)
}
