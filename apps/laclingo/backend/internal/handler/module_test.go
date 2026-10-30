package handler

import (
	"context"
	"net/http/httptest"
	"testing"

	"laclingo-backend/internal/repository/db"
	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// moduleUserRepo chỉ cài GetUserByID — RequireModule đọc quyền của user từ DB mỗi request
type moduleUserRepo struct {
	service.UserRepository
	user db.User
}

func (r moduleUserRepo) GetUserByID(context.Context, pgtype.UUID) (db.User, error) { return r.user, nil }

func TestRequireModuleBlocksDeactivatedAdmin(t *testing.T) {
	id := uuid.New()
	for _, tc := range []struct {
		name   string
		user   db.User
		status int
	}{
		{"admin có module", db.User{Role: "admin", AdminModules: []string{"users"}, IsActive: true}, fiber.StatusOK},
		{"admin bị khoá", db.User{Role: "admin", AdminModules: []string{"users"}, IsActive: false}, fiber.StatusForbidden},
		{"owner bị khoá", db.User{Role: "owner", IsActive: false}, fiber.StatusForbidden},
	} {
		t.Run(tc.name, func(t *testing.T) {
			tc.user.ID = pgtype.UUID{Bytes: id, Valid: true}
			app := fiber.New()
			app.Use(func(c *fiber.Ctx) error { c.Locals(userIDKey, id); return c.Next() })
			app.Get("/api/v1/admin/users", RequireModule(service.NewUserService(moduleUserRepo{user: tc.user})), func(c *fiber.Ctx) error {
				return c.SendStatus(fiber.StatusOK)
			})
			resp, err := app.Test(httptest.NewRequest("GET", "/api/v1/admin/users", nil))
			if err != nil || resp.StatusCode != tc.status {
				t.Fatalf("status=%v err=%v, muốn %d", resp.StatusCode, err, tc.status)
			}
		})
	}
}
