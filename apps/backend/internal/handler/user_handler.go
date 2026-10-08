package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type UserHandler struct {
	svc *service.UserService
}

func NewUserHandler(svc *service.UserService) *UserHandler {
	return &UserHandler{
		svc: svc,
	}
}

func (h *UserHandler) RegisterRoutes(router fiber.Router) {
	api := router.Group("/users")
	api.Get("", h.List)
	// /me phải đăng ký trước /:id để không bị match nhầm
	api.Get("/me", h.GetMe)
	api.Patch("/me", h.UpdateMe)
	api.Get("/:id", h.GetByID)
	router.Get("/leaderboard", h.GetLeaderboard)
}

// RegisterAdminRoutes gắn route quản lý học viên — PHẢI nằm sau RequireAdmin
// trong chain (đăng ký ở router.go).
func (h *UserHandler) RegisterAdminRoutes(router fiber.Router) {
	api := router.Group("/admin/users")
	api.Get("", h.ListUsersAdmin)
	api.Put("/:id/role", h.SetRole)
}

// ListUsersAdmin godoc
// @Summary      Danh sách học viên (admin)
// @Description  Search theo username/email/họ tên, lọc theo role, phân trang.
// @Tags         admin-users
// @Produce      json
// @Security     BearerAuth
// @Param        q     query     string  false  "Tìm theo username/email/họ tên"
// @Param        role  query     string  false  "user | admin"
// @Param        page  query     int     false  "Trang (mặc định 1)"
// @Success      200   {array}   service.UserResponse
// @Router       /admin/users [get]
func (h *UserHandler) ListUsersAdmin(c *fiber.Ctx) error {
	page, pageSize := pageParams(c)
	results, err := h.svc.ListUsersAdmin(c.UserContext(), c.Query("q"), c.Query("role"), page, pageSize)
	if err != nil {
		return err
	}
	return c.JSON(results)
}

type setUserRoleRequest struct {
	Role string `json:"role" example:"admin" enums:"user,admin"`
}

// SetRole godoc
// @Summary      Cấp/thu hồi quyền admin (admin)
// @Description  Không cho tự thu hồi quyền admin của chính mình.
// @Tags         admin-users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string               true  "User ID (UUID)"
// @Param        body  body      setUserRoleRequest  true  "Role mới"
// @Success      200   {object}  service.UserResponse
// @Failure      400   {object}  ErrorResponse
// @Router       /admin/users/{id}/role [put]
func (h *UserHandler) SetRole(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}
	var req setUserRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.SetRole(c.UserContext(), currentUserID(c), id, req.Role)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// GetMe godoc
// @Summary      Thông tin user đang đăng nhập
// @Tags         users
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  service.UserResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Router       /users/me [get]
func (h *UserHandler) GetMe(c *fiber.Ctx) error {
	result, err := h.svc.GetByID(c.UserContext(), currentUserID(c))
	if err != nil {
		return err
	}

	return c.JSON(result)
}

// UpdateMe godoc
// @Summary      Cập nhật hồ sơ của user đang đăng nhập
// @Description  Chỉ cập nhật các field được gửi lên.
// @Tags         users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.UpdateProfileRequest  true  "Thông tin cần cập nhật"
// @Success      200   {object}  service.UserResponse
// @Failure      400   {object}  ErrorResponse
// @Failure      401   {object}  ErrorResponse
// @Router       /users/me [patch]
func (h *UserHandler) UpdateMe(c *fiber.Ctx) error {
	var req service.UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}

	result, err := h.svc.UpdateProfile(c.UserContext(), currentUserID(c), req)
	if err != nil {
		return err
	}

	return c.JSON(result)
}

// GetByID godoc
// @Summary      Lấy thông tin user
// @Tags         users
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "User ID (UUID)"  format(uuid)
// @Success      200  {object}  service.UserResponse
// @Failure      400  {object}  ErrorResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      404  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /users/{id} [get]
func (h *UserHandler) GetByID(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID không hợp lệ")
	}

	result, err := h.svc.GetByID(c.UserContext(), id)
	if err != nil {
		return err
	}

	return c.JSON(result)
}

// List godoc
// @Summary      Danh sách user
// @Tags         users
// @Produce      json
// @Security     BearerAuth
// @Success      200  {array}   service.UserResponse
// @Failure      401  {object}  ErrorResponse
// @Failure      500  {object}  ErrorResponse
// @Router       /users [get]
func (h *UserHandler) List(c *fiber.Ctx) error {
	results, err := h.svc.List(c.UserContext())
	if err != nil {
		return err
	}

	return c.JSON(results)
}

// GetLeaderboard godoc
// @Summary      Bảng xếp hạng người học
// @Description  Sort theo level, điểm thách đấu (points), hoặc streak (mặc định).
// @Tags         users
// @Produce      json
// @Security     BearerAuth
// @Param        by   query     string  false  "level | points | streak"  example(level)
// @Success      200  {array}   service.LeaderboardEntry
// @Failure      400  {object}  ErrorResponse
// @Failure      401  {object}  ErrorResponse
// @Router       /leaderboard [get]
func (h *UserHandler) GetLeaderboard(c *fiber.Ctx) error {
	results, err := h.svc.GetLeaderboard(c.UserContext(), c.Query("by"))
	if err != nil {
		return err
	}

	return c.JSON(results)
}
