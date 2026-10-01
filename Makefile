DB_URL=postgresql://laclingo_user:laclingo_password@localhost:5432/laclingo_db?sslmode=disable

.PHONY: install init-backend init-web dev-up dev-down sqlc-gen run-backend build-backend swagger run-web

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
	cd apps/backend && go run ./cmd/server

build-backend: swagger
	cd apps/backend && go build -o bin/server ./cmd/server

# Sinh tài liệu Swagger từ annotation trong code (apps/backend/docs)
swagger:
	@command -v swag >/dev/null 2>&1 || go install github.com/swaggo/swag/cmd/swag@latest
	cd apps/backend && swag init -g cmd/server/main.go -o docs --parseInternal

run-web:
	cd apps/web && npm run dev
