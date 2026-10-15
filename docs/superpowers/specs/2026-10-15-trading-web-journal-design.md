# Thiết kế: Web Trading — Phần 4 (Nhật ký & phân tích hiệu suất)

> Tiếp nối phần 3 (`2026-10-15-trading-web-paper-trading-design.md`, nhánh `feature/trading-paper`).

## 1. Mục tiêu & tiêu chí hoàn thành

- Người dùng ghi **nhật ký cho từng giao dịch**: lý do vào/ra, bài học, cảm xúc, tự chấm 1–5 sao, tag.
- Khung đặt lệnh có ô **"Lý do vào lệnh"** (tuỳ chọn) — hiện sẵn làm lý do trong nhật ký của giao dịch khớp từ lệnh đó.
- Trang **`/journal`** hiển thị chỉ số hiệu suất, đường lãi/lỗ luỹ kế, lãi/lỗ theo mã và danh sách giao dịch kèm nhật ký; lọc theo **ví** (hiện tại / tất cả / từng ví cũ), **mã**, **thời gian** (7/30/90 ngày / tất cả).
- Toàn bộ giao diện & lỗi theo i18n vi/en (như phần 3).

### Ngoài phạm vi
Lưu ảnh chụp tổng tài sản theo thời gian (đường cong dùng lãi/lỗ **đã chốt**), xuất CSV, chia sẻ nhật ký, nhật ký theo "chuyến" (mở→đóng vị thế) — nhật ký gắn theo từng lần khớp.

## 2. Định nghĩa chỉ số

Mỗi trade có `realized_pnl`, `fee`, `closed_qty` (phần khối lượng **đóng** vị thế trong lần khớp).

| Chỉ số | Định nghĩa |
|---|---|
| Lệnh chốt | trade có `closed_qty > 0` (kể cả thanh lý, kể cả hoà vốn) |
| Kết quả ròng của lệnh chốt | `realized_pnl − fee` của chính trade đó |
| Thắng / Thua / Hoà | kết quả ròng > 0 / < 0 / = 0 |
| Win rate | thắng ÷ số lệnh chốt × 100 (không có lệnh chốt → null) |
| Lãi/lỗ ròng | Σ `realized_pnl` − Σ `fee` của **mọi** trade (cả phí lệnh mở) |
| Tổng lãi / tổng lỗ | Σ kết quả ròng dương / âm của lệnh chốt |
| Lãi TB / lỗ TB | tổng lãi ÷ số thắng / tổng lỗ ÷ số thua |
| Profit factor | tổng lãi ÷ \|tổng lỗ\| (không có lỗ → null) |
| Kỳ vọng / lệnh | lãi/lỗ ròng ÷ số lệnh chốt |
| Lệnh lãi / lỗ lớn nhất | max / min kết quả ròng của lệnh chốt |
| Đường lãi/lỗ luỹ kế | mỗi trade (theo thời gian) một điểm: Σ(`realized_pnl − fee`) tới thời điểm đó |
| Drawdown lớn nhất | trên đường vốn = **mốc gốc** + luỹ kế: max(đỉnh − hiện tại); % = drawdown ÷ đỉnh tại thời điểm đó × 100 (lấy max %) |
| Theo mã | mỗi mã: số trade, số lệnh chốt, win rate, lãi/lỗ ròng — sắp lãi/lỗ ròng giảm dần |

**Mốc gốc** (cho drawdown): 1 ví → vốn ban đầu của ví + lãi/lỗ ròng các trade **trước** khoảng thời gian lọc; "tất cả ví" → 10.000.

Tính bằng **`decimal.js`**, hàm thuần, trả số dạng chuỗi.

## 3. Dữ liệu

Migration mới:
- `trades.closed_qty numeric(36,18) not null default 0` — engine điền cho mọi lần khớp mới; **dữ liệu cũ**: `closed_qty = qty` khi `realized_pnl <> 0`.
- `orders.note text null` — lý do nhập lúc đặt lệnh (≤ 1000 ký tự).
- Bảng `trade_notes`: `trade_id` (PK, → trades cascade), `reason text`, `lesson text`, `emotion varchar(12)` (`calm|confident|fearful|greedy|fomo|revenge` hoặc null), `rating int` (1–5 hoặc null), `tags text[]` (≤ 10 tag, mỗi tag ≤ 30 ký tự, lưu chữ thường, bỏ trùng), `updated_at`.

Engine: `FillResult` và sự kiện `fill` / `liquidation` thêm `closedQty`.

## 4. API (cần đăng nhập; lỗi `{code, params, error}`)

| Method & path | Kết quả |
|---|---|
| `GET /api/journal/accounts` | `[{id, is_active, starting_balance, created_at, closed_at}]` các ví của user, mới nhất trước |
| `GET /api/journal/stats?account=current\|all\|<id>&symbol=&range=7d\|30d\|90d\|all` | `{metrics, curve: [{time, pnl}], by_symbol: [...]}` |
| `GET /api/journal/trades?account&symbol&range&page&page_size(≤100)` | `{items: [{…trade, account_id, note: {reason, lesson, emotion, rating, tags} \| null, order_note}], total}` mới nhất trước |
| `PUT /api/journal/trades/:id/note` | body `{reason?, lesson?, emotion?, rating?, tags?}` (null = xoá trường) → note đã lưu |

- `account` không thuộc user / trade không thuộc user → `NOT_FOUND` (404) — chỉ đọc/ghi dữ liệu của chính mình (kể cả ví cũ).
- `account=current|all` → quyết toán ví hiện tại trước (lệnh khớp lúc offline có trong thống kê).
- Mã lỗi mới: `NOT_FOUND`, `INVALID_EMOTION`, `INVALID_RATING`, `TOO_MANY_TAGS {max}`, `TAG_TOO_LONG {max}`, `NOTE_TOO_LONG {max}`.

## 5. Giao diện

- Nav thêm **Nhật ký / Journal** (`/journal`).
- Hàng lọc: ví (select), mã (select từ danh sách mã), thời gian (nút 7D/30D/90D/All) — giữ trên URL query để chia sẻ/refresh.
- Thẻ chỉ số: lãi/lỗ ròng, win rate (thắng/thua), profit factor, kỳ vọng, lãi TB / lỗ TB, lớn nhất, drawdown lớn nhất, tổng phí, số lệnh.
- Biểu đồ đường lãi/lỗ luỹ kế (`lightweight-charts` BaselineSeries: trên 0 xanh, dưới 0 đỏ).
- Bảng theo mã; danh sách giao dịch (phân trang 20) — bấm 1 dòng mở **khung nhật ký** ngay dưới dòng: cảm xúc (chip chọn), sao 1–5, lý do (hiện sẵn lý do lúc đặt lệnh nếu chưa có), bài học, tag (nhập, Enter để thêm) → Lưu.
- Khung đặt lệnh (phần 3) thêm ô "Lý do vào lệnh" (thu gọn mặc định).

## 6. Kiểm thử

- Unit (TDD): `computeStats` (thắng/thua/hoà, phí lệnh mở trong lãi/lỗ ròng, profit factor null, drawdown & %, mốc gốc, theo mã, danh sách rỗng); engine `closedQty` (mở / đóng một phần / đảo chiều / thanh lý); validation nhật ký.
- Curl: ghi/sửa/xoá trường nhật ký, chặn trade của user khác, lọc ví cũ / mã / thời gian, lý do lúc đặt lệnh hiện ra.
- `tsc`, `vitest`, `next build` pass.
