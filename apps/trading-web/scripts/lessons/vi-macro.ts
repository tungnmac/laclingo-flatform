import type { SeedChapter } from './types'

// Vĩ mô và chu kỳ kinh tế (vi) — 6 bài, thứ tự khớp với en-macro.ts (bài thứ i là bản dịch của nhau).
// Không nêu mức lãi suất, CPI, GDP hiện hành: mọi con số trong ví dụ đều là số MINH HOẠ (ghi rõ trong bài).
// Sự kiện thể chế (công cụ của NHNN, 8 cuộc họp FOMC/năm, cách tính PMI, lịch công bố của Cục Thống kê) đã đối chiếu nguồn ở cuối mỗi bài.
export const VI_MACRO: SeedChapter[] = [
  {
    slug: 'vi-mo-va-chu-ky',
    title: 'Vĩ mô và chu kỳ kinh tế',
    description:
      'Lãi suất, lạm phát, tỷ giá, tăng trưởng và chu kỳ kinh tế tác động thế nào tới thị trường chứng khoán — và cách đưa vĩ mô vào quy trình đầu tư mà không biến mình thành người đoán tin.',
    level: 'intermediate',
    lessons: [
      {
        slug: 'lai-suat-va-chinh-sach-tien-te',
        title: 'Lãi suất và chính sách tiền tệ',
        summary:
          'Các công cụ điều hành của Ngân hàng Nhà nước, ảnh hưởng lan toả từ Fed, và vì sao lãi suất là "trọng lực" của định giá cổ phiếu.',
        content_md: `## Vì sao nhà đầu tư cổ phiếu phải quan tâm lãi suất?

Lãi suất là **giá của tiền**. Nó quyết định chi phí vay của doanh nghiệp, sức mua nhà của hộ gia đình và — quan trọng nhất với nhà đầu tư — **mức lợi nhuận tối thiểu** mà bạn đòi hỏi khi bỏ tiền vào cổ phiếu thay vì gửi tiết kiệm. Khi lãi suất thay đổi, gần như mọi tài sản đều phải "định giá lại".

## Ngân hàng Nhà nước (NHNN) điều hành bằng những công cụ nào?

Theo Luật NHNN, Thống đốc quyết định sử dụng các công cụ chính sách tiền tệ gồm **tái cấp vốn, lãi suất, tỷ giá, dự trữ bắt buộc, nghiệp vụ thị trường mở** và các công cụ khác.

| Công cụ | Cách hoạt động | Tín hiệu cho thị trường |
|---|---|---|
| **Lãi suất tái cấp vốn** | Lãi suất NHNN cho ngân hàng vay có bảo đảm để bổ sung vốn ngắn hạn | Lãi suất điều hành chủ chốt, định hướng mặt bằng lãi suất |
| **Lãi suất tái chiết khấu** | Lãi suất khi NHNN chiết khấu lại giấy tờ có giá cho ngân hàng | Thường thấp hơn tái cấp vốn, cùng chiều điều hành |
| **Nghiệp vụ thị trường mở (OMO)** | NHNN **mua có kỳ hạn** giấy tờ có giá để bơm tiền, hoặc **phát hành tín phiếu** để hút tiền | Theo dõi hằng ngày: bơm ròng hay hút ròng |
| **Dự trữ bắt buộc** | Tỷ lệ tiền gửi huy động mà ngân hàng phải gửi tại NHNN | Giảm tỷ lệ = giải phóng thêm vốn cho vay |
| **Chỉ tiêu tăng trưởng tín dụng** ("room") | NHNN giao hạn mức tăng dư nợ cho từng ngân hàng | Đặc thù Việt Nam: room rộng hay hẹp ảnh hưởng trực tiếp lợi nhuận ngân hàng |

Điểm khác biệt của Việt Nam so với nhiều nước là NHNN dùng cả **công cụ giá** (lãi suất) lẫn **công cụ lượng** (room tín dụng). Vì vậy, khi đọc tin, đừng chỉ nhìn lãi suất điều hành — hãy để ý cả tốc độ tăng tín dụng và thanh khoản liên ngân hàng. NHNN đang nghiên cứu lộ trình bỏ dần cơ chế giao room, nên hãy kiểm tra cơ chế đang áp dụng khi bạn đọc bài này.

## Fed và hiệu ứng lan toả

Cục Dự trữ Liên bang Mỹ (**Fed**) quyết định lãi suất qua Uỷ ban Thị trường Mở Liên bang (**FOMC**), họp định kỳ **8 lần mỗi năm** (khoảng 6 tuần một lần), có thể họp bất thường khi cần. Fed ảnh hưởng tới Việt Nam qua vài kênh:

- **Tỷ giá USD/VND:** lãi suất USD cao làm đồng USD hấp dẫn hơn, gây áp lực lên VND. NHNN khi đó phải cân nhắc giữa giữ lãi suất thấp để hỗ trợ tăng trưởng và ổn định tỷ giá.
- **Dòng vốn ngoại:** chênh lệch lãi suất thu hẹp có thể khiến nhà đầu tư nước ngoài bán ròng trên sàn Việt Nam.
- **Tâm lý toàn cầu:** quyết định của Fed thường làm thị trường thế giới biến động, và tâm lý đó lan sang VN-Index.

## Lãi suất và định giá: so sánh lợi suất lợi nhuận với lãi tiết kiệm

Cách đơn giản để thấy tác động là lấy nghịch đảo P/E — gọi là **lợi suất lợi nhuận (earnings yield)** = EPS / Giá = 1 / P/E.

*Ví dụ minh hoạ (số giả định, không phải số liệu thực tế):*

| Kịch bản | P/E thị trường | Lợi suất lợi nhuận | Lãi tiết kiệm 12 tháng | Chênh lệch |
|---|---|---|---|---|
| A | 12 | 8,3% | 5% | +3,3 điểm % |
| B | 12 | 8,3% | 8% | +0,3 điểm % |
| C | 10 | 10% | 8% | +2 điểm % |

Ở kịch bản B, cổ phiếu chỉ "trả" thêm 0,3 điểm % so với gửi ngân hàng gần như không rủi ro — phần bù quá mỏng, nên áp lực là giá phải giảm (P/E hạ xuống như C) để phần bù rủi ro trở lại hợp lý. Đây cũng là logic của mô hình DCF: **lãi suất cao hơn → tỷ lệ chiết khấu cao hơn → giá trị hiện tại của dòng tiền tương lai thấp hơn**, đặc biệt với cổ phiếu tăng trưởng có dòng tiền ở xa.

## Ngành nào nhạy với lãi suất?

Như chương **Đọc BCTC theo ngành** đã phân tích:

- **Ngân hàng:** lãi suất và room tín dụng quyết định tăng trưởng dư nợ, NIM và nợ xấu. Lãi suất giảm nhanh thường kéo theo chi phí vốn giảm trước, nhưng cũng có thể thu hẹp NIM nếu lãi cho vay giảm nhanh hơn.
- **Bất động sản:** chủ đầu tư vay nhiều, người mua nhà dùng vay mua nhà — lãi suất cao làm chậm bán hàng và tăng chi phí lãi vay vốn hoá.
- **Công ty chứng khoán:** thanh khoản thị trường và dư nợ margin thường tăng khi tiền rẻ, nên lợi nhuận môi giới và cho vay ký quỹ nhạy với chu kỳ lãi suất.
- **Doanh nghiệp vay nợ cao (thép, tiện ích...):** chi phí lãi vay ăn trực tiếp vào lợi nhuận.

## Thực hành

1. Vào website NHNN (sbv.gov.vn), tìm các mức lãi suất điều hành đang áp dụng và ngày quyết định gần nhất. Ghi lại để so sánh trong các bài sau.
2. Tính lợi suất lợi nhuận của VN-Index từ P/E bạn tra được, so với lãi tiết kiệm 12 tháng của một ngân hàng lớn. Chênh lệch đang rộng hay hẹp?
3. Tìm lịch họp FOMC năm nay trên federalreserve.gov và đánh dấu vào lịch của bạn.

## Nguồn tham khảo

- Lịch họp FOMC và FAQ của Fed: https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm — https://www.federalreserve.gov/faqs/about_12844.htm
- Luật Ngân hàng Nhà nước 2010, Chương III (Điều 10–15: công cụ chính sách tiền tệ): https://hethongphapluat.com/luat-ngan-hang-nha-nuoc-viet-nam-2010/chuong-3
- Website Ngân hàng Nhà nước Việt Nam: https://www.sbv.gov.vn`,
        questions: [
          {
            prompt: 'Khi NHNN phát hành tín phiếu qua nghiệp vụ thị trường mở, mục đích chính thường là gì?',
            options: [
              'Hút bớt tiền từ hệ thống ngân hàng',
              'Bơm thêm tiền cho các ngân hàng thiếu vốn',
              'Cấp thêm room tín dụng cho ngân hàng',
              'Tăng giá trị VND so với vàng',
            ],
            correct_index: 0,
            explanation:
              'Phát hành tín phiếu là NHNN "bán" giấy tờ có giá để thu tiền về, tức hút thanh khoản. Ngược lại, mua có kỳ hạn giấy tờ có giá là bơm tiền ra. Room tín dụng là công cụ riêng, không liên quan đến OMO.',
          },
          {
            prompt:
              'Ví dụ minh hoạ: P/E thị trường là 12 và lãi tiết kiệm 12 tháng tăng từ 5% lên 8%. Nhận định nào hợp lý nhất?',
            options: [
              'Cổ phiếu hấp dẫn hơn vì lãi suất cao nghĩa là kinh tế mạnh',
              'Phần bù của cổ phiếu so với tiết kiệm thu hẹp từ khoảng 3,3 xuống 0,3 điểm %, tạo áp lực lên P/E',
              'Không ảnh hưởng gì vì P/E chỉ phụ thuộc vào lợi nhuận doanh nghiệp',
              'Lợi suất lợi nhuận tự động tăng lên 11%',
            ],
            correct_index: 1,
            explanation:
              'Lợi suất lợi nhuận = 1/12 ≈ 8,3%. So với 5% thì phần bù ~3,3 điểm %, so với 8% chỉ còn ~0,3 điểm %. Phần bù quá mỏng khiến nhà đầu tư đòi giá thấp hơn, tức P/E chịu áp lực giảm.',
          },
          {
            prompt: 'FOMC của Fed họp định kỳ bao nhiêu lần mỗi năm?',
            options: ['4 lần', '12 lần', '8 lần, ngoài ra có thể họp bất thường', 'Chỉ họp khi có khủng hoảng'],
            correct_index: 2,
            explanation:
              'Theo Fed, FOMC có 8 cuộc họp định kỳ mỗi năm (khoảng 6 tuần/lần) và có thể họp bất thường khi cần.',
          },
          {
            prompt: 'Vì sao lãi suất USD tăng mạnh có thể gây áp lực lên thị trường chứng khoán Việt Nam?',
            options: [
              'Vì Fed trực tiếp quyết định lãi suất tái cấp vốn của NHNN',
              'Vì doanh nghiệp Việt Nam bắt buộc phải vay bằng USD',
              'Vì sàn HOSE giao dịch bằng USD',
              'Vì nó gây sức ép lên tỷ giá USD/VND và có thể khiến khối ngoại bán ròng',
            ],
            correct_index: 3,
            explanation:
              'Fed không điều hành NHNN, nhưng lãi suất USD cao làm USD hấp dẫn hơn, gây áp lực tỷ giá và dòng vốn ngoại — hai kênh lan toả chính tới VN-Index.',
          },
        ],
      },
      {
        slug: 'lam-phat-va-ty-gia',
        title: 'Lạm phát và tỷ giá',
        summary:
          'CPI, lãi suất thực và danh nghĩa, USD/VND và chỉ số DXY, cách NHNN quản lý tỷ giá, ai hưởng lợi và ai chịu thiệt khi tỷ giá biến động.',
        content_md: `## Lạm phát là gì và đo bằng gì?

**Lạm phát** là tốc độ tăng chung của mặt bằng giá. Ở Việt Nam, thước đo phổ biến nhất là **chỉ số giá tiêu dùng (CPI)** do Cục Thống kê (trước đây là Tổng cục Thống kê, từ 01/3/2025 thuộc Bộ Tài chính) công bố hằng tháng. Từ tháng 8/2024, CPI và báo cáo kinh tế - xã hội được công bố vào **ngày 6 của tháng kế tiếp**.

Khi đọc CPI, hãy phân biệt:

- **So với tháng trước (MoM):** nhạy, dễ nhiễu bởi mùa vụ (Tết, giá xăng, học phí...).
- **So với cùng kỳ năm trước (YoY):** con số hay được so với mục tiêu lạm phát của Quốc hội.
- **Bình quân từ đầu năm:** dùng để đánh giá mục tiêu cả năm.
- **Lạm phát cơ bản:** loại trừ lương thực, thực phẩm tươi sống, năng lượng và mặt hàng do Nhà nước quản lý giá (gồm dịch vụ y tế, giáo dục) — phản ánh xu hướng nền tốt hơn.

## Lãi suất danh nghĩa và lãi suất thực

**Lãi suất thực ≈ lãi suất danh nghĩa − lạm phát.** Đây là con số thật sự quyết định tiền của bạn mạnh lên hay yếu đi.

*Ví dụ minh hoạ (số giả định):*

| | Lãi tiết kiệm | Lạm phát | Lãi suất thực |
|---|---|---|---|
| Kịch bản 1 | 6% | 3% | khoảng +3% |
| Kịch bản 2 | 6% | 7% | khoảng −1% |

Ở kịch bản 2, gửi tiết kiệm thực chất làm bạn **mất sức mua**. Lãi suất thực âm thường đẩy tiền sang tài sản khác (vàng, bất động sản, cổ phiếu) — nhưng nó cũng là lý do ngân hàng trung ương có động lực **tăng lãi suất**.

## Vì sao lạm phát tăng thường gây áp lực lên P/E?

1. **Lãi suất có xu hướng tăng theo** để kiềm chế lạm phát → tỷ lệ chiết khấu cao hơn → P/E hợp lý thấp hơn (xem bài trước).
2. **Biên lợi nhuận bị bóp** nếu doanh nghiệp không chuyển kịp chi phí nguyên liệu, lương sang giá bán.
3. **Chất lượng lợi nhuận kém đi:** lợi nhuận danh nghĩa tăng nhưng phần lớn là do giá, không phải sản lượng; nhu cầu vốn lưu động cũng tăng.
4. **Bất định cao hơn** → nhà đầu tư đòi phần bù rủi ro lớn hơn.

Ngược lại, doanh nghiệp có **sức mạnh định giá** (thương hiệu mạnh, vị thế độc quyền) chống chịu lạm phát tốt hơn.

## Tỷ giá USD/VND và DXY

- **USD/VND** là số đồng cần để mua 1 USD. Con số tăng = VND mất giá.
- **DXY** là chỉ số đo sức mạnh của USD so với một rổ đồng tiền lớn (EUR chiếm tỷ trọng lớn nhất). DXY tăng mạnh thường đi kèm áp lực lên hầu hết các đồng tiền mới nổi, trong đó có VND.

**NHNN quản lý tỷ giá thế nào?** NHNN công bố **tỷ giá trung tâm** hằng ngày; ngân hàng thương mại được giao dịch trong **biên độ ±5%** quanh tỷ giá trung tâm (biên độ này được nới từ ±3% lên ±5% vào tháng 10/2022). Khi áp lực lớn, NHNN có thể bán ngoại tệ từ dự trữ, điều chỉnh lãi suất hoặc hút thanh khoản VND để hỗ trợ tỷ giá — đây là lý do tỷ giá và lãi suất trong nước gắn chặt với nhau.

## Ai hưởng lợi, ai chịu thiệt khi VND mất giá?

| Nhóm doanh nghiệp | Tác động thường thấy |
|---|---|
| **Xuất khẩu** (dệt may, thuỷ sản, gỗ) có doanh thu USD, chi phí VND | Thường có lợi: doanh thu quy đổi tăng |
| **Nhập khẩu nguyên liệu** (thép dùng quặng/than nhập, nhựa, dược, thức ăn chăn nuôi) | Chi phí đầu vào tăng, biên bị ép |
| **Có nợ vay ngoại tệ** (điện, hàng không, một số tập đoàn lớn) | Lỗ chênh lệch tỷ giá khi đánh giá lại nợ, chi phí trả nợ tăng |
| **Bán hàng trong nước, chi phí VND** | Ít ảnh hưởng trực tiếp, nhưng chịu tác động qua lạm phát và lãi suất |

Lưu ý thực tế: nhiều doanh nghiệp vừa xuất vừa nhập (gia công), nên tác động ròng nhỏ hơn bạn nghĩ. Hãy xem **thuyết minh BCTC** — mục rủi ro tỷ giá và cơ cấu nợ theo loại tiền — thay vì đoán.

## Thực hành

1. Mở báo cáo CPI tháng gần nhất trên nso.gov.vn và ghi lại: CPI so với cùng kỳ, CPI bình quân từ đầu năm và lạm phát cơ bản.
2. Lấy lãi tiết kiệm 12 tháng của một ngân hàng lớn, trừ đi CPI so với cùng kỳ: lãi suất thực đang dương hay âm?
3. Chọn một doanh nghiệp xuất khẩu và một doanh nghiệp có nợ USD lớn. Trong thuyết minh BCTC, tìm khoản lãi/lỗ chênh lệch tỷ giá năm gần nhất.

## Nguồn tham khảo

- Cục Thống kê — thay đổi thời gian công bố CPI, GDP: https://www.nso.gov.vn/su-kien/2024/06/thay-doi-thoi-gian-cong-bo-so-lieu-cpi-gdp-grdp/
- Biên độ tỷ giá ±5% (Tuổi Trẻ News, 10/2022): https://news.tuoitre.vn/vietnams-central-bank-widens-usd-vnd-exchange-rate-band-to-5-percent-10369617.htm
- Tỷ giá trung tâm hằng ngày: https://www.sbv.gov.vn`,
        questions: [
          {
            prompt: 'Lãi tiết kiệm 6%/năm, lạm phát 7%/năm (số minh hoạ). Lãi suất thực xấp xỉ bao nhiêu?',
            options: ['+13%', '−1%', '+1%', '+6% vì lạm phát không liên quan đến tiền gửi'],
            correct_index: 1,
            explanation: 'Lãi suất thực ≈ danh nghĩa − lạm phát = 6% − 7% = −1%. Người gửi tiết kiệm đang mất sức mua.',
          },
          {
            prompt: 'Khi VND mất giá mạnh so với USD, nhóm nào thường chịu bất lợi trực tiếp nhất?',
            options: [
              'Doanh nghiệp xuất khẩu thuỷ sản có doanh thu chủ yếu bằng USD',
              'Doanh nghiệp bán lẻ chỉ dùng hàng nội địa',
              'Doanh nghiệp có nợ vay USD lớn và doanh thu bằng VND',
              'Người đang giữ tiền gửi USD',
            ],
            correct_index: 2,
            explanation:
              'Nợ USD được đánh giá lại cao hơn khi quy ra VND, trong khi doanh thu VND không tăng tương ứng — dẫn tới lỗ tỷ giá và chi phí trả nợ tăng. Nhà xuất khẩu và người giữ USD thường có lợi.',
          },
          {
            prompt: 'Lý do nào KHÔNG giải thích vì sao lạm phát tăng thường gây áp lực lên P/E?',
            options: [
              'Lãi suất có xu hướng tăng theo, làm tăng tỷ lệ chiết khấu',
              'Biên lợi nhuận có thể bị bóp do chi phí tăng nhanh hơn giá bán',
              'Bất định cao hơn khiến nhà đầu tư đòi phần bù rủi ro lớn hơn',
              'Lạm phát luôn làm số cổ phiếu lưu hành giảm đi',
            ],
            correct_index: 3,
            explanation:
              'Ba lý do đầu đều đúng. Lạm phát không có cơ chế nào làm số cổ phiếu lưu hành giảm — đáp án đó không liên quan.',
          },
          {
            prompt:
              'Theo cơ chế hiện hành (áp dụng từ 10/2022), ngân hàng thương mại được giao dịch USD/VND trong phạm vi nào?',
            options: [
              '±5% quanh tỷ giá trung tâm do NHNN công bố hằng ngày',
              'Tự do hoàn toàn theo cung cầu, NHNN không can thiệp',
              'Cố định một mức suốt cả năm',
              '±0,5% quanh chỉ số DXY',
            ],
            correct_index: 0,
            explanation:
              'NHNN công bố tỷ giá trung tâm mỗi ngày và nới biên độ từ ±3% lên ±5% vào tháng 10/2022. DXY là chỉ số sức mạnh USD, không phải mốc tính biên độ.',
          },
        ],
      },
      {
        slug: 'tang-truong-tin-dung-va-tai-khoa',
        title: 'Tăng trưởng, tín dụng và chính sách tài khoá',
        summary:
          'Các thành phần của GDP, PMI, tăng trưởng tín dụng, giải ngân đầu tư công, FDI, xuất khẩu; chỉ báo dẫn dắt và trễ; bảng theo dõi vĩ mô Việt Nam và nơi lấy số liệu.',
        content_md: `## GDP được tạo thành từ đâu?

**GDP** là tổng giá trị hàng hoá, dịch vụ cuối cùng một nền kinh tế tạo ra. Theo phương pháp chi tiêu:

**GDP = C + I + G + (X − M)**

| Thành phần | Ý nghĩa | Ở Việt Nam, theo dõi qua |
|---|---|---|
| **C** — Tiêu dùng | Hộ gia đình chi tiêu | Tổng mức bán lẻ hàng hoá và dịch vụ |
| **I** — Đầu tư | Doanh nghiệp, nhà nước đầu tư tài sản | Vốn đầu tư toàn xã hội, FDI giải ngân |
| **G** — Chi tiêu chính phủ | Chi thường xuyên và đầu tư công | Giải ngân vốn đầu tư công |
| **X − M** — Xuất khẩu ròng | Bán ra nước ngoài trừ mua vào | Số liệu xuất nhập khẩu hằng tháng |

Việt Nam là nền kinh tế **rất mở**: tổng kim ngạch xuất nhập khẩu lớn so với GDP, nên nhu cầu của các thị trường lớn như Mỹ, Trung Quốc, EU có ảnh hưởng mạnh tới tăng trưởng trong nước.

## PMI — chỉ báo sớm về sản xuất

**PMI (Chỉ số Nhà quản trị mua hàng)** ngành sản xuất Việt Nam do **S&P Global** công bố, thường vào ngày làm việc đầu tiên của tháng. Đây là chỉ số khuếch tán xây dựng từ khảo sát doanh nghiệp:

- Mỗi biến số = % trả lời "cao hơn" + một nửa % trả lời "không đổi", sau đó điều chỉnh mùa vụ.
- PMI tổng hợp là bình quân có trọng số: **đơn đặt hàng mới 30%, sản lượng 25%, việc làm 20%, thời gian giao hàng của nhà cung cấp 15%** (tính ngược chiều), **tồn kho hàng mua 10%**.
- **Trên 50** = điều kiện kinh doanh cải thiện so với tháng trước; **dưới 50** = suy giảm; khoảng cách so với 50 cho biết mức độ.

Lưu ý: PMI so với **tháng trước**, nên PMI 49 sau nhiều tháng 52 nghĩa là bắt đầu suy giảm nhẹ, chưa phải sản xuất "sụp đổ".

## Tín dụng, đầu tư công và FDI

- **Tăng trưởng tín dụng:** kinh tế Việt Nam phụ thuộc nhiều vào vốn ngân hàng (thị trường trái phiếu doanh nghiệp còn nhỏ), nên tốc độ tăng dư nợ là "mạch máu" của tăng trưởng. NHNN công bố định hướng cả năm và cập nhật số thực hiện định kỳ.
- **Giải ngân đầu tư công:** Bộ Tài chính công bố tiến độ giải ngân. Giải ngân nhanh hỗ trợ trực tiếp nhóm **xây dựng hạ tầng, vật liệu (thép, xi măng, đá, nhựa đường)**.
- **FDI:** phân biệt **vốn đăng ký** (cam kết, dễ biến động) với **vốn thực hiện/giải ngân** (tiền thật đã vào). FDI kéo theo nhu cầu đất khu công nghiệp, xuất khẩu và việc làm.
- **Xuất khẩu:** số liệu hằng tháng; đơn hàng xuất khẩu mới trong PMI là tín hiệu sớm hơn.

## Chỉ báo dẫn dắt, trùng khớp và trễ

| Loại | Ví dụ | Dùng để |
|---|---|---|
| **Dẫn dắt (leading)** | PMI đơn hàng mới, vốn FDI đăng ký, giá cổ phiếu | Dự cảm hướng đi vài tháng tới |
| **Trùng khớp (coincident)** | Chỉ số sản xuất công nghiệp (IIP), doanh số bán lẻ, GDP quý (dù công bố sau khi quý kết thúc) | Xác nhận tình trạng hiện tại |
| **Trễ (lagging)** | Tỷ lệ thất nghiệp, nợ xấu ngân hàng, lạm phát cơ bản | Xác nhận điều đã xảy ra |

Một sai lầm phổ biến: bán cổ phiếu vì **GDP quý vừa công bố thấp**. Nhưng GDP chỉ cho biết quý vừa qua đã diễn ra thế nào và được công bố sau khi quý kết thúc — thị trường thường đã phản ánh điều đó từ trước.

## Bảng theo dõi vĩ mô Việt Nam: lấy số liệu ở đâu?

| Nhóm | Nguồn | Tần suất |
|---|---|---|
| CPI, GDP, IIP, bán lẻ, xuất nhập khẩu, FDI | **Cục Thống kê** — nso.gov.vn (báo cáo kinh tế - xã hội ngày 6 tháng sau) | Tháng / quý |
| Lãi suất điều hành, tỷ giá trung tâm, tín dụng | **Ngân hàng Nhà nước** — sbv.gov.vn | Ngày / định kỳ |
| Thu chi ngân sách, giải ngân đầu tư công, trái phiếu Chính phủ | **Bộ Tài chính** — mof.gov.vn | Tháng |
| PMI ngành sản xuất | **S&P Global** — pmi.spglobal.com | Tháng |

Bạn không cần theo dõi tất cả. Một bảng 8–10 chỉ số, cập nhật mỗi tháng một lần, là đủ cho nhà đầu tư cá nhân.

## Thực hành

Lập một bảng tính với các cột: Chỉ số, Nguồn, Kỳ gần nhất, Giá trị, Kỳ trước, Xu hướng (lên/xuống/đi ngang). Điền ít nhất: PMI, CPI so với cùng kỳ, tăng trưởng tín dụng từ đầu năm, giải ngân đầu tư công, xuất khẩu, FDI thực hiện. Đánh dấu chỉ số nào là dẫn dắt, chỉ số nào là trễ.

## Nguồn tham khảo

- Lịch công bố PMI (S&P Global; phương pháp nêu trong từng bản tin PMI Việt Nam): https://www.pmi.spglobal.com/Public/Release/ReleaseDates
- Lịch công bố số liệu của Cục Thống kê: https://www.nso.gov.vn/su-kien/2024/06/thay-doi-thoi-gian-cong-bo-so-lieu-cpi-gdp-grdp/
- Cục Thống kê thuộc Bộ Tài chính (chức năng, nhiệm vụ theo QĐ 384/QĐ-BTC): https://www.nso.gov.vn/gioi-thieu/chuc-nang-nhiem-vu/`,
        questions: [
          {
            prompt: 'PMI ngành sản xuất ở mức 48,5. Cách hiểu đúng là gì?',
            options: [
              'Sản lượng đã giảm 51,5% so với năm trước',
              'Điều kiện kinh doanh nhìn chung kém đi so với tháng trước',
              'GDP quý này chắc chắn tăng trưởng âm',
              'Chỉ 48,5% doanh nghiệp còn hoạt động',
            ],
            correct_index: 1,
            explanation:
              'PMI là chỉ số khuếch tán, mốc 50 = không đổi so với tháng trước. Dưới 50 là suy giảm, nhưng nó không đo phần trăm thay đổi sản lượng và không đủ để kết luận về GDP.',
          },
          {
            prompt: 'Chỉ số nào sau đây là chỉ báo TRỄ (lagging)?',
            options: [
              'Đơn đặt hàng mới trong PMI',
              'Vốn FDI đăng ký mới',
              'Tỷ lệ nợ xấu của ngân hàng',
              'Giá cổ phiếu',
            ],
            correct_index: 2,
            explanation:
              'Nợ xấu thường chỉ tăng sau khi kinh tế đã yếu đi một thời gian, nên là chỉ báo trễ. Ba lựa chọn còn lại phản ánh kỳ vọng hoặc kế hoạch tương lai — là chỉ báo dẫn dắt.',
          },
          {
            prompt: 'Giải ngân đầu tư công tăng tốc thường hỗ trợ trực tiếp nhóm ngành nào?',
            options: [
              'Xây dựng hạ tầng và vật liệu xây dựng như thép, xi măng, đá',
              'Bảo hiểm nhân thọ',
              'Phần mềm xuất khẩu',
              'Bán lẻ dược phẩm',
            ],
            correct_index: 0,
            explanation:
              'Vốn đầu tư công chủ yếu đi vào đường sá, cầu cảng... nên doanh nghiệp xây lắp và vật liệu xây dựng hưởng lợi trực tiếp nhất.',
          },
          {
            prompt: 'Khi theo dõi FDI, vì sao nên chú ý vốn thực hiện hơn vốn đăng ký?',
            options: [
              'Vì vốn đăng ký luôn bằng 0',
              'Vì vốn thực hiện được công bố trước vốn đăng ký vài năm',
              'Vì vốn đăng ký chỉ tính doanh nghiệp trong nước',
              'Vì vốn thực hiện là tiền đã thực sự giải ngân, còn vốn đăng ký chỉ là cam kết và dễ biến động',
            ],
            correct_index: 3,
            explanation:
              'Vốn đăng ký có thể bị điều chỉnh hoặc không thực hiện; vốn thực hiện phản ánh dòng tiền thật đã vào nền kinh tế.',
          },
        ],
      },
      {
        slug: 'chu-ky-kinh-te-va-luan-chuyen-nganh',
        title: 'Chu kỳ kinh tế và luân chuyển ngành',
        summary:
          'Bốn giai đoạn của chu kỳ kinh tế, nhóm ngành thường dẫn dắt ở từng giai đoạn, vì sao thị trường chứng khoán đi trước nền kinh tế — và những giới hạn của mô hình.',
        content_md: `## Chu kỳ kinh tế là gì?

Nền kinh tế không tăng trưởng theo đường thẳng mà đi theo **chu kỳ**: mở rộng, đạt đỉnh, co lại, chạm đáy rồi mở rộng trở lại. Cơ quan định ngày chu kỳ của Mỹ (NBER) mô tả: giai đoạn **mở rộng** đi từ **đáy** tới **đỉnh**, còn **suy thoái** đi từ **đỉnh** tới **đáy**; suy thoái là "sự sụt giảm đáng kể của hoạt động kinh tế, lan rộng khắp nền kinh tế và kéo dài hơn vài tháng".

| Giai đoạn | Đặc điểm thường thấy | Lãi suất và tín dụng |
|---|---|---|
| **Phục hồi / đầu chu kỳ** (sau đáy) | Tăng trưởng bật lại, lợi nhuận cải thiện nhanh từ nền thấp | Lãi suất thấp, tín dụng nới lỏng |
| **Mở rộng / giữa chu kỳ** | Tăng trưởng ổn định, thường là giai đoạn dài nhất | Chính sách dần trung tính |
| **Đỉnh / cuối chu kỳ** | Tăng trưởng chậm lại, lạm phát tăng, thị trường lao động căng | Lãi suất được nâng lên |
| **Co lại / suy thoái** | Sản lượng, lợi nhuận giảm; nợ xấu tăng | Chính sách bắt đầu nới lỏng trở lại |

## Ngành nào thường dẫn dắt ở giai đoạn nào?

Các nghiên cứu như "Business Cycle Approach to Sector Investing" của Fidelity (dữ liệu Mỹ từ 1962) cho thấy xu hướng lịch sử sau — **xu hướng, không phải quy luật**:

| Giai đoạn | Nhóm thường làm tốt | Lý do |
|---|---|---|
| **Đầu chu kỳ** | **Tài chính** (ngân hàng, chứng khoán), **bất động sản**, **tiêu dùng không thiết yếu** | Hưởng lợi trực tiếp từ lãi suất thấp và tín dụng mở |
| **Giữa chu kỳ** | Công nghệ thông tin; ít nhóm vượt trội rõ rệt | Tăng trưởng đều, cạnh tranh dựa vào chất lượng doanh nghiệp |
| **Cuối chu kỳ** | **Năng lượng, nguyên vật liệu** (thép, hoá chất), sau đó là phòng thủ | Giá hàng hoá thường cao khi cầu căng |
| **Suy thoái** | **Phòng thủ**: tiện ích (điện, nước), **tiêu dùng thiết yếu**, **y tế** | Nhu cầu ít phụ thuộc chu kỳ, dòng tiền ổn định |

Liên hệ với chương **Đọc BCTC theo ngành**: ngân hàng và công ty chứng khoán nhạy với lãi suất và thanh khoản; bất động sản nhạy với tín dụng; **thép** là ví dụ điển hình của ngành chu kỳ — lợi nhuận phóng đại cả khi lên lẫn khi xuống, và P/E thấp nhất thường xuất hiện **gần đỉnh lợi nhuận**, không phải lúc rẻ nhất.

## Thị trường chứng khoán đi trước nền kinh tế

Giá cổ phiếu phản ánh **kỳ vọng** về lợi nhuận tương lai, nên thị trường thường:

- **Tạo đáy trước** khi số liệu kinh tế xấu nhất được công bố — lúc tin tức còn rất tệ.
- **Tạo đỉnh trước** khi tăng trưởng chậm lại thể hiện rõ trên GDP — lúc tin tức vẫn còn tốt.

Vì vậy, nếu bạn chờ GDP xác nhận phục hồi mới mua ngân hàng, bất động sản, có thể phần lớn đợt tăng đã qua. Ngược lại, bán khi "tin xấu nhất" công bố thường là bán gần đáy.

## Những giới hạn cần nhớ

1. **Chu kỳ không tuyến tính:** Fidelity cũng lưu ý có chu kỳ bỏ qua một giai đoạn hoặc quay lại giai đoạn trước. Bạn chỉ biết chắc đỉnh, đáy **sau khi** nó đã qua.
2. **Việt Nam có đặc thù riêng:** chính sách room tín dụng, đầu tư công, xuất khẩu và dòng vốn ngoại có thể làm chu kỳ ngành lệch khỏi khuôn mẫu Mỹ. Ví dụ, chu kỳ bất động sản gắn chặt với pháp lý dự án và thị trường trái phiếu doanh nghiệp.
3. **Định giá xuất phát quan trọng:** một ngành "đúng giai đoạn" nhưng đã được định giá quá cao vẫn có thể cho kết quả kém.
4. **Doanh nghiệp khác ngành:** trong cùng ngành, doanh nghiệp tốt và kém có thể đi ngược nhau.

## Thực hành

1. Dựa trên bảng theo dõi vĩ mô bạn lập ở bài trước (PMI, tín dụng, lãi suất, lạm phát), hãy thử đặt nền kinh tế vào một trong bốn giai đoạn và ghi lại lý do. Nếu các chỉ số mâu thuẫn, ghi rõ điều đó.
2. Trên tab **Thị trường › CK Việt Nam**, so sánh biểu đồ VN-Index trong một giai đoạn suy giảm kinh tế trước đây với thời điểm số liệu GDP xấu nhất được công bố. Giá tạo đáy trước hay sau?

## Nguồn tham khảo

- NBER — Business Cycle Dating: https://www.nber.org/research/business-cycle-dating
- Fidelity — The business cycle approach to sector investing: https://institutional.fidelity.com/advisors/insights/spotlights/sector-investing
- Fidelity — Sector investing and the business cycle (ngành dẫn dắt theo từng giai đoạn): https://www.fidelity.com/viewpoints/investing-ideas/sector-investing-business-cycle`,
        questions: [
          {
            prompt: 'Theo xu hướng lịch sử, nhóm ngành nào thường hưởng lợi nhiều nhất ở giai đoạn ĐẦU chu kỳ?',
            options: [
              'Tiện ích như điện, nước',
              'Tiêu dùng thiết yếu',
              'Y tế',
              'Tài chính, bất động sản và tiêu dùng không thiết yếu',
            ],
            correct_index: 3,
            explanation:
              'Đầu chu kỳ, lãi suất thấp và tín dụng nới lỏng hỗ trợ mạnh nhất cho tài chính, bất động sản và tiêu dùng không thiết yếu. Ba nhóm còn lại là phòng thủ, thường làm tốt ở cuối chu kỳ và suy thoái.',
          },
          {
            prompt: 'Vì sao thị trường chứng khoán thường tạo đáy TRƯỚC khi số liệu kinh tế xấu nhất được công bố?',
            options: [
              'Vì giá cổ phiếu phản ánh kỳ vọng lợi nhuận tương lai, trong khi GDP phản ánh quý đã qua và được công bố muộn',
              'Vì sở giao dịch được biết trước số liệu GDP',
              'Vì doanh nghiệp niêm yết không chịu ảnh hưởng của suy thoái',
              'Vì luật quy định thị trường phải tăng khi GDP giảm',
            ],
            correct_index: 0,
            explanation:
              'Nhà đầu tư nhìn về phía trước. Khi họ tin điều tồi tệ nhất sắp qua, giá bắt đầu tăng dù số liệu (phản ánh quá khứ) vẫn đang xấu.',
          },
          {
            prompt:
              'Một cổ phiếu thép có P/E rất thấp khi lợi nhuận đang ở mức kỷ lục. Theo bài học, điều này nên được hiểu thế nào?',
            options: [
              'Chắc chắn là cơ hội mua vì P/E thấp luôn là rẻ',
              'Có thể là dấu hiệu gần đỉnh chu kỳ lợi nhuận — cần cẩn trọng thay vì coi là rẻ',
              'P/E không áp dụng được cho ngành thép',
              'Đây là giai đoạn suy thoái nên nhóm phòng thủ sẽ tăng',
            ],
            correct_index: 1,
            explanation:
              'Với ngành chu kỳ, lợi nhuận đỉnh làm P/E trông thấp; khi chu kỳ đảo chiều, lợi nhuận giảm mạnh và P/E "thật" cao hơn nhiều. P/E thấp gần đỉnh lợi nhuận là cái bẫy kinh điển.',
          },
          {
            prompt: 'Nhận định nào phản ánh ĐÚNG giới hạn của mô hình luân chuyển ngành?',
            options: [
              'Mô hình cho biết chính xác ngày đỉnh và đáy chu kỳ',
              'Mô hình áp dụng y hệt cho mọi quốc gia',
              'Chu kỳ có thể bỏ qua hoặc quay lại giai đoạn, và định giá xuất phát vẫn quyết định kết quả',
              'Chỉ cần chọn đúng giai đoạn thì mọi cổ phiếu trong ngành đều tăng',
            ],
            correct_index: 2,
            explanation:
              'Mô hình mô tả xu hướng lịch sử, không dự báo chính xác. Chu kỳ không tuyến tính, mỗi nước có đặc thù, và một ngành "đúng giai đoạn" nhưng định giá quá cao vẫn có thể cho kết quả kém.',
          },
        ],
      },
      {
        slug: 'doc-lich-vi-mo',
        title: 'Đọc lịch vĩ mô',
        summary:
          'Những sự kiện vĩ mô quan trọng trong nước và quốc tế, cách so sánh kỳ vọng với thực tế, phản ứng của thị trường và cách tránh giao dịch quá nhiều theo tin.',
        content_md: `## Lịch vĩ mô là gì?

**Lịch vĩ mô (economic calendar)** liệt kê thời điểm công bố các số liệu và quyết định chính sách sắp tới, kèm **kỳ vọng (dự báo đồng thuận)** của giới phân tích và **kết quả thực tế** sau khi công bố. Mục tiêu của bạn không phải là giao dịch theo từng tin, mà là **biết trước khi nào thị trường có thể biến động mạnh** để không bị bất ngờ.

## Các sự kiện cần biết

| Sự kiện | Đơn vị công bố | Thời điểm thông thường |
|---|---|---|
| **Báo cáo kinh tế - xã hội tháng** (CPI, IIP, bán lẻ, xuất nhập khẩu, FDI) | Cục Thống kê Việt Nam | Ngày 6 tháng kế tiếp |
| **GDP quý** | Cục Thống kê Việt Nam | Ngày 6 tháng đầu quý sau |
| **PMI ngành sản xuất Việt Nam** | S&P Global | Ngày làm việc đầu tiên của tháng |
| **Quyết định lãi suất, room tín dụng, tỷ giá trung tâm** | Ngân hàng Nhà nước | Không có lịch cố định; tỷ giá trung tâm mỗi ngày |
| **CPI Mỹ** | Cục Thống kê Lao động Mỹ (BLS) | Hằng tháng, theo lịch BLS |
| **Báo cáo việc làm Mỹ (NFP)** | BLS — Employment Situation | Hằng tháng, thường thứ Sáu đầu tháng, 8:30 sáng giờ miền Đông Mỹ |
| **Quyết định lãi suất của Fed (FOMC)** | Fed | 8 cuộc họp định kỳ mỗi năm; biên bản công bố khoảng 3 tuần sau |

Lưu ý: các mốc trên có thể thay đổi — luôn kiểm tra lịch chính thức của từng cơ quan. Với sự kiện Mỹ, nhớ quy đổi múi giờ: tin công bố buổi tối/đêm giờ Việt Nam thường thể hiện lên VN-Index vào phiên **sáng hôm sau**.

## Kỳ vọng quan trọng hơn con số

Thị trường phản ứng với **phần bất ngờ** (thực tế − kỳ vọng), không phải với con số tuyệt đối.

*Ví dụ minh hoạ (số giả định):*

| Tình huống | Kỳ vọng CPI Mỹ (YoY) | Thực tế | Phản ứng thường thấy |
|---|---|---|---|
| A | 3,0% | 3,0% | Ít biến động — đã được phản ánh |
| B | 3,0% | 3,4% | Lo ngại Fed thắt chặt hơn → cổ phiếu chịu áp lực, USD mạnh lên |
| C | 3,0% | 2,6% | Kỳ vọng Fed nới lỏng → tài sản rủi ro thường được hỗ trợ |

Thậm chí, "tin tốt" có thể làm giá giảm: một báo cáo việc làm quá mạnh có thể khiến thị trường lo lãi suất cao kéo dài. Ngoài con số chính, hãy xem các chi tiết đi kèm (điều chỉnh số tháng trước, lạm phát cơ bản, giọng điệu trong tuyên bố của Fed).

## Cách đọc phản ứng thị trường

1. **Phản ứng đầu tiên thường quá đà**, nhất là trong vài phút/giờ đầu khi thanh khoản mỏng.
2. **Xu hướng sau đó** mới cho biết thị trường thực sự thay đổi quan điểm hay không.
3. **Một tin hiếm khi đổi xu hướng dài hạn**; chuỗi số liệu cùng chiều qua nhiều tháng mới có ý nghĩa.

## Tránh giao dịch quá nhiều theo tin

- **Không đặt lệnh "đoán" kết quả** ngay trước giờ công bố — bạn đang đặt cược vào phần bất ngờ mà không ai biết.
- **Lên kế hoạch trước:** nếu số liệu lệch kỳ vọng nhiều, bạn sẽ làm gì (hoặc không làm gì)? Quyết định khi bình tĩnh, không phải khi biểu đồ đang nhảy múa.
- **Tôn trọng chi phí:** mỗi lần mua bán đều tốn phí và thuế; giao dịch theo tin nhiều lần dễ bào mòn lợi nhuận.
- **Phân biệt nhà đầu tư và nhà giao dịch:** với nhà đầu tư dài hạn, lịch vĩ mô chủ yếu để hiểu bối cảnh và tránh mua đuổi lúc biến động, không phải để vào ra liên tục.
- **Ghi nhật ký:** sau mỗi sự kiện lớn, ghi lại kỳ vọng, thực tế và phản ứng của VN-Index. Sau vài tháng, bạn sẽ hiểu thị trường nhạy với tin nào.

## Thực hành

1. Lập lịch cho tháng tới gồm: ngày Cục Thống kê công bố báo cáo tháng, ngày công bố PMI Việt Nam, ngày công bố CPI Mỹ và NFP (tra trên bls.gov), và ngày họp FOMC gần nhất.
2. Với mỗi sự kiện, ghi lại kỳ vọng trước khi công bố (từ một lịch kinh tế bất kỳ), sau đó điền kết quả thực tế và phản ứng của VN-Index phiên kế tiếp.

## Nguồn tham khảo

- BLS — lịch công bố Employment Situation: https://www.bls.gov/schedule/news_release/empsit.htm
- Fed — lịch họp FOMC: https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
- Cục Thống kê — lịch công bố số liệu: https://www.nso.gov.vn/su-kien/2024/06/thay-doi-thoi-gian-cong-bo-so-lieu-cpi-gdp-grdp/`,
        questions: [
          {
            prompt: 'Kỳ vọng CPI là 3,0%, thực tế đúng 3,0% (số minh hoạ). Phản ứng hợp lý nhất của thị trường là gì?',
            options: [
              'Tăng rất mạnh vì lạm phát đúng kỳ vọng là tin tốt',
              'Giảm sàn vì lạm phát vẫn trên 2%',
              'Thường ít biến động vì thông tin đã được phản ánh vào giá',
              'Ngừng giao dịch để chờ Fed họp',
            ],
            correct_index: 2,
            explanation:
              'Thị trường phản ứng với phần bất ngờ. Khi thực tế khớp kỳ vọng, phần bất ngờ gần như bằng 0 nên biến động thường nhỏ.',
          },
          {
            prompt: 'Vì sao một báo cáo việc làm Mỹ rất mạnh đôi khi lại khiến cổ phiếu giảm?',
            options: [
              'Vì thị trường lo Fed giữ lãi suất cao lâu hơn',
              'Vì việc làm tăng luôn làm lợi nhuận doanh nghiệp giảm',
              'Vì BLS công bố sai số liệu',
              'Vì NFP chỉ đo việc làm trong nông nghiệp',
            ],
            correct_index: 0,
            explanation:
              'Thị trường lao động quá nóng có thể đẩy lạm phát và khiến Fed duy trì lãi suất cao, làm tăng tỷ lệ chiết khấu. NFP là việc làm phi nông nghiệp, không phải nông nghiệp.',
          },
          {
            prompt: 'Cách làm nào giúp tránh giao dịch quá nhiều theo tin?',
            options: [
              'Đặt lệnh mua lớn ngay trước giờ công bố để đón đầu',
              'Lên kế hoạch hành động trước sự kiện và chờ xu hướng sau phản ứng đầu tiên',
              'Bán toàn bộ danh mục trước mỗi cuộc họp FOMC',
              'Theo dõi biểu đồ từng phút và mua bán theo mọi biến động',
            ],
            correct_index: 1,
            explanation:
              'Quyết định trước khi tin ra giúp bạn không bị cảm xúc chi phối; phản ứng đầu tiên thường quá đà. Các lựa chọn khác đều là đặt cược hoặc giao dịch quá mức.',
          },
          {
            prompt: 'Tin vĩ mô Mỹ công bố vào buổi tối giờ Việt Nam thường thể hiện lên VN-Index khi nào?',
            options: [
              'Ngay lập tức, vì HOSE giao dịch 24/7',
              'Không bao giờ, vì VN-Index không liên quan đến Mỹ',
              'Sau một tháng, khi Cục Thống kê công bố số liệu',
              'Thường từ phiên giao dịch sáng hôm sau',
            ],
            correct_index: 3,
            explanation: 'HOSE đã đóng cửa vào buổi tối, nên tác động (nếu có) thường xuất hiện từ phiên kế tiếp.',
          },
        ],
      },
      {
        slug: 'dua-vi-mo-vao-quy-trinh-dau-tu',
        title: 'Đưa vĩ mô vào quy trình đầu tư',
        summary:
          'Top-down và bottom-up, tư duy theo kịch bản cơ sở/tích cực/tiêu cực, điều chỉnh tỷ trọng tiền mặt và ngành thay vì dự đoán, kèm checklist vĩ mô một trang.',
        content_md: `## Vĩ mô để làm gì — và không để làm gì?

Sau năm bài, bạn đã biết lãi suất, lạm phát, tỷ giá, tăng trưởng và chu kỳ ảnh hưởng thế nào đến cổ phiếu. Nhưng một sự thật quan trọng: **dự báo vĩ mô chính xác là rất khó**, kể cả với chuyên gia. Vì vậy, mục tiêu không phải là đoán đúng lãi suất quý sau, mà là:

- **Hiểu bối cảnh** để không mua đuổi ở nơi rủi ro đang tích tụ.
- **Chuẩn bị cho nhiều kịch bản** thay vì đặt cược vào một kịch bản.
- **Điều chỉnh mức độ rủi ro** (tiền mặt, tỷ trọng ngành) một cách từ từ, có kỷ luật.

## Top-down và bottom-up

| | **Top-down** (từ trên xuống) | **Bottom-up** (từ dưới lên) |
|---|---|---|
| Bắt đầu từ | Kinh tế → ngành → doanh nghiệp | Doanh nghiệp cụ thể |
| Câu hỏi chính | Bối cảnh nào thuận lợi cho ngành nào? | Doanh nghiệp này có tốt và rẻ không? |
| Điểm mạnh | Tránh ngành đang đi ngược gió | Tìm được doanh nghiệp xuất sắc bất kể chu kỳ |
| Điểm yếu | Dễ biến thành đoán vĩ mô | Có thể bỏ qua rủi ro hệ thống |

Cách thực tế cho nhà đầu tư cá nhân là **kết hợp**: dùng vĩ mô để chọn **mức độ rủi ro** và **ngành ưu tiên/thận trọng**, sau đó dùng phân tích cơ bản (BCTC, chỉ số, định giá) để chọn **doanh nghiệp cụ thể**.

## Tư duy theo kịch bản

Thay vì một dự báo, hãy viết **ba kịch bản** cho 6–12 tháng tới và hỏi: danh mục của tôi sẽ ra sao trong từng kịch bản?

*Ví dụ minh hoạ (không phải dự báo):*

| Kịch bản | Mô tả | Ngành có thể hưởng lợi | Ngành có thể chịu áp lực |
|---|---|---|---|
| **Cơ sở** | Tăng trưởng ổn định, lãi suất đi ngang | Doanh nghiệp tăng trưởng lợi nhuận đều | — |
| **Tích cực** | Tín dụng mở, đầu tư công tăng tốc, xuất khẩu phục hồi | Ngân hàng, chứng khoán, vật liệu xây dựng | Nhóm phòng thủ có thể tăng chậm hơn |
| **Tiêu cực** | Lạm phát tăng, áp lực tỷ giá, lãi suất tăng | Phòng thủ (tiện ích, thiết yếu), doanh nghiệp ít nợ, xuất khẩu | Bất động sản vay nhiều, doanh nghiệp nợ USD |

Mục tiêu không phải gán xác suất chính xác, mà là đảm bảo **không kịch bản nào làm danh mục bị tổn thương quá mức chịu đựng**.

## Điều chỉnh thay vì dự đoán

Vĩ mô nên tác động đến danh mục qua **những điều chỉnh vừa phải**, có giới hạn trước:

- **Tỷ trọng tiền mặt:** ví dụ đặt biên độ 10–30%; khi checklist cho thấy nhiều rủi ro, dịch về phía trên, khi bối cảnh thuận lợi, dịch về phía dưới. Không bao giờ "tất tay" theo một nhận định.
- **Tỷ trọng ngành:** nghiêng nhẹ (ví dụ thêm/bớt vài điểm %) thay vì dồn toàn bộ vào một ngành.
- **Chất lượng doanh nghiệp:** khi rủi ro vĩ mô tăng, ưu tiên doanh nghiệp ít nợ, dòng tiền tốt.
- **Tái cân bằng định kỳ** (xem chương Quản lý danh mục đầu tư) giúp kỷ luật, tránh phản ứng theo cảm xúc.

## Checklist vĩ mô một trang

Cập nhật mỗi tháng một lần, đánh giá từng dòng: **thuận lợi / trung tính / bất lợi**.

| Nhóm | Câu hỏi | Nguồn |
|---|---|---|
| Lãi suất | Lãi suất điều hành, lãi tiết kiệm đang tăng, giảm hay đi ngang? | NHNN, website ngân hàng |
| Định giá | Lợi suất lợi nhuận của VN-Index so với lãi tiết kiệm 12 tháng ra sao? | Dữ liệu thị trường |
| Lạm phát | CPI so với cùng kỳ và lạm phát cơ bản đi về đâu? | Cục Thống kê |
| Tỷ giá | USD/VND và DXY có áp lực lớn không? | NHNN, dữ liệu thị trường |
| Tăng trưởng | PMI trên hay dưới 50? Xuất khẩu, bán lẻ thế nào? | S&P Global, Cục Thống kê |
| Tín dụng & tài khoá | Tăng trưởng tín dụng, giải ngân đầu tư công so với kế hoạch? | NHNN, Bộ Tài chính |
| Quốc tế | Fed đang thắt chặt hay nới lỏng? Khối ngoại mua hay bán ròng? | Fed, dữ liệu sàn |
| Chu kỳ | Bối cảnh giống giai đoạn nào nhất? Các chỉ số có mâu thuẫn không? | Tổng hợp các dòng trên |

Kết luận của checklist chỉ nên dẫn tới **một trong ba hành động**: giữ nguyên, nghiêng nhẹ về phòng thủ, hoặc nghiêng nhẹ về chủ động.

## Thực hành

1. Mở tab **Thị trường › CK Việt Nam** trong ứng dụng, xem biểu đồ **VN-Index** và **VN30** trong 1–3 năm gần nhất. Đánh dấu các giai đoạn lãi suất tăng hoặc giảm mà bạn đã tìm hiểu, và quan sát chỉ số phản ứng ra sao.
2. Điền checklist một trang cho tháng này và viết ba kịch bản ngắn cho danh mục của bạn.
3. Ôn lại các bài **Chỉ số định giá: EPS, P/E và P/B** và **DCF — định giá bằng dòng tiền chiết khấu** để thấy lãi suất đi vào định giá ở đâu.

Bài học chỉ nhằm mục đích giáo dục, không phải khuyến nghị đầu tư.

## Nguồn tham khảo

- Fidelity — The business cycle approach to sector investing: https://institutional.fidelity.com/advisors/insights/spotlights/sector-investing
- NBER — Business Cycle Dating: https://www.nber.org/research/business-cycle-dating
- Website Ngân hàng Nhà nước Việt Nam: https://www.sbv.gov.vn`,
        questions: [
          {
            prompt: 'Cách tiếp cận nào được bài học khuyến khích cho nhà đầu tư cá nhân?',
            options: [
              'Chỉ dùng vĩ mô để chọn cổ phiếu, bỏ qua BCTC',
              'Chỉ dùng BCTC, coi vĩ mô là vô nghĩa',
              'Dùng vĩ mô để chọn mức rủi ro và ngành ưu tiên, rồi dùng phân tích cơ bản để chọn doanh nghiệp',
              'Dự đoán chính xác lãi suất quý sau rồi dồn toàn bộ vốn theo dự đoán',
            ],
            correct_index: 2,
            explanation:
              'Kết hợp top-down và bottom-up tận dụng điểm mạnh của cả hai: tránh ngành ngược gió, đồng thời chọn được doanh nghiệp tốt.',
          },
          {
            prompt: 'Mục đích chính của tư duy theo ba kịch bản (cơ sở/tích cực/tiêu cực) là gì?',
            options: [
              'Đảm bảo danh mục không bị tổn thương quá mức trong bất kỳ kịch bản nào',
              'Tìm ra kịch bản chắc chắn xảy ra',
              'Thay thế hoàn toàn việc phân tích doanh nghiệp',
              'Gán xác suất chính xác đến từng phần trăm',
            ],
            correct_index: 0,
            explanation:
              'Kịch bản giúp chuẩn bị cho nhiều khả năng thay vì đặt cược vào một dự báo. Không ai biết chắc kịch bản nào xảy ra.',
          },
          {
            prompt:
              'Checklist tháng này cho thấy lạm phát tăng, áp lực tỷ giá và PMI dưới 50. Phản ứng nào phù hợp với quy trình trong bài?',
            options: [
              'Bán toàn bộ cổ phiếu và chờ đến khi mọi chỉ số tốt trở lại',
              'Vay margin mua thêm vì "khi người khác sợ hãi thì tham lam"',
              'Không làm gì cả vì vĩ mô không ảnh hưởng tới cổ phiếu',
              'Nghiêng nhẹ về phòng thủ trong biên độ đã định trước: tăng tiền mặt vừa phải, ưu tiên doanh nghiệp ít nợ',
            ],
            correct_index: 3,
            explanation:
              'Quy trình khuyến khích điều chỉnh vừa phải trong giới hạn đặt trước. Bán hết hay vay margin là đặt cược "tất tay"; bỏ qua hoàn toàn thì phí công theo dõi rủi ro.',
          },
          {
            prompt: 'Trong checklist, vì sao so sánh lợi suất lợi nhuận của VN-Index với lãi tiết kiệm 12 tháng?',
            options: [
              'Vì hai con số này luôn bằng nhau',
              'Để đánh giá phần bù mà cổ phiếu đang trả so với kênh gần như không rủi ro',
              'Vì lãi tiết kiệm quyết định số cổ phiếu niêm yết',
              'Để tính chính xác VN-Index cuối năm',
            ],
            correct_index: 1,
            explanation:
              'Lợi suất lợi nhuận (1/P/E) trừ lãi tiết kiệm cho biết cổ phiếu đang bù thêm bao nhiêu cho rủi ro. Phần bù mỏng là tín hiệu định giá kém hấp dẫn hơn — không phải công cụ dự báo chỉ số.',
          },
        ],
      },
    ],
  },
]
