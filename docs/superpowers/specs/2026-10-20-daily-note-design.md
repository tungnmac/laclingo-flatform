# Thiết kế: Daily note (Nhật ký học) — LacLingo

## 1. Mục tiêu

- Học viên **tự đặt việc cần làm mỗi ngày** và theo dõi đã làm được tới đâu; xem lại các ngày trước.
- Việc gắn với hoạt động học trong app được **tự cập nhật tiến độ**; việc tự do thì học viên tự nhập.
- **Riêng tư tuyệt đối:** note là của riêng từng học viên — chỉ chính họ xem/sửa. Không có API/trang admin nào đọc note
  (kể cả role owner/admin), không xuất hiện ở bảng xếp hạng, hồ sơ, thống kê admin, không tạo thông báo cho người khác.

Khác **Nhiệm vụ** (admin đặt, có thưởng EXP): daily note do học viên tự đặt, không có thưởng.

### Ngoài phạm vi
Chia sẻ note, admin xem/quản lý note, nhắc theo từng việc, đính kèm file, thưởng EXP/point.

## 2. Khái niệm & quy tắc

- **Ngày** tính theo múi giờ học viên (`user_reminder_settings.timezone`; chưa có → `Asia/Ho_Chi_Minh`).
- Mỗi học viên có tối đa **1 note / ngày**: danh sách việc + ô **ghi chú trong ngày** (≤ 5.000 ký tự).
- **Việc** (≤ 20 / ngày): tiêu đề (≤ 200 ký tự, không trùng trong cùng ngày theo `dedupe_key`), loại `kind`
  (`free` | `srs_review` | `learn_word` | `grammar_exercise` | `listening_practice` | `speaking_practice` |
  `challenge_participate`), mục tiêu `target` (1–1000, NULL = việc tích xong/chưa), tiến độ `progress` (≥ 0),
  ghi chú ngắn (≤ 500 ký tự), `completed_at`, `carried_from` (việc gốc khi được chuyển), `position`.
- **Hoàn thành:** `target` NULL → tích xong; có `target` → `progress ≥ target`. `completed_at` ghi lần đầu đạt;
  về lại dưới mục tiêu (sửa tay) thì xoá `completed_at`. Đạt rồi vẫn đếm tiếp (vd 25/20).
- **Tự cập nhật:** `MissionService.RecordAction(user, action, amount)` gọi thêm `DailyNoteService.RecordAction` —
  cộng `amount` vào mọi việc cùng `kind` của **note hôm nay** của user (không tạo note nếu chưa có). Lỗi daily note
  chỉ log, không làm hỏng hoạt động học. Việc tự cập nhật vẫn sửa tay được.
- **Lặp lại hằng ngày:** bật "lặp lại" trên 1 việc → lưu mẫu (`daily_task_templates`: tiêu đề, kind, target).
  Lần đầu note của **hôm nay** được tạo, mọi mẫu được thêm thành việc với tiến độ 0. Tắt lặp lại = xoá mẫu
  (từ hôm sau không tạo nữa; việc đã có giữ nguyên).
- **Việc dở:** việc 1 lần chưa xong của ngày trước có thể **"Chuyển sang hôm nay"**: tạo bản sao ở hôm nay với
  `target = target − progress` (việc tích → giữ nguyên), `carried_from` = việc gốc; việc gốc đánh dấu `carried_at`.
  Mỗi việc chỉ chuyển 1 lần. Việc lặp lại không chuyển (hôm nay đã có từ mẫu).
- **Ngày cũ chỉ xem**; ngày tương lai không mở được.
- **Chuỗi ngày hoàn thành:** số ngày liên tiếp (tính tới hôm qua, + hôm nay nếu đã xong hết) có ≥ 1 việc và mọi
  việc đều hoàn thành hoặc đã chuyển.

## 3. Dữ liệu (migration `000035_add_daily_notes`)

| Bảng | Cột chính |
|---|---|
| `daily_notes` | `id`, `user_id` → users cascade, `note_date DATE`, `journal TEXT NOT NULL DEFAULT ''`, `created_at`, `updated_at`; UNIQUE `(user_id, note_date)` |
| `daily_note_tasks` | `id`, `note_id` → daily_notes cascade, `title`, `kind`, `target INT NULL`, `progress INT NOT NULL DEFAULT 0`, `memo TEXT`, `completed_at`, `carried_from UUID NULL` → daily_note_tasks SET NULL, `carried_at`, `template_id UUID NULL` → daily_task_templates SET NULL, `position`, `created_at`; UNIQUE `(note_id, dedupe_key(title))`; CHECK kind |
| `daily_task_templates` | `id`, `user_id` → users cascade, `title`, `kind`, `target`, `position`, `created_at`; UNIQUE `(user_id, dedupe_key(title))` |

Tạo note hôm nay + thêm việc từ mẫu chạy trong 1 transaction, `INSERT … ON CONFLICT DO NOTHING` trên note để 2 request
đồng thời không tạo việc lặp 2 lần (chỉ request tạo được note mới thêm việc từ mẫu).

## 4. API (cần đăng nhập; chỉ dữ liệu của chính user — id của người khác → 404)

| Method & path | Kết quả |
|---|---|
| `GET /daily-notes/today` | note hôm nay (tạo nếu chưa có, kèm việc lặp lại) + `date`, `streak`, `yesterday_unfinished` (việc dở hôm qua chưa chuyển) |
| `GET /daily-notes/:date` | note của ngày `YYYY-MM-DD` (không tạo; ngày chưa có note → note rỗng `exists:false`); ngày > hôm nay → 400 |
| `GET /daily-notes?month=YYYY-MM` | `[{date, total, completed}]` cho lịch tháng |
| `PUT /daily-notes/today/journal` | `{journal}` |
| `POST /daily-notes/today/tasks` | `{title, kind, target?, memo?, repeat?}` → việc mới (`repeat` tạo mẫu) |
| `PATCH /daily-notes/tasks/:id` | `{title?, target?, progress?, done?, memo?, repeat?}` — chỉ việc của note hôm nay |
| `DELETE /daily-notes/tasks/:id` | xoá việc hôm nay (mẫu giữ nguyên nếu đang lặp lại — tắt lặp lại bằng PATCH `repeat:false`) |
| `POST /daily-notes/tasks/:id/move` | `{direction: up\|down}` |
| `POST /daily-notes/tasks/:id/carry-over` | chuyển việc dở của ngày trước sang hôm nay |

Lỗi: 400 dữ liệu sai / sửa ngày cũ, 404 không phải của mình, 409 trùng tiêu đề / đã chuyển, 422 → 400 quá 20 việc.
**Không có endpoint admin nào.**

## 5. Giao diện

- Menu học viên thêm **📓 Nhật ký học** (`/daily`), cạnh Nhiệm vụ (sidebar + menu dưới trên mobile).
- `/daily` (mặc định hôm nay): ngày + ◀ ▶; vòng tiến độ "3/5 việc · 60%"; chuỗi ngày 🔥.
- Danh sách việc: icon theo loại, tiêu đề, thanh tiến độ "12/20" + nút ±, ô tích (việc không có mục tiêu), nhãn
  "tự cập nhật" + link tới trang học tương ứng; mở rộng để sửa ghi chú/tiêu đề/mục tiêu, lặp lại, lên/xuống, xoá.
- Thêm việc: tiêu đề, loại, mục tiêu (tuỳ chọn), "Lặp lại hằng ngày"; chip gợi ý ("Ôn 30 từ", "Học 10 từ mới",
  "Nghe 1 bài", "Làm 10 câu ngữ pháp").
- Ghi chú trong ngày: textarea tự lưu sau ~1 s ngừng gõ ("Đang lưu…" / "Đã lưu").
- Thẻ "Còn N việc dở hôm qua" + "Chuyển sang hôm nay".
- Ngày cũ: chỉ xem + nút chuyển việc dở. Lịch tháng tô màu theo % hoàn thành; bấm ngày để mở.
- i18n vi/en; toast & chặn trùng theo cơ chế chung.

## 6. Kiểm thử

- Unit (TDD): ngày theo múi giờ (sát nửa đêm, múi giờ sai → mặc định), tính hoàn thành / `completed_at`,
  tiến độ chuyển việc dở, chuỗi ngày, giới hạn 20 việc, `RecordAction` chỉ cộng việc cùng kind của note hôm nay.
- API thật: user khác → 404; tạo note hôm nay đồng thời 2 lần → việc lặp chỉ 1 bản; làm bài thật → việc tự tăng;
  chuyển việc dở 2 lần → lần 2 bị chặn.
- `go build`/`go test`, `tsc` pass.
