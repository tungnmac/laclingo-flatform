# Thiết kế: Web Trading — Phần 8 (Trung tâm học tập: lộ trình theo cấp độ, sách, kế hoạch đầu tư, thuật ngữ)

> Tiếp nối phần 5 (bài học) và phần 7 (doanh nghiệp). Nhánh `feature/trading-learn-hub`.

## 1. Mục tiêu & tiêu chí hoàn thành

- Mục **Học** có **sidebar** (desktop: cột trái cố định; mobile: thanh tab cuộn ngang ở đầu trang) gồm 4 phần:
  1. **Lộ trình** — chương chia theo cấp độ **Cơ bản / Trung cấp / Nâng cao**, lọc theo cấp; thêm **2 chương nâng cao** (vi + en).
  2. **Sách nên đọc** — danh sách đầu sách, người học đánh dấu *Muốn đọc / Đang đọc / Đã đọc*.
  3. **Kế hoạch đầu tư** — trắc nghiệm khẩu vị rủi ro → gợi ý phân bổ; nhập vốn, góp hằng tháng, kỳ hạn → biểu đồ dự phóng lãi kép; lưu nhiều kế hoạch.
  4. **Thuật ngữ** — từ điển tài chính vi/en, tìm kiếm, link sang bài học liên quan.
- Admin quản lý cấp độ chương, sách, thuật ngữ. Seed sẵn: ~16 đầu sách, ~40 thuật ngữ mỗi ngôn ngữ, 2 chương nâng cao (8 bài).
- Mọi nội dung có miễn trừ "mang tính giáo dục, không phải khuyến nghị đầu tư". Giao diện & lỗi i18n vi/en.

### Ngoài phạm vi
Bán/đọc sách trong app, trích nội dung sách, đồng bộ kế hoạch với ví paper trading, mô phỏng Monte Carlo, nhắc lịch góp vốn, chia sẻ kế hoạch.

## 2. Dữ liệu (migration `0009_learn_hub`)

| Bảng | Cột |
|---|---|
| `chapters` (+cột) | `level varchar(12) not null default 'basic'` (`basic`\|`intermediate`\|`advanced`). Migration gán: `nhap-mon`, `phan-tich-ky-thuat`, `getting-started`, `technical-analysis` → basic; `quan-ly-rui-ro`, `risk-and-psychology`, chương đọc BCTC & chỉ số → intermediate |
| `books` | `id` uuid PK, `title varchar(200)`, `author varchar(200)`, `year int null`, `level` (như chapters), `topic varchar(20)` (`investing`\|`trading`\|`psychology`\|`finance`\|`economics`), `url text null` (http/https), `summary_vi text`, `summary_en text`, `published bool default false`, `position int`, `created_at`, `updated_at` |
| `user_books` | PK `(user_id, book_id)` (cả hai cascade), `status varchar(10)` (`want`\|`reading`\|`done`), `updated_at`; index `(book_id)` |
| `glossary_terms` | `id` uuid PK, `locale varchar(2)`, `term varchar(120)`, `definition_md text` (≤ 4.000), `lesson_slug varchar(80) null`, `published bool default false`, `updated_at`; unique `(locale, lower(term))` |
| `investment_plans` | `id` uuid PK, `user_id` → users cascade, `name varchar(100)`, `currency` (`VND`\|`USD`), `risk_profile` (`conservative`\|`balanced`\|`growth`\|`aggressive`), `allocation jsonb` `{stocks, bonds, cash, crypto}` (số nguyên %, tổng 100), `initial_amount numeric(20,2)`, `monthly_contribution numeric(20,2)`, `years int` (1–50), `expected_return_pct numeric(5,2)` (−20…40), `goal_amount numeric(20,2) null`, `notes text` (≤ 2.000), `created_at`, `updated_at`; index `(user_id, updated_at)`; tối đa 20 kế hoạch / user |

- Slug bài học cấm trùng tên route con: `books`, `plans`, `glossary` (validation `RESERVED_SLUG`).

## 3. Kế hoạch đầu tư — quy tắc tính (hàm thuần `src/lib/plan-projection.ts`)

- **Khẩu vị rủi ro:** 5 câu trắc nghiệm (kỳ hạn, phản ứng khi giảm 20%, kinh nghiệm, nguồn thu nhập, mục tiêu), mỗi câu 1–4 điểm → tổng 5–20 → `conservative` (≤ 8), `balanced` (≤ 12), `growth` (≤ 16), `aggressive`.
- **Phân bổ gợi ý:** conservative 20/50/30/0 · balanced 45/35/15/5 · growth 65/20/10/5 · aggressive 75/10/5/10 (cổ phiếu/trái phiếu/tiền mặt/crypto). Người dùng chỉnh tự do (tổng phải 100).
- **Lợi nhuận kỳ vọng gợi ý** = Σ tỷ trọng × giả định (cổ phiếu 9%, trái phiếu 4%, tiền mặt 2%, crypto 12% — ghi rõ là giả định), làm tròn 0,1; người dùng ghi đè được.
- **Dự phóng:** lãi kép theo tháng, `r = (1 + năm)^(1/12) − 1`; góp đầu mỗi tháng; trả theo năm `{year, contributed, value}` cho 3 kịch bản: kỳ vọng, thận trọng (−3 điểm %), lạc quan (+3 điểm %). Nếu có mục tiêu: năm đạt mục tiêu (kịch bản kỳ vọng) hoặc "chưa đạt trong kỳ hạn" + số tiền góp hằng tháng cần thêm (giải ngược bằng công thức niên kim).
- Tính bằng `decimal.js` ở server và cùng hàm ở client (hàm thuần, không phụ thuộc DB) — client xem trước tức thì, server tính lại khi trả DTO.

## 4. API (cần đăng nhập; lỗi `{code, params, error}`)

| Method & path | Kết quả |
|---|---|
| `GET /api/learn?level=` | như cũ + `level` mỗi chương; lọc theo cấp nếu có |
| `GET /api/learn/books?level=&topic=&status=` | sách đã công bố + `my_status` |
| `PUT /api/learn/books/:id/status` | `{status: want\|reading\|done\|null}` (null = bỏ đánh dấu) |
| `GET /api/learn/glossary?q=` | thuật ngữ đã công bố theo locale, `q` tìm theo term (không phân biệt hoa thường, bỏ dấu) |
| `GET/POST /api/plans`, `GET/PUT/DELETE /api/plans/:id` | CRUD kế hoạch của chính user (người khác → `NOT_FOUND`); DTO kèm `projection` |
| `GET/POST /api/admin/books`, `PATCH/DELETE /api/admin/books/:id` | admin |
| `GET/POST /api/admin/glossary?locale=`, `PATCH/DELETE /api/admin/glossary/:id` | admin |
| `PATCH /api/admin/learn/chapters/:id` | thêm trường `level` |

Mã lỗi mới: `RESERVED_SLUG`, `INVALID_ALLOCATION`, `TOO_MANY_PLANS`, `TERM_TAKEN`, `INVALID_LEVEL`.

## 5. Giao diện

- `src/app/(app)/learn/layout.tsx`: sidebar 4 mục (icon + nhãn, mục đang mở được tô), nội dung bên phải. Mobile: tab cuộn ngang, không cuộn ngang cả trang.
- **Lộ trình** (`/learn`): tab cấp độ *Tất cả / Cơ bản / Trung cấp / Nâng cao* (`?level=`), tiến độ theo cấp; huy hiệu cấp trên từng chương.
- **Sách** (`/learn/books`): lọc cấp độ, chủ đề, trạng thái của tôi; thẻ sách (tên, tác giả, năm, cấp, chủ đề, tóm tắt theo ngôn ngữ, link ngoài `rel=noopener`), nút trạng thái 3 trạng thái.
- **Kế hoạch** (`/learn/plans`): danh sách kế hoạch; tạo/sửa: bước 1 trắc nghiệm rủi ro (bỏ qua được), bước 2 thông số + phân bổ (thanh trượt, tổng = 100), xem trước biểu đồ (SVG, 3 đường + cột tiền góp) và bảng theo năm; lưu. Miễn trừ nổi bật.
- **Thuật ngữ** (`/learn/glossary`): ô tìm kiếm, nhóm theo chữ cái đầu, mỗi mục: thuật ngữ, định nghĩa (Markdown), "Xem bài học" nếu có.
- Admin: `/admin/learn` thêm chọn cấp độ cho chương; trang mới `/admin/library` (2 tab Sách / Thuật ngữ).

## 6. Seed (`npm run seed:library`, idempotent, không ghi đè chỉnh sửa admin)

- **Sách (~16, đã công bố):** chỉ thông tin công khai (tên, tác giả, năm) + tóm tắt ngắn tự viết vi/en về *vì sao nên đọc*; không trích nội dung sách.
- **Thuật ngữ (~40 mỗi ngôn ngữ, đã công bố):** khớp các bài đã có, `lesson_slug` trỏ bài tương ứng.
- **2 chương nâng cao** (vào seed bài học hiện có, cấp `advanced`): *Định giá doanh nghiệp nâng cao* (DCF, EV/EBITDA & bội số so sánh, biên an toàn, bẫy định giá) và *Quản lý danh mục* (đa dạng hoá & tương quan, phân bổ & tái cân bằng, DCA vs đầu tư một lần, đo hiệu quả danh mục). Mỗi bài 4 câu quiz, cùng quy ước số liệu ví dụ khớp nhau.

## 7. Kiểm thử

- Unit (TDD): điểm rủi ro → profile, phân bổ gợi ý, lợi nhuận gợi ý, dự phóng (0% lãi, góp 0, 1 năm, so với công thức đóng), năm đạt mục tiêu & số góp cần thêm, validation kế hoạch (tổng 100, giới hạn), slug cấm, tìm thuật ngữ bỏ dấu, seed hợp lệ (sách/thuật ngữ/bài nâng cao qua validation, slug duy nhất).
- Curl: CRUD kế hoạch & quyền sở hữu, giới hạn 20 kế hoạch, trạng thái sách, lọc cấp độ, admin quyền.
- `tsc`, `vitest`, `next build` pass; smoke test trang.
