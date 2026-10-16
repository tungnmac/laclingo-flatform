# Thiết kế: Web Trading — Phần 7 (Phân tích doanh nghiệp niêm yết)

> Tiếp nối phần 5 (bài học) và chương lý thuyết tài chính. Nhánh `feature/trading-companies`.

## 1. Mục tiêu & tiêu chí hoàn thành

- Người học xem danh sách **doanh nghiệp hàng đầu** đang niêm yết ở **Việt Nam (HOSE)** và **Mỹ**, so sánh nhanh các chỉ số đã học (vốn hoá, P/E, P/B, ROE, biên ròng, D/E, tăng trưởng doanh thu).
- Trang chi tiết mỗi doanh nghiệp: hồ sơ, **phân tích định tính** (mô hình kinh doanh, chiến lược, điểm mạnh, rủi ro), chỉ số chính, **BCTC 5 năm** (KQKD, CĐKT, LCTT) và biểu đồ doanh thu / LNST.
- Số liệu tài chính lấy **tự động từ EODHD** (Fundamentals API), cache Redis; luôn ghi **nguồn & ngày cập nhật** và câu miễn trừ "không phải khuyến nghị đầu tư".
- Phân tích định tính theo ngôn ngữ (vi/en), **admin soạn & duyệt** trước khi công bố. Seed sẵn **bản nháp chưa công bố** cho 10 doanh nghiệp.
- Liên kết sang bài học (P/E, ROE, BCTC…) để người học tra lại khái niệm.
- Giao diện & lỗi i18n vi/en.

### Ngoài phạm vi
Giá realtime / biểu đồ giá cổ phiếu, đặt lệnh cổ phiếu (paper trading vẫn chỉ crypto), BCTC theo quý, so sánh nhiều doanh nghiệp cạnh nhau, lọc / tìm kiếm toàn sàn, tự động chọn "top" theo chỉ số (danh sách do admin quản lý), dịch tự động nội dung.

## 2. Nguồn dữ liệu — EODHD

- `GET https://eodhd.com/api/v1.1/fundamentals/{SYMBOL}.{EX}?api_token=…&fmt=json&filter=General,Highlights,Valuation,Financials` — `EX` = `VN` (HOSE) hoặc `US`. Mỗi request tốn 10 call của gói.
- Biến môi trường `EODHD_API_KEY`. Không đặt: dev tự dùng token `demo` (chỉ một số mã Mỹ như AAPL, MSFT, AMZN, TSLA), production không gọi EODHD. `EODHD_BASE_URL` tuỳ chọn.
- **Không có số liệu không bao giờ làm hỏng trang**: mã lỗi → các ô hiện "—", danh sách báo số mã chưa có số liệu, trang chi tiết vẫn hiện phân tích.
- Provider `src/server/companies/eodhd.ts` chỉ làm 2 việc: gọi HTTP (timeout 10s, thử lại 1 lần khi lỗi mạng) và **map JSON → `Fundamentals`** (hàm thuần, test bằng fixture thật). Trường thiếu / `null` / `"NA"` / 0 vô nghĩa (vốn hoá, số nhân viên) → `null`, UI hiện "—".
- Cache Redis (dùng `CacheStore` có sẵn): `trading:fund:{market}:{symbol}` TTL **24 giờ** + bản stale **7 ngày**; khoá chống dồn request như quotes. EODHD lỗi mà còn stale → trả stale kèm `stale: true`. Lỗi → ghi `trading:fail:fund:…` **10 phút** để mã không có dữ liệu không bị gọi lại mỗi lần tải trang (mỗi request tốn 10 call).
- Trang danh sách cần số liệu của mọi mã → gọi song song tối đa 4 request, mã lỗi → hàng hiện "—" (không làm hỏng cả danh sách).

### `Fundamentals` (sau khi map)

```
{ name, exchange, currency, sector, industry, website, logo_url, employees, ipo_date, description,
  market_cap, pe, pb, eps, dividend_yield, updated_at,
  years: [{ year, revenue, gross_profit, operating_income, net_income,
            total_assets, total_liabilities, equity, cash, current_assets, current_liabilities, total_debt,
            cfo, capex, fcf, dividends_paid }]   // tối đa 5 năm gần nhất, mới nhất trước
}
```

Website/logo chỉ nhận URL `http(s)`. Chỉ số **tự tính** từ năm gần nhất (hàm thuần `ratios(year, prev)`, cùng công thức chương "Các chỉ số tài chính cơ bản"): biên gộp, biên ròng, ROE, ROA, D/E (nợ vay / vốn chủ), thanh toán hiện hành, tăng trưởng doanh thu & LNST so với năm trước. Mẫu số ≤ 0 hoặc thiếu → `null`. **Ngân hàng** (ngành chứa "Bank"): biên gộp, D/E, thanh toán hiện hành → `null` kèm chú thích (nợ là nguyên liệu kinh doanh).

## 3. Dữ liệu (migration `0006_companies`)

| Bảng | Cột |
|---|---|
| `companies` | `id` uuid PK, `market varchar(2)` (`vn`\|`us`), `symbol varchar(20)` (vd `FPT`, `BRK-B`), `active bool default true`, `created_at`; unique `(market, symbol)` |
| `company_analyses` | PK `(company_id, locale)`, `company_id` → companies **cascade**, `locale varchar(2)`, `summary text`, `business_md`, `strategy_md`, `strengths_md`, `risks_md` (text, mặc định `''`), `published bool default false`, `updated_at` |

- Symbol: `^[A-Z0-9]+(-[A-Z0-9]+)?$`, ≤ 20. Markdown mỗi phần ≤ 20.000 ký tự, summary ≤ 2.000.
- Seed `npm run seed:companies` (idempotent theo `(market, symbol)` và `(company_id, locale)`, không ghi đè nội dung admin):
  - **VN:** VCB, BID, CTG, TCB, VHM, VIC, HPG, FPT, VNM, MWG
  - **US:** AAPL, MSFT, NVDA, AMZN, GOOGL, META, BRK-B, JPM, V, TSLA
  - Bản nháp phân tích vi + en (**chưa công bố**) cho FPT, HPG, VNM, MWG, VCB, AAPL, MSFT, NVDA, AMZN, TSLA — chỉ nội dung định tính lâu bền (mô hình kinh doanh, mảng chính, định hướng chiến lược đã công bố, rủi ro ngành), **không ghi số liệu**; admin kiểm tra với báo cáo thường niên mới nhất rồi mới công bố.

## 4. API (cần đăng nhập; lỗi `{code, params, error}`)

| Method & path | Kết quả |
|---|---|
| `GET /api/companies?market=vn\|us` | `{ items: [{ market, symbol, name, sector, market_cap, currency, pe, pb, roe, net_margin, debt_to_equity, revenue_growth, has_analysis }], stale, unavailable, updated_at }` — sắp theo vốn hoá giảm dần, mã thiếu số liệu xuống cuối; `unavailable` = số mã chưa có số liệu |
| `GET /api/companies/:market/:symbol` | `{ market, symbol, fundamentals: Fundamentals \| null, ratios, analysis: {summary, business_md, strategy_md, strengths_md, risks_md, updated_at} \| null (bản đã công bố theo locale), stale }` — mã không có / `active=false` → `NOT_FOUND` |
| `GET /api/admin/companies` | danh sách + trạng thái phân tích vi/en (admin) |
| `POST /api/admin/companies` | `{market, symbol}` → thêm (trùng → `SYMBOL_TAKEN` 409) |
| `PATCH /api/admin/companies/:id` | `{active}` |
| `DELETE /api/admin/companies/:id` | xoá (cascade phân tích) |
| `GET/PUT /api/admin/companies/:id/analysis/:locale` | đọc / ghi phân tích 1 ngôn ngữ (PUT nhận đủ trường + `published`) |

Mã lỗi mới: `SYMBOL_TAKEN`, `INVALID_SYMBOL` (dùng lại `INVALID_MARKET`, `NOT_FOUND`).

## 5. Giao diện

- Nav thêm **Doanh nghiệp / Companies** (`/companies`); admin thêm mục **Doanh nghiệp** (`/admin/companies`).
- `/companies`: tab **Việt Nam / Mỹ** (nhớ tab trong URL `?market=`); bảng: mã + tên + ngành, vốn hoá (VND → "nghìn tỷ đ"/"tỷ đ", USD → "B$"/"M$"), P/E, P/B, ROE, biên ròng, D/E, tăng trưởng DT; bấm tiêu đề cột để sắp xếp; huy hiệu "Có phân tích". Dòng chú thích nguồn & ngày cập nhật + miễn trừ trách nhiệm. Mobile: cuộn ngang trong khung bảng, không cuộn ngang cả trang.
- `/companies/[market]/[symbol]`:
  - Đầu trang: logo, tên, mã · sàn · ngành, website, số nhân viên, năm niêm yết.
  - Thẻ chỉ số (vốn hoá, P/E, P/B, EPS, ROE, biên ròng, D/E, thanh toán hiện hành, cổ tức) — mỗi thẻ có link "?" tới bài học tương ứng.
  - **Phân tích** (nếu đã công bố ở ngôn ngữ đang chọn): tóm tắt + 4 mục Markdown. Chưa có → "Chưa có bài phân tích bằng ngôn ngữ này" + mô tả gốc từ EODHD (tiếng Anh).
  - **BCTC 5 năm**: 3 tab KQKD / CĐKT / LCTT, bảng năm theo cột; biểu đồ cột doanh thu & LNST (SVG thuần, không thêm thư viện).
  - Chân trang: "Nguồn: EODHD · cập nhật <ngày>" (+ "dữ liệu cũ" nếu stale) và miễn trừ trách nhiệm.
- `/admin/companies`: danh sách theo thị trường, thêm mã, bật/tắt, xoá; sửa phân tích từng ngôn ngữ (5 ô Markdown có xem trước, dùng lại `Markdown`) + công bố/ẩn.

## 6. Kiểm thử

- Unit (TDD): map EODHD → `Fundamentals` (fixture thật AAPL.US từ token `demo`, fixture rút gọn dạng VN; trường thiếu/`null`/chuỗi số), `ratios` (đúng công thức, mẫu số 0/âm/thiếu → null, tăng trưởng), sắp xếp danh sách (thiếu số liệu xuống cuối), định dạng vốn hoá VND/USD, validation symbol/market/analysis, cache fresh/stale (dùng lại kiểu test của `cache.test.ts`), seed hợp lệ (mã duy nhất, nháp qua validation, không chứa ảnh ngoài).
- EODHD lỗi / không có dữ liệu → danh sách vẫn đủ mã (ô "—", đếm `unavailable`), trang chi tiết vẫn hiện phân tích.
- `tsc`, `vitest`, `next build` pass.
