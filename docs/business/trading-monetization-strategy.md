# TradeLab / LacTrading — Chiến lược doanh thu (bản rà soát v2)

> Rà soát bản `lactrading_monetization_strategy.md` (v1) theo pháp lý Việt Nam, sản phẩm hiện có và số liệu thực tế. Cập nhật: 23/10/2026.
> **Không phải tư vấn pháp lý** — các điểm đánh dấu ⚖️ cần ý kiến luật sư trước khi triển khai.

## 0. Tóm tắt

| Nguồn thu (v1) | Kết luận | Lý do chính |
|---|---|---|
| Affiliate Exness / CFD offshore | ❌ **Bỏ** với người dùng VN | Forex/CFD qua sàn không phép là bất hợp pháp; quảng cáo, giới thiệu có thể bị xử lý (Luật Quảng cáo sửa đổi 75/2025 — người phát hành QC chịu trách nhiệm) |
| Affiliate Binance / OKX / Bybit | ❌ **Bỏ** với người dùng VN | NĐ 284/2026 (hiệu lực 01/9/2026): tổ chức **quảng cáo** dịch vụ tài sản mã hoá không phép bị phạt 180–200 triệu đ; chưa sàn nào có phép tại VN |
| Pro subscription | ✅ **Giữ, đổi nội dung gói** | Bán **phân tích & dữ liệu**, không bán "đòn bẩy cao hơn" |
| Thu phí nạp lại ví demo khi cháy | ⚠️ **Không làm** | Hợp pháp nhưng kiếm tiền đúng lúc người học "cháy tài khoản" — trái định vị giáo dục; reset vẫn miễn phí |
| Token backtest | ✅ Giữ (nằm trong quota Pro) | Không có rủi ro pháp lý |
| Giải đấu có tài trợ | ✅ **Giữ, đổi nhà tài trợ** | Chỉ nhà tài trợ **được cấp phép tại VN** (CTCK, sau này sàn TSMH được cấp phép); miễn phí tham gia; thông báo khuyến mại; khấu trừ thuế TNCN giải thưởng |
| *(mới)* B2B giáo dục cho CTCK / trường học | ✅ **Thêm — nguồn thu chính** | Nội dung 60 bài + paper trading + nhật ký là thứ CTCK cần cho khách hàng mới |
| *(mới)* Hợp tác marketing với CTCK | ⚠️ ⚖️ Thêm có điều kiện | Hợp đồng dịch vụ marketing (phí cố định/lead), **không** chia hoa hồng giao dịch; cần ý kiến pháp lý |

**Thông điệp định vị:** TradeLab là nơi *học và luyện tập an toàn* — doanh thu đến từ việc giúp người học giỏi hơn, **không** đến từ việc đẩy họ giao dịch nhiều hơn hay dùng đòn bẩy cao hơn. Bài học trong app (chương Tâm lý, Phái sinh, Lịch sử biến động) cảnh báo đúng các hành vi mà mô hình v1 kiếm tiền từ đó; giữ hai thứ nhất quán là lợi thế uy tín dài hạn.

## 1. Vì sao bỏ affiliate sàn offshore

- **Forex/CFD:** chỉ tổ chức tín dụng được NHNN cấp phép mới được cung cấp giao dịch ngoại hối; chưa có sàn forex nào được cấp phép; tên miền exness.vn từng bị chặn; công an nhiều lần triệt phá đường dây sàn forex/CFD và hệ thống "IB" tuyển khách ([VTV 2020](https://english.vtv.vn/news/central-bank-warns-of-illegal-forex-trading-20201208140418548.htm), [LSVN 2023](https://lsvn.vn/canh-bao-rui-ro-tham-gia-san-tien-te-quoc-te-voi-ten-mien-vn-1695462970-a135540.html), [VnEconomy](https://vneconomy.vn/ma-tran-forex-cfd-ky-3-chieu-bai-moi-gioi-rac-thinh-va-dem-con-bo-cho.htm)).
- **Crypto:** Nghị quyết 05/2025/NQ-CP thí điểm thị trường TSMH — chỉ doanh nghiệp VN vốn ≥ 10.000 tỷ đ được cấp phép; 6 tháng sau khi có đơn vị đầu tiên được cấp phép, nhà đầu tư trong nước giao dịch ngoài hệ thống bị xử phạt. NĐ 284/2026 phạt tổ chức **cung cấp hoặc quảng cáo** dịch vụ không phép 180–200 triệu đ ([VnEconomy](https://vneconomy.vn/chinh-thuc-thi-diem-thi-truong-tai-san-ma-hoa-tai-viet-nam-tu-992025.htm), [VietTimes](https://viettimes.vn/tu-19-giao-dich-tai-san-ma-hoa-ngoai-don-vi-duoc-cap-phep-se-bi-xu-phat-nang-post203163.html)).
- **Rủi ro cho người dùng:** ESMA ghi nhận 74–89% tài khoản CFD cá nhân thua lỗ ([ESMA](https://www.esma.europa.eu/node/84933)). RevShare trên spread thưởng cho việc người dùng giao dịch *nhiều hơn* — đúng hành vi mà nhật ký và chương Tâm lý đang giúp người học kiềm chế.
- **App store:** Apple yêu cầu app CFD/FX/crypto phải có giấy phép tại mọi khu vực phát hành; link giới thiệu sàn không phép trong app dễ bị từ chối ([Guidelines 3.1.5, 3.2.2](https://developer.apple.com/app-store/review/guidelines/)).

*Dữ liệu giá Binance cho paper trading vẫn dùng được (là sử dụng dữ liệu, không phải giới thiệu dịch vụ) — cần rà điều khoản API.*

## 2. Các nguồn thu đề xuất

### 2.1. B2B giáo dục — "TradeLab cho tổ chức" (ưu tiên 1)
- **Khách hàng:** công ty chứng khoán (cần đào tạo khách hàng mới, theo tinh thần UBCK yêu cầu kiểm soát tư vấn trên mạng), trường đại học/khối kinh tế, câu lạc bộ đầu tư sinh viên, doanh nghiệp (phúc lợi tài chính cho nhân viên).
- **Sản phẩm:** không gian tổ chức (cohort), lộ trình bài học có chứng nhận hoàn thành, giải đấu nội bộ, bảng điều khiển tiến độ học viên, gắn thương hiệu đối tác (co-branding), nội dung bổ sung theo yêu cầu.
- **Giá tham khảo:** theo số học viên/năm hoặc gói khoá học (VD 50–150 nghìn đ/học viên/năm; gói tối thiểu theo hợp đồng).
- **Nguyên tắc:** nội dung trung lập, **không khuyến nghị mã cụ thể** (Công văn 3760/UBCK-QLKD 2026 yêu cầu người tư vấn phải có chứng chỉ hành nghề).

### 2.2. TradeLab Pro (ưu tiên 2)
- **Giá đề xuất (thị trường VN):** 99.000 đ/tháng · 899.000 đ/năm (≈ 25% rẻ hơn khi trả năm). Giá USD $9.99 của v1 cao so với sức chi của nhóm người học trẻ tại VN.
- **Gói Free giữ nguyên toàn bộ bài học**, paper trading, nhật ký cơ bản, dữ liệu cổ phiếu VN cơ bản — bài học miễn phí là kênh tăng trưởng.
- **Pro bán phân tích & công cụ:**
  - Phân tích nhật ký nâng cao: thống kê theo chiến lược/tag/cảm xúc, phát hiện thói quen xấu (giao dịch trả thù, FOMO, gồng lỗ), "đánh giá sau khi cháy tài khoản".
  - Dữ liệu cổ phiếu VN mở rộng: lịch sử BCTC đầy đủ năm/quý, bộ lọc cổ phiếu theo chỉ số, so sánh doanh nghiệp, xuất CSV.
  - Backtest chiến lược (quota hằng tháng) và nhiều danh mục paper trading song song.
  - Chứng nhận hoàn thành lộ trình.
- **Không đưa vào Pro:** đòn bẩy cao hơn, nạp lại tiền ảo trả phí, tín hiệu mua/bán mã cụ thể.

### 2.3. Giải đấu mô phỏng (ưu tiên 3)
- **Giai đoạn 1 — tự tổ chức:** giải miễn phí theo mùa, xếp hạng theo **lợi nhuận đã điều chỉnh rủi ro** (VD lợi nhuận/max drawdown) thay vì lợi nhuận tuyệt đối — khuyến khích quản lý rủi ro, giảm "đánh bạc tất tay".
- **Giai đoạn 2 — có tài trợ:** chỉ nhà tài trợ được cấp phép tại VN. Thu phí tổ chức + nhà tài trợ góp quỹ giải.
- **Tuân thủ:** miễn phí tham gia (thu phí tham gia + giải thưởng + kết quả phụ thuộc thị trường có rủi ro bị coi là cờ bạc); thông báo/đăng ký khuyến mại với Sở Công Thương theo NĐ 81/2018 sửa đổi bởi NĐ 128/2024 ⚖️; khấu trừ 10% thuế TNCN phần giải thưởng vượt ngưỡng ([TVPL](https://thuvienphapluat.vn/hoi-dap-phap-luat/trung-thuong-bao-nhieu-thi-phai-nop-thue-tncn-282932.html)) ⚖️ (ngưỡng có thể thay đổi theo Luật Thuế TNCN 2025); chống gian lận (một người nhiều tài khoản).

### 2.4. Hợp tác marketing với công ty chứng khoán (có điều kiện ⚖️)
- Người dùng chủ động bấm "Mở tài khoản thật với đối tác" — **không** hiển thị dựa trên lãi/lỗ paper trading, luôn kèm cảnh báo rủi ro và nhãn "Quảng cáo/Đối tác".
- Cấu trúc: **hợp đồng dịch vụ marketing** (phí cố định theo chiến dịch hoặc theo lead đủ điều kiện), **không** nhận phần trăm phí giao dịch — tránh rủi ro bị coi là hoạt động môi giới không phép.
- Theo dõi bằng **click ID ẩn danh**; đối tác tự ghi nhận chuyển đổi phía họ. Không gửi email/SĐT/user ID cho đối tác nếu không có đồng ý riêng, cụ thể (Luật Bảo vệ dữ liệu cá nhân 2025 + NĐ 356/2025, hiệu lực 01/01/2026; phạt tới 5% doanh thu với một số vi phạm) ([PwC](https://www.pwc.com/vn/vn/publications/legal-news-brief/250811-personal-data-protection-law.html)).
- Sàn TSMH trong nước **sau khi được cấp phép** có thể xem xét cùng cơ chế.

## 3. Dự phóng thận trọng (tháng thứ 12)

Giả định — cần thay bằng số liệu thật sau 3 tháng vận hành:

| Chỉ tiêu | Giả định |
|---|---|
| Người dùng đăng ký luỹ kế | 30.000 |
| Hoạt động hằng tháng (MAU) | 8.000 |
| Tỷ lệ MAU trả phí Pro | 1,5% (benchmark freemium toàn cầu ~2–5%, trung vị ~2,1% theo [RevenueCat qua SaaStr](https://www.saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps/); hạ cho VN) |
| Doanh thu Pro bình quân/thuê bao/tháng | ~85.000 đ (pha trộn tháng/năm) |
| Hợp đồng B2B | 2 hợp đồng × 25 triệu đ/tháng |
| Giải đấu có tài trợ | 1 giải/quý × 50 triệu đ phí tổ chức |

| Nguồn | Doanh thu/tháng |
|---|---|
| Pro: 8.000 × 1,5% = 120 thuê bao × 85.000 đ | ≈ 10,2 triệu đ |
| B2B: 2 × 25 triệu đ | 50 triệu đ |
| Giải đấu: 50 triệu đ / 3 tháng | ≈ 16,7 triệu đ |
| **Tổng** | **≈ 77 triệu đ (~3.000 USD)** |

**Kinh tế đơn vị:** chi phí quảng cáo ~30.000–60.000 đ/lượt đăng ký; với chuyển đổi 1,5%, chi phí để có 1 thuê bao Pro ≈ 2–4 triệu đ, trong khi giá trị vòng đời Pro ≈ 85.000 đ × ~8 tháng ≈ 680.000 đ. → **Không nên mua quảng cáo để bán Pro.** Tăng trưởng phải dựa vào kênh tự nhiên (SEO từ 60 bài học và trang dữ liệu cổ phiếu, cộng đồng, đối tác B2B); doanh thu chủ lực là B2B và giải đấu. (So sánh: v1 giả định ARPU 8,5 USD/tháng — tương đương ~85% người dùng trả phí, không khả thi.)

## 4. Dữ liệu (thay cho schema v1)

Thay đổi so với v1: reset vẫn miễn phí (mỗi lần reset đã tạo ví mới nên `demo_reset_transactions` không cần); thêm thuê bao/thanh toán; affiliate dùng click ID ẩn danh + bảng đồng ý.

| Bảng | Mục đích / cột chính |
|---|---|
| `subscriptions` | `user_id`, `plan` (free/pro), `period` (month/year), `status` (active/past_due/canceled/expired), `current_period_end`, `provider`, `provider_subscription_id`; hoặc `org_id` cho B2B |
| `payments` | `id`, `user_id`/`org_id`, `amount_vnd`, `provider` (payos/vnpay/momo/iap), `provider_txn_id` **unique** (chống ghi trùng webhook), `status`, `raw` jsonb, `paid_at` |
| `entitlements` | quyền theo tính năng (`journal_analytics`, `vn_data_pro`, `backtest_quota`…) — tách khỏi gói để B2B/khuyến mại cấp quyền linh hoạt |
| `organizations`, `org_members`, `cohorts` | không gian B2B, vai trò (owner/instructor/student), tiến độ học |
| `contests`, `contest_entries` | mùa giải, luật xếp hạng, ví thi đấu **riêng** (không dùng ví học), điểm số đã điều chỉnh rủi ro, cờ chống gian lận |
| `contest_prizes` | giải, người nhận, số thuế TNCN đã khấu trừ, trạng thái chi trả |
| `partner_offers` | đối tác **được cấp phép tại VN**, giấy phép/số hiệu, nội dung cảnh báo bắt buộc, bật/tắt |
| `partner_clicks` | `click_id` ngẫu nhiên, `offer_id`, thời gian — **không** lưu PII gửi đối tác |
| `user_consents` | `user_id`, `purpose`, `partner_id`, `granted_at`, `revoked_at`, phiên bản điều khoản |

## 5. Thanh toán & pháp nhân
- Cần **pháp nhân VN** (công ty) để ký hợp đồng cổng thanh toán (PayOS/VietQR, VNPay, MoMo) và hợp đồng B2B; Stripe không mở được cho pháp nhân VN ⚖️.
- Website bán dịch vụ trực tuyến cần thực hiện thủ tục thông báo/đăng ký với Bộ Công Thương theo quy định thương mại điện tử ⚖️; xuất hoá đơn điện tử, kê khai VAT.
- Nếu phát hành app di động: thuê bao số phải dùng IAP (Apple 3.1.1/Google Play Billing); tài khoản nhà phát triển là pháp nhân (Apple 5.1.1(ix)).

## 6. Lộ trình (mỗi bước một PR)

| # | Hạng mục | Phụ thuộc |
|---|---|---|
| 1 | **Entitlements + gói Pro** (admin cấp quyền thủ công, chưa thu tiền); gắn cổng tính năng Pro | — |
| 2 | **Phân tích nhật ký nâng cao** (tính năng Pro đầu tiên) | 1 |
| 3 | **Bảng xếp hạng + giải đấu miễn phí** (ví thi đấu riêng, điểm điều chỉnh rủi ro) | — |
| 4 | **Tổ chức/cohort B2B** (mời học viên, theo dõi tiến độ, chứng nhận) | 1 |
| 5 | **Thanh toán** PayOS/VNPay + webhook idempotent | Pháp nhân + hợp đồng cổng |
| 6 | **Đối tác CTCK** (offer, click ID ẩn danh, đồng ý, nhãn quảng cáo) | Ý kiến pháp lý + hợp đồng |
| 7 | **Giải đấu có tài trợ** | 3 + thủ tục khuyến mại |

Các bước 1–4 làm được ngay, không cần pháp nhân hay giấy phép.

## 7. Việc cần quyết / xác minh
- [ ] Thành lập pháp nhân và chọn cổng thanh toán.
- [ ] ⚖️ Ý kiến luật sư chứng khoán về hợp tác marketing với CTCK.
- [ ] ⚖️ Thủ tục khuyến mại cho giải đấu; ngưỡng thuế TNCN giải thưởng theo Luật Thuế TNCN 2025.
- [ ] ⚖️ Thông báo website thương mại điện tử; điều khoản sử dụng và chính sách dữ liệu cá nhân mới.
- [ ] Rà điều khoản sử dụng API dữ liệu Binance cho mục đích giáo dục.
- [ ] Theo dõi việc cấp phép sàn TSMH trong nước (Bộ Tài chính/UBCK) trước khi xem xét đối tác crypto.
