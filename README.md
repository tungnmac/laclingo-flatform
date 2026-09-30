# 🦩 LacLingo — Smart SRS Language Learning Platform

Nền tảng học từ vựng tiếng Anh ứng dụng thuật toán lặp lại ngắt quãng SRS (SM-2 Algorithm) và linh vật Chim Lạc đồng hành.

---

## 🛠️ 1. Yêu Cầu Tiền Trạm (Prerequisites)

Để chạy và phát triển dự án, máy của sếp cần cài đặt sẵn các công cụ sau:

* **Go**: Version `1.22+` (Khuyến nghị `1.26+`)
* **Node.js**: Version `18+` & `npm` / `pnpm`
* **Docker & Docker Compose**: Để chạy PostgreSQL & Redis
* **SQLC**: Trình biên dịch SQL thành Go types (`brew install sqlc` hoặc `go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`)

---

## 🚀 2. Khởi Tạo Dự Án Bản Đầu (Initial Generation)

Nếu đây là lần đầu khởi tạo cây thư mục và generate code mẫu, hãy thực thi script `init-project.sh`:

```bash
# 1. Cấp quyền thực thi cho script
chmod +x init-project.sh

# 2. Chạy script để tự động sinh cấu trúc thư mục & mã nguồn gốc
./init-project.sh

.env
PORT=8080
DATABASE_URL=postgresql://laclingo_user:laclingo_password@localhost:5432/laclingo_db?sslmode=disable
REDIS_URL=localhost:6379