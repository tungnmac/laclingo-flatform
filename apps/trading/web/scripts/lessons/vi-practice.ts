import type { SeedChapter } from './types'

// Phân tích BCTC thực hành (vi) — đi sâu hơn chương "Đọc báo cáo tài chính" và "Các chỉ số tài chính cơ bản".
// Số liệu thật lấy từ BCTC hợp nhất năm (tỷ đồng) của FPT, HPG, VCB, tổng hợp từ dữ liệu công khai (Vietcap), làm tròn.
// Mọi ví dụ "xào nấu" đều là công ty giả định — không ám chỉ doanh nghiệp thật nào.
export const VI_PRACTICE: SeedChapter[] = [
  {
    slug: 'phan-tich-bctc-thuc-hanh',
    title: 'Phân tích BCTC thực hành',
    description:
      'Đọc thuyết minh và ý kiến kiểm toán, đánh giá chất lượng lợi nhuận, nhận diện dấu hiệu bất thường, phân tích dòng tiền chuyên sâu và so sánh doanh nghiệp cùng ngành — với số liệu thật của FPT, HPG, VCB.',
    level: 'advanced',
    lessons: [
      {
        slug: 'thuyet-minh-va-y-kien-kiem-toan',
        title: 'Đọc thuyết minh BCTC và ý kiến kiểm toán',
        summary:
          'Những thuyết minh quan trọng nhất, các loại ý kiến kiểm toán, đoạn "vấn đề cần nhấn mạnh" và các tín hiệu cảnh báo như nộp chậm, đổi kiểm toán, chênh lệch sau kiểm toán.',
        content_md: `## Vì sao phải đọc phần "chữ nhỏ"?

Ba báo cáo chính chỉ cho bạn **con số**. **Thuyết minh BCTC** cho bạn biết con số đó được tạo ra **như thế nào** — và thường dài gấp nhiều lần ba báo cáo cộng lại. Nhà phân tích chuyên nghiệp thường đọc **báo cáo kiểm toán** trước, rồi tới các thuyết minh then chốt, sau cùng mới quay lại các dòng tổng.

## Các thuyết minh đáng đọc nhất

| Thuyết minh | Bạn tìm gì ở đó |
|---|---|
| **Chính sách kế toán chủ yếu** | Ghi nhận doanh thu khi nào (giao hàng, theo tiến độ hợp đồng?), khấu hao theo phương pháp nào, thời gian bao lâu. Chính sách **thay đổi** giữa hai năm là điểm phải hỏi "vì sao". |
| **Phải thu khách hàng** | Bảng **phân tích tuổi nợ** (dưới 6 tháng, 6–12 tháng, trên 1 năm…) và **dự phòng phải thu khó đòi**. Nợ quá hạn tăng mà dự phòng không tăng → lợi nhuận có thể đang được "đẩy" lên. |
| **Hàng tồn kho** | Cơ cấu nguyên liệu – thành phẩm – hàng đi đường, **dự phòng giảm giá hàng tồn kho**. Với doanh nghiệp chu kỳ (thép, bất động sản), đây là nơi lỗ ẩn nằm. |
| **Vay và nợ thuê tài chính** | Ngắn hạn/dài hạn, lãi suất, đồng tiền vay, **tài sản bảo đảm**, lịch đáo hạn. Nợ dồn đáo hạn trong 12 tháng tới là rủi ro thanh khoản. |
| **Giao dịch với bên liên quan** | Mua bán, cho vay, bảo lãnh với cổ đông lớn, công ty "anh em", thành viên HĐQT. Số dư phải thu bên liên quan lớn là tín hiệu cần soi. |
| **Nợ tiềm tàng và cam kết** | Bảo lãnh cho bên thứ ba, kiện tụng, cam kết góp vốn — những nghĩa vụ **chưa** nằm trên bảng cân đối. |
| **Sự kiện sau ngày kết thúc kỳ** | Phát hành thêm cổ phiếu, khoản lỗ lớn, thay đổi lãnh đạo xảy ra sau ngày khoá sổ nhưng trước ngày ký báo cáo. |
| **Báo cáo bộ phận** | Doanh thu và lợi nhuận theo mảng/khu vực — cho biết mảng nào thực sự tạo ra tiền. |

Mẹo: dùng chức năng tìm kiếm trong file PDF với các từ khoá "dự phòng", "bên liên quan", "bảo lãnh", "tài sản bảo đảm", "điều chỉnh hồi tố".

## Các loại ý kiến kiểm toán

| Ý kiến | Nghĩa | Mức cảnh báo |
|---|---|---|
| **Chấp nhận toàn phần** | BCTC trình bày trung thực, hợp lý trên các khía cạnh trọng yếu | Bình thường |
| **Ngoại trừ** | Có sai sót trọng yếu nhưng giới hạn ở một/vài khoản mục, hoặc kiểm toán viên không thu thập đủ bằng chứng cho khoản đó | Cao — phải đọc kỹ khoản bị ngoại trừ và quy mô của nó |
| **Trái ngược** | Sai sót trọng yếu và lan toả, BCTC không phản ánh trung thực | Rất cao |
| **Từ chối đưa ra ý kiến** | Kiểm toán viên không thể thu thập đủ bằng chứng để kết luận, và ảnh hưởng có thể có là trọng yếu và lan toả | Rất cao |

**Đoạn "Vấn đề cần nhấn mạnh"** (emphasis of matter) **không** làm thay đổi ý kiến — ý kiến vẫn có thể là chấp nhận toàn phần. Nhưng kiểm toán viên chủ động kéo sự chú ý của bạn tới một vấn đề: thường gặp nhất là **sự không chắc chắn trọng yếu liên quan đến khả năng hoạt động liên tục** (lỗ luỹ kế lớn, nợ ngắn hạn vượt tài sản ngắn hạn), một vụ kiện lớn chưa có kết quả, hoặc khoản phải thu bên liên quan khó thu hồi. Đừng đọc lướt chỉ vì thấy chữ "chấp nhận toàn phần".

Hệ quả thực tế: cổ phiếu có ý kiến kiểm toán không phải chấp nhận toàn phần thường bị loại khỏi danh mục cho vay ký quỹ, và các quỹ có quy trình kiểm soát rủi ro thường tránh xa.

## Các tín hiệu cảnh báo quanh kỳ kiểm toán

- **Nộp BCTC kiểm toán chậm** hoặc xin gia hạn nhiều lần: thường có nghĩa là doanh nghiệp và kiểm toán viên chưa thống nhất được số liệu.
- **Thay đổi công ty kiểm toán** bất thường, nhất là đổi giữa niên độ hoặc đổi từ hãng lớn sang hãng nhỏ ít tên tuổi, mà không giải thích thuyết phục.
- **Chênh lệch trước và sau kiểm toán:** BCTC quý 4 do doanh nghiệp tự lập; BCTC năm đã kiểm toán ra sau. Nếu lợi nhuận sau kiểm toán **giảm mạnh** so với số tự lập (do kiểm toán viên buộc trích thêm dự phòng, loại bớt doanh thu…), doanh nghiệp phải công bố giải trình — theo quy định công bố thông tin hiện hành (ví dụ Thông tư 96/2020/TT-BTC), khi lợi nhuận sau thuế trước và sau kiểm toán chênh lệch từ 5% trở lên (tăng hoặc giảm) hoặc chuyển từ lãi sang lỗ và ngược lại. Một lần có thể là khác biệt kỹ thuật; lặp lại nhiều năm là dấu hiệu chất lượng kế toán kém.
- **Soát xét bán niên khác kiểm toán năm:** BCTC bán niên chỉ được **soát xét** (mức đảm bảo thấp hơn kiểm toán). Hãy so kết luận soát xét giữa năm với ý kiến kiểm toán cuối năm — một khoản "ngoại trừ" xuất hiện ở bán niên rồi kéo dài sang năm là vấn đề chưa được giải quyết.

## Ví dụ minh hoạ (giả định)

Công ty giả định XYZ công bố BCTC quý 4 tự lập với lợi nhuận sau thuế cả năm **200 tỷ đồng**. Sau kiểm toán, con số còn **150 tỷ** do phải trích thêm 50 tỷ dự phòng phải thu khó đòi. Chênh lệch:

> (150 − 200) / 200 = **−25%**

Đọc thuyết minh phải thu, bạn thấy khoản nợ trên 1 năm tuổi chủ yếu là của một **bên liên quan**. Ba dữ kiện cộng lại — chênh lệch lớn, nợ quá hạn, đối tác là bên liên quan — mạnh hơn nhiều so với từng dữ kiện riêng lẻ.

## Thực hành

Tải BCTC hợp nhất năm gần nhất (đã kiểm toán) của một doanh nghiệp bạn quan tâm và trả lời: (1) Ý kiến kiểm toán là gì, có đoạn "vấn đề cần nhấn mạnh" không? (2) Tỷ lệ dự phòng / tổng phải thu khách hàng là bao nhiêu và thay đổi ra sao so với năm trước? (3) Có khoản bảo lãnh hay giao dịch bên liên quan nào lớn hơn 5% vốn chủ sở hữu không? (4) So lợi nhuận sau thuế trong BCTC quý 4 tự lập với BCTC năm đã kiểm toán — chênh lệch bao nhiêu phần trăm?`,
        questions: [
          {
            prompt: 'BCTC có ý kiến "chấp nhận toàn phần" kèm đoạn "vấn đề cần nhấn mạnh" về khả năng hoạt động liên tục. Cách hiểu nào đúng?',
            options: [
              'Ý kiến vẫn là chấp nhận toàn phần, nhưng kiểm toán viên lưu ý một rủi ro trọng yếu về khả năng tiếp tục hoạt động — cần đọc kỹ',
              'Đây thực chất là ý kiến trái ngược',
              'Đoạn nhấn mạnh chỉ là thủ tục, có thể bỏ qua',
              'Kiểm toán viên đã từ chối đưa ra ý kiến',
            ],
            correct_index: 0,
            explanation:
              'Đoạn "vấn đề cần nhấn mạnh" không thay đổi loại ý kiến, nhưng kiểm toán viên chủ động hướng sự chú ý của người đọc tới một vấn đề quan trọng — ở đây là rủi ro hoạt động liên tục (lỗ luỹ kế, mất cân đối nợ ngắn hạn…).',
          },
          {
            prompt: 'Lợi nhuận sau thuế tự lập là 200 tỷ, sau kiểm toán còn 150 tỷ. Chênh lệch sau kiểm toán là bao nhiêu?',
            options: ['−20%', '−25%', '−33%', '−50%'],
            correct_index: 1,
            explanation: '(150 − 200) / 200 = −50 / 200 = −25%. Lấy số trước kiểm toán (200) làm gốc so sánh.',
          },
          {
            prompt: 'Muốn biết lợi nhuận có đang bị "đẩy" lên nhờ trích dự phòng quá ít hay không, bạn nên xem thuyết minh nào trước?',
            options: [
              'Thông tin chung về doanh nghiệp',
              'Phân tích tuổi nợ phải thu và dự phòng phải thu khó đòi',
              'Danh sách thành viên HĐQT',
              'Vốn điều lệ',
            ],
            correct_index: 1,
            explanation:
              'Nếu nợ quá hạn lâu năm tăng mà dự phòng không tăng tương ứng, chi phí đang bị ghi nhận thiếu và lợi nhuận bị phóng đại. Bảng tuổi nợ và dự phòng trả lời trực tiếp câu hỏi này.',
          },
          {
            prompt: 'Nhóm dữ kiện nào là tín hiệu cảnh báo MẠNH NHẤT?',
            options: [
              'Doanh nghiệp công bố BCTC đúng hạn, ý kiến chấp nhận toàn phần',
              'Doanh thu tăng 10% cùng với chi phí bán hàng tăng 10%',
              'Nộp BCTC kiểm toán chậm, vừa đổi công ty kiểm toán, lợi nhuận sau kiểm toán giảm mạnh so với số tự lập',
              'Doanh nghiệp có công ty con ở nước ngoài',
            ],
            correct_index: 2,
            explanation:
              'Mỗi dấu hiệu riêng lẻ có thể có lý do hợp lý, nhưng nộp chậm + đổi kiểm toán + chênh lệch lớn sau kiểm toán cùng lúc cho thấy doanh nghiệp và kiểm toán viên bất đồng về số liệu — tín hiệu cần thận trọng cao.',
          },
        ],
      },
      {
        slug: 'chat-luong-loi-nhuan',
        title: 'Chất lượng lợi nhuận',
        summary:
          'Lợi nhuận có biến thành tiền không? Đo bằng tỷ lệ CFO/LNST nhiều năm, so tốc độ tăng phải thu – tồn kho với doanh thu và tách các khoản bất thường — ví dụ với FPT và HPG.',
        content_md: `## Lợi nhuận kế toán và tiền

Lợi nhuận được lập theo **cơ sở dồn tích**: doanh thu ghi nhận khi giao hàng (dù chưa thu tiền), chi phí ghi nhận khi phát sinh (dù chưa trả). Phần chênh lệch giữa lợi nhuận và tiền gọi là **khoản dồn tích (accruals)**:

> **Dồn tích = Lợi nhuận sau thuế − Lưu chuyển tiền thuần từ hoạt động kinh doanh (CFO)**

Dồn tích không xấu — nó là bản chất của kế toán. Nhưng **lợi nhuận chất lượng cao** là lợi nhuận **bền vững** (lặp lại được) và **chuyển thành tiền** qua thời gian. Nghiên cứu học thuật (Sloan, 1996) cho thấy doanh nghiệp có dồn tích lớn so với tổng tài sản thường có lợi nhuận tương lai kém hơn.

## Bốn phép kiểm tra chính

1. **CFO / LNST qua nhiều năm.** Một năm lệch là bình thường (thời điểm thu tiền, mùa vụ). Cộng dồn 3–5 năm, tỷ lệ nên quanh hoặc trên **1,0** với doanh nghiệp phi tài chính (vì khấu hao là chi phí không dùng tiền). Thấp hơn hẳn 1 nhiều năm liền là cảnh báo.
2. **Phải thu và tồn kho so với doanh thu.** Nếu **phải thu khách hàng** tăng nhanh hơn doanh thu nhiều năm liên tiếp, doanh nghiệp có thể đang nới tín dụng để bán được hàng. Tồn kho tăng nhanh hơn doanh thu có thể là hàng ế.
3. **Khoản bất thường, không lặp lại:** lãi bán tài sản, bán công ty con, đánh giá lại khoản đầu tư, **doanh thu hoạt động tài chính** đột biến, **thu nhập khác**. Hãy tính lại "lợi nhuận cốt lõi" sau khi loại các khoản này.
4. **Chi phí bị đẩy sang tương lai:** **vốn hoá chi phí** (lãi vay, phát triển phần mềm, chi phí trả trước dài hạn) làm chi phí kỳ này thấp hơn; **hoàn nhập dự phòng** làm lợi nhuận tăng mà không có tiền vào. Xem thuyết minh để biết quy mô.

## Ví dụ 1: FPT — doanh nghiệp dịch vụ, ít tài sản

| Năm | LNST | CFO | CFO/LNST | Tăng doanh thu | Tăng phải thu KH |
|---|---|---|---|---|---|
| 2021 | 5.349 | 5.840 | 1,09 | — | — |
| 2022 | 6.491 | 5.054 | 0,78 | +23,4% | +28,6% |
| 2023 | 7.788 | 9.517 | 1,22 | +19,6% | +13,4% |
| 2024 | 9.427 | 11.704 | 1,24 | +19,4% | +16,3% |
| 2025 | 11.232 | 10.136 | 0,90 | +11,6% | +20,9% |

Đơn vị: tỷ đồng. Số liệu: BCTC hợp nhất năm, tổng hợp từ dữ liệu công khai (Vietcap), làm tròn.

- **Cộng dồn 5 năm:** CFO = 42.251, LNST = 40.287 → CFO/LNST = 42.251 / 40.287 ≈ **1,05**. Lợi nhuận nhìn chung đã chuyển thành tiền.
- **Năm 2025:** dồn tích = 11.232 − 10.136 = **1.096 tỷ**, tức khoảng 1.096 / ((72.000 + 88.142) / 2) ≈ **1,4%** tổng tài sản bình quân — nhỏ. Năm 2024 ngược lại: CFO vượt lợi nhuận 11.704 − 9.427 = 2.277 tỷ.
- **Phải thu 2025** tăng 20,9% (10.537 → 12.735) trong khi doanh thu tăng 11,6% (62.849 → 70.113). Số ngày thu tiền (phải thu cuối kỳ / doanh thu × 365) tăng từ khoảng **61** lên **66** ngày. Trên cả giai đoạn 2021–2025, phải thu tăng ×2,05 so với doanh thu ×1,97 — gần như song hành.

Kết luận đúng mực: một năm phải thu tăng nhanh hơn doanh thu **chưa phải** dấu hiệu xấu — có thể do hợp đồng dự án lớn ghi nhận cuối năm, cơ cấu khách hàng thay đổi. Việc của nhà phân tích là **đặt câu hỏi** và đọc thuyết minh tuổi nợ, rồi theo dõi năm sau xem xu hướng có kéo dài không.

## Ví dụ 2: HPG — doanh nghiệp thép, có tính chu kỳ

| Năm | LNST | CFO | CFO/LNST | Biến động tồn kho |
|---|---|---|---|---|
| 2021 | 34.521 | 26.721 | 0,77 | (tồn kho cuối kỳ 42.134) |
| 2022 | 8.444 | 12.278 | 1,45 | −7.643 |
| 2023 | 6.800 | 8.643 | 1,27 | +13 |
| 2024 | 12.020 | 6.608 | 0,55 | +11.587 |
| 2025 | 15.515 | 17.366 | 1,12 | +6.737 |

Đơn vị: tỷ đồng. Số liệu: BCTC hợp nhất năm, tổng hợp từ dữ liệu công khai (Vietcap), làm tròn.

Với doanh nghiệp chu kỳ, **vốn lưu động** (chủ yếu là tồn kho) chi phối CFO:

- **2022:** lợi nhuận giảm mạnh, nhưng khấu hao 6.759 tỷ (chi phí không dùng tiền) cộng với tồn kho giảm 7.643 tỷ (giải phóng tiền) giúp CFO cao hơn lợi nhuận (1,45 lần).
- **2024:** tồn kho tăng 11.587 tỷ → tiền bị "giam" trong hàng, CFO chỉ bằng 0,55 lần lợi nhuận; dồn tích = 12.020 − 6.608 = **5.412 tỷ**.
- **Cộng dồn 5 năm:** CFO 71.616 / LNST 77.300 ≈ **0,93** — chấp nhận được qua cả chu kỳ.

Bài học: với ngành chu kỳ, đánh giá CFO/LNST **qua cả chu kỳ** chứ không theo từng năm, và luôn hỏi "tồn kho tăng vì chủ động tích trữ hay vì không bán được?".

## Thực hành

Với một doanh nghiệp phi tài chính bạn chọn, lập bảng 5 năm gồm: LNST, CFO, CFO/LNST, tốc độ tăng doanh thu, tốc độ tăng phải thu và tồn kho. Tính CFO/LNST cộng dồn. Sau đó mở thuyết minh "thu nhập khác" và "doanh thu hoạt động tài chính" của năm gần nhất: nếu loại các khoản không lặp lại, lợi nhuận cốt lõi tăng hay giảm bao nhiêu phần trăm so với năm trước?`,
        questions: [
          {
            prompt: 'Doanh nghiệp có LNST 500 tỷ và CFO 300 tỷ. Khoản dồn tích (LNST − CFO) là bao nhiêu và CFO/LNST bằng mấy?',
            options: ['200 tỷ; 0,6', '200 tỷ; 1,67', '−200 tỷ; 0,6', '800 tỷ; 0,6'],
            correct_index: 0,
            explanation: 'Dồn tích = 500 − 300 = 200 tỷ. CFO/LNST = 300 / 500 = 0,6 — chỉ 60% lợi nhuận đã thành tiền trong năm.',
          },
          {
            prompt: 'Năm 2025, phải thu khách hàng của FPT tăng từ 10.537 lên 12.735 tỷ, doanh thu từ 62.849 lên 70.113 tỷ. Nhận định nào hợp lý nhất?',
            options: [
              'Phải thu tăng khoảng 20,9%, nhanh hơn doanh thu (khoảng 11,6%) — cần đọc thuyết minh tuổi nợ và theo dõi xu hướng, chưa đủ để kết luận xấu',
              'Phải thu tăng chậm hơn doanh thu nên rất tốt',
              'Đây chắc chắn là dấu hiệu gian lận doanh thu',
              'Phải thu không liên quan đến chất lượng lợi nhuận',
            ],
            correct_index: 0,
            explanation:
              '12.735 / 10.537 − 1 ≈ 20,9%; 70.113 / 62.849 − 1 ≈ 11,6%. Một năm lệch có thể do hợp đồng lớn cuối kỳ; cả giai đoạn 2021–2025 phải thu (×2,05) và doanh thu (×1,97) gần song hành. Đúng cách là đặt câu hỏi và kiểm chứng, không kết luận vội.',
          },
          {
            prompt: 'Vì sao năm 2022 CFO của HPG (12.278 tỷ) cao hơn LNST (8.444 tỷ) dù lợi nhuận giảm mạnh?',
            options: [
              'Do HPG phát hành thêm cổ phiếu',
              'Do khấu hao lớn (chi phí không dùng tiền) và tồn kho giảm khoảng 7.643 tỷ, giải phóng tiền từ vốn lưu động',
              'Do chi đầu tư tài sản cố định giảm',
              'Do vay thêm ngân hàng',
            ],
            correct_index: 1,
            explanation:
              'Khấu hao 6.759 tỷ được cộng lại vì không dùng tiền, và tồn kho giảm từ 42.134 xuống 34.491 tỷ (−7.643) → tiền được thu về khi bán hàng tồn. Phát hành cổ phiếu và vay nợ thuộc dòng tiền tài chính; capex thuộc dòng tiền đầu tư — không nằm trong CFO.',
          },
          {
            prompt: 'Khoản nào sau đây làm tăng lợi nhuận kỳ này nhưng KHÔNG phản ánh năng lực kinh doanh cốt lõi lặp lại được?',
            options: [
              'Doanh thu bán hàng cho khách hàng mới',
              'Lãi từ bán một công ty con và hoàn nhập dự phòng',
              'Giảm giá vốn nhờ cải tiến dây chuyền',
              'Tăng giá bán nhờ thương hiệu mạnh',
            ],
            correct_index: 1,
            explanation:
              'Lãi bán công ty con và hoàn nhập dự phòng là khoản một lần — không lặp lại năm sau và thường không đi kèm dòng tiền kinh doanh. Hãy loại chúng để tính lợi nhuận cốt lõi.',
          },
        ],
      },
      {
        slug: 'dau-hieu-bat-thuong-tren-bctc',
        title: 'Dấu hiệu bất thường và "xào nấu" BCTC',
        summary:
          'Các thủ thuật làm đẹp số liệu thường gặp, dấu vết chúng để lại trên ba báo cáo, ý tưởng của Beneish M-score và một bảng kiểm thực tế.',
        content_md: `## "Xào nấu" là gì?

**"Xào nấu" BCTC** là việc chủ động trình bày số liệu sai lệch bản chất kinh tế để đạt một mục tiêu: lợi nhuận đạt kế hoạch, giữ giá cổ phiếu, đủ điều kiện vay vốn hay phát hành. Ranh giới giữa **kế toán "mạnh tay"** (hợp lệ nhưng lạc quan) và **gian lận** không phải lúc nào cũng rõ — nhưng cả hai đều làm giảm chất lượng thông tin bạn dựa vào. Mục tiêu của nhà đầu tư không phải là "bắt" gian lận, mà là **nhận ra khi nào cần giảm niềm tin vào con số** và yêu cầu biên an toàn lớn hơn.

Lưu ý: mọi ví dụ trong bài là **giả định minh hoạ**, không nói về doanh nghiệp cụ thể nào.

## Các thủ thuật thường gặp và dấu vết của chúng

| Thủ thuật | Cách làm | Dấu vết trên BCTC |
|---|---|---|
| **Nhồi hàng cho kênh phân phối** (channel stuffing) | Đẩy hàng cho đại lý cuối kỳ, cho trả chậm hoặc cho trả lại | Doanh thu quý 4 tăng vọt; phải thu tăng nhanh hơn doanh thu; hàng bán bị trả lại tăng ở quý 1 năm sau |
| **Ghi nhận doanh thu sớm** | Ghi nhận toàn bộ hợp đồng nhiều năm, ghi nhận theo "tiến độ" lạc quan | Doanh thu tăng nhưng CFO không tăng; thay đổi chính sách ghi nhận doanh thu |
| **Giao dịch vòng với bên liên quan** (round-tripping) | Bán cho công ty "anh em", rồi tiền quay lại qua khoản cho vay/ứng trước | Phải thu, ứng trước, cho vay bên liên quan lớn; doanh thu từ bên liên quan chiếm tỷ trọng cao |
| **Nợ ẩn** | Bảo lãnh vay cho bên khác, nợ nằm ở công ty không hợp nhất, hợp đồng hợp tác kinh doanh | Thuyết minh nợ tiềm tàng, cam kết bảo lãnh; chi phí lãi vay cao bất thường so với dư nợ |
| **"Tắm lớn"** (big bath) | Năm đổi lãnh đạo hoặc năm xấu: trích dự phòng thật lớn, rồi hoàn nhập trong các năm sau | Lỗ đột biến một năm, sau đó lợi nhuận "hồi phục" nhờ hoàn nhập dự phòng |
| **Vốn hoá chi phí** | Ghi chi phí vận hành thành tài sản (xây dựng dở dang, chi phí trả trước dài hạn) | Tài sản dở dang/trả trước tăng nhanh; capex tăng nhưng tài sản không tạo thêm doanh thu |

## Các tín hiệu "ngoài bảng số"

- **Điều chỉnh hồi tố thường xuyên:** số liệu năm trước bị trình bày lại nhiều lần.
- **Ý kiến kiểm toán ngoại trừ**, đổi kiểm toán, nộp báo cáo chậm (xem bài 1).
- **Người nội bộ bán ra** đều đặn trong khi ban lãnh đạo phát đi thông điệp rất lạc quan.
- **Kế hoạch lợi nhuận luôn đạt "vừa khít"** năm này qua năm khác — thực tế kinh doanh hiếm khi trơn tru như vậy.

## Ý tưởng Beneish M-score

Giáo sư Messod Beneish xây dựng **M-score** — một mô hình thống kê kết hợp 8 chỉ số để ước lượng xác suất doanh nghiệp đã điều chỉnh lợi nhuận. Bạn không cần thuộc công thức; hãy hiểu **tư duy** của các thành phần:

- **Số ngày thu tiền tăng** (phải thu so với doanh thu tăng) → nguy cơ ghi nhận doanh thu sớm.
- **Biên lợi nhuận gộp giảm** → áp lực phải "làm đẹp" số liệu.
- **Chất lượng tài sản giảm** (tài sản "mềm" ngoài TSCĐ và tài sản ngắn hạn tăng) → nguy cơ vốn hoá chi phí.
- **Doanh thu tăng rất nhanh** → áp lực duy trì tốc độ.
- **Tốc độ khấu hao chậm lại** → kéo dài thời gian khấu hao để giảm chi phí.
- **Chi phí bán hàng – quản lý tăng nhanh hơn doanh thu**, **đòn bẩy tăng**, và **tổng dồn tích lớn** so với tài sản.

M-score cao hơn ngưỡng (ngưỡng thường được trích dẫn khoảng −1,78; một số nguồn dùng −2,22) gợi ý rủi ro cao hơn. Đây là **công cụ sàng lọc**, không phải bằng chứng — mô hình được xây dựng trên dữ liệu doanh nghiệp Mỹ và cho nhiều cảnh báo nhầm, đặc biệt với doanh nghiệp tăng trưởng nhanh một cách hợp lệ.

## Ví dụ minh hoạ (giả định): Công ty ABC Phân phối

| | Năm N−1 | Năm N | Thay đổi |
|---|---|---|---|
| Doanh thu | 1.000 | 1.300 | +30% |
| Phải thu khách hàng | 150 | 325 | +117% |
| LNST | 80 | 120 | +50% |
| CFO | 70 | −40 | — |

Số ngày thu tiền: năm N−1 = 150 / 1.000 × 365 ≈ **55 ngày**; năm N = 325 / 1.300 × 365 ≈ **91 ngày**. Lợi nhuận tăng 50% nhưng CFO âm, phải thu tăng hơn gấp đôi. Nếu thuyết minh còn cho thấy phần lớn phải thu mới là của bên liên quan, đây là một bức tranh cần hết sức thận trọng — dù chưa đủ để kết luận gian lận.

## Bảng kiểm thực tế

1. CFO / LNST cộng dồn 3–5 năm có thấp hơn hẳn 1 không?
2. Phải thu, tồn kho có tăng nhanh hơn doanh thu nhiều năm liên tiếp không?
3. Lợi nhuận có phụ thuộc vào thu nhập tài chính, thu nhập khác, hoàn nhập dự phòng không?
4. Giao dịch và số dư với bên liên quan có lớn không?
5. Có bảo lãnh, nợ tiềm tàng, cam kết ngoài bảng không?
6. Ý kiến kiểm toán, lịch sử đổi kiểm toán, nộp chậm, điều chỉnh hồi tố?
7. Người nội bộ đang mua hay bán?

Càng nhiều câu trả lời "có", bạn càng cần chiết khấu niềm tin vào lợi nhuận báo cáo — hoặc đứng ngoài.

## Thực hành

Dùng bảng kiểm 7 câu trên cho một doanh nghiệp bạn đang theo dõi. Với mỗi câu, ghi số liệu cụ thể và trang thuyết minh làm bằng chứng, rồi chấm điểm: 0 = không có dấu hiệu, 1 = cần theo dõi, 2 = đáng lo. Tổng điểm từ 5 trở lên: hãy viết ra ba câu hỏi bạn muốn đặt cho bộ phận quan hệ nhà đầu tư.`,
        questions: [
          {
            prompt: 'Doanh thu tăng từ 1.000 lên 1.300 tỷ, phải thu từ 150 lên 325 tỷ. Số ngày thu tiền (phải thu / doanh thu × 365) thay đổi thế nào?',
            options: ['Từ khoảng 55 lên khoảng 91 ngày', 'Từ khoảng 55 xuống khoảng 40 ngày', 'Từ khoảng 91 xuống khoảng 55 ngày', 'Không đổi, khoảng 55 ngày'],
            correct_index: 0,
            explanation: '150 / 1.000 × 365 ≈ 54,8 ≈ 55 ngày; 325 / 1.300 × 365 = 91,25 ≈ 91 ngày. Khách hàng trả tiền chậm hơn nhiều — dấu hiệu cần kiểm tra chính sách bán chịu và bên liên quan.',
          },
          {
            prompt: 'Một doanh nghiệp lỗ đột biến năm đổi CEO do trích dự phòng rất lớn, hai năm sau lợi nhuận tăng mạnh chủ yếu nhờ hoàn nhập dự phòng. Đây là dấu hiệu của thủ thuật nào?',
            options: ['Nhồi hàng cho kênh phân phối', '"Tắm lớn" (big bath)', 'Giao dịch vòng', 'Ghi nhận doanh thu sớm'],
            correct_index: 1,
            explanation:
              '"Tắm lớn" dồn chi phí vào một năm xấu (thường gắn với ban lãnh đạo mới) để các năm sau lợi nhuận đẹp hơn nhờ hoàn nhập — lợi nhuận "hồi phục" không đến từ kinh doanh.',
          },
          {
            prompt: 'Nhận định nào ĐÚNG về Beneish M-score?',
            options: [
              'M-score vượt ngưỡng là bằng chứng pháp lý về gian lận',
              'M-score chỉ dùng cho ngân hàng',
              'M-score là công cụ sàng lọc thống kê, gợi ý nơi cần soi kỹ, và có thể cảnh báo nhầm',
              'M-score thay thế được việc đọc thuyết minh BCTC',
            ],
            correct_index: 2,
            explanation:
              'M-score kết hợp 8 chỉ số (số ngày thu tiền, biên gộp, chất lượng tài sản, tăng trưởng doanh thu, dồn tích…) để ước lượng rủi ro. Nó chỉ là bộ lọc ban đầu; kết luận phải dựa trên thuyết minh và bằng chứng cụ thể.',
          },
          {
            prompt: 'Bạn nghi ngờ doanh nghiệp có "nợ ẩn". Phần nào của BCTC giúp kiểm tra nhiều nhất?',
            options: [
              'Biên lợi nhuận gộp trong báo cáo kết quả kinh doanh',
              'Thuyết minh nợ tiềm tàng, cam kết và các khoản bảo lãnh cho bên khác',
              'Số cổ phiếu đang lưu hành',
              'Thông tin về trụ sở chính',
            ],
            correct_index: 1,
            explanation:
              'Nợ ẩn thường không nằm trên bảng cân đối mà xuất hiện dưới dạng bảo lãnh, cam kết, nghĩa vụ tiềm tàng — tất cả được trình bày trong thuyết minh.',
          },
        ],
      },
      {
        slug: 'phan-tich-dong-tien-chuyen-sau',
        title: 'Phân tích dòng tiền chuyên sâu',
        summary:
          'Dòng tiền tự do so với cổ tức, tăng trưởng bằng vốn vay, chu kỳ chuyển đổi tiền mặt và cách đọc tổ hợp dấu CFO/CFI/CFF — ví dụ FPT và HPG.',
        content_md: `## Nhắc lại và đi xa hơn

Ở chương "Đọc báo cáo tài chính" bạn đã biết **Dòng tiền tự do (FCF) = CFO − chi mua sắm tài sản cố định (capex)**. Bài này dùng FCF để trả lời ba câu hỏi thực tế: **cổ tức có được trả bằng tiền thật không? Tăng trưởng được tài trợ bằng gì? Vốn lưu động đang "ăn" bao nhiêu tiền?**

Lưu ý về định nghĩa: số capex ở đây là **tiền chi mua sắm, xây dựng TSCĐ** (dòng chi trong lưu chuyển tiền từ hoạt động đầu tư). Một số nhà phân tích trừ thêm tiền thu từ thanh lý tài sản; hãy thống nhất một cách tính khi so sánh.

## Ví dụ 1: FPT — FCF so với cổ tức tiền mặt

| Năm | CFO | Capex | FCF | Cổ tức đã trả | FCF − cổ tức |
|---|---|---|---|---|---|
| 2021 | 5.840 | 2.911 | 2.929 | 2.254 | 675 |
| 2022 | 5.054 | 3.215 | 1.839 | 2.222 | −383 |
| 2023 | 9.517 | 3.978 | 5.539 | 2.931 | 2.608 |
| 2024 | 11.704 | 3.275 | 8.429 | 3.292 | 5.137 |
| 2025 | 10.136 | 5.098 | 5.038 | 4.574 | 464 |
| **Cộng** | **42.251** | **18.477** | **23.774** | **15.273** | **8.501** |

Đơn vị: tỷ đồng. Số liệu: BCTC hợp nhất năm, tổng hợp từ dữ liệu công khai (Vietcap), làm tròn.

- Cộng dồn 5 năm, FCF gấp 23.774 / 15.273 ≈ **1,56 lần** cổ tức tiền mặt: cổ tức được trả bằng tiền tự tạo ra.
- Năm **2022** FCF (1.839) thấp hơn cổ tức (2.222) 383 tỷ — một năm thiếu hụt là bình thường khi CFO giảm; điều đáng lo là thiếu hụt **kéo dài nhiều năm**.
- Năm 2025 capex tăng lên 5.098 tỷ (gấp khoảng 1,75 lần khấu hao 2.914 tỷ) → doanh nghiệp đang đầu tư mở rộng, FCF thu hẹp lại.
- Tiền và tương đương tiền tăng từ 5.418 (2021) lên 10.522 tỷ (2025), trong khi tổng vay ngắn và dài hạn chỉ nhích từ 20.095 lên 21.074 tỷ.

## Ví dụ 2: HPG — tăng trưởng bằng vốn vay

Năm 2024, HPG đầu tư mạnh cho dự án mới:

> FCF 2024 = CFO − capex = 6.608 − 35.495 = **−28.887 tỷ**

Khoản thiếu hụt đến từ đâu? Bảng cân đối cho thấy:

- **Vay dài hạn** tăng từ 10.399 lên 27.080 tỷ (**+16.681**); tổng vay ngắn + dài hạn tăng từ 65.381 lên 82.963 tỷ (**+17.582**).
- **Tiền mặt** giảm từ 12.252 xuống 6.888 tỷ (**−5.364**).
- Phần còn lại được bù bằng các dòng khác trong lưu chuyển tiền đầu tư/tài chính — hãy đọc đầy đủ báo cáo LCTT để đối chiếu.

Nhìn 5 năm 2021–2025: CFO cộng dồn 71.616 tỷ, capex 108.126 tỷ → FCF cộng dồn **−36.510 tỷ**; tổng vay tăng từ 57.213 lên 92.174 tỷ. Đây **không** tự động là điều xấu: đầu tư công suất ở đáy chu kỳ có thể tạo ra lợi nhuận lớn khi chu kỳ đi lên. Nhưng rủi ro tăng lên: nếu giá thép giảm kéo dài, nghĩa vụ trả nợ vẫn còn đó. Câu hỏi đúng là: **dự án mới khi chạy hết công suất tạo ra bao nhiêu CFO, và bao lâu thì trả được nợ?**

## Chu kỳ chuyển đổi tiền mặt (CCC)

> **CCC = DSO + DIO − DPO**

- **DSO** (số ngày thu tiền) = Phải thu khách hàng / Doanh thu × 365
- **DIO** (số ngày tồn kho) = Hàng tồn kho / Giá vốn hàng bán × 365
- **DPO** (số ngày trả tiền nhà cung cấp) = Phải trả người bán / Giá vốn hàng bán × 365

CCC là số ngày tiền bị "giam" trong vốn lưu động. Ví dụ: DSO 45, DIO 60, DPO 30 → CCC = 45 + 60 − 30 = **75 ngày**. CCC rút ngắn giải phóng tiền; CCC kéo dài khi doanh nghiệp tăng trưởng nghĩa là cần thêm vốn.

Áp dụng số dư cuối năm 2025 (giá vốn = doanh thu − lợi nhuận gộp):

| | FPT | HPG |
|---|---|---|
| Giá vốn | 70.113 − 25.889 = 44.224 | 156.116 − 24.498 = 131.618 |
| DSO | 12.735 / 70.113 × 365 ≈ **66 ngày** | 10.972 / 156.116 × 365 ≈ **26 ngày** |
| DIO | 2.194 / 44.224 × 365 ≈ **18 ngày** | 52.828 / 131.618 × 365 ≈ **147 ngày** |

Hai mô hình rất khác nhau: FPT bán dịch vụ, gần như không có tồn kho nhưng chờ khách hàng thanh toán; HPG thu tiền nhanh nhưng phải trữ quặng, than, thép thành phẩm gần 5 tháng. (Cần thêm số phải trả người bán từ BCTC để tính DPO và CCC đầy đủ.)

## Đọc tổ hợp dấu của ba dòng tiền

| CFO | CFI | CFF | Thường là |
|---|---|---|---|
| + | − | + | **Đang tăng trưởng:** kinh doanh có tiền nhưng vẫn vay/phát hành thêm để đầu tư |
| + | − | − | **Trưởng thành:** tiền kinh doanh đủ để đầu tư, trả nợ và trả cổ tức |
| − | − | + | **Khởi nghiệp / mở rộng sớm:** sống nhờ vốn huy động |
| − | + | + | **Khó khăn:** bán tài sản và đi vay để bù tiền kinh doanh thiếu hụt |
| + | + | − | **Tái cấu trúc:** bán tài sản để trả nợ |

Với **ngân hàng, công ty chứng khoán, bảo hiểm**, các khuôn mẫu này **không áp dụng**: tiền gửi, cho vay, cho vay ký quỹ là hoạt động kinh doanh, nên CFO dao động rất mạnh. Ví dụ CFO của VCB: −53.766 tỷ (2021), 185.960 tỷ (2022), −35.739 tỷ (2023) — không nói lên chất lượng lợi nhuận như ở doanh nghiệp sản xuất.

## Thực hành

Chọn một doanh nghiệp sản xuất hoặc bán lẻ, lập bảng 5 năm: CFO, capex, FCF, cổ tức tiền mặt, tổng vay cuối kỳ. Tính FCF cộng dồn / cổ tức cộng dồn. Sau đó lấy số phải trả người bán năm gần nhất để tính đủ DSO, DIO, DPO và CCC. Cuối cùng xác định tổ hợp dấu CFO/CFI/CFF của năm gần nhất và mô tả doanh nghiệp đang ở giai đoạn nào.`,
        questions: [
          {
            prompt: 'Năm 2025 FPT có CFO 10.136 tỷ, capex 5.098 tỷ và trả cổ tức 4.574 tỷ. FCF và phần FCF còn lại sau cổ tức là bao nhiêu?',
            options: ['FCF 5.038 tỷ; còn 464 tỷ', 'FCF 15.234 tỷ; còn 10.660 tỷ', 'FCF 5.562 tỷ; còn 988 tỷ', 'FCF 5.038 tỷ; thiếu 464 tỷ'],
            correct_index: 0,
            explanation: 'FCF = 10.136 − 5.098 = 5.038 tỷ. Sau cổ tức: 5.038 − 4.574 = 464 tỷ (dương) — cổ tức vẫn được FCF năm đó chi trả.',
          },
          {
            prompt: 'Năm 2024 HPG có CFO 6.608 tỷ và capex 35.495 tỷ, vay dài hạn tăng từ 10.399 lên 27.080 tỷ. Diễn giải nào đúng?',
            options: [
              'FCF dương, HPG dùng tiền thừa để trả nợ',
              'FCF khoảng −28.887 tỷ; phần lớn thiếu hụt được bù bằng vay thêm (vay dài hạn +16.681 tỷ) và giảm tiền mặt',
              'Capex thuộc dòng tiền hoạt động kinh doanh nên CFO đã tính sẵn',
              'Vay dài hạn tăng không liên quan đến capex',
            ],
            correct_index: 1,
            explanation:
              'FCF = 6.608 − 35.495 = −28.887 tỷ. Vay dài hạn +16.681 tỷ (27.080 − 10.399), tổng vay +17.582 tỷ, tiền mặt −5.364 tỷ — tăng trưởng đang được tài trợ chủ yếu bằng nợ.',
          },
          {
            prompt: 'Doanh nghiệp có DSO 40 ngày, DIO 90 ngày, DPO 50 ngày. Chu kỳ chuyển đổi tiền mặt (CCC) là bao nhiêu?',
            options: ['180 ngày', '100 ngày', '80 ngày', '0 ngày'],
            correct_index: 2,
            explanation: 'CCC = DSO + DIO − DPO = 40 + 90 − 50 = 80 ngày: tiền bị giam trong vốn lưu động khoảng 80 ngày.',
          },
          {
            prompt: 'Một doanh nghiệp có CFO âm, CFI dương (bán tài sản), CFF dương (vay thêm). Tổ hợp này thường gợi ý điều gì?',
            options: [
              'Doanh nghiệp trưởng thành, dư tiền',
              'Doanh nghiệp đang gặp khó khăn: bán tài sản và vay để bù tiền kinh doanh thiếu hụt',
              'Doanh nghiệp đang mua lại cổ phiếu quỹ',
              'Doanh nghiệp tăng trưởng lành mạnh nhờ kinh doanh có lãi',
            ],
            correct_index: 1,
            explanation:
              'Kinh doanh không tạo ra tiền (CFO âm), doanh nghiệp phải bán tài sản (CFI dương) và vay thêm (CFF dương) để tồn tại — khuôn mẫu điển hình của doanh nghiệp khó khăn (không áp dụng cho ngân hàng, chứng khoán, bảo hiểm).',
          },
        ],
      },
      {
        slug: 'so-sanh-doanh-nghiep-va-quy-trinh-phan-tich',
        title: 'So sánh doanh nghiệp và quy trình phân tích trọn vẹn',
        summary:
          'BCTC dạng tỷ trọng, tăng trưởng kép nhiều năm, phân rã ROE theo DuPont cho FPT, HPG, VCB và một quy trình từng bước từ tải BCTC đến luận điểm đầu tư một trang.',
        content_md: `## BCTC dạng tỷ trọng (common-size)

Để so sánh doanh nghiệp có quy mô khác nhau, hãy quy mọi dòng về **tỷ lệ phần trăm**: khoản mục KQKD chia cho **doanh thu**, khoản mục CĐKT chia cho **tổng tài sản**. Năm 2025:

| % | FPT | HPG |
|---|---|---|
| Giá vốn / doanh thu | 63,1% | 84,3% |
| Lợi nhuận gộp / doanh thu | 36,9% | 15,7% |
| Chi phí lãi vay / doanh thu | 1,2% | 2,0% |
| Khấu hao / doanh thu | 4,2% | 5,4% |
| LNST / doanh thu | 16,0% | 9,9% |
| Tiền / tổng tài sản | 11,9% | 3,2% |
| Phải thu khách hàng / tổng tài sản | 14,4% | 4,3% |
| Hàng tồn kho / tổng tài sản | 2,5% | 20,5% |
| Tổng vay / tổng tài sản | 23,9% | 35,7% |

Đơn vị gốc: tỷ đồng. Số liệu: BCTC hợp nhất năm, tổng hợp từ dữ liệu công khai (Vietcap), làm tròn.

Bảng tỷ trọng cho thấy ngay **mô hình kinh doanh**: FPT giữ ít hàng, nhiều phải thu, biên gộp cao; HPG giữ nhiều hàng, biên mỏng và vay nhiều hơn tính trên tài sản.

## Tăng trưởng kép (CAGR)

> **CAGR = (Giá trị cuối / Giá trị đầu)^(1 / số năm) − 1**

Từ 2021 đến 2025 là **4 năm** tăng trưởng (không phải 5):

- Doanh thu FPT: (70.113 / 35.657)^(1/4) − 1 ≈ 1,966^0,25 − 1 ≈ **18,4%/năm**
- LNST FPT: (11.232 / 5.349)^(1/4) − 1 ≈ 2,100^0,25 − 1 ≈ **20,4%/năm**
- Doanh thu HPG: (156.116 / 149.680)^(1/4) − 1 ≈ **1,1%/năm** — nhưng con số này che giấu một chu kỳ đi xuống rồi lên (thấp nhất 118.953 năm 2023). Với ngành chu kỳ, CAGR từ đỉnh đến đỉnh hay đáy đến đáy dễ gây hiểu lầm; hãy luôn nhìn cả chuỗi năm.

## Phân rã ROE theo DuPont

> **ROE = Biên LNST × Vòng quay tài sản × Đòn bẩy tài chính**
> = (LNST / Doanh thu) × (Doanh thu / Tổng tài sản) × (Tổng tài sản / Vốn chủ sở hữu)

Dùng số cuối năm 2025:

| | Biên LNST | Vòng quay tài sản | Đòn bẩy | ROE |
|---|---|---|---|---|
| **FPT** | 11.232 / 70.113 = 16,0% | 70.113 / 88.142 = 0,80 | 88.142 / 43.748 = 2,01 | ≈ **25,7%** |
| **HPG** | 15.515 / 156.116 = 9,9% | 156.116 / 257.899 = 0,61 | 257.899 / 131.220 = 1,97 | ≈ **11,8%** |
| **VCB** | ROA = 35.198 / 2.442.279 = 1,44% | (gộp trong ROA) | 2.442.279 / 224.559 = 10,9 | ≈ **15,7%** |

Kiểm tra (tính bằng số chưa làm tròn): tích ba thành phần đúng bằng LNST / vốn chủ — FPT 11.232 / 43.748 ≈ 25,7%; HPG 15.515 / 131.220 ≈ 11,8%; VCB 35.198 / 224.559 ≈ 15,7%.

Đối chiếu với chỉ số TTM quý 2/2026 (4 quý gần nhất): FPT có ROE 26,5%, ROA 12,8%, biên LNST 17,2% → đòn bẩy ≈ 26,5 / 12,8 ≈ **2,07** và vòng quay tài sản ≈ 12,8 / 17,2 ≈ **0,74**. VCB có ROE 17,9%, ROA 1,7% → đòn bẩy ≈ **10,5 lần**. HPG có ROE TTM 17,4%, cao hơn hẳn 11,8% của năm 2025 chủ yếu vì lợi nhuận 4 quý gần nhất cao hơn. (Số TTM thường dùng vốn chủ bình quân và lợi nhuận 4 quý, nên không khớp tuyệt đối với số cuối năm.)

Ba nguồn ROE khác nhau:

- **FPT — nhẹ tài sản:** ROE cao chủ yếu nhờ **biên lợi nhuận** và vòng quay, đòn bẩy vừa phải.
- **HPG — nặng vốn:** biên mỏng và biến động theo giá thép; vòng quay thấp vì tài sản cố định và tồn kho lớn.
- **VCB — ngân hàng:** ROA chỉ khoảng 1,4–1,7%, ROE đến từ **đòn bẩy** khoảng 10–11 lần — bình thường với ngân hàng vì tiền gửi của khách hàng là "nguyên liệu".

Vì vậy **chỉ so sánh trong cùng ngành**: nói "FPT tốt hơn VCB vì ROE cao hơn" là vô nghĩa. Hãy so FPT với các công ty công nghệ, HPG với các doanh nghiệp thép, VCB với các ngân hàng khác — và so cùng một cách tính (cuối kỳ hay bình quân, năm hay TTM).

## Quy trình phân tích từng bước

1. **Thu thập:** BCTC hợp nhất đã kiểm toán 5 năm, BCTC soát xét bán niên và quý gần nhất, báo cáo thường niên.
2. **Đọc báo cáo kiểm toán** và các thuyết minh then chốt (bài 1).
3. **Lập bảng tỷ trọng** và tính CAGR doanh thu, lợi nhuận, vốn chủ.
4. **Chất lượng lợi nhuận:** CFO/LNST cộng dồn, phải thu – tồn kho so với doanh thu, khoản bất thường (bài 2).
5. **Bảng kiểm dấu hiệu bất thường** (bài 3).
6. **Dòng tiền:** FCF, cổ tức, nợ, CCC (bài 4).
7. **DuPont và so sánh 3–5 doanh nghiệp cùng ngành.**
8. **Định giá** bằng các phương pháp trong chương "Định giá doanh nghiệp nâng cao" (DCF, EV/EBITDA, biên an toàn).
9. **Viết luận điểm một trang:** doanh nghiệp kiếm tiền thế nào, 3 điểm mạnh có số liệu, 3 rủi ro, điều gì sẽ khiến bạn đổi ý, và các chỉ số cần theo dõi mỗi quý.

## Thực hành

Chọn 3 doanh nghiệp cùng ngành. Lập bảng DuPont năm gần nhất cho cả ba (biên LNST, vòng quay tài sản, đòn bẩy, ROE), kiểm tra tích ba thành phần có khớp ROE không, và tính CAGR doanh thu 4 năm của từng doanh nghiệp. Viết 5 câu giải thích vì sao ROE của chúng khác nhau, rồi hoàn thành bản luận điểm một trang theo bước 9.`,
        questions: [
          {
            prompt: 'Doanh thu tăng từ 100 lên 160 trong giai đoạn 2021–2025. Tăng trưởng kép (CAGR) xấp xỉ bao nhiêu?',
            options: ['12,5%/năm', '15,0%/năm', '9,9%/năm', '16,0%/năm'],
            correct_index: 0,
            explanation: '2021 → 2025 là 4 năm. CAGR = (160 / 100)^(1/4) − 1 = 1,6^0,25 − 1 ≈ 1,1247 − 1 ≈ 12,5%/năm. Chia 5 năm hoặc lấy 60% / 4 = 15% đều sai.',
          },
          {
            prompt: 'Doanh nghiệp có biên LNST 10%, vòng quay tài sản 0,8 và đòn bẩy (tài sản / vốn chủ) 2,5. ROE bằng bao nhiêu?',
            options: ['13,3%', '20%', '25%', '8%'],
            correct_index: 1,
            explanation: 'ROE = 10% × 0,8 × 2,5 = 20%. ROA = 10% × 0,8 = 8%; nhân đòn bẩy 2,5 ra ROE 20%.',
          },
          {
            prompt: 'Theo chỉ số TTM, VCB có ROE 17,9% và ROA 1,7%. Đòn bẩy tài chính ngầm định và cách hiểu đúng là gì?',
            options: [
              'Khoảng 1,05 lần — ngân hàng gần như không dùng nợ',
              'Khoảng 10,5 lần — bình thường với ngân hàng vì tiền gửi khách hàng là nguồn vốn chính',
              'Khoảng 10,5 lần — chứng tỏ VCB rủi ro hơn FPT nên kém hơn',
              'Không thể tính được',
            ],
            correct_index: 1,
            explanation:
              'Đòn bẩy = ROE / ROA = 17,9 / 1,7 ≈ 10,5 lần. Với ngân hàng đây là mức thông thường; so sánh đòn bẩy ngân hàng với doanh nghiệp công nghệ là so khác ngành.',
          },
          {
            prompt: 'Năm 2025, hàng tồn kho chiếm 20,5% tổng tài sản HPG nhưng chỉ 2,5% ở FPT. Kết luận nào hợp lý nhất?',
            options: [
              'HPG quản lý kho kém hơn FPT',
              'Khác biệt chủ yếu phản ánh mô hình kinh doanh khác nhau (sản xuất thép so với dịch vụ công nghệ); cần so HPG với doanh nghiệp thép khác',
              'FPT đang giấu hàng tồn kho',
              'Tỷ trọng tồn kho không có ý nghĩa phân tích',
            ],
            correct_index: 1,
            explanation:
              'Bảng tỷ trọng làm lộ mô hình kinh doanh: nhà sản xuất thép phải trữ nguyên liệu và thành phẩm, công ty dịch vụ thì không. Đánh giá hiệu quả quản lý kho chỉ có ý nghĩa khi so với doanh nghiệp cùng ngành.',
          },
        ],
      },
    ],
  },
]
