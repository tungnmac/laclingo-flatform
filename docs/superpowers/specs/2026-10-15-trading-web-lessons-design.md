# Thiết kế: Web Trading — Phần 5 (Bài học + quiz + admin nội dung)

> Tiếp nối phần 4 (`2026-10-15-trading-web-journal-design.md`, đã merge vào `main`). Nhánh `feature/trading-lessons`.

## 1. Mục tiêu & tiêu chí hoàn thành

- Người mới học kiến thức trading/đầu tư ngay trong TradeLab theo lộ trình chương → bài, kiểm tra hiểu biết bằng quiz trắc nghiệm.
- **Mỗi bài thuộc một ngôn ngữ** (`vi` hoặc `en`); `/learn` chỉ hiện bài đúng ngôn ngữ đang chọn. Giao diện & lỗi vẫn i18n vi/en như các phần trước.
- **Học tự do**: mọi bài đã công bố đều mở. Bài **hoàn thành** khi quiz đạt **≥ 70%**; làm lại không giới hạn, giữ điểm cao nhất. Có gợi ý "bài tiếp theo".
- Admin (`users.role = 'admin'`) thêm/sửa/xoá chương, bài, câu hỏi; đổi thứ tự; công bố/ẩn; viết Markdown có xem trước; **upload ảnh lên Cloudflare R2**.
- Có sẵn bộ bài khởi đầu (seed) cho cả vi và en.

### Ngoài phạm vi
Video, câu hỏi chọn nhiều đáp án đúng, chứng chỉ, bình luận bài học, kéo-thả sắp xếp, lịch sử phiên bản nội dung, mở khoá tuần tự.

## 2. Dữ liệu (migration `0003_lessons`)

| Bảng | Cột |
|---|---|
| `chapters` | `id` uuid PK, `locale varchar(2)` (`vi`\|`en`), `slug varchar(80)`, `title varchar(200)`, `description text`, `position int`, `published bool default false`, `created_at`, `updated_at`; unique `(locale, slug)` |
| `lessons` | `id` uuid PK, `chapter_id` → chapters **cascade**, `locale varchar(2)` (= locale của chương), `slug varchar(80)`, `title varchar(200)`, `summary text`, `content_md text`, `position int`, `published bool default false`, `created_at`, `updated_at`; unique `(locale, slug)` |
| `quiz_questions` | `id` uuid PK, `lesson_id` → lessons **cascade**, `prompt text`, `options text[]` (2–6), `correct_index int`, `explanation text`, `position int` |
| `lesson_progress` | PK `(user_id, lesson_id)` (cả hai cascade), `best_score int` (0–100), `attempts int`, `completed_at timestamptz null`, `updated_at` |

- `slug`: `^[a-z0-9]+(-[a-z0-9]+)*$`, ≤ 80 ký tự. Title ≤ 200, `content_md` ≤ 100.000 ký tự, prompt/đáp án/giải thích ≤ 2.000.
- `position` sắp tăng dần trong phạm vi cha; đổi thứ tự = đổi `position` với phần tử kề (trong 1 transaction).
- Bài được hiển thị cho người học khi **cả bài và chương** `published = true`.
- Bài không có câu hỏi: không có quiz; bấm "Đánh dấu đã học" → hoàn thành với điểm 100.

## 3. Chấm quiz & tiến độ (hàm thuần, TDD)

- `gradeQuiz(questions, answers)`: `answers.length` phải bằng số câu, mỗi phần tử là số nguyên trong `[0, options.length)` hoặc `null` (bỏ trống = sai) → `{score, correct, total, results: [{question_id, chosen, correct_index, is_correct, explanation}]}`; `score = round(correct ÷ total × 100)`.
- `PASS_SCORE = 70`. `applyAttempt(progress | null, score, now)` → `best_score = max`, `attempts + 1`, `completed_at` giữ nguyên nếu đã có, ngược lại = `now` khi `score ≥ 70`.
- `nextLesson(lessonsInOrder, progressByLesson)` → bài đầu tiên (theo chương rồi bài) chưa hoàn thành; tất cả hoàn thành → `null`.

## 4. API (cần đăng nhập; lỗi `{code, params, error}`)

### Người học
| Method & path | Kết quả |
|---|---|
| `GET /api/learn` | locale lấy từ cookie `trading_locale` (mặc định `vi`). `{chapters: [{id, slug, title, description, lessons: [{id, slug, title, summary, question_count, progress: {best_score, attempts, completed} \| null}]}], next_lesson_slug, completed, total}` — chỉ nội dung đã công bố |
| `GET /api/learn/lessons/:slug` | bài (cùng locale) + `questions: [{id, prompt, options}]` **không có** `correct_index` / `explanation` + `progress` + `prev_slug` / `next_slug`. Không có / chưa công bố / khác locale → `NOT_FOUND` |
| `POST /api/learn/lessons/:slug/quiz` | body `{answers: (number\|null)[]}` → kết quả chấm + `progress` mới. Số câu trả lời sai → `INVALID_ANSWERS` (400). Bài không có câu hỏi: body `{answers: []}` → điểm 100 |

### Admin (`role = 'admin'`, người khác → `FORBIDDEN` 403)
| Method & path | Kết quả |
|---|---|
| `GET /api/admin/learn?locale=vi\|en` | toàn bộ chương + bài (kể cả chưa công bố), không kèm nội dung |
| `POST/PATCH/DELETE /api/admin/learn/chapters[/:id]` | tạo / sửa (`title, slug, description, published`) / xoá chương |
| `POST /api/admin/learn/chapters/:id/move` | body `{direction: 'up'\|'down'}` |
| `GET/POST/PATCH/DELETE /api/admin/learn/lessons[/:id]` | bài kèm `questions` đầy đủ; tạo cần `chapter_id`; PATCH nhận `title, slug, summary, content_md, published, chapter_id` |
| `POST /api/admin/learn/lessons/:id/move` | `{direction}` |
| `PUT /api/admin/learn/lessons/:id/questions` | thay **toàn bộ** danh sách câu hỏi `[{prompt, options, correct_index, explanation}]` (≤ 20 câu) theo thứ tự gửi |
| `POST /api/admin/uploads` | multipart `file` → `{url: "/api/media/<uuid>.<ext>"}` |

### Media
- `GET /api/media/:name` — public, chỉ nhận `^<uuid>\.(jpg|png|webp|gif)$` → 302 sang presigned URL R2 (TTL 1 giờ, `Cache-Control: private, max-age=3000`); tên sai → 404.
- Upload: đọc nội dung, **nhận diện loại ảnh theo magic bytes** (jpeg/png/webp/gif), ≤ 5 MB; key R2 `trading/lessons/<uuid>.<ext>`.
- R2 dùng 4 biến môi trường như backend LacLingo: `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` (thư viện `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`). Thiếu biến → upload/media trả `UPLOAD_UNAVAILABLE` (503); các phần khác vẫn chạy.

### Mã lỗi mới
`FORBIDDEN`, `INVALID_SLUG`, `SLUG_TAKEN`, `TITLE_REQUIRED`, `TEXT_TOO_LONG {max}`, `INVALID_OPTIONS {min,max}`, `INVALID_CORRECT_INDEX`, `TOO_MANY_QUESTIONS {max}`, `INVALID_ANSWERS`, `INVALID_IMAGE`, `IMAGE_TOO_LARGE {max}` (MB), `UPLOAD_UNAVAILABLE`.

## 5. Giao diện

- Nav thêm **Học / Learn** (`/learn`); **Quản trị / Admin** (`/admin/learn`) chỉ hiện với admin.
- `/learn`: thanh tiến độ tổng (X/Y bài), thẻ "Học tiếp: <bài>", các chương (tiến độ chương) → bài với trạng thái chưa học / đang dở (đã làm quiz < 70%) / ✓ hoàn thành + điểm cao nhất. Đổi ngôn ngữ → danh sách đổi theo.
- `/learn/<slug>`: nội dung Markdown (`react-markdown` + `remark-gfm`, **không render HTML thô**), quiz bên dưới (chọn từng câu → Nộp bài → điểm, đúng xanh / sai đỏ + giải thích, Làm lại), nút Bài trước / Bài tiếp. Không tìm thấy → thông báo + link về `/learn`.
- `/admin/learn`: chọn locale; cây chương → bài với lên/xuống, công bố/ẩn, xoá (confirm); form chương; form bài (tiêu đề, slug, tóm tắt, chương, Markdown + xem trước cạnh nhau, nút "Tải ảnh lên" chèn `![](/api/media/…)` tại con trỏ); trình soạn câu hỏi (nội dung, 2–6 đáp án, chọn đáp án đúng, giải thích, thêm/xoá/lên/xuống) → Lưu.
- Trang admin chặn ở server (layout kiểm tra role → user thường bị chuyển về `/learn`) và API cũng chặn độc lập.

## 6. Seed & công cụ

- `npm run make-admin <email>` — đặt `role='admin'` cho user đã đăng ký (không có → báo lỗi, exit 1).
- `npm run seed:lessons` — nạp 2 bộ **vi** và **en**, mỗi bộ 3 chương / 10 bài, mỗi bài 3–5 câu quiz, tất cả `published = true`:
  1. Nhập môn: thị trường crypto & cặp giao dịch; lệnh Market vs Limit; phí & cách tính lãi/lỗ; Long vs Short.
  2. Phân tích kỹ thuật: đọc nến Nhật; hỗ trợ & kháng cự; xu hướng & đường MA.
  3. Quản lý rủi ro & tâm lý: stop-loss & take-profit; cỡ vị thế & quy tắc 1–2%; nhật ký giao dịch & FOMO.
- Idempotent theo `(locale, slug)`: chương/bài đã tồn tại → **bỏ qua** (không ghi đè chỉnh sửa của admin); chỉ thêm cái còn thiếu. Bài seed có link sang `/markets`, `/journal`; không dùng ảnh R2.

## 7. Kiểm thử

- Unit (TDD): `gradeQuiz` (đúng/sai/bỏ trống, làm tròn, sai số câu, chỉ số ngoài phạm vi), `applyAttempt` (giữ điểm cao nhất, `completed_at` chỉ ghi lần đạt đầu), `nextLesson`, validation admin (slug, 2–6 đáp án, `correct_index`, độ dài), nhận diện ảnh theo magic bytes & regex tên media, dữ liệu seed hợp lệ (slug duy nhất mỗi locale, mọi câu hỏi qua validation).
- Curl: user thường gọi admin API → 403; lấy bài không lộ `correct_index`; nộp quiz cập nhật tiến độ; đổi locale đổi danh sách; upload khi chưa cấu hình R2 → `UPLOAD_UNAVAILABLE`; seed chạy 2 lần không nhân đôi; `/learn` 200 cả vi/en.
- `tsc`, `vitest`, `next build` pass.
