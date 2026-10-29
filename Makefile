DB_URL=postgresql://laclingo_user:laclingo_password@localhost:5432/laclingo_db?sslmode=disable
N ?= 1

.PHONY: install init-backend init-web dev-up dev-down sqlc-gen migrate migrate-down migrate-create seed dev-backend run-backend dev-web run-web build-backend swagger clean trading-install trading-db-create trading-migrate trading-seed trading-dev trading-build trading-start trading-test vn-sync contests-finalize migrate-all seed-all

# ========================
# SETUP
# ========================

# Khởi tạo & kéo thư viện cho Backend (Go)
init-backend:
	@echo "📦 Đang khởi tạo và kéo Go modules cho Backend..."
	@cd apps/laclingo/backend && go mod tidy
	@echo "✅ Backend Go modules đã sẵn sàng!"

# Khởi tạo & cài đặt npm packages cho Web (Next.js)
init-web:
	@echo "📦 Đang cài đặt npm packages cho Frontend Web..."
	@cd apps/laclingo/web && npm install
	@echo "✅ Frontend Web dependencies đã sẵn sàng!"

# Cài đặt toàn bộ dependencies cho dự án
install: init-backend init-web
	@echo "🛠️ Kiểm tra và cài đặt sqlc (nếu chưa có)..."
	@command -v sqlc >/dev/null 2>&1 || go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	@command -v air >/dev/null 2>&1 || go install github.com/air-verse/air@latest
	@command -v migrate >/dev/null 2>&1 || go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
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

# Áp các migration CHƯA chạy (golang-migrate track trong bảng schema_migrations,
# nên chạy nhiều lần vẫn an toàn — chỉ migration mới được áp).
migrate:
	@command -v migrate >/dev/null 2>&1 || go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
	migrate -path packages/database/migrations -database "$(DB_URL)" up

# Rollback N migration gần nhất (mặc định 1). VD: make migrate-down N=2
migrate-down:
	@command -v migrate >/dev/null 2>&1 || go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
	migrate -path packages/database/migrations -database "$(DB_URL)" down $(N)

# Tạo cặp file migration mới (.up.sql/.down.sql). VD: make migrate-create name=add_foo
migrate-create:
	@command -v migrate >/dev/null 2>&1 || go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
	migrate create -ext sql -dir packages/database/migrations -seq $(name)

# Seed dữ liệu mẫu — idempotent (ON CONFLICT), an toàn chạy lại nhiều lần. Thêm seed mới thì thêm cả vào deploy/seed.sh.
# Nhớ cập nhật packages/database/schema.sql khi thêm migration mới (sqlc đọc file này).
seed:
	docker exec -i laclingo_postgres psql -U laclingo_user -d laclingo_db -v ON_ERROR_STOP=1 < packages/database/seeds.sql
	docker exec -i laclingo_postgres psql -U laclingo_user -d laclingo_db -v ON_ERROR_STOP=1 < packages/database/seeds_vocabulary.sql
	docker exec -i laclingo_postgres psql -U laclingo_user -d laclingo_db -v ON_ERROR_STOP=1 < packages/database/seeds/0003_exercise_types_seed.sql
	docker exec -i laclingo_postgres psql -U laclingo_user -d laclingo_db -v ON_ERROR_STOP=1 < packages/database/seeds/0004_challenge_questions_seed.sql
	# 0005_dialogues_seed.sql TẠM BỎ QUA: seed cho bảng dialogues/dialogue_lines
	# nhưng migration tạo 2 bảng đó chưa có trên main (đang ở nhánh riêng
	# feature/grammar-dialogues của đồng nghiệp) — chạy sẽ lỗi "relation does
	# not exist". Bật lại dòng này khi migration dialogues được merge vào main.
	docker exec -i laclingo_postgres psql -U laclingo_user -d laclingo_db -v ON_ERROR_STOP=1 < packages/database/seeds/0006_missions_seed.sql
	docker exec -i laclingo_postgres psql -U laclingo_user -d laclingo_db -v ON_ERROR_STOP=1 < packages/database/seeds_zh.sql
	docker exec -i laclingo_postgres psql -U laclingo_user -d laclingo_db -v ON_ERROR_STOP=1 < packages/database/seeds/0007_vocabulary_topics_emoji_seed.sql
	# 0008 chạy SAU seeds_zh.sql — cần language 'zh' đã tồn tại (listening seed
	# có 1 bài tiếng Trung, FK vào languages.id).
	docker exec -i laclingo_postgres psql -U laclingo_user -d laclingo_db -v ON_ERROR_STOP=1 < packages/database/seeds/0008_listening_seed.sql
	docker exec -i laclingo_postgres psql -U laclingo_user -d laclingo_db -v ON_ERROR_STOP=1 < packages/database/seeds/0009_vocabulary_example_meaning_seed.sql
	docker exec -i laclingo_postgres psql -U laclingo_user -d laclingo_db -v ON_ERROR_STOP=1 < packages/database/seeds/0010_vocabulary_part_of_speech_seed.sql
	docker exec -i laclingo_postgres psql -U laclingo_user -d laclingo_db -v ON_ERROR_STOP=1 < packages/database/seeds/0011_speaking_it_interview_seed.sql
	docker exec -i laclingo_postgres psql -U laclingo_user -d laclingo_db -v ON_ERROR_STOP=1 < packages/database/seeds/0012_vocabulary_topic_keys_seed.sql
	@echo "✅ Seed dữ liệu hoàn tất!"

# Cấp quyền admin cho 1 user theo email — không có UI để cấp quyền admin đầu
# tiên (gà-trứng: cần đã là admin mới vào được trang quản trị), nên phải có
# cách làm việc này trực tiếp qua DB. VD: make promote-admin email=a@b.com
promote-admin:
	@test -n "$(email)" || (echo "❌ Thiếu email. VD: make promote-admin email=a@b.com" && exit 1)
	docker exec -i laclingo_postgres psql -U laclingo_user -d laclingo_db -v ON_ERROR_STOP=1 \
		-c "UPDATE users SET role = 'admin' WHERE email = '$(email)';"
	@echo "✅ Đã cấp quyền admin cho $(email)"

# ========================
# BACKEND
# ========================

# Chạy backend với hot reload (Air)
dev-backend:
	cd apps/laclingo/backend && air

# Chạy backend bình thường (không hot reload)
run-backend:
	cd apps/laclingo/backend && go run ./cmd/server

# Build backend
build-backend: swagger
	cd apps/laclingo/backend && go build -o bin/server ./cmd/server

# Sinh tài liệu Swagger từ annotation trong code
swagger:
	@command -v swag >/dev/null 2>&1 || go install github.com/swaggo/swag/cmd/swag@latest
	cd apps/laclingo/backend && swag init -g cmd/server/main.go -o docs --parseInternal

# ========================
# FRONTEND
# ========================

# Chạy web với hot reload (Next.js)
dev-web:
	cd apps/laclingo/web && npm run dev

# Alias cho dev-web
run-web: dev-web

# ========================
# CLEANUP
# ========================

clean:
	rm -rf apps/laclingo/backend/bin/ apps/laclingo/backend/tmp/ apps/laclingo/backend/build-errors.log
	rm -rf apps/laclingo/web/.next
	@echo "🧹 Đã dọn build artifacts!"

# ========================
# TRADING WEB (apps/trading/web)
# ========================
trading-install:
	cd apps/trading/web && npm install

# DB đã khởi tạo từ trước thì script init không chạy lại — tạo trading_db thủ công (idempotent)
trading-db-create:
	@docker exec laclingo_postgres psql -U laclingo_user -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='trading_db'" | grep -q 1 \
		|| docker exec laclingo_postgres psql -U laclingo_user -d postgres -c "CREATE DATABASE trading_db"

trading-migrate:
	cd apps/trading/web && npm run db:migrate

# Seed của trading-web nằm trong chính project (apps/trading/web/scripts) — Makefile chỉ gọi.
# seed:all = danh mục mã → bài học → doanh nghiệp → thư viện (đều idempotent, không ghi đè chỉnh sửa admin)
trading-seed:
	cd apps/trading/web && npm run seed:all

trading-dev:
	cd apps/trading/web && npm run dev

# Chạy bản production ở local: next start cần thư mục .next nên phải build trước
trading-build:
	cd apps/trading/web && npm run build

trading-start: trading-build
	cd apps/trading/web && npm start

trading-test:
	cd apps/trading/web && npm test

# Chốt kết quả giải đấu đã kết thúc — chạy định kỳ (cron mỗi 10 phút)
contests-finalize:
	cd apps/trading/web && npm run contests:finalize

# Đồng bộ dữ liệu cổ phiếu VN vào trading_db. VD: make vn-sync job=symbols | indexes | prices | index-prices | profiles | financials | all
# Thêm tham số: make vn-sync job=prices args="--symbols FPT,VNM"  ·  chỉ VN30: args="--vn30"
vn-sync:
	@test -n "$(job)" || (echo "❌ Thiếu job. VD: make vn-sync job=symbols" && exit 1)
	cd apps/trading/web && npm run vn:sync -- $(job) $(args)

# ========================
# TẤT CẢ (app chính + trading-web) — mỗi app giữ migration/seed của riêng mình
# ========================
migrate-all: migrate trading-migrate

seed-all: seed trading-seed
