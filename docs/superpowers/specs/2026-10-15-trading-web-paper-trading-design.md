# Thiết kế: Web Trading — Phần 3 (Paper trading) + Đa ngôn ngữ

> Tiếp nối `2026-10-15-trading-web-foundation-market-data-design.md` (phần 1–2, đã xong trên
> nhánh `feature/trading-web`). Spec này gồm 2 khối: **A. Đa ngôn ngữ (i18n)** áp dụng cho toàn
> app (kể cả phần 1–2), và **B. Paper trading**.

## 1. Mục tiêu & tiêu chí hoàn thành

- Người dùng chọn được ngôn ngữ **Tiếng Việt / English**; mọi nhãn giao diện **và mọi thông báo
  lỗi/xác nhận từ API** hiển thị theo ngôn ngữ đang chọn.
- Mỗi user có **ví ảo 10.000 USDT**, đặt được lệnh **Market / Limit**, gắn **Stop-loss /
  Take-profit**, giao dịch **spot có bán khống (không đòn bẩy)**, chịu **phí 0,1%** mỗi lần khớp.
- Lệnh chờ (Limit / SL / TP) và **thanh lý vị thế Short** được khớp **đúng thời điểm & đúng giá**
  dựa trên nến 1 phút — kể cả khi user offline.
- Trang **Danh mục** hiển thị tổng tài sản, lãi/lỗ, vị thế, lệnh chờ, lịch sử; reset được ví.

### Ngoài phạm vi
Đòn bẩy / futures, trailing stop, lệnh OCO tự đặt (ngoài SL/TP của vị thế), nhiều ví song song,
thị trường VN/US, ngôn ngữ zh/ja/ko (chỉ chừa chỗ), nhật ký & phân tích (phần 4).

## 2. Khối A — Đa ngôn ngữ (i18n)

### Chọn ngôn ngữ
- `LOCALES = ['vi', 'en']`, mặc định `vi`. Cookie **`trading_locale`** (1 năm, `SameSite=Lax`,
  không httpOnly — client đọc/ghi được).
- Chưa có cookie → lấy theo `Accept-Language` (ngôn ngữ đầu tiên khớp `vi`/`en`), không khớp → `vi`.
- Nút chọn ngôn ngữ ở thanh nav và ở trang đăng nhập/đăng ký. Đổi ngôn ngữ = ghi cookie +
  `router.refresh()`.
- Thêm ngôn ngữ mới = thêm file từ điển + thêm vào `LOCALES`; key thiếu → dùng `en`, rồi `vi`.

### Từ điển
- `src/i18n/messages/{vi,en}.ts` — object lồng nhau; `en` khai báo kiểu `Messages = typeof vi`
  để TS bắt key thiếu.
- Tham số dạng `{name}` trong chuỗi: `t('trading.minNotional', { min: '1' })`.
- Root layout (server) đọc locale → `<html lang>` + `I18nProvider` truyền từ điển của locale đó
  xuống client; hook `useT()` trả `t(key, params)` và `locale`.

### Thông báo từ API — mã lỗi
- Mọi lỗi API trả **`{ code, params?, error }`**:
  - `code`: mã ổn định, vd `INSUFFICIENT_FUNDS`, `INVALID_CREDENTIALS`.
  - `params`: giá trị chèn vào câu (vd `{ available: "120.5" }`).
  - `error`: câu đã dịch theo cookie `trading_locale` của request (cho curl / client cũ).
- Client hiển thị bằng `t('errors.' + code, params)` theo ngôn ngữ **đang chọn** (đổi ngôn ngữ
  là đổi ngay); mã lạ → `errors.INTERNAL`.
- Validate (zod) dùng **mã** làm message (vd `PASSWORD_TOO_SHORT`) — không viết câu tiếng Việt
  cứng nữa.
- Danh sách mã: xem §6.

### Định dạng
- Ngày/giờ theo locale (`Intl.DateTimeFormat`).
- Giá / số lượng crypto giữ **dấu chấm thập phân** (chuẩn sàn) ở mọi ngôn ngữ để tránh nhầm
  `81.265,73` ↔ `81,265.73`.

### Áp dụng cho phần 1–2
Chuyển toàn bộ nhãn (đăng nhập/đăng ký, nav, Thị trường, bảng giá, biểu đồ, cảnh báo trễ) và
toàn bộ lỗi API hiện có sang từ điển + mã lỗi.

## 3. Khối B — Paper trading: mô hình nghiệp vụ

### Ví
- Lần đầu user vào phần giao dịch → tự tạo ví **10.000 USDT**.
- **Reset**: đóng ví cũ (`is_active=false`, `closed_at`), huỷ lệnh chờ của ví cũ, tạo ví mới
  10.000 USDT. Lịch sử ví cũ giữ lại (phần 4 dùng).
- `cash` = tiền **khả dụng** (đã trừ phần giữ chỗ cho lệnh Limit đang chờ và ký quỹ Short).

### Vị thế ròng (1 dòng / ví / mã)
- `qty` > 0 = **Long**, < 0 = **Short**, `avg_price` = giá vào bình quân, `margin` = ký quỹ Short.
- **Mua** khi đang Short → đóng Short trước (lãi/lỗ = (giá vào − giá khớp) × SL đóng, nhả ký quỹ
  tương ứng), phần dư mở/thêm Long (trả tiền = SL × giá).
- **Bán** khi đang Long → đóng Long trước (nhận tiền = SL × giá, lãi/lỗ = (giá khớp − giá vào) ×
  SL đóng), phần dư mở/thêm Short (khoá ký quỹ = SL × giá, **100% — không đòn bẩy**).
- Thêm cùng chiều → giá vào bình quân gia quyền. Vị thế về 0 → `avg_price = 0`, `margin = 0`.
- **Phí 0,1%** giá trị khớp, trừ vào `cash` ở mọi lần khớp (kể cả thanh lý — nhưng không làm
  `cash` âm: phí thanh lý tối đa bằng `cash` còn lại).

### Thanh lý Short
- Giá thanh lý = `avg_price + margin / |qty|` (lỗ bằng toàn bộ ký quỹ; ký quỹ 100% ⇒ gấp đôi giá vào).
- Nến 1m có `high ≥` giá thanh lý → đóng toàn bộ Short tại giá thanh lý, ghi trade `kind=liquidation`,
  huỷ SL/TP của vị thế.

### Lệnh
| Loại | Ràng buộc khi đặt | Khớp |
|---|---|---|
| `market` | — | Ngay, theo giá server (quote cache ≤ 3 s) |
| `limit` mua | `price` > 0 | Nếu `price ≥` giá hiện tại → khớp ngay như market. Ngược lại chờ; nến có `low ≤ price` → khớp **tại đúng `price`** |
| `limit` bán | `price` > 0 | Nếu `price ≤` giá hiện tại → khớp ngay. Ngược lại chờ; nến có `high ≥ price` → khớp **tại đúng `price`** |
| `stop_loss` | Gắn vào vị thế. Long: trigger < giá hiện tại; Short: trigger > giá hiện tại | Long: `low ≤ trigger` → bán tại `min(trigger, open)`; Short: `high ≥ trigger` → mua tại `max(trigger, open)` |
| `take_profit` | Long: trigger > giá hiện tại; Short: trigger < giá hiện tại | Long: `high ≥ trigger` → bán tại `max(trigger, open)`; Short: `low ≤ trigger` → mua tại `min(trigger, open)` |

- **Giá trị lệnh tối thiểu 1 USDT**; số lượng > 0, tối đa 8 chữ số thập phân; giá tối đa 8 chữ số
  thập phân.
- Limit chờ khớp tại đúng giá đặt (không "khớp giá tốt hơn" khi nến mở gap) — đảm bảo phần giữ chỗ
  luôn đủ trả cho lệnh. SL/TP khi nến mở gap qua mức kích hoạt khớp tại giá mở cửa (sát thực tế trượt giá).
- **Limit chờ giữ chỗ** `qty × price × (1 + 0,1%)` từ `cash` ngay khi đặt (bảo thủ, kể cả khi lệnh
  là đóng vị thế). Khớp → trả phần giữ chỗ về `cash` rồi áp dụng khớp; huỷ → trả lại.
- **Market** chỉ chấp nhận nếu sau khi khớp `cash ≥ 0`.
- **SL/TP** là lệnh "đóng toàn bộ vị thế tại thời điểm kích hoạt" (`qty` = |qty vị thế| lúc khớp),
  không giữ chỗ, cùng **nhóm OCO**: 1 lệnh khớp → lệnh kia huỷ. Vị thế về 0 hoặc đảo chiều →
  huỷ SL/TP của nó. Đặt SL/TP được lúc đặt lệnh mở (áp dụng sau khi khớp) hoặc sửa sau trên vị thế.
- Đặt lại SL hoặc TP → huỷ lệnh cũ cùng loại, tạo lệnh mới.

### Quyết toán trễ (lazy settlement)
- Chạy **trước mọi thao tác** trên ví (xem ví, đặt/huỷ lệnh, sửa SL/TP, đóng vị thế, reset).
- Với mỗi mã có lệnh chờ hoặc vị thế Short: lấy **nến 1m** từ mốc `checked_until` nhỏ nhất tới
  hiện tại (tối đa **30 ngày** gần nhất; phân trang 1000 nến/lần).
- Một lệnh chỉ xét các nến **mở từ phút kế tiếp sau khi đặt** (`openTime ≥ floor(created_at,1m) + 60s`)
  — phút đặt lệnh đã được kiểm tra ngay lúc đặt bằng giá hiện tại.
- Xử lý **theo thời gian**: từng nến, trong một nến xét theo `created_at` của lệnh, thanh lý xét
  trước các lệnh của vị thế đó. Mỗi sự kiện kiểm tra lại hiệu lực (lệnh đã huỷ do OCO? vị thế còn?).
- Cập nhật `checked_until` = thời điểm mở của nến cuối (nến đang chạy sẽ được xét lại lần sau).
- Lỗi nguồn giá khi quyết toán → giữ nguyên trạng thái, thao tác vẫn tiếp tục (riêng đặt lệnh
  Market cần giá → trả `PRICE_UNAVAILABLE`), response gắn `settlement_delayed: true`.
- Mọi thao tác trên 1 ví chạy trong **1 transaction**, khoá dòng ví (`SELECT … FOR UPDATE`).

### Tính toán hiển thị
- Lãi/lỗ tạm tính Long = (giá hiện tại − giá vào) × qty; Short = (giá vào − giá hiện tại) × |qty|.
- **Tổng tài sản** = `cash` + Σ giữ chỗ lệnh chờ + Σ Long (qty × giá hiện tại) + Σ Short (ký quỹ + lãi/lỗ tạm tính).
- Lãi/lỗ tổng = tổng tài sản − vốn ban đầu (và %).

## 4. Dữ liệu

Số tiền / khối lượng / giá: cột `numeric(36,18)`, xử lý bằng **`decimal.js`** (không dùng float).

```
trading_accounts  id, user_id → users (cascade), starting_balance, cash, is_active, created_at, closed_at
                  unique (user_id) WHERE is_active
positions         id, account_id → trading_accounts (cascade), market, symbol, qty, avg_price, margin,
                  realized_pnl, liq_checked_until (timestamptz), opened_at, updated_at
                  unique (account_id, market, symbol)
orders            id, account_id → trading_accounts (cascade), market, symbol, side ('buy'|'sell'),
                  type ('market'|'limit'|'stop_loss'|'take_profit'), qty (null = đóng toàn bộ — SL/TP),
                  price (giá limit / giá kích hoạt), status ('pending'|'filled'|'cancelled'),
                  reserved, oco_group (uuid null), checked_until, created_at, filled_at, fill_price, fee
                  index (account_id, status)
trades            id, account_id, order_id (null khi thanh lý), market, symbol, side, qty, price, fee,
                  realized_pnl, kind ('order'|'liquidation'), executed_at
                  index (account_id, executed_at desc)
```

## 5. Kiến trúc mã

```
src/i18n/                      locales.ts, messages/{vi,en}.ts, translate.ts, server.ts (getLocale),
                               I18nProvider.tsx (useT), LanguageSwitcher.tsx
src/server/trading/
  decimal.ts                   cấu hình Decimal, parse/format chuỗi
  engine.ts                    HÀM THUẦN: applyFill, evaluateCandle (trigger/OCO/thanh lý), tính equity
  settlement.ts                quyết toán trễ (đọc DB → nến → engine → ghi DB)
  account-service.ts           lấy/tạo ví, reset, snapshot ví (equity, vị thế, lệnh)
  order-service.ts             đặt/huỷ lệnh, SL/TP, đóng vị thế
src/app/api/trading/…          route handlers mỏng
src/components/trading/        OrderPanel, PositionsTable, OpenOrdersTable, TradeHistory, EquityCard
src/app/(app)/portfolio/       trang Danh mục
```
- Provider thêm `getCandlesSince(symbol, interval, startTimeMs, limit)` (Binance `klines?startTime=`),
  **không cache** (dùng cho quyết toán).

## 6. API (đều cần đăng nhập; lỗi theo định dạng §2)

| Method & path | Body / query | Kết quả |
|---|---|---|
| `GET /api/trading/account` | — | `{account, positions[], open_orders[], settlement_delayed}` — account gồm `cash, reserved, equity, starting_balance, pnl, pnl_pct`; position gồm `symbol, qty, side, avg_price, margin, mark_price, unrealized_pnl, liquidation_price?, stop_loss?, take_profit?` |
| `POST /api/trading/orders` | `{symbol, side, type: market\|limit, qty, price?, stop_loss?, take_profit?}` | 201 order (+ trade nếu khớp ngay) |
| `DELETE /api/trading/orders/:id` | — | 200 order đã huỷ |
| `PUT /api/trading/positions/:symbol/protection` | `{stop_loss: string\|null, take_profit: string\|null}` | 200 position |
| `POST /api/trading/positions/:symbol/close` | — | 200 trade |
| `GET /api/trading/history` | `page, page_size` (≤100) | `{items: trade[], total}` |
| `POST /api/trading/account/reset` | — | 200 account mới |

Số trả về dạng **chuỗi thập phân** (giữ chính xác); client format.

### Mã lỗi
Chung: `UNAUTHORIZED`, `INVALID_BODY`, `INVALID_INPUT`, `INTERNAL`.
Auth: `INVALID_EMAIL`, `EMAIL_TOO_LONG`, `PASSWORD_TOO_SHORT`, `PASSWORD_TOO_LONG`, `PASSWORD_REQUIRED`,
`NAME_REQUIRED`, `NAME_TOO_LONG`, `EMAIL_TAKEN`, `INVALID_CREDENTIALS`.
Market: `INVALID_MARKET`, `MARKET_UNSUPPORTED`, `SYMBOL_REQUIRED`, `SYMBOL_NOT_FOUND`, `INVALID_INTERVAL`,
`INVALID_LIMIT`, `TOO_MANY_SYMBOLS`, `MARKET_UNAVAILABLE`, `CHART_UNAVAILABLE`.
Trading: `INVALID_SIDE`, `INVALID_ORDER_TYPE`, `INVALID_QTY`, `INVALID_PRICE`, `PRICE_REQUIRED`,
`MIN_NOTIONAL {min}`, `INSUFFICIENT_FUNDS {required, available}`, `SL_WRONG_SIDE {price}`,
`TP_WRONG_SIDE {price}`, `NO_POSITION`, `ORDER_NOT_FOUND`, `ORDER_NOT_PENDING`, `PRICE_UNAVAILABLE`.

## 7. Giao diện

- **`/markets/[symbol]`** — thay nút "Sắp ra mắt" bằng **khung đặt lệnh**: tab Mua/Bán, Market/Limit,
  nhập số lượng **hoặc** USDT, nút 25/50/75/100% (theo tiền khả dụng khi mua; theo vị thế Long khi
  bán — vượt quá thì phần dư là mở Short), ô SL/TP tuỳ chọn, phí ước tính, tiền khả dụng; lỗi
  hiển thị theo mã. Biểu đồ vẽ **đường giá vào / SL / TP / thanh lý** của vị thế mã đó. Dưới biểu
  đồ: vị thế và lệnh chờ của mã đó.
- **`/portfolio`** (nav "Danh mục" / "Portfolio"): thẻ tổng tài sản, lãi/lỗ (số + %), tiền khả dụng,
  đang giữ chỗ; bảng vị thế (lãi/lỗ tạm tính, giá thanh lý với Short, sửa SL/TP inline, nút Đóng);
  bảng lệnh chờ (nút Huỷ); lịch sử giao dịch phân trang; nút **Reset ví** có hộp xác nhận.
  Giá cập nhật 3 s (poll `/api/trading/account`, dừng khi tab ẩn).
- Màu: Long/Mua xanh, Short/Bán đỏ; lãi xanh, lỗ đỏ.

## 8. Kiểm thử

- **Unit (vitest, TDD)**: i18n (resolveLocale, translate có tham số / fallback); engine
  (mở/thêm/giảm/đảo Long–Short, giá vào bình quân, phí, giữ chỗ limit, kiểm tra đủ tiền, trigger
  limit/SL/TP với gap mở cửa, OCO, thanh lý Short, thứ tự sự kiện trong 1 nến, tính equity);
  handleRoute trả `{code, params, error}` đúng ngôn ngữ.
- **Thủ công**: đặt Market/Limit/SL/TP, huỷ, đóng, reset; Limit khớp sau khi offline (đặt giá
  gần, chờ vài phút rồi mở ví); đổi ngôn ngữ thấy nhãn & lỗi đổi theo.
- `tsc`, `vitest run`, `next build` phải pass.
