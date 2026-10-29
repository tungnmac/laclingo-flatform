# Deploy production

LacLingo chạy trên **1 máy chủ Linux** bằng Docker Compose:

| Service | Vai trò |
|---|---|
| `postgres` | CSDL (volume `postgres_data`, không mở cổng ra ngoài) |
| `migrate` | Chạy migration mỗi lần deploy rồi thoát — backend chỉ khởi động khi migration thành công |
| `backend` | API Go (`apps/laclingo/backend/Dockerfile`) |
| `web` | Next.js (`apps/laclingo/web/Dockerfile`) — app iOS/Android cũng nạp web từ đây |
| `caddy` | Reverse proxy, **tự xin + gia hạn HTTPS** (Let's Encrypt) cho 2 domain |

Cấu hình tối thiểu: 2 vCPU, 2 GB RAM (build image Next.js cần ~1.5 GB), Docker 24+ với Compose v2.

## Lần đầu

1. **DNS:** tạo 2 bản ghi A trỏ về IP máy chủ, vd `app.example.com` (web) và `api.example.com` (API). Mở cổng
   80 + 443 trên firewall. **Không tạo bản ghi AAAA (IPv6):** mạng Docker ở đây chỉ có IPv4, kết nối IPv6 đi qua
   docker-proxy và mất IP thật → mọi người dùng IPv6 bị giới hạn đăng nhập chung 1 IP.
2. **Code:** `git clone` repo lên máy chủ.
3. **Cấu hình:**
   ```bash
   cd deploy
   cp .env.example .env
   chmod 600 .env
   ```
   Điền ít nhất `WEB_DOMAIN`, `API_DOMAIN`, `ACME_EMAIL`, `POSTGRES_PASSWORD`, `JWT_SECRET`, `CONTACT_EMAIL`.
   Các tính năng khác (R2, AI, push, thanh toán, mua trong app) để trống thì tự tắt — điền dần khi có tài khoản.
   File service account (Firebase, Google Play) đặt trong `deploy/secrets/` rồi trỏ biến tương ứng tới
   `/secrets/<tên file>`. Backend chạy bằng uid 10001 nên cần cấp quyền đọc (thiếu quyền thì push / mua trong app
   tự tắt, chỉ báo trong log):
   ```bash
   sudo chown 10001 secrets/*.json && sudo chmod 400 secrets/*.json
   ```
4. **Chạy:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   docker compose -f docker-compose.prod.yml ps        # migrate: exited (0), các service khác: healthy / running
   curl https://api.example.com/health
   ```
5. **Tài khoản owner:** đăng ký tài khoản trên web rồi đặt quyền owner một lần:
   ```bash
   docker compose -f docker-compose.prod.yml exec postgres \
     psql -U laclingo -d laclingo -c "UPDATE users SET role = 'owner' WHERE username = '<tên đăng nhập>'"
   ```
6. **Dữ liệu nền** (ngôn ngữ, chủ đề, bài tập, nhiệm vụ — migration không tạo các dữ liệu này), chạy 1 lần **sau khi
   đã có tài khoản owner** (nhiệm vụ mẫu gán người tạo là user đầu tiên, chưa có user thì bị bỏ qua):
   ```bash
   ./seed.sh
   ```
7. **Sao lưu hằng ngày** (cron trên máy chủ):
   ```
   0 3 * * * cd /đường/dẫn/repo/deploy && mkdir -p backups && ./backup.sh >> backups/backup.log 2>&1
   ```
   Nên chép thêm thư mục `backups/` sang nơi khác (máy khác / object storage).

## Cập nhật phiên bản mới

```bash
git pull
cd deploy && docker compose -f docker-compose.prod.yml up -d --build
```

Migration mới tự chạy trước khi backend mới khởi động. Nên `./backup.sh` trước khi cập nhật.
Có seed mới (`packages/database/seeds/…`) thì thêm vào `seed.sh` rồi chạy lại `./seed.sh`.

**Migration lỗi** (`docker compose -f docker-compose.prod.yml logs migrate`): DB bị đánh dấu *dirty*, backend không
khởi động. Sửa tay phần migration dở dang trong psql, rồi đánh dấu lại version đúng và chạy tiếp:
```bash
docker compose -f docker-compose.prod.yml run --rm migrate -path /migrations \
  -database "postgres://laclingo:<POSTGRES_PASSWORD>@postgres:5432/laclingo?sslmode=disable" force <version>
docker compose -f docker-compose.prod.yml up -d
```

## Khôi phục bản sao lưu

Bản sao lưu là SQL thuần, phải nạp vào **DB trống** (không để `migrate` tạo bảng trước):
```bash
docker compose -f docker-compose.prod.yml down              # dừng hết (giữ volume)
docker volume rm laclingo_postgres_data                     # XOÁ DB hiện tại
docker compose -f docker-compose.prod.yml up -d postgres    # chỉ bật Postgres (DB trống)
gunzip -c backups/<file>.sql.gz | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U laclingo -d laclingo -v ON_ERROR_STOP=1 --single-transaction
docker compose -f docker-compose.prod.yml up -d             # migrate chỉ chạy phần còn thiếu
```

## Ghi chú

- **Đổi domain API** phải build lại web (`NEXT_PUBLIC_API_URL` nhúng lúc build) — lệnh `up -d --build` ở trên đã làm.
- **App iOS/Android:** build bằng `CAP_SERVER_URL=https://<WEB_DOMAIN> npx cap sync` (xem `apps/laclingo/mobile/README.md`).
- **URL cần khai báo ở dịch vụ ngoài** (sau khi có domain):
  - Stripe webhook: `https://<API_DOMAIN>/api/v1/billing/stripe/webhook`
  - VNPay IPN: `https://<API_DOMAIN>/api/v1/billing/vnpay/ipn`
  - App Store Server Notifications: `https://<API_DOMAIN>/api/v1/billing/iap/apple/notifications`
  - Google Play RTDN (Pub/Sub push): `https://<API_DOMAIN>/api/v1/billing/iap/google/notifications?token=<GOOGLE_PLAY_RTDN_TOKEN>`
  - Chính sách quyền riêng tư (khai báo khi nộp store): `https://<WEB_DOMAIN>/privacy`
- **Log:** `docker compose -f docker-compose.prod.yml logs -f backend`
- **Giới hạn đăng nhập theo IP** đã cấu hình sẵn `TRUSTED_PROXIES` = IP nội bộ cố định của Caddy (`172.28.0.10`). Nếu đặt thêm CDN /
  load balancer phía trước Caddy: khai báo dải IP của nó ở `trusted_proxies` của Caddy (Caddyfile) **và** thêm vào
  `TRUSTED_PROXIES` (trong `docker-compose.prod.yml`) — thiếu một trong hai thì mọi người dùng chung 1 IP.
- **Không đặt `CLIENT_IP_HEADER`** trong `deploy/.env`: biến này chỉ dành cho Render (luôn qua Cloudflare, header
  `CF-Connecting-IP` do Cloudflare ghi đè). Sau Caddy, client tự gửi được header đó để giả IP — đặt cùng
  `TRUSTED_PROXIES` thì backend chỉ tin header khi request đến từ proxy tin cậy (Caddy không xoá header client gửi).
- Bộ đếm giới hạn đăng nhập nằm trong bộ nhớ của backend — chạy 1 instance backend như cấu hình này là đúng.
