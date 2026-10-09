# File mẫu để test "Nhập hàng loạt" / "Xuất JSON" trên /admin

Mỗi phần quản trị có cấu trúc JSON khác nhau (đúng field, đúng kiểu dữ liệu như
backend yêu cầu). Dùng các file này để test tính năng upload file / kéo thả
trên trang web — đã chạy thử qua API thật, chắc chắn nhập được trên DB sạch.

| File | Dùng ở trang | Ghi chú |
|---|---|---|
| `vocabulary-topics.sample.json` | `/admin/vocabulary` → tab Chủ đề | — |
| `vocabulary.sample.json` | `/admin/vocabulary` → tab Từ vựng | — |
| `grammar-topics.sample.json` | `/admin/grammar` → tab Chủ đề | — |
| `grammar-lessons.sample.json` | `/admin/grammar` → tab Bài học | `topic_id` phải là UUID **thật đang có trong DB** — không auto-điền theo trang, phải tự dán đúng (xem cách lấy ở dưới). |
| `grammar-exercises.sample.json` | `/admin/grammar/<lessonId>` | Không cần field `lesson_id` — trang tự điền theo `lessonId` trên URL. Nếu dùng ở nơi khác thì phải tự thêm field này. |
| `challenge-questions.sample.json` | `/admin/challenge-questions` | — |
| `listening-passages.sample.json` | `/admin/listening` | — |
| `listening-questions.sample.json` | `/admin/listening/<passageId>` | Không cần field `passage_id` — trang tự điền theo `passageId` trên URL. |

Các field `language_id` ở `vocabulary-topics`, `vocabulary`, `grammar-topics`,
`challenge-questions`, `listening-passages` cũng được trang TỰ ĐIỀN theo ngôn
ngữ đang chọn ở dropdown nếu để trống trong file — có sẵn trong file mẫu chỉ
để dễ đọc, không bắt buộc phải khớp.

## Cách lấy `topic_id` thật cho `grammar-lessons.sample.json`

1. Vào `/admin/grammar` → tab 🗂️ Chủ đề.
2. Mỗi dòng hiển thị `mã · id: <uuid>` — copy đúng uuid của chủ đề muốn gắn bài học vào.
3. Dán vào field `topic_id` trong file trước khi tải lên.

## Lưu ý khi test lại nhiều lần

Chạy lại CÙNG 1 file lần 2 sẽ báo lỗi "đã tồn tại" cho các dòng đã nhập trước
đó (409 — đúng hành vi chống trùng của hệ thống, không phải lỗi). Muốn test
lại từ đầu thì đổi `term`/`code`/`title`/`question` sang giá trị khác, hoặc
xoá dòng cũ trong trang admin trước.
