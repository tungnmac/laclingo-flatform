#!/usr/bin/env bash

set -e

echo "🚀 Đang khởi tạo toàn bộ cấu trúc dự án & generate mã nguồn cho LacLingo..."

# -----------------------------------------------------------------------------
# 1. TẠO CÁC THƯ MỤC HỆ THỐNG
# -----------------------------------------------------------------------------
mkdir -p apps/web/public/{audio,images} \
  apps/web/src/app/\(auth\)/{login,register} \
  apps/web/src/app/\(dashboard\)/{learn/\[courseId\],review,leaderboard,profile} \
  apps/web/src/app/api \
  apps/web/src/components/{ui,audio,mascot} \
  apps/web/src/features/srs-review/{components,hooks} \
  apps/web/src/features/{course,user} \
  apps/web/src/{hooks,lib,store,types} \
  apps/backend/cmd/server \
  apps/backend/config \
  apps/backend/internal/{domain,srs,repository/db,service,handler/{http,middleware},pkg/{r2,logger}} \
  packages/database/{migrations,queries}

echo "📂 Đã tạo xong toàn bộ cây thư mục!"

# -----------------------------------------------------------------------------
# 2. GENERATE CODE BACKEND (GO)
# -----------------------------------------------------------------------------

# File: apps/backend/cmd/server/main.go
cat << 'EOF' > apps/backend/cmd/server/main.go
package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://laclingo_user:laclingo_password@localhost:5432/laclingo_db?sslmode=disable"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	dbPool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("❌ Không thể kết nối PostgreSQL: %v\n", err)
	}
	defer dbPool.Close()

	log.Println("✅ Kết nối PostgreSQL thành công!")

	app := fiber.New(fiber.Config{
		AppName: "LacLingo API Engine v1.0",
	})

	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"status":  "success",
			"message": "LacLingo API đang hoạt động!",
			"mascot":  "🦩 Chim Lạc cất cánh!",
		})
	})

	go func() {
		port := os.Getenv("PORT")
		if port == "" {
			port = "8080"
		}
		if err := app.Listen(":" + port); err != nil {
			log.Fatalf("❌ Lỗi Server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Đang đóng kết nối server an toàn...")
	_ = app.Shutdown()
}
EOF

# File: apps/backend/internal/srs/sm2.go
cat << 'EOF' > apps/backend/internal/srs/sm2.go
package srs

import (
	"math"
	"time"
)

type ReviewQuality int

const (
	QualityBlackout  ReviewQuality = 0
	QualityIncorrect ReviewQuality = 1
	QualityHardFail  ReviewQuality = 2
	QualityPassHard  ReviewQuality = 3
	QualityPassGood  ReviewQuality = 4
	QualityPassEasy  ReviewQuality = 5
)

type SRSInput struct {
	SRSStage     int32         `json:"srs_stage"`
	EaseFactor   float64       `json:"ease_factor"`
	IntervalDays int32         `json:"interval_days"`
	Quality      ReviewQuality `json:"quality"`
}

type SRSOutput struct {
	NewSRSStage     int32     `json:"new_srs_stage"`
	NewEaseFactor   float64   `json:"new_ease_factor"`
	NewIntervalDays int32     `json:"new_interval_days"`
	NextReviewAt    time.Time `json:"next_review_at"`
}

func CalculateSM2(input SRSInput, now time.Time) SRSOutput {
	q := float64(input.Quality)

	newEF := input.EaseFactor + (0.1 - (5.0-q)*(0.08+(5.0-q)*0.02))
	if newEF < 1.3 {
		newEF = 1.3
	}

	var newStage int32
	var newInterval int32

	if input.Quality >= QualityPassHard {
		newStage = input.SRSStage + 1
		switch newStage {
		case 1:
			newInterval = 1
		case 2:
			newInterval = 6
		default:
			calculatedInterval := float64(input.IntervalDays) * newEF
			newInterval = int32(math.Ceiling(calculatedInterval))
		}
	} else {
		newStage = 0
		newInterval = 1
	}

	nextReviewAt := now.AddDate(0, 0, int(newInterval))

	return SRSOutput{
		NewSRSStage:     newStage,
		NewEaseFactor:   math.Round(newEF*100) / 100,
		NewIntervalDays: newInterval,
		NextReviewAt:    nextReviewAt,
	}
}
EOF

# File: apps/backend/internal/domain/srs.go
cat << 'EOF' > apps/backend/internal/domain/srs.go
package domain

import (
	"time"

	"github.com/google/uuid"
)

type VocabularyReviewRequest struct {
	UserID       uuid.UUID `json:"user_id"`
	VocabularyID uuid.UUID `json:"vocabulary_id"`
	Quality      int32     `json:"quality"` // 0 -> 5
}

type VocabularyReviewResponse struct {
	VocabularyID uuid.UUID `json:"vocabulary_id"`
	NewStage     int32     `json:"new_stage"`
	IntervalDays int32     `json:"interval_days"`
	NextReviewAt time.Time `json:"next_review_at"`
}
EOF

# -----------------------------------------------------------------------------
# 3. GENERATE DATABASE FILES (SQL, SCHEMAS & SQLC)
# -----------------------------------------------------------------------------

# File: packages/database/schema.sql
cat << 'EOF' > packages/database/schema.sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    streak_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vocabularies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term VARCHAR(255) NOT NULL,
    phonetic VARCHAR(255),
    meaning TEXT NOT NULL,
    audio_url TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_vocabulary_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vocabulary_id UUID NOT NULL REFERENCES vocabularies(id) ON DELETE CASCADE,
    srs_stage INT DEFAULT 0,
    ease_factor FLOAT DEFAULT 2.5,
    interval_days INT DEFAULT 0,
    next_review_at TIMESTAMPTZ NOT NULL,
    last_reviewed_at TIMESTAMPTZ,
    CONSTRAINT unique_user_vocab UNIQUE (user_id, vocabulary_id)
);

CREATE INDEX idx_srs_due_review ON user_vocabulary_reviews(user_id, next_review_at);
EOF

# File: packages/database/queries/srs_reviews.sql
cat << 'EOF' > packages/database/queries/srs_reviews.sql
-- name: GetDueVocabulariesForUser :many
SELECT 
    v.id AS vocabulary_id,
    v.term,
    v.phonetic,
    v.meaning,
    v.audio_url,
    r.id AS review_id,
    r.srs_stage,
    r.ease_factor,
    r.interval_days,
    r.next_review_at
FROM user_vocabulary_reviews r
JOIN vocabularies v ON r.vocabulary_id = v.id
WHERE r.user_id = $1 
  AND r.next_review_at <= NOW()
ORDER BY r.next_review_at ASC
LIMIT $2;

-- name: UpsertVocabularyReview :one
INSERT INTO user_vocabulary_reviews (
    user_id, vocabulary_id, srs_stage, ease_factor, interval_days, next_review_at, last_reviewed_at
) VALUES (
    $1, $2, $3, $4, $5, $6, NOW()
)
ON CONFLICT (user_id, vocabulary_id) 
DO UPDATE SET
    srs_stage = EXCLUDED.srs_stage,
    ease_factor = EXCLUDED.ease_factor,
    interval_days = EXCLUDED.interval_days,
    next_review_at = EXCLUDED.next_review_at,
    last_reviewed_at = NOW()
RETURNING *;
EOF

# File: packages/database/sqlc.yaml
cat << 'EOF' > packages/database/sqlc.yaml
version: "2"
sql:
  - schema: "schema.sql"
    queries: "queries/"
    gen:
      go:
        package: "db"
        out: "../../apps/backend/internal/repository/db"
        sql_package: "pgx/v5"
        emit_json_tags: true
        emit_prepared_queries: true
        emit_interface: true
EOF

# -----------------------------------------------------------------------------
# 4. GENERATE CODE FRONTEND (NEXT.JS)
# -----------------------------------------------------------------------------

# File: apps/web/src/app/layout.tsx
cat << 'EOF' > apps/web/src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LacLingo - Học Ngôn Ngữ Cùng Linh Vật Chim Lạc',
  description: 'Nền tảng học từ vựng ứng dụng thuật toán lặp lại ngắt quãng SRS tối ưu cho người Việt.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  )
}
EOF

# File: apps/web/src/app/page.tsx
cat << 'EOF' > apps/web/src/app/page.tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <div className="text-6xl mb-4">🦩</div>
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
        Chào mừng sếp đến với <span className="text-indigo-600">LacLingo</span>
      </h1>
      <p className="mt-6 text-lg leading-8 text-slate-600 max-w-xl">
        Hệ thống học ngôn ngữ thông minh với thuật toán SRS (SM-2) và linh vật Chim Lạc đồng hành.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <a
          href="/review"
          className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Bắt đầu phiên ôn tập SRS
        </a>
      </div>
    </main>
  )
}
EOF

# -----------------------------------------------------------------------------
# 5. GENERATE DOCKER & MAKEFILE
# -----------------------------------------------------------------------------

# File: docker-compose.yml
cat << 'EOF' > docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: laclingo_postgres
    restart: always
    environment:
      POSTGRES_USER: laclingo_user
      POSTGRES_PASSWORD: laclingo_password
      POSTGRES_DB: laclingo_db
      TZ: Asia/Ho_Chi_Minh
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: laclingo_redis
    restart: always
    ports:
      - "6379:6379"

volumes:
  postgres_data:
EOF

# File: Makefile
cat << 'EOF' > Makefile
DB_URL=postgresql://laclingo_user:laclingo_password@localhost:5432/laclingo_db?sslmode=disable

.PHONY: install init-backend init-web dev-up dev-down sqlc-gen run-backend run-web

# Khởi tạo & kéo thư viện cho Backend (Go)
init-backend:
	@echo "📦 Đang khởi tạo và kéo Go modules cho Backend..."
	@cd apps/backend && go mod tidy
	@echo "✅ Backend Go modules đã sẵn sàng!"

# Khởi tạo & cài đặt npm packages cho Web (Next.js)
init-web:
	@echo "📦 Đang cài đặt npm packages cho Frontend Web..."
	@cd apps/web && npm install
	@echo "✅ Frontend Web dependencies đã sẵn sàng!"

# Cài đặt toàn bộ dependencies cho dự án
install: init-backend init-web
	@echo "🛠️ Kiểm tra và cài đặt sqlc (nếu chưa có)..."
	@command -v sqlc >/dev/null 2>&1 || go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	@echo "🎉 Tất cả dependencies đã được cài đặt hoàn tất!"

dev-up:
	docker-compose up -d

dev-down:
	docker-compose down

sqlc-gen:
	sqlc generate -f packages/database/sqlc.yaml

run-backend:
	go run apps/backend/cmd/server/main.go

run-web:
	cd apps/web && npm run dev
EOF

# File: apps/backend/go.mod
cat << 'EOF' > apps/backend/go.mod
module laclingo-backend

go 1.22
EOF

# File: apps/web/package.json
cat << 'EOF' > apps/web/package.json
{
  "name": "laclingo-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.3",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
EOF

echo "✨ HOÀN THÀNH! Toàn bộ file và mã nguồn đã được tạo thành công!"

# -----------------------------------------------------------------------------
# GENERATE .GITIGNORE
# -----------------------------------------------------------------------------
cat << 'EOF' > .gitignore
**/node_modules/
**/.pnpm-store/
**/vendor/
**/.next/
**/out/
**/build/
**/dist/
**/bin/
*.exe
*.dll
*.so
*.dylib
*.test
*.out
main
server
**/.env
**/.env*.local
!.env.example
*.log
.vscode/
.idea/
.DS_Store
Thumbs.db
EOF

echo "🛡️ Đã tạo file .gitignore thành công!"