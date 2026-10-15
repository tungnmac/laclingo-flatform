# Thiết kế: Web Trading — Phần 6 (Thực hành trên biểu đồ nến lịch sử)

> Phần cuối của lộ trình (`2026-10-15-trading-web-foundation-market-data-design.md` §1). Nhánh `feature/trading-practice`.

## 1. Mục tiêu & tiêu chí hoàn thành

- Người học luyện đọc biểu đồ và ra quyết định trên **nến thật trong quá khứ**, phần tương lai bị **giấu** và lộ dần khi tua — thấy kết quả ngay, không chờ thị trường.
- Mỗi phiên có **ví ảo riêng 10.000 USDT**, đặt lệnh như phần 3 (Market / Limit / SL-TP, phí 0,1%, Short ký quỹ 100%, thanh lý), không ảnh hưởng ví paper trading và Nhật ký.
- **Server giữ phiên**: client chỉ nhận nến đã lộ; lệnh khớp ở server bằng engine phần 3.
- Hết phiên: tổng kết (lãi/lỗ, % so với vốn, số lệnh, win rate, profit factor, drawdown, so với mua-và-giữ) và **lộ ngày thật**. Có lịch sử các phiên.
- Giao diện & lỗi i18n vi/en.

### Ngoài phạm vi
Bảng xếp hạng, chia sẻ phiên, chỉ báo kỹ thuật vẽ trên biểu đồ, thử thách dự đoán, thị trường cổ phiếu, chọn ngày bắt đầu.

## 2. Tham số phiên

| Tham số | Giá trị |
|---|---|
| Mã | một mã crypto đang hoạt động, hoặc `random` (server chọn) |
| Khung nến | `1h` \| `4h` \| `1d` |
| Độ dài (`length`) | 50 \| 100 \| 200 nến tương lai |
| Bối cảnh (`context`) | 150 nến lịch sử hiện sẵn |
| Thời điểm bắt đầu | ngẫu nhiên, mốc của nến bối cảnh đầu tiên nằm trong [now − 3 năm, now − 30 ngày − (context+length) × interval], làm tròn xuống theo interval |
| Vốn | 10.000 USDT |

- Tải `context + length` nến 1 lần lúc tạo (`getCandlesSince`, không cache) → lưu vào phiên. Nhận về thiếu nến (mã niêm yết sau mốc đó) → chọn mốc khác, tối đa 5 lần → `PRACTICE_DATA_UNAVAILABLE` (503).
- **Mỗi user tối đa 1 phiên `active`**; tạo phiên mới → phiên cũ tự kết thúc (đóng vị thế ở giá đóng nến cuối đã lộ, tính kết quả).

## 3. Thời gian giả

Client không nhận thời gian thật: nến thứ `i` (0-based trong toàn phiên) có `time = FAKE_EPOCH + i × intervalSeconds` với `FAKE_EPOCH = 946684800` (2000-01-01 UTC). Trục biểu đồ hiển thị "Nến #n" (n = i − context + 1 với nến tương lai, ≤ 0 với bối cảnh) thay cho ngày giờ. Ngày thật (`real_start`, `real_end`) chỉ trả khi phiên `finished`.

## 4. Dữ liệu (migration `0004_practice`)

| Bảng | Cột |
|---|---|
| `practice_sessions` | `id` uuid PK, `user_id` → users cascade, `symbol`, `interval`, `context int`, `length int`, `cursor int` (số nến tương lai đã lộ, 0…length), `candles jsonb` (`[{time(ms thật), open, high, low, close, volume}]` dạng chuỗi số), `wallet jsonb` (`{cash, position: {qty, avgPrice, margin, realizedPnl} \| null}` chuỗi Decimal), `orders jsonb` (lệnh chờ: `{id, side, type, qty, price, reserved, createdAt}`), `status` (`active`\|`finished`), `result jsonb null`, `created_at`, `finished_at`; index `(user_id, status)` và `(user_id, created_at)` |
| `practice_trades` | `id` uuid PK, `session_id` → sessions cascade, `candle_index int`, `side`, `qty`, `price`, `fee`, `realized_pnl`, `closed_qty` (numeric như `trades`), `kind` (`order`\|`liquidation`\|`close`) |

## 5. Quy tắc giao dịch trong phiên

- **Giá hiện tại** = giá đóng của nến cuối đã lộ (index `context + cursor − 1`).
- **Market**: khớp ngay ở giá hiện tại bằng `applyFill` (phí 0,1%, MIN_NOTIONAL, INSUFFICIENT_FUNDS, bán vượt → Short ký quỹ 100%) — cùng kiểm tra & mã lỗi như `placeOrder` phần 3. SL/TP kèm lệnh Market tạo lệnh bảo vệ như phần 3 (`SL_WRONG_SIDE`, `TP_WRONG_SIDE` so với giá hiện tại).
- **Limit**: đặt chờ, giữ chỗ `limitReserve`; khớp khi tua.
- **Tua** `steps` nến: lộ nến `context+cursor … context+cursor+steps−1`, chạy `settleSymbol` lần lượt trên từng nến (time = mốc thật, `liquidationFrom` = thời điểm của nến đầu được tua) → lệnh khớp / huỷ OCO / thanh lý ghi `practice_trades` với `candle_index`. `cursor` không vượt `length`.
- `cursor == length` → **kết thúc tự động**: huỷ lệnh chờ (trả tiền giữ chỗ), đóng vị thế ở giá đóng nến cuối (`kind='close'`), tính `result`.
- **Kết thúc tay** (nút hoặc tạo phiên mới): như trên tại `cursor` hiện tại.
- Mọi thao tác ghi: transaction + `SELECT … FOR UPDATE` dòng phiên; phiên `finished` → `SESSION_FINISHED` (409).

## 6. Kết quả (`result`)

`{ final_equity, net_pnl, return_pct, buy_hold_pct, trades, closing_trades, win_rate, profit_factor, max_drawdown, max_drawdown_pct, total_fees, candles_played, real_start, real_end }` —
thống kê từ `computeStats` (phần 4) trên `practice_trades` với mốc gốc 10.000; `buy_hold_pct` = (close nến cuối đã lộ ÷ close nến bối cảnh cuối − 1) × 100; `return_pct` = (final_equity ÷ 10.000 − 1) × 100; số dạng chuỗi, % `toFixed(2)`.

## 7. API (cần đăng nhập; lỗi `{code, params, error}`)

| Method & path | Kết quả |
|---|---|
| `POST /api/practice/sessions` | body `{symbol: string \| 'random', interval, length}` → `SessionDto` (201) |
| `GET /api/practice/sessions/current` | `SessionDto` của phiên active; không có → `NO_ACTIVE_SESSION` (404) |
| `GET /api/practice/sessions?page` | phiên `finished` của user (mới nhất trước, 20/trang): `{items: [{id, symbol, interval, length, candles_played, result, created_at, finished_at}], total}` |
| `GET /api/practice/sessions/:id` | `SessionDto` (phiên của chính user; của người khác / không có → `NOT_FOUND`) — để xem lại phiên đã xong |
| `POST /api/practice/sessions/current/orders` | như `POST /api/trading/orders` phần 3 (không `note`) → `SessionDto` |
| `DELETE /api/practice/sessions/current/orders/:orderId` | huỷ lệnh chờ → `SessionDto` |
| `POST /api/practice/sessions/current/close` | đóng vị thế ở giá hiện tại → `SessionDto` |
| `POST /api/practice/sessions/current/advance` | `{steps: 1\|5\|10\|'end'}` → `SessionDto` |
| `POST /api/practice/sessions/current/finish` | kết thúc tay → `SessionDto` (finished) |

`SessionDto = { id, symbol, interval, context, length, cursor, status, candles: [{time(giả, giây), open, high, low, close, volume}] (CHỈ context+cursor nến), account: AccountSnapshot-compatible ({account:{cash, reserved, equity, starting_balance, pnl, pnl_pct}, positions, open_orders}), trades: [{candle_index, side, qty, price, fee, realized_pnl, kind}], liquidation_price, result (khi finished, kèm real_start/real_end) }`. Khi `finished`, `candles` gồm toàn bộ nến đã chơi (`context + cursor`).

Mã lỗi mới: `NO_ACTIVE_SESSION`, `SESSION_FINISHED`, `PRACTICE_DATA_UNAVAILABLE`, `INVALID_LENGTH`. Lỗi đặt lệnh dùng lại mã phần 3.

## 8. Giao diện

- Nav thêm **Thực hành / Practice** (`/practice`).
- `/practice` không có phiên active: form (mã — select các mã + "🎲 Ngẫu nhiên"; khung 1h/4h/1d; độ dài 50/100/200) → Bắt đầu; dưới là lịch sử (mã, khung, % lãi/lỗ, so với mua-và-giữ, win rate, ngày luyện) — bấm 1 dòng mở `/practice/<id>` (xem lại).
- Có phiên active: `ReplayChart` (component mới, cùng style `CandleChart`, nhận nến qua props, trục "Nến #n", đường giá vào/SL/TP/thanh lý, marker mua/bán theo `trades`) + tiến độ "Nến 37/100"; thanh tua **+1**, **+5**, **+10**, **Tự chạy** (1 nến/giây, dừng khi bấm lại, khi lỗi hoặc khi hết phiên), **Tới cuối** (confirm); `OrderPanel` (thêm prop `endpoint` và `allowNote`, mặc định giữ hành vi phần 3) với `account` của phiên; bảng vị thế + lệnh chờ của phiên (huỷ / đóng gọi API practice); tổng tài sản; **Kết thúc phiên** (confirm).
- Phiên vừa kết thúc / `/practice/<id>`: thẻ tổng kết (§6) + "Giai đoạn: <real_start> – <real_end>" + biểu đồ toàn phiên có marker + nút **Luyện phiên mới**.

## 9. Kiểm thử

- Unit (TDD), hàm thuần trong `src/server/practice/`: chọn mốc bắt đầu (trong khoảng, làm tròn theo interval, đủ chỗ cho context+length), thời gian giả, `advance` (lộ đúng số nến, dừng ở `length`, khớp Limit/SL/TP & thanh lý qua engine, tự kết thúc và đóng vị thế khi hết), Market khớp ở giá đóng nến cuối đã lộ, `result` (return %, mua-và-giữ, thống kê), DTO **không chứa nến chưa lộ** và không chứa thời gian thật khi active.
- Curl: số nến nhận = context + cursor; tạo phiên mới kết thúc phiên cũ; Limit khớp khi tua; tới cuối → finished + result; phiên người khác → 404; 2 lần advance song song → cursor tăng đúng 2.
- `tsc`, `vitest`, `next build` pass.
