package handler

import (
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestClientIP(t *testing.T) {
	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error { return c.SendString(clientIP(c)) })
	ip := func(xff string) string {
		req := httptest.NewRequest(fiber.MethodGet, "/", nil)
		if xff != "" {
			req.Header.Set(fiber.HeaderXForwardedFor, xff)
		}
		resp, err := app.Test(req, -1)
		if err != nil {
			t.Fatal(err)
		}
		b, _ := io.ReadAll(resp.Body)
		return string(b)
	}
	t.Cleanup(func() { _ = SetTrustedProxies(nil) })

	// Không khai báo proxy: luôn là IP kết nối (app.Test kết nối từ 0.0.0.0), bỏ qua header client tự gửi
	_ = SetTrustedProxies(nil)
	if got := ip("6.6.6.6"); got != "0.0.0.0" {
		t.Errorf("không có proxy tin cậy: muốn IP kết nối, nhận %q", got)
	}

	// Kết nối từ proxy tin cậy: client tự thêm "6.6.6.6" bên trái, proxy nối IP thật 1.2.3.4 vào cuối
	if err := SetTrustedProxies([]string{"0.0.0.0"}); err != nil {
		t.Fatal(err)
	}
	if got := ip("6.6.6.6, 1.2.3.4"); got != "1.2.3.4" {
		t.Errorf("phải lấy hop bên phải (IP proxy thấy), nhận %q", got)
	}
	// 2 tầng proxy (CDN 10.0.0.0/8 → nginx)
	if err := SetTrustedProxies([]string{"0.0.0.0", "10.0.0.0/8"}); err != nil {
		t.Fatal(err)
	}
	if got := ip("6.6.6.6, 1.2.3.4, 10.1.2.3"); got != "1.2.3.4" {
		t.Errorf("bỏ qua hop là proxy tin cậy, nhận %q", got)
	}
	if got := ip("rác, 1.2.3.4"); got != "1.2.3.4" {
		t.Errorf("hop hỏng bên trái không ảnh hưởng, nhận %q", got)
	}
	if err := SetTrustedProxies([]string{"không-phải-ip"}); err == nil {
		t.Error("TRUSTED_PROXIES sai phải báo lỗi")
	}
}
