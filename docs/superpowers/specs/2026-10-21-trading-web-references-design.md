# Thiết kế: Tài liệu tham khảo (Nguồn học & Nhà đầu tư) — trading-web

## 1. Mục tiêu

- Trong khu **Học tập** thêm menu **🔗 Tài liệu tham khảo** (`/learn/references`) gồm 2 phần:
  - **Nguồn học:** gợi ý khoá học online, chương trình/chứng chỉ, kênh YouTube, website, podcast (vi/en).
  - **Nhà đầu tư:** danh sách nhà đầu tư nổi tiếng thế giới — lọc theo quốc gia; xem khối tài sản (có ngày & nguồn),
    tài sản nắm giữ chính, câu chuyện cuộc đời, lộ trình thành công, bài học.
- Admin quản lý được toàn bộ nội dung; seed sẵn ~20 nhà đầu tư + ~25 nguồn học với số liệu tra cứu từ nguồn công khai.

### Ngoài phạm vi
Cập nhật tài sản tự động từ API bên ngoài, bình luận/đánh giá nguồn học, lưu yêu thích, upload ảnh (ảnh là link).

## 2. Dữ liệu (migration `0011_references`)

### `learning_resources`
| Cột | Kiểu / ràng buộc |
|---|---|
| `id` | uuid PK |
| `title` | varchar(200) NOT NULL |
| `provider` | varchar(120) NOT NULL DEFAULT '' (vd Coursera, CFA Institute) |
| `url` | text NOT NULL, `https://` — UNIQUE |
| `type` | varchar(12): `course` \| `program` \| `youtube` \| `website` \| `podcast` |
| `language` | varchar(2): `vi` \| `en` |
| `is_free` | boolean NOT NULL DEFAULT true |
| `level` | varchar(12): `basic` \| `intermediate` \| `advanced` |
| `topic` | varchar(20): `investing` \| `trading` \| `personal_finance` \| `fundamental` \| `economics` |
| `description_vi`, `description_en` | text NOT NULL DEFAULT '' |
| `search_text` | text NOT NULL DEFAULT '' (bỏ dấu, chữ thường: title + provider) |
| `published` | boolean NOT NULL DEFAULT false |
| `position` | integer NOT NULL DEFAULT 0 |
| `created_at`, `updated_at` | timestamptz |

UNIQUE thêm trên `lower(btrim(title))` (chặn trùng tên).

### `investors`
| Cột | Kiểu / ràng buộc |
|---|---|
| `id` | uuid PK |
| `slug` | varchar(80) UNIQUE, `^[a-z0-9-]+$` |
| `name` | varchar(120) NOT NULL |
| `country` | char(2) mã ISO 3166-1 alpha-2 (chữ hoa) |
| `birth_year` | integer NULL; `death_year` integer NULL (≥ `birth_year`) |
| `photo_url` | text NULL (`https://`) |
| `role_vi`, `role_en` | varchar(200) NOT NULL DEFAULT '' (vd "Chủ tịch Berkshire Hathaway") |
| `style` | varchar(16): `value` \| `growth` \| `macro` \| `quant` \| `activist` \| `index` \| `venture` \| `trading` |
| `net_worth_usd` | bigint NULL (đơn vị USD) |
| `net_worth_as_of` | date NULL; `net_worth_source_url` text NULL — **bắt buộc cả hai khi có `net_worth_usd`** |
| `holdings` | jsonb NOT NULL DEFAULT '[]' — `[{name, kind, percent?, note_vi?, note_en?}]`, `kind` ∈ `stock`\|`company`\|`real_estate`\|`fund`\|`crypto`\|`bond`\|`other`, `percent` 0–100 |
| `story_vi`, `story_en` | text NOT NULL DEFAULT '' |
| `milestones` | jsonb NOT NULL DEFAULT '[]' — `[{year, text_vi, text_en}]`, sắp theo năm |
| `lessons_vi`, `lessons_en` | jsonb NOT NULL DEFAULT '[]' — mảng chuỗi (≤ 8) |
| `search_text` | text NOT NULL DEFAULT '' (bỏ dấu: name) |
| `published`, `position`, `created_at`, `updated_at` | như trên |

Người đã mất: không ghi `net_worth_*` hiện tại; thành tích tiêu biểu đặt trong `story`/`milestones`.

## 3. Quy tắc

- **Học viên** (đã đăng nhập) chỉ thấy bản ghi `published = true`; slug ẩn → 404.
- **Admin** (`requireAdmin`, giống Thư viện) thấy tất cả, CRUD, ẩn/hiện, đổi thứ tự qua `position`.
- **Validation** (zod, dùng chung server cho POST/PATCH; PATCH không áp default):
  link `https://`; slug định dạng & duy nhất; tên nguồn học không trùng; quốc gia 2 chữ hoa;
  tài sản ≥ 0 và có tài sản ⇒ có ngày + link nguồn, ngày không ở tương lai; `death_year ≥ birth_year`;
  năm trong 1800–năm hiện tại; giới hạn độ dài (story ≤ 20.000, mô tả ≤ 2.000, ≤ 30 holdings, ≤ 40 milestones).
- Trùng (unique) → 409 `{code: 'duplicate'}`; lỗi theo định dạng `{code, params, error}` hiện có, hiển thị theo ngôn ngữ.
- **Tìm kiếm:** bỏ dấu, không phân biệt hoa thường (cùng hàm với Sách).
- **Sắp xếp nhà đầu tư:** `net_worth` (giảm dần, người không có số ở cuối), `name`, `birth_year`; mặc định `position`.

## 4. API

| Method & path | Quyền | Kết quả |
|---|---|---|
| `GET /api/references/resources?type&language&free&level&topic&q` | user | danh sách đã công bố |
| `GET /api/references/investors?country&style&status=alive\|deceased&q&sort` | user | danh sách + `countries: [{code, count}]` (trên tập đã công bố) |
| `GET /api/references/investors/:slug` | user | chi tiết (404 nếu ẩn/không có) |
| `GET/POST /api/admin/references/resources`, `PATCH/DELETE …/:id` | admin | CRUD |
| `GET/POST /api/admin/references/investors`, `PATCH/DELETE …/:id` | admin | CRUD |

Thứ tự hiển thị chỉnh bằng trường `position` trong form (giống trang Thư viện), không có endpoint di chuyển riêng.
`references` được thêm vào `RESERVED_LESSON_SLUGS` (bài học slug `references` sẽ không mở được vì trùng trang).

## 5. Giao diện

- `LearnSidebar` thêm `{ href: '/learn/references', label: 'learnNav.references', icon: '🔗' }`.
- `/learn/references` — 2 tab (`?tab=resources|investors`), bộ lọc giữ trên URL.
  - **Nguồn học:** lưới thẻ: icon loại (🎓 🏅 ▶️ 🌐 🎙️), tên, đơn vị, nhãn ngôn ngữ, Miễn phí/Trả phí, trình độ,
    mô tả, nút "Mở ↗" (`target=_blank rel=noopener noreferrer`).
  - **Nhà đầu tư:** thẻ ảnh/chữ cái đầu, tên, cờ + tên quốc gia, phong cách, tài sản rút gọn + "tính đến MM/YYYY",
    nhãn "Đã mất (1894–1976)". Bộ lọc quốc gia chỉ liệt kê nước có dữ liệu kèm số người.
- `/learn/references/investors/[slug]` — đầu trang, ô tài sản ("Số liệu tính đến <ngày> · nguồn: <link>"),
  bảng nắm giữ, câu chuyện, dòng thời gian lộ trình, bài học, dòng miễn trừ
  "Thông tin chỉ mang tính tham khảo, không phải lời khuyên đầu tư."
- `/admin/references` (link trong menu admin) — 2 tab; danh sách + thêm/sửa/ẩn-hiện/thứ tự (`position`)/xoá (xác nhận);
  form nhà đầu tư có danh sách dòng cho holdings, milestones, bài học; ô vi/en.
- Tên quốc gia: `Intl.DisplayNames` theo locale; cờ từ mã ISO (regional indicator). Tiền rút gọn theo locale
  (`Intl.NumberFormat` compact: "140 tỷ US$" / "$140B").
- i18n vi/en cho mọi nhãn.

## 6. Seed (`npm run seed:references`)

- ~20 nhà đầu tư nhiều quốc gia (US, GB, HU/GB, HK, JP, IN, SA, VN, …), gồm người đã mất (Benjamin Graham,
  John Templeton, …) và còn sống; ~25 nguồn học vi/en (khoá học, CFA…, YouTube, website, podcast).
- Số liệu tài sản tra cứu từ nguồn công khai (Forbes, Bloomberg, SEC 13F…) khi soạn; mỗi số có ngày + link nguồn.
- Idempotent: khớp nhà đầu tư theo `slug`, nguồn học theo `url`; bản ghi admin đã sửa (`updated_at > created_at`)
  không bị ghi đè; seed tạo bản ghi `published = true`.

## 7. Kiểm thử

- Unit: validation (tài sản thiếu ngày/nguồn, ngày tương lai, năm mất < năm sinh, link http, slug sai, quốc gia sai);
  tìm kiếm bỏ dấu; định dạng tiền vi/en; quyết định seed (tạo / cập nhật / bỏ qua bản đã sửa).
- API thật: học viên gọi API admin → 403; bản ghi ẩn không hiện & slug ẩn → 404; lọc quốc gia đúng; tạo trùng → 409;
  seed chạy 2 lần không nhân đôi.
- `tsc`, lint, `npm test`, `next build` pass; review code trước khi merge.
