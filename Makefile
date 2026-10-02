DB_URL=postgresql://laclingo_user:laclingo_password@localhost:5432/laclingo_db?sslmode=disable

DB_URL=postgresql://laclingo_user:laclingo_password@localhost:5432/laclingo_db?sslmode=disable

.PHONY: install init-backend init-web dev-up dev-down sqlc-gen dev-backend run-backend dev-web run-web build-backend swagger clean

# ========================
# SETUP
# ========================

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
	@command -v air >/dev/null 2>&1 || go install github.com/air-verse/air@latest
	@echo "🎉 Tất cả dependencies đã được cài đặt hoàn tất!"

# ========================
# DATABASE
# ========================

dev-up:
	docker-compose up -d

dev-down:
	docker-compose down

sqlc-gen:
	sqlc generate -f packages/database/sqlc.yaml

# ========================
# BACKEND
# ========================

# Chạy backend với hot reload (Air)
dev-backend:
	cd apps/backend && air

# Chạy backend bình thường (không hot reload)
run-backend:
	cd apps/backend && go run ./cmd/server

# Build backend
build-backend: swagger
	cd apps/backend && go build -o bin/server ./cmd/server

# Sinh tài liệu Swagger từ annotation trong code
swagger:
	@command -v swag >/dev/null 2>&1 || go install github.com/swaggo/swag/cmd/swag@latest
	cd apps/backend && swag init -g cmd/server/main.go -o docs --parseInternal

# ========================
# FRONTEND
# ========================

# Chạy web với hot reload (Next.js)
dev-web:
	cd apps/web && npm run dev

# ========================
# CLEANUP
# ========================

clean:
	rm -rf apps/backend/bin/ apps/backend/tmp/ apps/backend/build-errors.log
	rm -rf apps/web/.next
	@echo "🧹 Đã dọn build artifacts!"
