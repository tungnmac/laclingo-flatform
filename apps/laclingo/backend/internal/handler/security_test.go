package handler

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestClientIPHeader(t *testing.T) {
	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error { return c.SendString(clientIP(c)) })
	ip := func(header string) string {
		req := httptest.NewRequest(fiber.MethodGet, "/", nil)
		if header != "" {
			req.Header.Set("CF-Connecting-IP", header)
		}
		resp, err := app.Test(req, -1)
		if err != nil {
			t.Fatal(err)
		}
		b, _ := io.ReadAll(resp.Body)
		return string(b)
	}
	t.Cleanup(func() { SetClientIPHeader("") })

	SetClientIPHeader("")
	if got := ip("6.6.6.6"); got != "0.0.0.0" {
		t.Errorf("chưa bật header: không được tin header client gửi, nhận %q", got)
	}
	SetClientIPHeader("CF-Connecting-IP")
	if got := ip("1.2.3.4"); got != "1.2.3.4" {
		t.Errorf("bật header: phải lấy IP từ header, nhận %q", got)
	}
	if got := ip("2001:db8::1"); got != "2001:db8::1" {
		t.Errorf("IPv6: nhận %q", got)
	}
	if got := ip("không-phải-ip"); got != "0.0.0.0" {
		t.Errorf("header hỏng: quay về IP kết nối, nhận %q", got)
	}
	if got := ip(""); got != "0.0.0.0" {
		t.Errorf("thiếu header: quay về IP kết nối, nhận %q", got)
	}
}

func TestRateLimit(t *testing.T) {
	SetClientIPHeader("CF-Connecting-IP")
	t.Cleanup(func() { SetClientIPHeader("") })
	app := fiber.New()
	app.Use(RateLimit(3))
	app.All("/*", func(c *fiber.Ctx) error { return c.SendStatus(fiber.StatusOK) })
	status := func(method, path, ip string) int {
		req := httptest.NewRequest(method, path, nil)
		req.Header.Set("CF-Connecting-IP", ip)
		resp, err := app.Test(req, -1)
		if err != nil {
			t.Fatal(err)
		}
		return resp.StatusCode
	}

	for i := 0; i < 3; i++ {
		if got := status(fiber.MethodGet, "/api/v1/languages", "1.1.1.1"); got != fiber.StatusOK {
			t.Fatalf("request %d trong giới hạn: %d", i+1, got)
		}
	}
	if got := status(fiber.MethodGet, "/api/v1/languages", "1.1.1.1"); got != fiber.StatusTooManyRequests {
		t.Errorf("vượt giới hạn: muốn 429, nhận %d", got)
	}
	if got := status(fiber.MethodGet, "/api/v1/languages", "2.2.2.2"); got != fiber.StatusOK {
		t.Errorf("IP khác đếm riêng: nhận %d", got)
	}
	if got := status(fiber.MethodGet, "/health", "1.1.1.1"); got != fiber.StatusOK {
		t.Errorf("/health không bị giới hạn: nhận %d", got)
	}
	if got := status(fiber.MethodOptions, "/api/v1/languages", "1.1.1.1"); got != fiber.StatusOK {
		t.Errorf("preflight CORS không bị giới hạn: nhận %d", got)
	}
}

func TestRateLimitDisabled(t *testing.T) {
	app := fiber.New()
	app.Use(RateLimit(0))
	app.Get("/", func(c *fiber.Ctx) error { return c.SendStatus(fiber.StatusOK) })
	for i := 0; i < 20; i++ {
		resp, _ := app.Test(httptest.NewRequest(fiber.MethodGet, "/", nil), -1)
		if resp.StatusCode != fiber.StatusOK {
			t.Fatalf("RateLimit(0) phải tắt, nhận %d", resp.StatusCode)
		}
	}
}

func TestSecurityHeaders(t *testing.T) {
	for _, production := range []bool{false, true} {
		app := fiber.New()
		app.Use(SecurityHeaders(production))
		app.Get("/", func(c *fiber.Ctx) error { return c.SendStatus(fiber.StatusOK) })
		resp, _ := app.Test(httptest.NewRequest(fiber.MethodGet, "/", nil), -1)
		if resp.Header.Get("X-Content-Type-Options") != "nosniff" || resp.Header.Get("X-Frame-Options") != "DENY" {
			t.Errorf("thiếu header bảo mật: %v", resp.Header)
		}
		if hsts := resp.Header.Get("Strict-Transport-Security"); (hsts != "") != production {
			t.Errorf("production=%v: HSTS = %q", production, hsts)
		}
		if resp.Header.Get("Cross-Origin-Resource-Policy") != "" {
			t.Error("không được chặn web domain khác nạp ảnh / audio từ API")
		}
	}
}

func TestRateLimitIPv6Prefix(t *testing.T) {
	SetClientIPHeader("CF-Connecting-IP")
	t.Cleanup(func() { SetClientIPHeader("") })
	app := fiber.New()
	app.Use(RateLimit(2))
	app.Get("/", func(c *fiber.Ctx) error { return c.SendStatus(fiber.StatusOK) })
	get := func(ip string) *http.Response {
		req := httptest.NewRequest(fiber.MethodGet, "/", nil)
		req.Header.Set("CF-Connecting-IP", ip)
		resp, err := app.Test(req, -1)
		if err != nil {
			t.Fatal(err)
		}
		return resp
	}
	// Cùng dải /64, đổi địa chỉ vẫn chung 1 bộ đếm
	get("2001:db8:1:2::1")
	get("2001:db8:1:2::abcd")
	resp := get("2001:db8:1:2:ffff::9")
	if resp.StatusCode != fiber.StatusTooManyRequests {
		t.Fatalf("đổi địa chỉ trong cùng /64 phải bị giới hạn, nhận %d", resp.StatusCode)
	}
	b, _ := io.ReadAll(resp.Body)
	if !strings.Contains(string(b), `"code":"rate_limited"`) {
		t.Errorf("429 giới hạn chung phải có code rate_limited: %s", b)
	}
	if got := get("2001:db8:1:3::1").StatusCode; got != fiber.StatusOK {
		t.Errorf("dải /64 khác đếm riêng, nhận %d", got)
	}
}

func TestClientIPHeaderWithTrustedProxies(t *testing.T) {
	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error { return c.SendString(clientIP(c)) })
	ip := func() string {
		req := httptest.NewRequest(fiber.MethodGet, "/", nil)
		req.Header.Set("CF-Connecting-IP", "6.6.6.6")
		resp, _ := app.Test(req, -1)
		b, _ := io.ReadAll(resp.Body)
		return string(b)
	}
	SetClientIPHeader("CF-Connecting-IP")
	t.Cleanup(func() { SetClientIPHeader(""); _ = SetTrustedProxies(nil) })

	// Kết nối (0.0.0.0) không phải proxy tin cậy → không tin header client tự gửi
	_ = SetTrustedProxies([]string{"10.0.0.0/8"})
	if got := ip(); got != "0.0.0.0" {
		t.Errorf("kết nối không qua proxy tin cậy: không được tin header, nhận %q", got)
	}
	// Kết nối từ proxy tin cậy → tin header
	_ = SetTrustedProxies([]string{"0.0.0.0"})
	if got := ip(); got != "6.6.6.6" {
		t.Errorf("qua proxy tin cậy: phải lấy header, nhận %q", got)
	}
}
