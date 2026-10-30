package handler

import (
	"encoding/json"
	"net/http/httptest"
	"testing"

	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

func TestListLocalesAndMiddlewareFollowConfig(t *testing.T) {
	service.SetUILocales([]string{"vi", "en", "fr"})
	t.Cleanup(func() { service.SetUILocales([]string{"vi", "en", "zh", "ja", "ko"}) })

	app := fiber.New()
	app.Use(ContentLocale())
	RegisterLocaleRoutes(app)
	app.Get("/ctx", func(c *fiber.Ctx) error { return c.SendString(service.ContentLocale(c.UserContext())) })

	resp, err := app.Test(httptest.NewRequest(fiber.MethodGet, "/locales", nil))
	if err != nil {
		t.Fatal(err)
	}
	var got []service.UILocale
	if err := json.NewDecoder(resp.Body).Decode(&got); err != nil {
		t.Fatal(err)
	}
	if len(got) != 3 || got[0].Code != "vi" || got[2] != (service.UILocale{Code: "fr", NativeName: "Français", Flag: "🇫🇷"}) {
		t.Fatalf("/locales = %+v", got)
	}

	for header, want := range map[string]string{"fr-FR": "fr", "ja": "", "en": "en"} {
		req := httptest.NewRequest(fiber.MethodGet, "/ctx", nil)
		req.Header.Set("Accept-Language", header)
		resp, err := app.Test(req)
		if err != nil {
			t.Fatal(err)
		}
		buf := make([]byte, 16)
		n, _ := resp.Body.Read(buf)
		if string(buf[:n]) != want {
			t.Errorf("Accept-Language %q → %q, want %q", header, buf[:n], want)
		}
	}
}
