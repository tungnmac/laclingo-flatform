package handler

import (
	"time"

	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

type ReminderHandler struct {
	svc *service.ReminderService
}

func NewReminderHandler(svc *service.ReminderService) *ReminderHandler {
	return &ReminderHandler{svc: svc}
}

// RegisterRoutes gắn route nhắc học của học viên — cần đăng nhập
func (h *ReminderHandler) RegisterRoutes(router fiber.Router) {
	push := router.Group("/notifications/push")
	push.Get("/public-key", h.PublicKey)
	push.Post("/subscriptions", h.Subscribe)
	push.Delete("/subscriptions", h.Unsubscribe)
	push.Post("/native", h.SubscribeNative)
	push.Post("/test", h.SendTest)

	settings := router.Group("/reminder-settings")
	settings.Get("", h.GetMySettings)
	settings.Put("", h.UpdateMySettings)
	settings.Delete("", h.ResetMySettings)
	settings.Put("/timezone", h.UpdateTimezone)
}

// RegisterAdminRoutes — lịch nhắc mặc định, PHẢI nằm sau RequireModule (module "reminders")
func (h *ReminderHandler) RegisterAdminRoutes(router fiber.Router) {
	router.Get("/admin/reminder-defaults", h.GetDefaults)
	router.Put("/admin/reminder-defaults", h.UpdateDefaults)
}

type pushPublicKeyResponse struct {
	PublicKey  string `json:"public_key"`
	Configured bool   `json:"configured"`
}

// PublicKey godoc
// @Summary      Khoá VAPID công khai để đăng ký web push
// @Tags         reminders
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  pushPublicKeyResponse
// @Router       /notifications/push/public-key [get]
func (h *ReminderHandler) PublicKey(c *fiber.Ctx) error {
	key, ok := h.svc.PushPublicKey()
	return c.JSON(pushPublicKeyResponse{PublicKey: key, Configured: ok})
}

// Subscribe godoc
// @Summary      Bật nhận thông báo nhắc học trên trình duyệt này
// @Tags         reminders
// @Accept       json
// @Security     BearerAuth
// @Param        body  body  service.PushSubscriptionRequest  true  "Subscription từ PushManager.subscribe() + múi giờ trình duyệt"
// @Success      204
// @Failure      400   {object}  ErrorResponse
// @Router       /notifications/push/subscriptions [post]
func (h *ReminderHandler) Subscribe(c *fiber.Ctx) error {
	var req service.PushSubscriptionRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	if err := h.svc.Subscribe(c.UserContext(), currentUserID(c), req); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// SubscribeNative godoc
// @Summary      Bật thông báo đẩy trên app iOS/Android (FCM)
// @Description  Tắt: gọi DELETE /notifications/push/subscriptions với endpoint = token.
// @Tags         reminders
// @Accept       json
// @Security     BearerAuth
// @Param        body  body  service.NativePushRequest  true  "FCM token + múi giờ thiết bị"
// @Success      204
// @Failure      400   {object}  ErrorResponse
// @Router       /notifications/push/native [post]
func (h *ReminderHandler) SubscribeNative(c *fiber.Ctx) error {
	var req service.NativePushRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	if err := h.svc.SubscribeNative(c.UserContext(), currentUserID(c), req); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

type unsubscribeRequest struct {
	Endpoint string `json:"endpoint"`
}

// Unsubscribe godoc
// @Summary      Tắt nhận thông báo trên trình duyệt này
// @Tags         reminders
// @Accept       json
// @Security     BearerAuth
// @Param        body  body  unsubscribeRequest  true  "endpoint của subscription"
// @Success      204
// @Router       /notifications/push/subscriptions [delete]
func (h *ReminderHandler) Unsubscribe(c *fiber.Ctx) error {
	var req unsubscribeRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	if err := h.svc.Unsubscribe(c.UserContext(), currentUserID(c), req.Endpoint); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

type sendTestResponse struct {
	Sent int `json:"sent"`
	// Hẹn gửi sau bấy nhiêu giây (gửi thử có ?delay_seconds=) — sent là số thiết bị sẽ nhận
	DelaySeconds int `json:"delay_seconds,omitempty"`
}

// SendTest godoc
// @Summary      Gửi thử 1 thông báo tới mọi thiết bị của tôi
// @Tags         reminders
// @Produce      json
// @Security     BearerAuth
// @Param        delay_seconds  query  int  false  "Hẹn gửi sau N giây (1-30) — để kịp thoát app xem thông báo hiện ra"
// @Success      200  {object}  sendTestResponse
// @Failure      404  {object}  ErrorResponse
// @Router       /notifications/push/test [post]
func (h *ReminderHandler) SendTest(c *fiber.Ctx) error {
	if delay := c.QueryInt("delay_seconds"); delay > 0 {
		devices, err := h.svc.SendTestLater(c.UserContext(), currentUserID(c), time.Duration(delay)*time.Second)
		if err != nil {
			return err
		}
		return c.JSON(sendTestResponse{Sent: devices, DelaySeconds: delay})
	}
	sent, err := h.svc.SendTest(c.UserContext(), currentUserID(c))
	if err != nil {
		return err
	}
	return c.JSON(sendTestResponse{Sent: sent})
}

type timezoneRequest struct {
	Timezone string `json:"timezone" example:"Asia/Ho_Chi_Minh"`
}

// UpdateTimezone godoc
// @Summary      Lưu múi giờ trình duyệt (để nhắc học đúng giờ địa phương)
// @Tags         reminders
// @Accept       json
// @Security     BearerAuth
// @Param        body  body  timezoneRequest  true  "Múi giờ IANA từ Intl của trình duyệt"
// @Success      204
// @Failure      400  {object}  ErrorResponse
// @Router       /reminder-settings/timezone [put]
func (h *ReminderHandler) UpdateTimezone(c *fiber.Ctx) error {
	var req timezoneRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	if err := h.svc.UpdateTimezone(c.UserContext(), currentUserID(c), req.Timezone); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// GetMySettings godoc
// @Summary      Lịch nhắc học của tôi
// @Tags         reminders
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  service.MyReminderSettings
// @Router       /reminder-settings [get]
func (h *ReminderHandler) GetMySettings(c *fiber.Ctx) error {
	result, err := h.svc.GetMySettings(c.UserContext(), currentUserID(c))
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// UpdateMySettings godoc
// @Summary      Tự chỉnh lịch nhắc học (không còn theo mặc định)
// @Tags         reminders
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.ReminderSchedule  true  "Lịch nhắc"
// @Success      200   {object}  service.MyReminderSettings
// @Failure      400   {object}  ErrorResponse
// @Router       /reminder-settings [put]
func (h *ReminderHandler) UpdateMySettings(c *fiber.Ctx) error {
	var req service.ReminderSchedule
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.UpdateMySettings(c.UserContext(), currentUserID(c), req)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// ResetMySettings godoc
// @Summary      Quay về lịch nhắc mặc định
// @Tags         reminders
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  service.MyReminderSettings
// @Router       /reminder-settings [delete]
func (h *ReminderHandler) ResetMySettings(c *fiber.Ctx) error {
	result, err := h.svc.ResetMySettings(c.UserContext(), currentUserID(c))
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// GetDefaults godoc
// @Summary      Lịch nhắc học mặc định (admin)
// @Tags         admin-reminders
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  service.ReminderSchedule
// @Router       /admin/reminder-defaults [get]
func (h *ReminderHandler) GetDefaults(c *fiber.Ctx) error {
	result, err := h.svc.GetDefaults(c.UserContext())
	if err != nil {
		return err
	}
	return c.JSON(result)
}

// UpdateDefaults godoc
// @Summary      Sửa lịch nhắc học mặc định (admin)
// @Description  Áp dụng cho mọi học viên chưa tự chỉnh lịch.
// @Tags         admin-reminders
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body  body      service.ReminderSchedule  true  "Lịch nhắc mặc định"
// @Success      200   {object}  service.ReminderSchedule
// @Failure      400   {object}  ErrorResponse
// @Router       /admin/reminder-defaults [put]
func (h *ReminderHandler) UpdateDefaults(c *fiber.Ctx) error {
	var req service.ReminderSchedule
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "body không hợp lệ")
	}
	result, err := h.svc.UpdateDefaults(c.UserContext(), req)
	if err != nil {
		return err
	}
	return c.JSON(result)
}
