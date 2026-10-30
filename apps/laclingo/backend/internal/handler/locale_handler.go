package handler

import (
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

// RegisterLocaleRoutes — danh sách ngôn ngữ giao diện (công khai: trang đăng nhập cũng có ô chọn ngôn ngữ)
func RegisterLocaleRoutes(router fiber.Router) {
	router.Get("/locales", ListLocales)
}

// ListLocales godoc
// @Summary      Ngôn ngữ giao diện đang cấu hình (UI_LOCALES) — tiếng Việt đứng đầu; nội dung học được dịch sẵn sang các ngôn ngữ còn lại
// @Tags         languages
// @Produce      json
// @Success      200  {array}   service.UILocale
// @Router       /locales [get]
func ListLocales(c *fiber.Ctx) error {
	return c.JSON(service.ListUILocales())
}
