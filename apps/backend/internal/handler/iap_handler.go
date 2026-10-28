package handler

import "github.com/gofiber/fiber/v2"

// Mua trong app iOS/Android (Apple In-App Purchase, Google Play Billing) — xem service/iap.go

type appleVerifyRequest struct {
	JWS string `json:"jws"` // jwsRepresentation của giao dịch StoreKit 2
}

type googleVerifyRequest struct {
	ProductID     string `json:"product_id" example:"laclingo.pro.monthly"`
	PurchaseToken string `json:"purchase_token"`
}

// VerifyApple godoc
// @Summary      Xác thực giao dịch mua trong app iOS
// @Description  App gửi jwsRepresentation sau khi mua / khôi phục; server kiểm chữ ký Apple rồi giao hàng (1 lần / giao dịch).
// @Tags         billing
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      appleVerifyRequest  true  "Giao dịch StoreKit 2"
// @Success      200   {object}  service.IAPResult
// @Failure      400   {object}  ErrorResponse
// @Failure      403   {object}  ErrorResponse
// @Failure      503   {object}  ErrorResponse
// @Router       /billing/iap/apple [post]
func (h *PaymentHandler) VerifyApple(c *fiber.Ctx) error {
	var req appleVerifyRequest
	if err := c.BodyParser(&req); err != nil || req.JWS == "" {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	res, err := h.svc.VerifyApple(c.UserContext(), currentUserID(c), req.JWS)
	if err != nil {
		return paymentError(err)
	}
	return c.JSON(res)
}

// VerifyGoogle godoc
// @Summary      Xác thực giao dịch mua trong app Android
// @Description  App gửi purchaseToken sau khi mua / khôi phục; server tra Google Play Developer API rồi giao hàng (1 lần / giao dịch).
// @Tags         billing
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      googleVerifyRequest  true  "Giao dịch Google Play"
// @Success      200   {object}  service.IAPResult
// @Failure      400   {object}  ErrorResponse
// @Failure      403   {object}  ErrorResponse
// @Failure      503   {object}  ErrorResponse
// @Router       /billing/iap/google [post]
func (h *PaymentHandler) VerifyGoogle(c *fiber.Ctx) error {
	var req googleVerifyRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	res, err := h.svc.VerifyGoogle(c.UserContext(), currentUserID(c), req.ProductID, req.PurchaseToken)
	if err != nil {
		return paymentError(err)
	}
	return c.JSON(res)
}

// AppleNotification — App Store Server Notifications V2 (URL khai báo ở App Store Connect). Lỗi tạm → 500, Apple gửi lại.
func (h *PaymentHandler) AppleNotification(c *fiber.Ctx) error {
	var req struct {
		SignedPayload string `json:"signedPayload"`
	}
	if err := c.BodyParser(&req); err != nil || req.SignedPayload == "" {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	if err := h.svc.AppleNotification(c.UserContext(), req.SignedPayload); err != nil {
		return paymentError(err)
	}
	return c.SendStatus(fiber.StatusOK)
}

// GoogleNotification — Google Play RTDN qua Pub/Sub push (URL push có ?token=<GOOGLE_PLAY_RTDN_TOKEN>). Lỗi tạm → 500,
// Pub/Sub gửi lại.
func (h *PaymentHandler) GoogleNotification(c *fiber.Ctx) error {
	if err := h.svc.GoogleNotification(c.UserContext(), c.Query("token"), c.Body()); err != nil {
		return paymentError(err)
	}
	return c.SendStatus(fiber.StatusOK)
}
