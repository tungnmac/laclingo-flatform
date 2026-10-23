package handler

import (
	"errors"
	"net/url"

	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

// PaymentHandler — thanh toán gói Pro / gems (VNPay, Stripe) + ví gems
type PaymentHandler struct {
	svc *service.PaymentService
}

func NewPaymentHandler(svc *service.PaymentService) *PaymentHandler {
	return &PaymentHandler{svc: svc}
}

// RegisterPublicRoutes — cổng thanh toán gọi về (không có token học viên; xác thực bằng chữ ký của cổng)
func (h *PaymentHandler) RegisterPublicRoutes(router fiber.Router) {
	router.Get("/billing/vnpay/ipn", h.VNPayIPN)
	router.Get("/billing/vnpay/return", h.VNPayReturn)
	router.Post("/billing/stripe/webhook", h.StripeWebhook)
}

func (h *PaymentHandler) RegisterRoutes(router fiber.Router) {
	api := router.Group("/billing")
	api.Get("/catalog", h.Catalog)
	api.Post("/checkout", h.Checkout)
	api.Get("/orders", h.ListOrders)
	api.Get("/orders/:id", h.GetOrder)
	api.Post("/portal", h.Portal)
	api.Get("/wallet", h.Wallet)
	api.Post("/wallet/streak-freeze", h.BuyStreakFreeze)
	api.Get("/rewards", h.PendingRewards)
	api.Post("/rewards/claim-all", h.ClaimAllRewards)
	api.Post("/rewards/:id/claim", h.ClaimReward)
}

func paymentError(err error) error {
	if errors.Is(err, service.ErrPaymentNotConfigured) {
		return fiber.NewError(fiber.StatusServiceUnavailable, err.Error())
	}
	return err
}

// Catalog godoc
// @Summary      Danh mục gói Pro / gói gems (giá VND + USD) và cổng thanh toán đang bật
// @Tags         billing
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  service.CatalogResponse
// @Router       /billing/catalog [get]
func (h *PaymentHandler) Catalog(c *fiber.Ctx) error {
	return c.JSON(h.svc.Catalog())
}

// Checkout godoc
// @Summary      Tạo đơn + URL thanh toán (VNPay: VND trả trước; Stripe: USD, gói tháng/năm tự gia hạn)
// @Tags         billing
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.CheckoutRequest  true  "Mặt hàng + cổng"
// @Success      200   {object}  service.CheckoutResponse
// @Failure      400   {object}  ErrorResponse
// @Failure      503   {object}  ErrorResponse  "Cổng chưa cấu hình"
// @Router       /billing/checkout [post]
func (h *PaymentHandler) Checkout(c *fiber.Ctx) error {
	var req service.CheckoutRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	out, err := h.svc.Checkout(c.UserContext(), currentUserID(c), req, c.IP())
	if err != nil {
		return paymentError(err)
	}
	return c.JSON(out)
}

// GetOrder godoc
// @Summary      Trạng thái 1 đơn thanh toán (trang kết quả)
// @Tags         billing
// @Produce      json
// @Security     BearerAuth
// @Param        id    path      string  true   "Order ID"  format(uuid)
// @Param        sync  query     bool    false  "true = đơn Stripe còn chờ thì hỏi lại Stripe (trang kết quả)"
// @Success      200   {object}  service.PaymentOrderInfo
// @Failure      404  {object}  ErrorResponse
// @Router       /billing/orders/{id} [get]
func (h *PaymentHandler) GetOrder(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	out, err := h.svc.GetOrder(c.UserContext(), currentUserID(c), id, c.QueryBool("sync"))
	if err != nil {
		return err
	}
	return c.JSON(out)
}

// ListOrders godoc
// @Summary      Lịch sử thanh toán (đơn đã xử lý, mới nhất trước)
// @Tags         billing
// @Produce      json
// @Security     BearerAuth
// @Success      200  {array}  service.PaymentOrderInfo
// @Router       /billing/orders [get]
func (h *PaymentHandler) ListOrders(c *fiber.Ctx) error {
	out, err := h.svc.ListOrders(c.UserContext(), currentUserID(c))
	if err != nil {
		return err
	}
	return c.JSON(out)
}

type portalResponse struct {
	URL string `json:"url"`
}

// Portal godoc
// @Summary      Link trang Stripe quản lý gói tự gia hạn (đổi thẻ, hoá đơn, huỷ)
// @Tags         billing
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  handler.portalResponse
// @Failure      400  {object}  ErrorResponse  "Chưa có gói Stripe"
// @Router       /billing/portal [post]
func (h *PaymentHandler) Portal(c *fiber.Ctx) error {
	u, err := h.svc.PortalURL(c.UserContext(), currentUserID(c))
	if err != nil {
		return paymentError(err)
	}
	return c.JSON(portalResponse{URL: u})
}

// Wallet godoc
// @Summary      Ví: số gems, Streak Freeze, lịch sử gems
// @Tags         billing
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  service.WalletResponse
// @Router       /billing/wallet [get]
func (h *PaymentHandler) Wallet(c *fiber.Ctx) error {
	out, err := h.svc.Wallet(c.UserContext(), currentUserID(c))
	if err != nil {
		return err
	}
	return c.JSON(out)
}

// BuyStreakFreeze godoc
// @Summary      Đổi gems lấy 1 Streak Freeze
// @Tags         billing
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  service.WalletResponse
// @Failure      400  {object}  ErrorResponse  "Không đủ gems / đã giữ tối đa"
// @Router       /billing/wallet/streak-freeze [post]
func (h *PaymentHandler) BuyStreakFreeze(c *fiber.Ctx) error {
	out, err := h.svc.BuyStreakFreeze(c.UserContext(), currentUserID(c))
	if err != nil {
		return err
	}
	return c.JSON(out)
}

// VNPayIPN godoc
// @Summary      VNPay IPN (server-to-server) — xác thực chữ ký, giao hàng
// @Tags         billing
// @Produce      json
// @Success      200  {object}  service.VNPayIPNResponse
// @Router       /billing/vnpay/ipn [get]
func (h *PaymentHandler) VNPayIPN(c *fiber.Ctx) error {
	return c.JSON(h.svc.VNPayIPN(c.UserContext(), queryValues(c)))
}

// VNPayReturn godoc
// @Summary      VNPay chuyển trình duyệt về sau khi thanh toán → xử lý như IPN rồi về trang kết quả
// @Tags         billing
// @Success      302
// @Router       /billing/vnpay/return [get]
func (h *PaymentHandler) VNPayReturn(c *fiber.Ctx) error {
	return c.Redirect(h.svc.VNPayReturn(c.UserContext(), queryValues(c)), fiber.StatusFound)
}

// StripeWebhook godoc
// @Summary      Webhook Stripe (xác thực Stripe-Signature) — thanh toán xong, gia hạn, huỷ gói
// @Tags         billing
// @Accept       json
// @Success      200
// @Failure      400  {object}  ErrorResponse
// @Router       /billing/stripe/webhook [post]
func (h *PaymentHandler) StripeWebhook(c *fiber.Ctx) error {
	if err := h.svc.StripeWebhook(c.UserContext(), c.Body(), c.Get("Stripe-Signature")); err != nil {
		return paymentError(err) // lỗi tạm (DB...) → 500, Stripe tự gửi lại
	}
	return c.SendStatus(fiber.StatusOK)
}

// queryValues — query string thô (giữ nguyên giá trị để kiểm chữ ký VNPay)
func queryValues(c *fiber.Ctx) url.Values {
	v, _ := url.ParseQuery(string(c.Request().URI().QueryString()))
	return v
}

// PendingRewards godoc
// @Summary      Quà gems chờ nhận (nhiệm vụ, thắng thử thách, lên level) + mức thưởng hiện tại
// @Tags         billing
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  service.PendingRewardsResponse
// @Router       /billing/rewards [get]
func (h *PaymentHandler) PendingRewards(c *fiber.Ctx) error {
	out, err := h.svc.PendingRewards(c.UserContext(), currentUserID(c))
	if err != nil {
		return err
	}
	return c.JSON(out)
}

// ClaimReward godoc
// @Summary      Nhận 1 quà gems vào ví
// @Tags         billing
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      string  true  "Reward ID"  format(uuid)
// @Success      200  {object}  service.WalletResponse
// @Failure      404  {object}  ErrorResponse  "Đã nhận / không có"
// @Router       /billing/rewards/{id}/claim [post]
func (h *PaymentHandler) ClaimReward(c *fiber.Ctx) error {
	id, err := parseUUIDParam(c, "id")
	if err != nil {
		return err
	}
	out, err := h.svc.ClaimReward(c.UserContext(), currentUserID(c), id)
	if err != nil {
		return err
	}
	return c.JSON(out)
}

// ClaimAllRewards godoc
// @Summary      Nhận tất cả quà gems đang chờ
// @Tags         billing
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  service.WalletResponse
// @Router       /billing/rewards/claim-all [post]
func (h *PaymentHandler) ClaimAllRewards(c *fiber.Ctx) error {
	out, err := h.svc.ClaimAllRewards(c.UserContext(), currentUserID(c))
	if err != nil {
		return err
	}
	return c.JSON(out)
}
