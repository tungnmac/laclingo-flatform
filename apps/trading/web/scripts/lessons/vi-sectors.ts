import type { SeedChapter } from './types'

// Đọc BCTC theo ngành (vi) — đào sâu hơn chương "Đọc báo cáo tài chính" và "Các chỉ số tài chính cơ bản".
// Số liệu thật (VCB, SSI, BVH, HPG, FPT): BCTC hợp nhất năm, tỷ đồng, tổng hợp từ dữ liệu công khai (Vietcap), làm tròn.
// Bài bất động sản và bán lẻ dùng số liệu minh hoạ (ghi rõ trong bài).
// Thứ tự bài khớp với en-sectors.ts (bài thứ i là bản dịch của nhau).
export const VI_SECTORS: SeedChapter[] = [
  {
    slug: 'bctc-theo-nganh',
    title: 'Đọc BCTC theo ngành',
    description:
      'Mỗi ngành có cấu trúc báo cáo tài chính và bộ chỉ số riêng: ngân hàng, bất động sản, chứng khoán, bảo hiểm, sản xuất chu kỳ và bán lẻ — minh hoạ bằng số liệu thật của doanh nghiệp niêm yết.',
    level: 'advanced',
    lessons: [
      {
        slug: 'bctc-ngan-hang',
        title: 'Ngân hàng: thu nhập lãi thuần, nợ xấu và an toàn vốn',
        summary: 'Vì sao BCTC ngân hàng không có doanh thu và giá vốn, đòn bẩy 10 lần là bình thường, và cách đọc NIM, CIR, nợ xấu, bao phủ nợ xấu, CASA, CAR.',
        content_md: `## Vì sao không đọc ngân hàng như doanh nghiệp thường?

Trong chương **Đọc báo cáo tài chính**, ta đọc báo cáo kết quả kinh doanh từ doanh thu, trừ giá vốn để ra lợi nhuận gộp. Ngân hàng không có hai dòng đó. "Hàng hoá" của ngân hàng chính là **tiền**: huy động tiền gửi với lãi suất thấp hơn rồi cho vay với lãi suất cao hơn. Vì vậy báo cáo kết quả kinh doanh của ngân hàng được trình bày theo **nguồn thu nhập**:

| Dòng trên KQKD ngân hàng | Ý nghĩa |
|---|---|
| Thu nhập lãi − Chi phí lãi = **Thu nhập lãi thuần (NII)** | Chênh lệch lãi suất — tương đương "lợi nhuận gộp" cốt lõi |
| **Lãi thuần từ hoạt động dịch vụ** | Phí thanh toán, thẻ, bảo lãnh, bancassurance |
| Lãi thuần từ ngoại hối, chứng khoán, hoạt động khác | Dễ biến động, ít lặp lại |
| = **Tổng thu nhập hoạt động (TOI)** | "Doanh thu" theo nghĩa rộng |
| − Chi phí hoạt động | Lương, thuê trụ sở, công nghệ |
| − **Chi phí dự phòng rủi ro tín dụng** | Khoản chi mà ban lãnh đạo có nhiều dư địa điều chỉnh nhất |
| = Lợi nhuận trước thuế | |

Với **Vietcombank (VCB)** năm 2025: thu nhập lãi thuần **58.771 tỷ đồng** trên tổng thu nhập hoạt động **72.455 tỷ** — tức khoảng **81%** thu nhập đến từ chênh lệch lãi suất; lợi nhuận sau thuế **35.198 tỷ**.

## Bảng cân đối: đòn bẩy 10 lần là bình thường

Tài sản lớn nhất của ngân hàng là **cho vay khách hàng**, nợ phải trả lớn nhất là **tiền gửi của khách hàng**. Cuối 2025, VCB có dư nợ cho vay gộp **1.673.526 tỷ**, tiền gửi khách hàng **1.672.535 tỷ**, tổng tài sản **2.442.279 tỷ** nhưng vốn chủ sở hữu chỉ **224.559 tỷ** — khoảng **9%** tổng tài sản, nợ phải trả gần **10 lần** vốn chủ.

Ở bài **Sức khoẻ tài chính**, D/E dưới 1 được xem là an toàn với doanh nghiệp sản xuất, và bài đó cũng lưu ý ngân hàng là ngoại lệ. Với ngân hàng, đòn bẩy cao chính là mô hình kinh doanh. Điều này cũng giải thích quan hệ ROA–ROE: VCB có ROA khoảng **1,7%** nhưng ROE khoảng **17,9%** (TTM quý 2/2026) — đòn bẩy khoảng 10 lần nhân ROA lên thành ROE. Vì vậy câu hỏi đúng không phải "nợ nhiều hay ít" mà là **vốn có đủ đệm cho rủi ro không** và **tài sản cho vay có chất lượng không**.

## Bộ chỉ số riêng của ngân hàng

| Chỉ số | Cách tính | Đọc thế nào |
|---|---|---|
| **NIM** | Thu nhập lãi thuần / tài sản sinh lãi bình quân | Biên lãi; VCB khoảng 2,75% (TTM). Cao hơn chưa chắc tốt nếu đến từ cho vay rủi ro |
| **CIR** | Chi phí hoạt động / TOI | Hiệu quả vận hành; thấp là tốt |
| **Tỷ lệ nợ xấu (NPL)** | Nợ nhóm 3–5 / tổng dư nợ | Chất lượng tài sản |
| **Bao phủ nợ xấu (LLR)** | Số dư dự phòng / nợ xấu | Tấm đệm đã trích sẵn; trên 100% nghĩa là dự phòng lớn hơn nợ xấu |
| **CASA** | Tiền gửi không kỳ hạn / tổng tiền gửi | Nguồn vốn rẻ — CASA cao giúp NIM cao |
| **LDR** | Cho vay / huy động | Mức độ "dùng hết" nguồn vốn |
| **CAR** | Vốn tự có / tài sản có rủi ro | An toàn vốn |

Một số lưu ý về quy định:

- **CAR** theo chuẩn **Basel II** mà NHNN áp dụng (Thông tư 41/2016 và các văn bản sửa đổi, thay thế) có mức tối thiểu **8%**. Ngân hàng tăng trưởng nhanh cần liên tục bổ sung vốn — qua lợi nhuận giữ lại, cổ tức bằng cổ phiếu hoặc phát hành thêm.
- **LDR theo quy định** được NHNN tính bằng công thức riêng (không đơn giản là cho vay chia tiền gửi trên BCTC) và trần áp dụng thay đổi theo thời gian; tương tự với tỷ lệ vốn ngắn hạn cho vay trung dài hạn. Tỷ lệ "thô" của VCB năm 2025 khoảng 100% **không** thể đem so trực tiếp với trần pháp lý.
- **Hạn mức tăng trưởng tín dụng ("room tín dụng")** do NHNN giao cho từng ngân hàng, điều chỉnh hằng năm. Ngân hàng được room cao thường tăng trưởng lợi nhuận nhanh hơn. Dư nợ VCB tăng khoảng **15,5%** năm 2025 (1.449.199 → 1.673.526 tỷ).

## Đọc thuyết minh phân loại nợ

Thuyết minh "Cho vay khách hàng" chia dư nợ thành **5 nhóm**: nhóm 1 (đủ tiêu chuẩn), nhóm 2 (cần chú ý), nhóm 3 (dưới tiêu chuẩn), nhóm 4 (nghi ngờ), nhóm 5 (có khả năng mất vốn). **Nợ xấu = nhóm 3 + 4 + 5.** Ngân hàng trích **dự phòng cụ thể** theo tỷ lệ tăng dần với nhóm nợ (nhóm 5 lên tới 100% sau khi trừ giá trị tài sản bảo đảm) cộng **dự phòng chung** trên dư nợ.

Cách đọc thực tế:

1. **Theo dõi nợ nhóm 2** qua các quý — đây là "phòng chờ" của nợ xấu. Nhóm 2 tăng mạnh thường báo trước nợ xấu tăng.
2. **So số dư dự phòng với nợ xấu** để tính LLR. Với VCB 2025, số dư dự phòng ≈ dư nợ gộp − dư nợ thuần = 1.673.526 − 1.648.550 ≈ **24.976 tỷ** (khoảng 1,5% dư nợ).
3. **Soi chi phí dự phòng**: lợi nhuận tăng nhờ giảm trích dự phòng trong khi nợ xấu tăng là lợi nhuận "vay mượn" từ tương lai.
4. Tìm các khoản **nợ được cơ cấu lại thời hạn và giữ nguyên nhóm nợ** theo các chính sách hỗ trợ (áp dụng giai đoạn 2020–2024) — chúng không hiện trong nợ xấu dù rủi ro có thể cao hơn.

## Vì sao lưu chuyển tiền từ HĐKD gần như vô nghĩa?

Với ngân hàng, tiền khách gửi vào và tiền giải ngân cho vay đều nằm trong **hoạt động kinh doanh**. Một đợt huy động lớn cuối năm làm dòng tiền HĐKD dương vọt; một đợt giải ngân lớn làm nó âm sâu. Dòng tiền HĐKD của VCB lần lượt **−53.766 / 185.960 / −35.739 tỷ** trong 2021–2023, trong khi lợi nhuận sau thuế tăng đều từ 22.017 lên 33.122 tỷ. Phép kiểm tra "dòng tiền HĐKD so với lợi nhuận" ở chương trước **không áp dụng** cho ngân hàng — hãy thay bằng chất lượng tài sản và an toàn vốn.

*Số liệu: BCTC hợp nhất năm, tổng hợp từ dữ liệu công khai (Vietcap), làm tròn.*

## Thực hành

Mở BCTC hợp nhất năm gần nhất của một ngân hàng niêm yết. (1) Tính tỷ trọng thu nhập lãi thuần trong TOI. (2) Trong thuyết minh phân loại nợ, cộng nợ nhóm 3–5 và chia cho tổng dư nợ để ra NPL. (3) Lấy số dư dự phòng rủi ro cho vay chia nợ xấu để ra LLR. (4) So nợ nhóm 2 với cùng kỳ năm trước và ghi lại một nhận xét về xu hướng chất lượng tài sản.`,
        questions: [
          {
            prompt: 'Vì sao nợ phải trả gấp khoảng 10 lần vốn chủ ở một ngân hàng lớn KHÔNG tự động là dấu hiệu nguy hiểm?',
            options: [
              'Vì ngân hàng không phải trả lãi cho tiền gửi',
              'Vì mô hình kinh doanh của ngân hàng là trung gian vốn bằng tiền gửi; độ an toàn được đo bằng CAR và chất lượng tài sản',
              'Vì nợ phải trả của ngân hàng không được ghi trên bảng cân đối',
              'Vì đòn bẩy càng cao thì ngân hàng càng an toàn',
            ],
            correct_index: 1,
            explanation:
              'Tiền gửi của khách hàng là "nguyên liệu" của ngân hàng nên đòn bẩy cao là cấu trúc bình thường. Câu hỏi quan trọng là vốn có đủ đệm (CAR tối thiểu 8% theo Basel II) và khoản cho vay có lành mạnh không (NPL, LLR).',
          },
          {
            prompt: 'Tỷ lệ nợ xấu (NPL) của ngân hàng Việt Nam được tính từ những nhóm nợ nào?',
            options: ['Chỉ nhóm 5', 'Nhóm 2 đến nhóm 5', 'Nhóm 3, 4 và 5', 'Tất cả các nhóm có tài sản bảo đảm'],
            correct_index: 2,
            explanation:
              'Nợ xấu gồm nhóm 3 (dưới tiêu chuẩn), nhóm 4 (nghi ngờ) và nhóm 5 (có khả năng mất vốn). Nhóm 2 (cần chú ý) chưa phải nợ xấu nhưng là chỉ báo sớm cần theo dõi.',
          },
          {
            prompt: 'Một ngân hàng báo lợi nhuận tăng 30% trong khi thu nhập lãi thuần và chi phí hoạt động gần như đi ngang. Điều gì cần kiểm tra trước tiên?',
            options: [
              'Giá cổ phiếu tuần trước',
              'Chi phí dự phòng có giảm mạnh không, và nợ xấu, nợ nhóm 2, tỷ lệ bao phủ nợ xấu có xấu đi không',
              'Số lượng chi nhánh mới mở',
              'Dòng tiền từ hoạt động kinh doanh có dương không',
            ],
            correct_index: 1,
            explanation:
              'Khi thu nhập cốt lõi đi ngang, lợi nhuận tăng thường đến từ việc trích dự phòng ít hơn. Nếu đồng thời nợ xấu tăng và LLR giảm, lợi nhuận đó kém bền vững. Dòng tiền HĐKD của ngân hàng gần như không mang thông tin về điều này.',
          },
          {
            prompt: 'Vì sao dòng tiền từ hoạt động kinh doanh của ngân hàng dao động rất mạnh và ít ý nghĩa?',
            options: [
              'Vì ngân hàng không phải lập báo cáo lưu chuyển tiền tệ',
              'Vì tiền gửi khách hàng và tiền giải ngân cho vay đều được xếp vào hoạt động kinh doanh',
              'Vì lợi nhuận ngân hàng luôn bằng không',
              'Vì cổ tức được ghi vào hoạt động kinh doanh',
            ],
            correct_index: 1,
            explanation:
              'Biến động huy động và cho vay — những dòng tiền khổng lồ so với lợi nhuận — chảy qua mục HĐKD. Ví dụ VCB: −53.766 tỷ (2021), +185.960 tỷ (2022), −35.739 tỷ (2023) trong khi lợi nhuận tăng đều.',
          },
        ],
      },
      {
        slug: 'bctc-bat-dong-san',
        title: 'Bất động sản: ghi nhận khi bàn giao, hàng tồn kho và người mua trả tiền trước',
        summary:
          'Vì sao lợi nhuận doanh nghiệp phát triển bất động sản lên xuống thất thường, đọc quỹ đất trong hàng tồn kho, tiền khách trả trước, nợ vay, trái phiếu và tư duy RNAV.',
        content_md: `## Doanh thu chỉ được ghi nhận khi bàn giao

Doanh nghiệp phát triển bất động sản bán căn hộ, nhà phố, đất nền từ rất sớm — khi dự án mới đủ điều kiện mở bán — và thu tiền theo tiến độ. Nhưng theo chuẩn mực kế toán Việt Nam, **doanh thu chỉ được ghi nhận khi phần lớn rủi ro và lợi ích đã chuyển cho người mua**, thường là lúc **bàn giao** sản phẩm. Hệ quả:

- Năm bàn giao dự án lớn, doanh thu và lợi nhuận **tăng vọt**; năm không có dự án bàn giao, lợi nhuận **sụt mạnh** dù công ty vẫn bán hàng tốt.
- Tăng trưởng EPS hay P/E một năm đơn lẻ (bài **Chỉ số định giá: EPS, P/E và P/B**) gần như không nói lên điều gì — cần nhìn chuỗi nhiều năm và lịch bàn giao.

Ví dụ **minh hoạ** (số liệu giả định, tỷ đồng) của Công ty BĐS X:

| Năm | Doanh thu | LNST | Người mua trả tiền trước (cuối năm) | Hàng tồn kho (cuối năm) |
|---|---|---|---|---|
| N1 | 800 | 90 | 1.500 | 6.000 |
| N2 | 4.500 | 1.100 | 600 | 4.800 |
| N3 | 600 | 40 | 2.800 | 7.500 |
| N4 | 300 | 10 | 4.200 | 9.000 |
| N5 | 5.200 | 1.300 | 1.200 | 7.000 |

Nhìn N3–N4, lợi nhuận gần như bằng không — nhưng tiền khách trả trước tăng mạnh, báo hiệu một đợt bàn giao lớn ở N5.

## Người mua trả tiền trước — chỉ báo dẫn dắt

Khoản **"Người mua trả tiền trước"** (ngắn hạn và dài hạn) trên phần nợ phải trả là tiền khách đã đóng cho sản phẩm **chưa bàn giao**. Nó là "doanh thu chờ ghi nhận": khi bàn giao, khoản này giảm và doanh thu tăng. Vì thế:

- **Người mua trả tiền trước tăng** → doanh số bán hàng thực tế đang tốt, lợi nhuận tương lai có cơ sở (với điều kiện dự án hoàn thành và bàn giao được).
- **Khoản này giảm liên tục mà không có dự án mới mở bán** → "kho" lợi nhuận tương lai đang cạn.

Hãy đọc thêm thuyết minh để biết khoản trả trước thuộc dự án nào và tiến độ pháp lý của dự án đó.

## Hàng tồn kho là tài sản chính

Ở doanh nghiệp sản xuất, hàng tồn kho là nguyên liệu và thành phẩm. Ở doanh nghiệp bất động sản, **hàng tồn kho chính là quỹ đất và dự án**: tiền sử dụng đất, chi phí giải phóng mặt bằng, chi phí xây dựng dở dang, căn hộ hoàn thành chưa bán. Nó thường chiếm phần lớn tổng tài sản.

Những điểm cần đọc trong thuyết minh hàng tồn kho:

1. **Chi tiết theo dự án** — dự án nào chiếm tỷ trọng lớn, đang ở giai đoạn nào.
2. **Tài sản đem thế chấp** cho khoản vay.
3. **Dự phòng giảm giá hàng tồn kho** — khi giá trị thuần có thể thực hiện thấp hơn giá gốc (thị trường đi xuống, dự án đình trệ).

Vì mua đất và xây dựng dự án để bán được hạch toán vào hàng tồn kho, **dòng tiền từ hoạt động kinh doanh thường âm** trong giai đoạn tích luỹ quỹ đất và xây dựng — khác với nhận định ở bài **Báo cáo lưu chuyển tiền tệ** rằng dòng tiền HĐKD âm kéo dài là xấu. Điều cần hỏi là dòng tiền đó có quay về khi bàn giao hay không.

## Nợ vay, trái phiếu và lãi vay được vốn hoá

Dự án cần vốn lớn trong nhiều năm, nên doanh nghiệp bất động sản thường vay ngân hàng và phát hành **trái phiếu doanh nghiệp**. Hai điểm dễ bị bỏ sót:

- **Lãi vay được vốn hoá**: theo chuẩn mực về chi phí đi vay, lãi của khoản vay dùng cho dự án đang xây dựng được **cộng vào giá trị hàng tồn kho** thay vì ghi chi phí ngay. Chi phí lãi vay trên KQKD vì vậy có thể rất nhỏ, khiến hệ số khả năng trả lãi trông "an toàn" giả tạo. Lãi đó chỉ đi vào giá vốn khi bàn giao. Hãy đối chiếu tổng tiền lãi đã trả trên báo cáo lưu chuyển tiền tệ (một phần lãi vốn hoá có thể được trình bày ở dòng tiền đầu tư) và phần lãi vốn hoá trong thuyết minh.
- **Lịch đáo hạn trái phiếu**: giai đoạn thị trường trái phiếu căng thẳng năm 2022–2023 cho thấy rủi ro lớn nhất của doanh nghiệp bất động sản thường là **thanh khoản**, không phải lỗ kế toán. Thuyết minh vay và trái phiếu cho biết khoản nào đáo hạn trong 12 tháng tới.

## Rủi ro pháp lý và bàn giao

Một dự án có thể nằm trong hàng tồn kho nhiều năm vì vướng **pháp lý**: chưa xác định xong tiền sử dụng đất, chưa được phê duyệt điều chỉnh quy hoạch, chưa được cấp giấy chứng nhận cho người mua. Khi đó tiền vốn bị "chôn", lãi vay vẫn chạy, còn doanh thu chưa thể ghi nhận. Hãy đọc báo cáo thường niên và thuyết minh để biết dự án đang ở bước nào.

## Định giá: vì sao P/B dễ đánh lừa — tư duy NAV/RNAV

Quỹ đất được ghi theo **giá gốc** — có khi mua từ hàng chục năm trước, có khi mua đắt ở đỉnh thị trường. Vì vậy vốn chủ sở hữu trên sổ sách có thể khác xa giá trị thực, và P/B không đáng tin như ở ngành khác. Nhà phân tích thường dùng **RNAV (giá trị tài sản ròng đánh giá lại)**:

> RNAV = Tổng giá trị hiện tại của dòng tiền ròng từng dự án + tài sản khác − nợ vay ròng

Mỗi dự án được ước tính doanh thu, chi phí còn lại, tiến độ bán và bàn giao, rồi chiết khấu về hiện tại. Kết quả nhạy cảm với giả định giá bán và thời gian hoàn thành pháp lý — nên hãy coi RNAV là một khoảng giá trị, không phải một con số chính xác.

*Số liệu trong bảng là minh hoạ, không phải của doanh nghiệp thật.*

## Thực hành

Chọn một doanh nghiệp phát triển bất động sản niêm yết và lập bảng 5 năm gồm: doanh thu, LNST, người mua trả tiền trước, hàng tồn kho, tổng nợ vay và trái phiếu. Trả lời: (1) Năm nào lợi nhuận tăng vọt và có trùng với năm bàn giao dự án lớn không? (2) Người mua trả tiền trước hiện đang tăng hay giảm? (3) Bao nhiêu nợ vay và trái phiếu đáo hạn trong 12 tháng tới so với tiền mặt hiện có?`,
        questions: [
          {
            prompt: 'Doanh thu của một doanh nghiệp bất động sản tăng gấp 7 lần trong một năm. Lý do khả dĩ nhất là gì?',
            options: [
              'Giá căn hộ trên toàn thị trường tăng gấp 7 lần',
              'Doanh nghiệp bàn giao một dự án lớn nên ghi nhận doanh thu tích luỹ của nhiều năm bán hàng',
              'Doanh nghiệp đổi sang dùng chuẩn mực kế toán khác',
              'Hàng tồn kho tăng mạnh',
            ],
            correct_index: 1,
            explanation:
              'Doanh thu bất động sản được ghi nhận khi bàn giao, nên sản phẩm đã bán trong nhiều năm sẽ "đổ" vào doanh thu đúng năm bàn giao. Vì thế lợi nhuận ngành này rất thất thường.',
          },
          {
            prompt: 'Khoản "Người mua trả tiền trước" tăng mạnh qua hai năm liên tiếp thường báo hiệu điều gì?',
            options: [
              'Doanh nghiệp đang lỗ nặng',
              'Doanh nghiệp sắp phải trả lại tiền cho khách',
              'Doanh số bán thực tế tốt, là nguồn doanh thu sẽ được ghi nhận khi dự án bàn giao',
              'Doanh nghiệp đã vốn hoá lãi vay',
            ],
            correct_index: 2,
            explanation:
              'Đây là tiền khách đã trả cho sản phẩm chưa bàn giao — một chỉ báo dẫn dắt của doanh thu tương lai, với điều kiện dự án hoàn thành pháp lý và bàn giao đúng hạn.',
          },
          {
            prompt: 'Doanh nghiệp vốn hoá phần lớn lãi vay vào giá trị dự án. Điều này ảnh hưởng thế nào đến việc phân tích?',
            options: [
              'Không ảnh hưởng gì vì tiền lãi đã được miễn',
              'Chi phí lãi vay trên KQKD thấp nên khả năng trả lãi trông an toàn hơn thực tế; lãi sẽ vào giá vốn khi bàn giao',
              'Lợi nhuận gộp năm hiện tại sẽ thấp hơn',
              'Nợ vay được xoá khỏi bảng cân đối',
            ],
            correct_index: 1,
            explanation:
              'Lãi vốn hoá nằm trong hàng tồn kho chứ không đi qua chi phí tài chính kỳ này. Hãy đối chiếu tiền lãi thực trả trên báo cáo lưu chuyển tiền tệ và thuyết minh chi phí đi vay để thấy gánh nặng lãi thật.',
          },
          {
            prompt: 'Vì sao P/B thường kém tin cậy khi định giá doanh nghiệp phát triển bất động sản?',
            options: [
              'Vì doanh nghiệp bất động sản không có vốn chủ sở hữu',
              'Vì quỹ đất ghi theo giá gốc nên có thể khác xa giá trị thị trường; cần ước tính RNAV theo từng dự án',
              'Vì giá cổ phiếu bất động sản không thay đổi',
              'Vì P/B chỉ dùng cho ngân hàng',
            ],
            correct_index: 1,
            explanation:
              'Giá trị sổ sách phản ánh chi phí lịch sử của quỹ đất. RNAV ước tính giá trị hiện tại của dòng tiền từng dự án trừ nợ ròng, dù kết quả rất nhạy với giả định giá bán và tiến độ pháp lý.',
          },
        ],
      },
      {
        slug: 'bctc-cong-ty-chung-khoan',
        title: 'Công ty chứng khoán: môi giới, cho vay ký quỹ và tự doanh',
        summary: 'Các mảng thu nhập của công ty chứng khoán, vì sao lợi nhuận đi theo thanh khoản thị trường, lãi FVTPL dễ đảo chiều và dòng tiền HĐKD thường âm.',
        content_md: `## Công ty chứng khoán kiếm tiền từ đâu?

Báo cáo kết quả kinh doanh của công ty chứng khoán được lập theo mẫu riêng cho ngành, chia doanh thu theo **mảng nghiệp vụ** thay vì doanh thu bán hàng và giá vốn:

| Mảng | Dòng trên BCTC | Phụ thuộc vào |
|---|---|---|
| **Môi giới** | Doanh thu nghiệp vụ môi giới chứng khoán | Giá trị giao dịch của thị trường và thị phần |
| **Cho vay ký quỹ (margin)** | Lãi từ các khoản cho vay và phải thu | Dư nợ margin và lãi suất cho vay |
| **Tự doanh** | Lãi từ tài sản tài chính FVTPL, lãi từ các khoản đầu tư nắm giữ đến ngày đáo hạn (HTM), lãi từ tài sản tài chính sẵn sàng để bán (AFS) | Diễn biến giá cổ phiếu, trái phiếu, lãi suất tiền gửi |
| **Ngân hàng đầu tư (IB)** | Bảo lãnh, đại lý phát hành; tư vấn tài chính | Thị trường vốn có sôi động không |

Ba nhóm tài sản tài chính chính:

- **Tài sản tài chính ghi nhận thông qua lãi/lỗ (FVTPL)**: đánh giá lại theo giá thị trường mỗi kỳ, chênh lệch **đi thẳng vào lợi nhuận** — kể cả khi chưa bán.
- **Các khoản đầu tư nắm giữ đến ngày đáo hạn (HTM)**: thường là tiền gửi có kỳ hạn, chứng chỉ tiền gửi; thu nhập ổn định.
- **Tài sản tài chính sẵn sàng để bán (AFS)**: đánh giá lại nhưng phần chênh lệch đi vào **thu nhập toàn diện khác** trong vốn chủ, chỉ vào lợi nhuận khi bán.

## Lợi nhuận đi theo thanh khoản thị trường

Môi giới và margin đều co giãn theo **giá trị giao dịch** của thị trường: khi thanh khoản giảm một nửa, phí môi giới giảm theo, nhà đầu tư cũng vay ít hơn. Ví dụ **SSI**:

| Năm | Doanh thu | LNST | Vay ngắn hạn (cuối năm) | Chi phí lãi vay |
|---|---|---|---|---|
| 2021 | 7.443 | 2.695 | 31.121 | 1.030 |
| 2022 | 6.336 | 1.698 | 27.892 | 1.031 |
| 2023 | 7.158 | 2.294 | 43.169 | 1.570 |
| 2024 | 8.529 | 2.845 | 45.502 | 1.506 |
| 2025 | 12.931 | 4.107 | 60.161 | 2.562 |

*Đơn vị: tỷ đồng. Số liệu: BCTC hợp nhất năm, tổng hợp từ dữ liệu công khai (Vietcap), làm tròn.*

Năm 2022 thị trường giảm mạnh, lợi nhuận SSI giảm khoảng **37%**; đến 2025 khi thanh khoản phục hồi, lợi nhuận lên **4.107 tỷ**. Đây là ngành **chu kỳ theo thị trường**: mua cổ phiếu chứng khoán vì "năm nay lãi kỷ lục" thường là mua ở đỉnh chu kỳ thanh khoản.

## Margin được tài trợ bằng vay ngắn hạn

Cho vay ký quỹ là nghiệp vụ tín dụng: công ty chứng khoán đi vay (chủ yếu vay ngắn hạn ngân hàng, phát hành giấy tờ có giá) rồi cho nhà đầu tư vay lại với lãi suất cao hơn. Cuối 2025, SSI có vay ngắn hạn **60.161 tỷ** trên tổng tài sản **94.050 tỷ**, trong khi vốn chủ là **32.066 tỷ** — tổng tài sản khoảng 2,9 lần vốn chủ. Dư nợ cho vay ký quỹ bị giới hạn theo vốn chủ sở hữu theo quy định của Uỷ ban Chứng khoán Nhà nước, nên muốn mở rộng margin, công ty phải **tăng vốn**.

Rủi ro cần nhìn:

- **Chênh lệch lãi suất**: chi phí lãi vay tăng từ 1.506 tỷ (2024) lên 2.562 tỷ (2025) theo quy mô vay. Lãi suất huy động tăng mà lãi margin không tăng kịp sẽ bào mòn biên lãi.
- **Chất lượng khoản cho vay**: khi thị trường giảm sâu, tài sản ký quỹ mất giá nhanh; nếu bán giải chấp không kịp, công ty phải trích **dự phòng** cho khoản cho vay.

## Lãi FVTPL: đánh giá lại theo giá thị trường

Vì FVTPL được đánh giá lại mỗi kỳ, một quý thị trường tăng mạnh có thể mang lại **lãi tự doanh lớn chưa thực hiện**, và quý sau thị trường giảm thì lãi đó **đảo chiều thành lỗ**. Khi đọc, hãy:

1. Tách lãi FVTPL thành **lãi bán** và **chênh lệch đánh giá lại** (thuyết minh có chi tiết).
2. Xem **danh mục FVTPL gồm gì**: chứng chỉ tiền gửi, trái phiếu (ít biến động) hay cổ phiếu niêm yết (biến động mạnh).
3. Đừng ngoại suy một quý lãi tự doanh đột biến thành năng lực lợi nhuận dài hạn.

## Vì sao dòng tiền HĐKD thường âm?

Với công ty chứng khoán, **giải ngân margin** và **mua tài sản tài chính** để tự doanh đều nằm trong hoạt động kinh doanh. Khi công ty mở rộng quy mô, dòng tiền HĐKD âm, còn tiền vay làm **dòng tiền tài chính dương** — SSI ghi nhận dòng tiền tài chính **+15.973 tỷ** năm 2025. Đây là đặc điểm mô hình, không tự thân là dấu hiệu xấu. Câu hỏi đúng là: tài sản tăng thêm đó (margin, trái phiếu, cổ phiếu) có chất lượng không, và nguồn vay có bền vững không.

## Thực hành

Lấy BCTC năm gần nhất của một công ty chứng khoán niêm yết. (1) Tính tỷ trọng doanh thu môi giới, lãi cho vay ký quỹ và lãi FVTPL trong tổng doanh thu hoạt động. (2) Tính dư nợ cho vay ký quỹ chia vốn chủ sở hữu. (3) Trong thuyết minh FVTPL, xác định tỷ trọng cổ phiếu niêm yết so với trái phiếu và chứng chỉ tiền gửi. Nếu thanh khoản thị trường giảm 40%, mảng nào bị ảnh hưởng mạnh nhất?`,
        questions: [
          {
            prompt: 'Giá trị giao dịch bình quân của thị trường giảm một nửa. Những dòng thu nhập nào của công ty chứng khoán chịu tác động trực tiếp nhất?',
            options: ['Lãi tiền gửi HTM', 'Doanh thu môi giới và lãi cho vay ký quỹ', 'Thu nhập từ cho thuê văn phòng', 'Chênh lệch tỷ giá'],
            correct_index: 1,
            explanation:
              'Phí môi giới tỷ lệ với giá trị giao dịch, và khi thị trường trầm lắng nhà đầu tư cũng vay margin ít hơn. Đó là lý do lợi nhuận SSI giảm khoảng 37% năm 2022.',
          },
          {
            prompt: 'Một công ty chứng khoán báo lãi tự doanh FVTPL đột biến trong quý. Điểm cần thận trọng là gì?',
            options: [
              'Lãi FVTPL luôn là tiền mặt đã thu về',
              'Lãi FVTPL có thể gồm chênh lệch đánh giá lại chưa thực hiện và có thể đảo chiều khi thị trường giảm',
              'Lãi FVTPL không được tính vào lợi nhuận',
              'Lãi FVTPL chỉ đến từ tiền gửi ngân hàng',
            ],
            correct_index: 1,
            explanation:
              'FVTPL được đánh giá lại theo giá thị trường mỗi kỳ và chênh lệch đi thẳng vào lợi nhuận, nên lãi một quý có thể biến thành lỗ ở quý sau. Hãy tách lãi bán và lãi đánh giá lại trong thuyết minh.',
          },
          {
            prompt: 'Công ty chứng khoán có lợi nhuận dương nhưng dòng tiền HĐKD âm lớn, dòng tiền tài chính dương lớn. Cách hiểu hợp lý nhất?',
            options: [
              'Chắc chắn công ty đang làm giả lợi nhuận',
              'Công ty đang mở rộng cho vay ký quỹ và danh mục tài sản tài chính (xếp vào HĐKD), tài trợ bằng tiền vay',
              'Công ty đã trả hết nợ vay',
              'Công ty ngừng hoạt động môi giới',
            ],
            correct_index: 1,
            explanation:
              'Giải ngân margin và mua tài sản tài chính là hoạt động kinh doanh của công ty chứng khoán, nên CFO âm khi quy mô tăng. Điều cần kiểm tra là chất lượng tài sản tăng thêm và tính bền vững của nguồn vay.',
          },
          {
            prompt: 'Muốn tăng mạnh dư nợ cho vay ký quỹ, công ty chứng khoán thường phải làm gì?',
            options: [
              'Giảm phí môi giới về 0',
              'Tăng vốn chủ sở hữu (vì dư nợ margin bị giới hạn theo vốn chủ) và tăng vay ngắn hạn',
              'Bán toàn bộ danh mục HTM',
              'Ngừng trả lãi vay',
            ],
            correct_index: 1,
            explanation:
              'Quy định giới hạn dư nợ margin theo vốn chủ sở hữu, còn phần vốn cho vay chủ yếu đến từ vay ngắn hạn. Vì vậy các đợt tăng vốn thường đi trước giai đoạn mở rộng margin.',
          },
        ],
      },
      {
        slug: 'bctc-bao-hiem',
        title: 'Bảo hiểm: phí, bồi thường, dự phòng nghiệp vụ và quỹ đầu tư',
        summary:
          'Cách đọc kết quả kinh doanh bảo hiểm, tỷ lệ kết hợp, vì sao doanh nghiệp bảo hiểm có thể lỗ nghiệp vụ mà vẫn lãi nhờ đầu tư, và khác biệt giữa nhân thọ và phi nhân thọ.',
        content_md: `## Mô hình: thu phí trước, chi trả sau

Doanh nghiệp bảo hiểm thu **phí bảo hiểm** ngay khi bán hợp đồng nhưng chỉ **bồi thường** (hoặc chi trả quyền lợi) khi sự kiện xảy ra — có thể sau vài tháng, vài năm hoặc vài chục năm với bảo hiểm nhân thọ. Khoảng thời gian đó tạo ra một **quỹ tiền nhàn rỗi ("float")** mà doanh nghiệp đem đi đầu tư. Lợi nhuận vì vậy có hai nguồn:

1. **Kết quả nghiệp vụ bảo hiểm (underwriting)**: phí thu được trừ bồi thường, hoa hồng, chi phí khai thác và trích lập dự phòng.
2. **Thu nhập đầu tư** trên quỹ float: lãi tiền gửi, trái phiếu, cổ tức, lãi bán chứng khoán.

## Đọc báo cáo kết quả kinh doanh bảo hiểm

| Dòng | Ý nghĩa |
|---|---|
| Doanh thu phí bảo hiểm | Phí thu từ hợp đồng gốc |
| − Phí nhượng tái bảo hiểm | Phần rủi ro chuyển cho nhà tái bảo hiểm |
| = **Doanh thu thuần hoạt động kinh doanh bảo hiểm** | |
| − Chi bồi thường / chi trả quyền lợi bảo hiểm | |
| − **Tăng dự phòng nghiệp vụ** | Khoản trích cho nghĩa vụ tương lai với người được bảo hiểm |
| − Hoa hồng, chi phí khai thác | |
| = **Lợi nhuận gộp hoạt động kinh doanh bảo hiểm** | Kết quả underwriting |
| + Doanh thu hoạt động tài chính (đầu tư) | |

## Tỷ lệ kết hợp (combined ratio)

Với bảo hiểm phi nhân thọ, chỉ số trung tâm là **tỷ lệ kết hợp**:

> Tỷ lệ kết hợp = Tỷ lệ bồi thường (bồi thường / phí thuần) + Tỷ lệ chi phí (chi phí khai thác, quản lý / phí thuần)

- **Dưới 100%**: nghiệp vụ có lãi trước khi tính thu nhập đầu tư.
- **Trên 100%**: nghiệp vụ lỗ; doanh nghiệp dựa vào đầu tư để có lãi.

Tỷ lệ bồi thường có thể nhảy vọt trong năm có thiên tai lớn (như bão Yagi năm 2024 ở miền Bắc) hoặc khi doanh nghiệp hạ phí để giành thị phần. Hãy so tỷ lệ kết hợp qua nhiều năm và với đối thủ, theo từng nghiệp vụ (xe cơ giới, sức khoẻ, tài sản…) nếu thuyết minh có.

## Ví dụ Bảo Việt (BVH): lỗ nghiệp vụ, lãi nhờ đầu tư

| Năm | Doanh thu thuần KD bảo hiểm | Lợi nhuận gộp KD bảo hiểm | Tổng tài sản | Vốn chủ sở hữu |
|---|---|---|---|---|
| 2021 | 36.830 | 614 | 169.505 | 22.031 |
| 2022 | 40.688 | 105 | 201.664 | 21.271 |
| 2023 | 40.085 | −2.532 | 221.160 | 22.280 |
| 2024 | 39.823 | −969 | 251.286 | 23.566 |
| 2025 | 40.948 | 1.238 | 291.806 | 25.480 |

*Đơn vị: tỷ đồng. Số liệu: BCTC hợp nhất năm, tổng hợp từ dữ liệu công khai (Vietcap), làm tròn.*

Trên khoảng 40.000 tỷ doanh thu thuần, lợi nhuận gộp nghiệp vụ chỉ dao động quanh 0, thậm chí **âm** năm 2023–2024. Vậy mà BVH vẫn có lãi, ROE khoảng **13,3%** (TTM quý 2/2026) — vì phần lớn lợi nhuận đến từ **đầu tư quỹ float**. Dòng tiền đầu tư của BVH âm sâu gần như mọi năm (−24.150 tỷ năm 2025): phí thu về liên tục được đem đi mua tiền gửi, trái phiếu, cổ phiếu.

Lưu ý quan trọng: với **bảo hiểm nhân thọ** (mảng lớn của BVH), kết quả nghiệp vụ âm phần nào là **thiết kế sẵn** — phần phí dành cho tích luỹ được trích vào dự phòng (ghi là chi phí), còn thu nhập đầu tư trên khoản dự phòng đó nằm ở dòng tài chính. Vì vậy phải đọc **cả hai nửa** cùng nhau.

## Bảng cân đối: "nợ" chủ yếu là dự phòng nghiệp vụ

Tổng tài sản BVH năm 2025 gấp khoảng **11,5 lần** vốn chủ. Nhưng phần lớn nợ phải trả không phải vay ngân hàng mà là **dự phòng nghiệp vụ** — ước tính nghĩa vụ tương lai với khách hàng (dự phòng phí chưa được hưởng, dự phòng bồi thường, dự phòng toán học với nhân thọ). Rủi ro nằm ở hai chỗ:

- **Dự phòng có đủ không**: nếu trích thiếu, lợi nhuận hiện tại bị phóng đại và sẽ phải trả giá sau.
- **Tài sản đầu tư có chất lượng không**: một khoản trái phiếu doanh nghiệp vỡ nợ hay cổ phiếu sụt giá sẽ ăn trực tiếp vào vốn chủ mỏng.

## Nhân thọ khác phi nhân thọ thế nào?

| | Nhân thọ | Phi nhân thọ |
|---|---|---|
| Kỳ hạn hợp đồng | Dài (10–20 năm hoặc hơn) | Ngắn (thường 1 năm) |
| Dự phòng | Rất lớn, tăng dần | Nhỏ hơn, xoay vòng nhanh |
| Chỉ số trọng tâm | Phí khai thác mới, tỷ lệ duy trì hợp đồng, chênh lệch lợi suất đầu tư | Tỷ lệ kết hợp |
| Nhạy với | **Lãi suất** dài hạn | Thiên tai, lạm phát chi phí sửa chữa, y tế |

Khi **lãi suất giảm**, doanh nghiệp nhân thọ vừa thu lợi suất thấp hơn khi tái đầu tư, vừa có thể phải trích thêm dự phòng vì cam kết lãi suất với khách hàng — biên lợi nhuận bị ép từ hai phía.

## Thực hành

Với BCTC năm gần nhất của một doanh nghiệp bảo hiểm phi nhân thọ niêm yết: (1) tính tỷ lệ bồi thường = bồi thường thuộc trách nhiệm giữ lại / doanh thu phí thuần; (2) tính tỷ lệ chi phí và cộng lại ra tỷ lệ kết hợp; (3) so lợi nhuận gộp nghiệp vụ với doanh thu tài chính. Doanh nghiệp đó kiếm tiền chủ yếu từ nghiệp vụ hay từ đầu tư?`,
        questions: [
          {
            prompt: 'Một công ty bảo hiểm phi nhân thọ có tỷ lệ kết hợp 103%. Điều này nghĩa là gì?',
            options: [
              'Công ty chắc chắn lỗ ròng trong năm',
              'Nghiệp vụ bảo hiểm lỗ khoảng 3% phí thuần trước khi tính thu nhập đầu tư',
              'Công ty có lợi nhuận bằng 103% doanh thu',
              'Công ty đã nhượng 103% phí cho nhà tái bảo hiểm',
            ],
            correct_index: 1,
            explanation: 'Tỷ lệ kết hợp trên 100% nghĩa là bồi thường cộng chi phí vượt phí thuần. Công ty vẫn có thể lãi ròng nếu thu nhập đầu tư trên quỹ float đủ bù.',
          },
          {
            prompt: 'Vì sao Bảo Việt có lợi nhuận gộp nghiệp vụ âm năm 2023–2024 mà vẫn có lãi?',
            options: [
              'Nhờ bán bớt văn phòng mỗi năm',
              'Nhờ thu nhập đầu tư trên quỹ phí tích luỹ (float) và dự phòng',
              'Vì doanh nghiệp bảo hiểm không phải nộp thuế',
              'Vì lỗ nghiệp vụ không được ghi vào báo cáo',
            ],
            correct_index: 1,
            explanation:
              'Phí thu trước được đầu tư vào tiền gửi, trái phiếu, cổ phiếu. Với nhân thọ, phần trích dự phòng được ghi là chi phí nghiệp vụ trong khi lãi đầu tư trên khoản đó nằm ở dòng tài chính — phải đọc cả hai.',
          },
          {
            prompt: 'Nợ phải trả của doanh nghiệp bảo hiểm gấp hơn 10 lần vốn chủ. Rủi ro chính cần đánh giá là gì?',
            options: [
              'Khả năng trả lãi vay ngân hàng',
              'Dự phòng nghiệp vụ có được trích đủ không và tài sản đầu tư có chất lượng không',
              'Số lượng nhân viên bán hàng',
              'Tỷ lệ hàng tồn kho trên tổng tài sản',
            ],
            correct_index: 1,
            explanation:
              'Phần lớn nợ phải trả là dự phòng nghiệp vụ — nghĩa vụ với khách hàng, không phải vay. Trích thiếu dự phòng làm lợi nhuận bị thổi phồng; tài sản đầu tư mất giá ăn thẳng vào vốn chủ mỏng.',
          },
          {
            prompt: 'Lãi suất thị trường giảm kéo dài ảnh hưởng thế nào đến doanh nghiệp bảo hiểm nhân thọ?',
            options: [
              'Có lợi tuyệt đối vì chi phí vay giảm',
              'Không ảnh hưởng vì hợp đồng nhân thọ là cố định',
              'Lợi suất tái đầu tư thấp hơn và có thể phải trích thêm dự phòng cho các cam kết lãi suất, làm biên lợi nhuận bị ép',
              'Tỷ lệ kết hợp tự động giảm xuống dưới 100%',
            ],
            correct_index: 2,
            explanation:
              'Doanh nghiệp nhân thọ kiếm lời từ chênh lệch giữa lợi suất đầu tư và lãi suất cam kết. Lãi suất giảm làm thu nhập đầu tư mới thấp đi trong khi nghĩa vụ cũ vẫn còn.',
          },
        ],
      },
      {
        slug: 'bctc-nganh-chu-ky-thep',
        title: 'Sản xuất và ngành chu kỳ: bài học từ thép',
        summary:
          'Biên lợi nhuận gộp dao động theo giá đầu vào – đầu ra, rủi ro tồn kho, chu kỳ đầu tư và khấu hao, vốn lưu động, và vì sao P/E thấp ở đỉnh chu kỳ là cái bẫy — minh hoạ bằng HPG.',
        content_md: `## Ngành chu kỳ là gì?

Doanh nghiệp **chu kỳ** bán sản phẩm có giá do thị trường quyết định — thép, phân bón, hoá chất, xi măng, cao su… — và mua đầu vào cũng là hàng hoá (quặng sắt, than, khí, điện). Lợi nhuận không đi theo đường thẳng mà theo **chênh lệch giữa giá bán và giá đầu vào**, vốn lên xuống theo kinh tế, xây dựng và chu kỳ toàn cầu.

## Biên lợi nhuận gộp nói lên tất cả — ví dụ Hoà Phát (HPG)

| Năm | Doanh thu | Lợi nhuận gộp | Biên gộp | LNST | Hàng tồn kho | Đầu tư TSCĐ (capex) | Dòng tiền HĐKD |
|---|---|---|---|---|---|---|---|
| 2021 | 149.680 | 41.108 | 27,5% | 34.521 | 42.134 | 11.621 | 26.721 |
| 2022 | 141.409 | 16.763 | 11,9% | 8.444 | 34.491 | 17.888 | 12.278 |
| 2023 | 118.953 | 12.938 | 10,9% | 6.800 | 34.504 | 17.374 | 8.643 |
| 2024 | 138.855 | 18.498 | 13,3% | 12.020 | 46.091 | 35.495 | 6.608 |
| 2025 | 156.116 | 24.498 | 15,7% | 15.515 | 52.828 | 25.748 | 17.366 |

*Đơn vị: tỷ đồng. Số liệu: BCTC hợp nhất năm, tổng hợp từ dữ liệu công khai (Vietcap), làm tròn.*

Từ 2021 sang 2022, doanh thu chỉ giảm khoảng **5,5%**, nhưng lợi nhuận gộp giảm gần **60%** và LNST giảm hơn **75%**. Lý do: giá thép đầu ra giảm trong khi chi phí đầu vào (đã mua ở giá cao) chưa giảm kịp — **chênh lệch giá** co lại. Đến 2023, LNST chỉ còn **6.800 tỷ**, khoảng **một phần năm** mức đỉnh 2021. Đây là **đòn bẩy hoạt động** (chi phí cố định như khấu hao, nhân công) cộng với **đòn bẩy tài chính** (lãi vay): hai loại chi phí cố định này khiến một thay đổi nhỏ ở doanh thu và biên gộp khuếch đại thành biến động rất lớn ở lợi nhuận.

## Hàng tồn kho: tài sản và cũng là rủi ro

Nhà sản xuất thép phải dự trữ nhiều tháng nguyên liệu và thành phẩm. Năm 2025, hàng tồn kho của HPG lên **52.828 tỷ**; với giá vốn khoảng 131.600 tỷ, số ngày tồn kho (= hàng tồn kho / giá vốn × 365) khoảng **147 ngày**. Hai rủi ro:

- **Giảm giá hàng tồn kho**: nếu giá thép rơi mạnh, giá trị thuần có thể thực hiện thấp hơn giá gốc → phải trích **dự phòng giảm giá hàng tồn kho**, ghi vào giá vốn. Tích trữ nhiều nguyên liệu giá cao ngay trước khi giá rơi là cách nhanh nhất để biên gộp sụp đổ.
- **Kẹt tiền**: hàng tồn kho tăng hút tiền mặt, thường được tài trợ bằng **vay ngắn hạn**. Vay ngắn hạn của HPG tăng từ 43.748 tỷ (2021) lên **64.695 tỷ** (2025).

Ngược lại, khi giá đầu ra đang tăng, tồn kho mua giá rẻ lại giúp biên gộp phình to — một phần lợi nhuận đỉnh chu kỳ đến từ hiệu ứng này và **không lặp lại**.

## Chu kỳ đầu tư (capex) và khấu hao

Doanh nghiệp chu kỳ thường đầu tư mở rộng công suất lớn theo từng đợt. Năm 2024, capex của HPG lên **35.495 tỷ** (giai đoạn xây dựng khu liên hợp Dung Quất 2), trong khi dòng tiền HĐKD chỉ **6.608 tỷ** — **dòng tiền tự do** (khái niệm ở bài **Báo cáo lưu chuyển tiền tệ**) âm khoảng **29.000 tỷ**, được bù bằng vay: vay dài hạn tăng từ 10.399 tỷ lên **27.080 tỷ**.

Đọc capex theo ba bước:

1. **Giai đoạn xây dựng**: tài sản nằm ở "xây dựng cơ bản dở dang", chưa khấu hao; lãi vay của dự án có thể được vốn hoá. Lợi nhuận chưa phản ánh gánh nặng chi phí.
2. **Khi đi vào vận hành**: khấu hao và lãi vay bắt đầu vào KQKD. Khấu hao của HPG tăng từ 6.916 tỷ (2024) lên **8.471 tỷ** (2025).
3. **Hiệu quả thật** chỉ đến nếu công suất mới được lấp đầy với chênh lệch giá đủ tốt. Nếu dự án hoàn thành đúng lúc chu kỳ đi xuống, khấu hao và lãi vay sẽ đè nặng lợi nhuận.

## Bẫy P/E thấp ở đỉnh chu kỳ

Ở bài **Kết hợp các chỉ số và những bẫy thường gặp**, ta biết P/E thấp chưa chắc là rẻ. Với ngành chu kỳ, điều này còn rõ hơn: **ở đỉnh chu kỳ, lợi nhuận (E) cao bất thường nên P/E trông rất thấp** — đúng lúc rủi ro lớn nhất. Khi chu kỳ đảo chiều, E giảm 70–80% và P/E "rẻ" hôm qua hoá thành đắt. Ngược lại, ở đáy chu kỳ, lợi nhuận thấp làm P/E cao, nhưng đó thường mới là giai đoạn kém rủi ro hơn.

Cách tiếp cận thận trọng hơn với ngành chu kỳ:

- Dùng **lợi nhuận bình quân cả chu kỳ** (ví dụ 5–7 năm) thay vì lợi nhuận năm gần nhất.
- Kết hợp **P/B** và ROE trung bình chu kỳ.
- Theo dõi chỉ báo dẫn dắt: giá bán, giá nguyên liệu, tồn kho trong ngành, nhu cầu xây dựng.

## Thực hành

Dựa vào bảng HPG ở trên: (1) Tính LNST bình quân 5 năm 2021–2025. (2) Giả sử một nhà đầu tư năm 2021 định giá bằng LNST 34.521 tỷ, còn nhà đầu tư khác dùng LNST bình quân — P/E của người thứ nhất thấp hơn người thứ hai bao nhiêu lần ở cùng một mức vốn hoá? (3) Tính dòng tiền tự do (dòng tiền HĐKD − capex) từng năm và nhận xét năm nào doanh nghiệp phải dựa nhiều nhất vào vay nợ.`,
        questions: [
          {
            prompt: 'Vì sao mua cổ phiếu ngành chu kỳ khi P/E rất thấp ở thời điểm lợi nhuận kỷ lục thường là cái bẫy?',
            options: [
              'Vì P/E không áp dụng cho doanh nghiệp sản xuất',
              'Vì lợi nhuận đang ở đỉnh chu kỳ; khi chênh lệch giá co lại, lợi nhuận giảm mạnh và P/E thực tế cao lên',
              'Vì doanh nghiệp chu kỳ không bao giờ trả cổ tức',
              'Vì P/E thấp luôn có nghĩa doanh nghiệp sắp phá sản',
            ],
            correct_index: 1,
            explanation:
              'P/E thấp ở đỉnh phản ánh E cao bất thường. HPG là ví dụ: LNST từ 34.521 tỷ (2021) giảm còn 6.800 tỷ (2023) — khoảng một phần năm. Nên dùng lợi nhuận bình quân cả chu kỳ.',
          },
          {
            prompt: 'Doanh thu HPG năm 2022 chỉ giảm khoảng 5,5% nhưng lợi nhuận gộp giảm gần 60%. Nguyên nhân chính là gì?',
            options: [
              'Số lượng nhân viên tăng gấp đôi',
              'Chênh lệch giữa giá bán thép và chi phí đầu vào co hẹp, khuếch đại bởi chi phí cố định lớn',
              'Doanh nghiệp đổi phương pháp tính thuế',
              'Hàng tồn kho tăng gấp đôi',
            ],
            correct_index: 1,
            explanation:
              'Biên gộp từ 27,5% xuống 11,9% vì giá đầu ra giảm nhanh hơn giá đầu vào. Với chi phí cố định cao, biên gộp co lại làm lợi nhuận giảm mạnh hơn nhiều so với doanh thu.',
          },
          {
            prompt: 'Doanh nghiệp thép tăng mạnh hàng tồn kho ngay trước giai đoạn giá thép có thể giảm. Rủi ro nào lớn nhất?',
            options: [
              'Phải trích dự phòng giảm giá hàng tồn kho, biên gộp giảm, và tiền bị kẹt trong kho được tài trợ bằng vay ngắn hạn',
              'Doanh thu chắc chắn tăng',
              'Khấu hao tăng ngay lập tức',
              'Không có rủi ro vì hàng tồn kho là tài sản',
            ],
            correct_index: 0,
            explanation:
              'Khi giá trị thuần có thể thực hiện thấp hơn giá gốc, doanh nghiệp phải lập dự phòng vào giá vốn. Hàng tồn kho lớn còn hút tiền và thường đi kèm vay ngắn hạn tăng.',
          },
          {
            prompt: 'Một doanh nghiệp sản xuất đang trong năm capex kỷ lục, dòng tiền tự do âm sâu. Điều gì hợp lý nhất để kỳ vọng ở các năm sau?',
            options: [
              'Lợi nhuận chắc chắn tăng gấp đôi ngay năm sau',
              'Khấu hao và chi phí lãi vay sẽ tăng khi dự án vận hành; lợi nhuận chỉ cải thiện nếu công suất mới được lấp đầy với chênh lệch giá đủ tốt',
              'Khấu hao sẽ giảm vì tài sản mới',
              'Nợ vay sẽ tự động được xoá khi dự án hoàn thành',
            ],
            correct_index: 1,
            explanation:
              'Tài sản mới bắt đầu khấu hao khi đưa vào sử dụng (khấu hao HPG tăng lên 8.471 tỷ năm 2025) và lãi vay không còn được vốn hoá. Hiệu quả phụ thuộc vào thời điểm chu kỳ khi dự án hoàn thành.',
          },
        ],
      },
      {
        slug: 'bctc-ban-le-tieu-dung',
        title: 'Bán lẻ và tiêu dùng: tăng trưởng cùng cửa hàng, vòng quay kho và vốn lưu động âm',
        summary:
          'Tách tăng trưởng của chuỗi bán lẻ thành cửa hàng hiện hữu và cửa hàng mới, đọc vòng quay hàng tồn kho, kinh tế từng cửa hàng, vốn lưu động âm, chi phí thuê — và so sánh với doanh nghiệp dịch vụ nhẹ tài sản như FPT.',
        content_md: `## Tăng trưởng đến từ đâu?

Doanh thu chuỗi bán lẻ tăng vì hai lý do rất khác nhau:

1. **Tăng trưởng cùng cửa hàng (SSSG — same-store sales growth)**: doanh thu của các cửa hàng **đã hoạt động đủ một năm trở lên** tăng bao nhiêu so với cùng kỳ. Đây là thước đo sức khoẻ thật của mô hình.
2. **Mở thêm cửa hàng**: doanh thu tăng vì có thêm điểm bán — tốn vốn, và mỗi cửa hàng mới cần thời gian để đạt doanh thu ổn định.

Ví dụ **minh hoạ** (số liệu giả định) của Chuỗi Y:

| | Năm N−1 | Năm N |
|---|---|---|
| Số cửa hàng cuối năm | 1.000 | 1.200 |
| Doanh thu (tỷ đồng) | 20.000 | 23.000 |
| Tăng trưởng doanh thu | | +15% |
| SSSG (doanh nghiệp công bố) | | −2% |

Doanh thu tăng 15% trông đẹp, nhưng **cửa hàng cũ bán kém đi 2%** — toàn bộ tăng trưởng đến từ mở mới. Nếu ngừng mở cửa hàng, doanh thu sẽ đi lùi. SSSG thường không nằm trong BCTC mà ở báo cáo thường niên, tài liệu nhà đầu tư; khi doanh nghiệp không công bố, có thể ước lượng thô bằng **doanh thu bình quân mỗi cửa hàng**.

## Kinh tế từng cửa hàng

Với bán lẻ, câu hỏi then chốt là: **biên lợi nhuận gộp có đủ trang trải chi phí vận hành mỗi cửa hàng không?**

| Trên 100 đồng doanh thu (minh hoạ) | |
|---|---|
| Biên lợi nhuận gộp | 22 |
| Chi phí thuê mặt bằng | 6 |
| Lương nhân viên | 7 |
| Điện, logistics, khấu hao, khác | 5 |
| = Lợi nhuận hoạt động | **4** |

Biên lợi nhuận mỏng và chi phí phần lớn là **cố định** (tiền thuê, lương). Theo bảng trên, SSSG giảm 10% có thể làm lợi nhuận cửa hàng giảm hơn một nửa; giảm khoảng 18% là lợi nhuận về 0 — một dạng **đòn bẩy hoạt động** giống ngành chu kỳ ở bài trước, nhưng do chi phí thuê và nhân sự.

## Vòng quay hàng tồn kho và vốn lưu động âm

Bán lẻ sống nhờ **quay vòng hàng nhanh**. Bài **Sức khoẻ tài chính** dùng hệ số thanh toán hiện hành và thanh toán nhanh; với bán lẻ, cần đi sâu hơn vào **số ngày**: số ngày tồn kho = hàng tồn kho / giá vốn × 365, số ngày phải trả = phải trả người bán / giá vốn × 365, số ngày phải thu = phải thu / doanh thu × 365. Ghép lại ta có **chu kỳ tiền mặt**:

> Chu kỳ tiền mặt = Số ngày tồn kho + Số ngày phải thu − Số ngày phải trả

Ví dụ minh hoạ của Chuỗi Y năm N: giá vốn 17.940 tỷ, hàng tồn kho 3.000 tỷ (≈ **61 ngày**), phải thu gần như bằng 0 (khách trả tiền ngay), phải trả nhà cung cấp 3.700 tỷ (≈ **75 ngày**) → chu kỳ tiền mặt ≈ **−14 ngày**.

Chu kỳ âm nghĩa là **nhà cung cấp đang tài trợ hàng tồn kho**: chuỗi bán hàng và thu tiền trước khi phải trả nhà cung cấp. Đây là lợi thế lớn khi chuỗi tăng trưởng — càng mở rộng, càng có thêm "tiền miễn phí". Nhưng có mặt trái:

- Khi doanh thu chững lại hoặc nhà cung cấp rút ngắn thời hạn thanh toán, khoản phải trả co lại và **tiền mặt bị hút ra rất nhanh**.
- **Số ngày tồn kho tăng** là tín hiệu sớm của hàng bán chậm, có thể phải giảm giá thanh lý và trích dự phòng.
- Hệ số thanh toán hiện hành dưới 1 ở một chuỗi bán lẻ chưa chắc là xấu — phải xem cấu trúc vốn lưu động.

## Chi phí thuê và nghĩa vụ thuê

Theo chuẩn mực kế toán Việt Nam, tiền thuê mặt bằng theo hợp đồng **thuê hoạt động** được ghi thẳng vào chi phí bán hàng, **không** ghi nhận thành tài sản quyền sử dụng và nợ thuê trên bảng cân đối như IFRS 16. Hệ quả:

- Bảng cân đối của chuỗi bán lẻ Việt Nam trông "nhẹ nợ" hơn so với chuỗi tương tự lập theo IFRS.
- Hãy đọc thuyết minh **cam kết thuê hoạt động** — tổng tiền thuê tối thiểu phải trả trong tương lai là một dạng nghĩa vụ giống nợ, không thể huỷ dễ dàng khi cửa hàng làm ăn kém.

## Đối chiếu: doanh nghiệp dịch vụ nhẹ tài sản (FPT)

Không phải doanh nghiệp nào cũng xoay quanh hàng tồn kho như bán lẻ. **FPT** — chủ yếu là dịch vụ công nghệ — có cấu trúc khác hẳn. Năm 2025: doanh thu **70.113 tỷ**, biên gộp khoảng **37%**, hàng tồn kho chỉ **2.194 tỷ**, nhưng phải thu khách hàng **12.735 tỷ** (≈ **66 ngày** doanh thu). Dòng tiền HĐKD **10.136 tỷ** so với LNST **11.232 tỷ**; ROE khoảng **26,5%** (TTM quý 2/2026).

| | Bán lẻ (minh hoạ) | Dịch vụ CNTT (FPT) |
|---|---|---|
| Tài sản vốn lưu động chính | Hàng tồn kho | Phải thu khách hàng |
| Biên gộp | Thấp (~20%) | Cao (~35–39%) |
| Nguồn vốn lưu động | Nhà cung cấp (phải trả) | Vốn của doanh nghiệp, vay ngắn hạn |
| Chỉ số cần soi | SSSG, số ngày tồn kho, chu kỳ tiền mặt | Số ngày phải thu, hợp đồng ký mới, dòng tiền HĐKD/LNST |

*Số liệu FPT: BCTC hợp nhất năm, tổng hợp từ dữ liệu công khai (Vietcap), làm tròn. Số liệu Chuỗi Y là minh hoạ.*

## Thực hành

Chọn một chuỗi bán lẻ niêm yết. (1) Tìm số cửa hàng cuối năm và tính doanh thu bình quân mỗi cửa hàng trong 3 năm. (2) Tính số ngày tồn kho, số ngày phải trả và chu kỳ tiền mặt. (3) Đọc thuyết minh cam kết thuê hoạt động và so tổng nghĩa vụ thuê với vốn chủ sở hữu. Tăng trưởng của chuỗi này chủ yếu đến từ cửa hàng cũ hay cửa hàng mới?`,
        questions: [
          {
            prompt: 'Một chuỗi bán lẻ có doanh thu tăng 20% nhưng tăng trưởng cùng cửa hàng (SSSG) là −3%. Điều này cho thấy gì?',
            options: [
              'Mô hình đang rất khoẻ vì doanh thu tăng mạnh',
              'Tăng trưởng đến từ mở cửa hàng mới, còn cửa hàng hiện hữu đang bán kém đi',
              'Chuỗi đã đóng bớt cửa hàng',
              'Biên lợi nhuận gộp chắc chắn tăng',
            ],
            correct_index: 1,
            explanation: 'SSSG âm nghĩa là cửa hàng cũ bán kém hơn cùng kỳ. Doanh thu tổng tăng chỉ nhờ thêm điểm bán — tốn vốn, và sẽ chững lại nếu ngừng mở rộng.',
          },
          {
            prompt: 'Chuỗi bán lẻ có chu kỳ tiền mặt âm. Điểm mạnh và rủi ro của cấu trúc này là gì?',
            options: [
              'Không có ý nghĩa gì vì bán lẻ không có hàng tồn kho',
              'Nhà cung cấp đang tài trợ hàng tồn kho; nhưng khi tăng trưởng chững hoặc nhà cung cấp rút ngắn thời hạn, tiền mặt bị hút ra nhanh',
              'Doanh nghiệp chắc chắn đang mất khả năng thanh toán',
              'Doanh nghiệp đang cho khách hàng nợ quá lâu',
            ],
            correct_index: 1,
            explanation:
              'Chu kỳ tiền mặt âm = thu tiền bán hàng trước khi trả nhà cung cấp. Nó là nguồn vốn miễn phí khi mở rộng, nhưng đảo chiều nhanh khi doanh thu hoặc điều khoản thanh toán thay đổi.',
          },
          {
            prompt: 'Theo chuẩn mực kế toán Việt Nam, chi phí thuê mặt bằng cửa hàng (thuê hoạt động) thường được thể hiện thế nào?',
            options: [
              'Ghi nhận thành nợ thuê và tài sản quyền sử dụng trên bảng cân đối như IFRS 16',
              'Ghi vào chi phí trong kỳ; nghĩa vụ thuê tương lai chỉ thể hiện ở thuyết minh cam kết thuê hoạt động',
              'Không được ghi nhận ở bất kỳ đâu',
              'Ghi giảm trực tiếp vốn chủ sở hữu',
            ],
            correct_index: 1,
            explanation:
              'Theo VAS, tiền thuê hoạt động là chi phí kỳ này; bảng cân đối không có nợ thuê. Khi so với doanh nghiệp lập theo IFRS 16, cần cộng thêm nghĩa vụ thuê từ thuyết minh để so sánh công bằng.',
          },
          {
            prompt: 'Với doanh nghiệp dịch vụ công nghệ như FPT, khoản mục vốn lưu động nào cần theo dõi sát hơn hàng tồn kho?',
            options: [
              'Phải trả nhà cung cấp',
              'Phải thu khách hàng (số ngày thu tiền) và tỷ lệ dòng tiền HĐKD trên lợi nhuận',
              'Hàng hoá thành phẩm trong kho',
              'Chi phí thuê mặt bằng bán lẻ',
            ],
            correct_index: 1,
            explanation:
              'Doanh nghiệp dịch vụ nhẹ tài sản có ít hàng tồn kho (FPT 2.194 tỷ) nhưng phải thu lớn (12.735 tỷ, khoảng 66 ngày doanh thu năm 2025). Phải thu tăng nhanh hơn doanh thu sẽ làm dòng tiền HĐKD tụt so với lợi nhuận.',
          },
        ],
      },
    ],
  },
]
