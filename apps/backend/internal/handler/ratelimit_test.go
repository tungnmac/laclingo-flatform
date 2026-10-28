package handler

import (
	"context"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"laclingo-backend/internal/repository/db"
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// noUserRepo — mọi lần đăng nhập đều sai (không có tài khoản)
type noUserRepo struct{ service.AuthRepository }

func (noUserRepo) GetUserByIdentifier(context.Context, string) (db.User, error) {
	return db.User{}, pgx.ErrNoRows
}

type noTokens struct{}

func (noTokens) Issue(uuid.UUID) (string, time.Time, error) { return "", time.Time{}, nil }
func (noTokens) RefreshTTL() time.Duration                  { return time.Hour }

func TestLoginRateLimit(t *testing.T) {
	app := fiber.New(fiber.Config{ErrorHandler: ErrorHandler})
	NewAuthHandler(service.NewAuthService(noUserRepo{}, noTokens{}, nil, nil)).RegisterRoutes(app)
	login := func(identifier string) int {
		req := httptest.NewRequest(fiber.MethodPost, "/auth/login", strings.NewReader(`{"identifier":"`+identifier+`","password":"sai"}`))
		req.Header.Set("Content-Type", "application/json")
		resp, err := app.Test(req, -1)
		if err != nil {
			t.Fatal(err)
		}
		return resp.StatusCode
	}
	for i := 1; i <= 5; i++ {
		if code := login("Lan@Test.Local"); code != fiber.StatusUnauthorized {
			t.Fatalf("lần sai thứ %d: muốn 401, nhận %d", i, code)
		}
	}
	if code := login(" lan@test.local "); code != fiber.StatusTooManyRequests {
		t.Fatalf("lần thứ 6 (cùng tài khoản, khác hoa thường/khoảng trắng) phải bị chặn 429, nhận %d", code)
	}
	if code := login("hoa@test.local"); code != fiber.StatusUnauthorized {
		t.Fatalf("tài khoản khác vẫn thử được (chưa quá giới hạn IP), nhận %d", code)
	}
}
