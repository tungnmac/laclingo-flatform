package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

// BillingHandler — gói LacLingo Pro của học viên + admin cấp/thu Pro thủ công (chưa có thanh toán online)
type BillingHandler struct {
	svc *service.PlanService
}

func NewBillingHandler(svc *service.PlanService) *BillingHandler {
	return &BillingHandler{svc: svc}
}

func (h *BillingHandler) RegisterRoutes(router fiber.Router) {
	router.Get("/billing/me", h.Me)
}

// RegisterAdminRoutes — dưới /admin/users nên cần module "users" (RequireModule suy từ path)
func (h *BillingHandler) RegisterAdminRoutes(router fiber.Router) {
	api := router.Group("/admin/users/:id/subscription")
	api.Get("", h.AdminGet)
	api.Put("", h.AdminGrant)
	api.Delete("", h.AdminRevoke)
}

// LimitErrorResponse — hết lượt dùng hôm nay. code: pro_required (gói Free, 402) | daily_limit (Pro, 429)
type LimitErrorResponse struct {
	Error   string `json:"error"`
	Code    string `json:"code" enums:"pro_required,daily_limit"`
	Feature string `json:"feature" enums:"srs_review,speaking,sentence_analysis"`
	Limit   int    `json:"limit"`
}

// Me godoc
// @Summary      Gói hiện tại, lượt dùng hôm nay, vật phẩm (Streak Freeze, gems)
// @Tags         billing
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  service.PlanStatus
// @Router       /billing/me [get]
func (h *BillingHandler) Me(c *fiber.Ctx) error {
	out, err := h.svc.Status(c.UserContext(), currentUserID(c))
	if err != nil {
		return err
	}
	return c.JSON(out)
}

// AdminGet godoc
// @Summary      Gói đang hiệu lực của 1 học viên (null = Free)
// @Tags         admin-users
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "User ID"  format(uuid)
// @Success      200  {object}  service.SubscriptionInfo
// @Failure      404  {object}  ErrorResponse
// @Router       /admin/users/{id}/subscription [get]
func (h *BillingHandler) AdminGet(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	out, err := h.svc.AdminSubscription(c.UserContext(), id)
	if err != nil {
		return err
	}
	return c.JSON(out)
}

// AdminGrant godoc
// @Summary      Cấp gói Pro cho học viên (thay gói đang có)
// @Description  MONTHLY = 1 tháng, YEARLY = 1 năm tính từ bây giờ; LIFETIME không hết hạn. Ghi payment_provider = ADMIN.
// @Tags         admin-users
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string                            true  "User ID"  format(uuid)
// @Param        body  body      service.GrantSubscriptionRequest  true  "Gói"
// @Success      200   {object}  service.SubscriptionInfo
// @Failure      400   {object}  ErrorResponse
// @Failure      404   {object}  ErrorResponse
// @Router       /admin/users/{id}/subscription [put]
func (h *BillingHandler) AdminGrant(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	var req service.GrantSubscriptionRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	out, err := h.svc.Grant(c.UserContext(), currentUserID(c), id, req)
	if err != nil {
		return err
	}
	return c.JSON(out)
}

// AdminRevoke godoc
// @Summary      Thu hồi gói Pro của học viên (về Free)
// @Tags         admin-users
// @Security     BearerAuth
// @Param        id  path  string  true  "User ID"  format(uuid)
// @Success      204
// @Router       /admin/users/{id}/subscription [delete]
func (h *BillingHandler) AdminRevoke(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	if err := h.svc.Revoke(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}
