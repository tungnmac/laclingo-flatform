package handler

import (
	"io"
	"net/http/httptest"
	"testing"

	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

func TestContentLocaleMiddleware(t *testing.T) {
	app := fiber.New()
	app.Use(ContentLocale())
	app.Get("/", func(c *fiber.Ctx) error { return c.SendString(service.ContentLocale(c.UserContext())) })
	for header, want := range map[string]string{"": "", "vi-VN": "", "en-US,en;q=0.9": "en", "ko": "ko"} {
		req := httptest.NewRequest(fiber.MethodGet, "/", nil)
		if header != "" {
			req.Header.Set("Accept-Language", header)
		}
		resp, err := app.Test(req)
		if err != nil {
			t.Fatal(err)
		}
		body, _ := io.ReadAll(resp.Body)
		if string(body) != want {
			t.Errorf("Accept-Language %q → %q, want %q", header, body, want)
		}
	}
}
