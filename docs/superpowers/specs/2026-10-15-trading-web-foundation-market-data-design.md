# Thiết kế: Web Trading — Phần 1 (Nền tảng) + Phần 2 (Dữ liệu thị trường)

## 1. Bối cảnh & mục tiêu

Thêm một sản phẩm mới trong monorepo `laclingo-flatform`: **web học trading + paper trading**
(giao dịch bằng tiền ảo trên giá thị trường thật). Sản phẩm tách biệt với LacLingo (học ngoại ngữ):
app riêng, database riêng, tài khoản riêng.

Toàn bộ sản phẩm được chia 6 phần, mỗi phần có spec → plan → triển khai riêng:

| # | Phần | Phụ thuộc |
|---|---|---|
| 1 | **Nền tảng** — app, DB, đăng nhập | — |
| 2 | **Dữ liệu thị trường** — adapter nhiều thị trường, giá, nến | 1 |
| 3 | Paper trading — ví ảo, lệnh market/limit, vị thế, P/L, lịch sử | 2 |
| 4 | Nhật ký + phân tích hiệu suất (win rate, P/L, drawdown) | 3 |
| 5 | Bài học + quiz + admin nội dung | 1 |
| 6 | Thực hành trên biểu đồ nến lịch sử | 2 |

**Spec này chỉ bao gồm Phần 1 và Phần 2.**

### Tiêu chí hoàn thành

- Người dùng đăng ký / đăng nhập / đăng xuất được trên `apps/trading-web` (cổng 3001).
- Trang `/markets` hiển thị danh sách mã crypto với giá, % thay đổi 24h, khối lượng — tự cập nhật mỗi ~3 giây.
- Trang `/markets/[symbol]` hiển thị biểu đồ nến + khối lượng, đổi được khung thời gian.
- Giá được cache ở Redis: nhiều người xem cùng lúc không làm tăng số request ra nguồn giá.
- Nguồn giá lỗi → UI vẫn hiện dữ liệu cũ kèm cảnh báo, hoặc thông báo lỗi + nút thử lại.

### Ngoài phạm vi

Đặt lệnh / ví ảo (phần 3), nhật ký (4), bài học (5), thực hành biểu đồ (6), provider cổ phiếu VN/US,
admin quản lý mã, watchlist, WebSocket realtime, quên mật khẩu / xác thực email.

## 2. Kiến trúc

**Next.js full-stack** — một app tự lo cả UI và API (route handlers), không có backend riêng.

| Thành phần | Lựa chọn | Lý do |
|---|---|---|
| Framework | Next.js 14 (App Router), React 18, TypeScript | Cùng phiên bản với `apps/web`, dùng lại kinh nghiệm/pattern |
| Style | Tailwind CSS 3 | Như `apps/web` |
| DB access | Drizzle ORM + `pg`, migration bằng `drizzle-kit` | Schema bằng TS, type-safe, nhẹ |
| Database | PostgreSQL — database **`trading_db`** riêng trên container `laclingo_postgres` hiện có | Tách dữ liệu, không thêm container |
| Cache | Redis — container `laclingo_redis` hiện có, client `ioredis`, key prefix `trading:` | Dùng chung hạ tầng, tránh đụng key |
| Auth | JWT (thư viện `jose`) trong cookie httpOnly, mật khẩu băm `bcryptjs` | Không lộ token cho JS (chống XSS), đọc được ở server/middleware |
| Biểu đồ | `lightweight-charts` (TradingView, Apache-2.0) | Nến + volume, nhẹ, chuẩn ngành |
| Test | `vitest` | Unit test phần parse dữ liệu & cache |

### Cấu trúc thư mục

```
apps/trading-web/
  drizzle/                         – file migration sinh bởi drizzle-kit
  drizzle.config.ts
  scripts/seed.ts                  – seed instruments
  src/
    middleware.ts                  – chặn trang (app) khi chưa đăng nhập
    app/
      (auth)/login/page.tsx
      (auth)/register/page.tsx
      (app)/layout.tsx             – layout sau đăng nhập (nav, user menu)
      (app)/markets/page.tsx
      (app)/markets/[symbol]/page.tsx
      api/auth/{register,login,logout,me}/route.ts
      api/market/{instruments,quotes,candles}/route.ts
    server/
      db/schema.ts, db/client.ts
      auth/{password.ts, session.ts, require-user.ts}
      cache/redis.ts
      market/{types.ts, registry.ts, cache.ts}
      market/providers/binance.ts
    components/…                   – UI (bảng giá, biểu đồ, badge %)
    lib/…                          – fetch client, format số/tiền
```

### Hạ tầng & vận hành

- `docker-compose.yml`: mount `scripts/postgres-init/01-create-trading-db.sql`
  (`CREATE DATABASE trading_db`) vào `/docker-entrypoint-initdb.d`. Vì DB hiện có đã khởi tạo
  (script init không chạy lại), `make trading-db-create` tạo DB thủ công cho máy đang dùng.
- Makefile: `trading-install`, `trading-dev` (cổng 3001), `trading-migrate`, `trading-seed`,
  `trading-test`, `trading-db-create`.
- `.env.example`: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `BINANCE_BASE_URL`
  (mặc định `https://data-api.binance.vision`).
- `JWT_SECRET` bắt buộc khi `NODE_ENV=production`; dev dùng giá trị mặc định có cảnh báo
  (giống `apps/backend`).

## 3. Phần 1 — Nền tảng & tài khoản

### Dữ liệu

```
users
  id            uuid PK default gen_random_uuid()
  email         varchar(255) unique not null   -- lưu chữ thường
  password_hash varchar(255) not null
  display_name  varchar(100) not null
  role          varchar(20) not null default 'user'   -- 'user' | 'admin'
  created_at    timestamptz not null default now()
```

### API

| Method & path | Body | Kết quả |
|---|---|---|
| `POST /api/auth/register` | `{email, password, display_name}` | 201 + set cookie; 409 email đã dùng; 400 dữ liệu sai |
| `POST /api/auth/login` | `{email, password}` | 200 + set cookie; 401 sai thông tin |
| `POST /api/auth/logout` | — | 204, xoá cookie |
| `GET /api/auth/me` | — | 200 `{id, email, display_name, role}`; 401 |

- Validate: email hợp lệ, mật khẩu 8–72 ký tự, tên 1–100 ký tự (dùng `zod`).
- Cookie `trading_session`: httpOnly, `SameSite=Lax`, `Secure` khi production, hạn 7 ngày;
  JWT chứa `sub` (user id), ký HS256.
- Sai email hay sai mật khẩu đều trả cùng thông báo (không lộ email nào đã đăng ký).
- `middleware.ts` (edge) chỉ kiểm tra chữ ký/hạn JWT để chuyển hướng `/login`;
  route handler dùng `requireUser()` tra DB khi cần dữ liệu user.

### UI

- `/login`, `/register`: form đơn giản, lỗi hiển thị dưới form, thành công → `/markets`.
- Layout `(app)`: thanh trên có logo, menu (Thị trường; các mục sau sẽ thêm ở phần 3–6),
  tên user + Đăng xuất. Responsive mobile.
- Giao diện tiếng Việt (chưa i18n ở giai đoạn này).

## 4. Phần 2 — Dữ liệu thị trường

### Adapter đa thị trường

```ts
type Market = 'crypto' | 'vn' | 'us'
type Interval = '1m' | '5m' | '1h' | '4h' | '1d'

interface Quote {
  symbol: string
  price: number
  change24hPct: number
  high24h: number
  low24h: number
  volume24h: number        // khối lượng theo đồng định giá (quote volume)
  updatedAt: string        // ISO
}

interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number } // time = unix giây

interface MarketDataProvider {
  market: Market
  getQuotes(symbols: string[]): Promise<Quote[]>
  getCandles(symbol: string, interval: Interval, limit: number): Promise<Candle[]>
}
```

- `registry.ts`: `getProvider(market)`; market chưa có provider → lỗi "chưa hỗ trợ".
- Mọi phần khác (API, UI, paper trading ở phần 3) chỉ gọi qua registry — thêm thị trường mới
  = viết provider mới + thêm instruments, không sửa chỗ khác.

### Provider crypto — Binance public market data

- Host `BINANCE_BASE_URL` (mặc định `https://data-api.binance.vision` — endpoint chỉ dữ liệu
  công khai, không cần API key, ít bị chặn theo khu vực hơn `api.binance.com`).
- Giá: `GET /api/v3/ticker/24hr?symbols=["BTCUSDT",…]` (1 request cho nhiều mã) → map
  `lastPrice, priceChangePercent, highPrice, lowPrice, quoteVolume, closeTime`.
- Nến: `GET /api/v3/klines?symbol=&interval=&limit=` → map mảng `[openTime, o, h, l, c, v, …]`.
- Số từ Binance là chuỗi → parse `Number`; giá trị không hợp lệ → bỏ mã đó + log.
- Timeout 5 giây mỗi request (`AbortSignal.timeout`).

### Danh mục mã

```
instruments
  id          uuid PK
  market      varchar(10) not null          -- 'crypto' | 'vn' | 'us'
  symbol      varchar(30) not null          -- mã theo provider, vd 'BTCUSDT'
  base        varchar(20) not null          -- 'BTC'
  quote       varchar(20) not null          -- 'USDT'
  name        varchar(100) not null         -- 'Bitcoin'
  is_active   boolean not null default true
  sort_order  int not null default 0
  unique (market, symbol)
```

Seed (idempotent, upsert theo `(market, symbol)`): BTC, ETH, BNB, SOL, XRP, ADA, DOGE, TON, AVAX, LINK — cặp /USDT.

### Cache (Redis)

| Key | TTL | Nội dung |
|---|---|---|
| `trading:quote:{market}:{symbol}` | 3 s (fresh) | Quote JSON + `fetchedAt` |
| `trading:candles:{market}:{symbol}:{interval}` | 30 s (1m/5m), 60 s (1h/4h/1d) | Candle[] |
| `trading:stale:quote:{market}:{symbol}`, `trading:stale:candles:{market}:{symbol}:{interval}` | 24 h | Bản cuối cùng lấy thành công — dùng khi provider lỗi |

- Đọc: còn fresh → trả; hết → gọi provider (gộp các mã thiếu thành 1 request), ghi fresh + stale.
- Provider lỗi → trả bản stale kèm `stale: true`; không có stale → 503.
- Chống dồn request khi cache hết hạn: khoá ngắn `SET NX` 5 s theo key; request khác chờ tối đa
  ~1 s rồi đọc lại cache, vẫn không có thì tự gọi provider.

### API

| Method & path | Kết quả |
|---|---|
| `GET /api/market/instruments?market=crypto` | Danh sách mã active, theo `sort_order` |
| `GET /api/market/quotes?market=crypto&symbols=BTCUSDT,ETHUSDT` | `{quotes: Quote[], stale: boolean}`; tối đa 50 mã/lần; mã không có trong `instruments` bị bỏ qua |
| `GET /api/market/candles?market=crypto&symbol=BTCUSDT&interval=1h&limit=300` | `{candles: Candle[], stale: boolean}`; `limit` 1–1000, mặc định 300 |

- Tất cả cần đăng nhập (401 nếu không).
- Tham số sai (interval lạ, symbol không tồn tại) → 400 / 404.

### UI

- **`/markets`**: bảng mã — tên + mã, giá, % 24h (xanh tăng / đỏ giảm), cao/thấp 24h, khối lượng.
  Poll `/api/market/quotes` mỗi 3 s (dừng khi tab bị ẩn — `document.visibilityState`).
  Có `stale` → dải cảnh báo "Giá có thể bị trễ". Bấm 1 dòng → trang chi tiết. Mobile: ẩn cột phụ.
- **`/markets/[symbol]`**: header giá + % 24h (poll 3 s); biểu đồ `lightweight-charts`
  (nến + histogram khối lượng) với nút chọn 1m / 5m / 1h / 4h / 1d; nến cuối cập nhật theo giá
  poll; nến tải lại mỗi 60 s. Nút "Đặt lệnh" hiển thị disabled kèm chú thích "Sắp ra mắt"
  (nối ở phần 3).
- Định dạng số: giá theo số chữ số thập phân hợp lý với độ lớn (vd ≥1000 → 2 chữ số,
  <1 → tối đa 6); khối lượng rút gọn (K/M/B).

## 5. Xử lý lỗi

| Tình huống | Hành vi |
|---|---|
| Binance timeout / 5xx / bị chặn | Trả bản stale + `stale: true`; không có → 503 `{error}`; UI hiện nút "Thử lại" |
| Binance 429 (rate limit) | Như trên; log cảnh báo |
| Redis không kết nối được | Gọi thẳng provider (bỏ cache), log lỗi — trang vẫn chạy |
| Chưa đăng nhập | Trang → chuyển `/login?next=…`; API → 401 |
| Lỗi không lường trước | 500 `{error: "Lỗi hệ thống"}`, log chi tiết ở server, không lộ cho client |

## 6. Kiểm thử

- **Unit (`vitest`)**: parse ticker/klines Binance từ file JSON mẫu (gồm giá trị lỗi);
  logic cache (fresh / stale / provider lỗi) với Redis giả lập; validate input auth (zod).
- **Thủ công**: đăng ký → đăng nhập → `/markets` thấy giá đổi → mở chi tiết, đổi khung thời gian;
  tắt mạng ra ngoài / đổi `BINANCE_BASE_URL` sai → thấy cảnh báo trễ / lỗi + thử lại;
  đăng xuất → bị chặn khỏi `/markets`.
- `next build` + `tsc` + `vitest run` phải pass.

## 7. Quyết định đã chốt

- App riêng trong monorepo, **Next.js full-stack**, tài khoản riêng.
- **Paper trading** (tiền ảo), không giao dịch thật.
- Đa thị trường qua adapter; **làm crypto (Binance public data) trước**.
- Giá gần realtime bằng **polling 3 s + Redis cache**, không dùng WebSocket.
- Giá dùng để khớp lệnh (phần 3) luôn lấy phía server qua registry, không nhận từ client.
