#!/usr/bin/env bash

set -e

# Kiểm tra xem người dùng có truyền tên module không
if [ -z "$1" ]; then
  echo "❌ Lỗi: Vui lòng truyền tên module/domain (ví dụ: ./scripts/gen_module.sh user)"
  exit 1
fi

MODULE_NAME=$1
MODULE_LOWER=$(echo "$MODULE_NAME" | tr '[:upper:]' '[:lower:]')
MODULE_CAPITAL="$(tr '[:lower:]' '[:upper:]' <<< ${MODULE_LOWER:0:1})${MODULE_LOWER:1}"

BASE_DIR="apps/backend/internal"

echo "🚀 Đang tạo cấu trúc code boilerplate cho module: '${MODULE_NAME}'..."

# 1. Tạo các thư mục cần thiết
mkdir -p "$BASE_DIR/config"
mkdir -p "$BASE_DIR/handler"
mkdir -p "$BASE_DIR/service"
mkdir -p "$BASE_DIR/repository"

# ==========================================
# 2. FILE CONFIG (apps/backend/internal/config/config.go)
# ==========================================
CONFIG_FILE="$BASE_DIR/config/config.go"
if [ ! -f "$CONFIG_FILE" ]; then
  cat << 'EOF' > "$CONFIG_FILE"
package config

import (
	"fmt"
	"os"
)

type Config struct {
	Port        string
	DatabaseURL string
	AppEnv      string
}

func Load() (*Config, error) {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/app_db?sslmode=disable"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	appEnv := os.Getenv("APP_ENV")
	if appEnv == "" {
		appEnv = "development"
	}

	return &Config{
		Port:        port,
		DatabaseURL: dbURL,
		AppEnv:      appEnv,
	}, nil
}
EOF
  echo "  ✅ Created $CONFIG_FILE"
fi

# ==========================================
# 3. FILE SERVICE / SRS INTERFACE (apps/backend/internal/service/${MODULE_LOWER}_service.go)
# ==========================================
SERVICE_FILE="$BASE_DIR/service/${MODULE_LOWER}_service.go"
cat << EOF > "$SERVICE_FILE"
package service

import (
	"context"

	"backend/internal/repository/db"
)

// ${MODULE_CAPITAL}Repository định nghĩa SRS / Interface tiếp xúc với cơ sở dữ liệu
type ${MODULE_CAPITAL}Repository interface {
	Get${MODULE_CAPITAL}ByID(ctx context.Context, id int64) (db.${MODULE_CAPITAL}, error)
	List${MODULE_CAPITAL}s(ctx context.Context) ([]db.${MODULE_CAPITAL}, error)
}

type ${MODULE_CAPITAL}Service struct {
	repo ${MODULE_CAPITAL}Repository
}

func New${MODULE_CAPITAL}Service(repo ${MODULE_CAPITAL}Repository) *${MODULE_CAPITAL}Service {
	return &${MODULE_CAPITAL}Service{
		repo: repo,
	}
}

func (s *${MODULE_CAPITAL}Service) GetByID(ctx context.Context, id int64) (db.${MODULE_CAPITAL}, error) {
	return s.repo.Get${MODULE_CAPITAL}ByID(ctx, id)
}

func (s *${MODULE_CAPITAL}Service) List(ctx context.Context) ([]db.${MODULE_CAPITAL}, error) {
	return s.repo.List${MODULE_CAPITAL}s(ctx)
}
EOF
echo "  ✅ Created $SERVICE_FILE"

# ==========================================
# 4. FILE HANDLER (apps/backend/internal/handler/${MODULE_LOWER}_handler.go)
# ==========================================
HANDLER_FILE="$BASE_DIR/handler/${MODULE_LOWER}_handler.go"
cat << EOF > "$HANDLER_FILE"
package handler

import (
	"net/http"
	"strconv"

	"backend/internal/service"

	"github.com/gin-gonic/gin"
)

type ${MODULE_CAPITAL}Handler struct {
	svc *service.${MODULE_CAPITAL}Service
}

func New${MODULE_CAPITAL}Handler(svc *service.${MODULE_CAPITAL}Service) *${MODULE_CAPITAL}Handler {
	return &${MODULE_CAPITAL}Handler{
		svc: svc,
	}
}

func (h *${MODULE_CAPITAL}Handler) RegisterRoutes(router *gin.Engine) {
	api := router.Group("/api/v1/${MODULE_LOWER}s")
	{
		api.GET("", h.List)
		api.GET("/:id", h.GetByID)
	}
}

func (h *${MODULE_CAPITAL}Handler) GetByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID không hợp lệ"})
		return
	}

	result, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *${MODULE_CAPITAL}Handler) List(c *gin.Context) {
	results, err := h.svc.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, results)
}
EOF
echo "  ✅ Created $HANDLER_FILE"

# ==========================================
# 5. FILE REPOSITORY / POSTGRES (apps/backend/internal/repository/postgres.go)
# ==========================================
POSTGRES_FILE="$BASE_DIR/repository/postgres.go"
if [ ! -f "$POSTGRES_FILE" ]; then
  cat << 'EOF' > "$POSTGRES_FILE"
package repository

import (
	"context"
	"fmt"

	"backend/internal/repository/db"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresRepository struct {
	Pool *pgxpool.Pool
	*db.Queries
}

func NewPostgresRepository(ctx context.Context, dbURL string) (*PostgresRepository, error) {
	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		return nil, fmt.Errorf("không thể parse config database URL: %w", err)
	}

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("không thể kết nối Postgres pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("không thể ping database: %w", err)
	}

	queries := db.New(pool)

	return &PostgresRepository{
		Pool:    pool,
		Queries: queries,
	}, nil
}

func (r *PostgresRepository) Close() {
	if r.Pool != nil {
		r.Pool.Close()
	}
}
EOF
  echo "  ✅ Created $POSTGRES_FILE"
fi

echo "🎉 Hoàn tất sinh code cho module '${MODULE_NAME}'!"