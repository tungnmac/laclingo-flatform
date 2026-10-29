import type { SeedChapter } from './types'

// Nâng cao (vi) — chương định giá tiếp tục dùng số liệu năm 2025 của "Công ty ABC" ở chương Phân tích cơ bản
// (tỷ đồng: doanh thu 1.000, EBIT 200, khấu hao 60, lãi vay 25, LNST 140, FCF 50, nợ vay 350, tiền 100, 100 triệu cổ phiếu, giá 21.000 đ).
// Chương danh mục dùng ví dụ danh mục 100 triệu đồng. Mọi phép tính đã được kiểm tra lại.
export const VI_ADVANCED: SeedChapter[] = [
  {
    slug: 'dinh-gia-nang-cao',
    title: 'Định giá doanh nghiệp nâng cao',
    description: 'DCF, EV/EBITDA, biên an toàn và những bẫy thường gặp khi ước tính giá trị nội tại của doanh nghiệp.',
    level: 'advanced',
    lessons: [
      {
        slug: 'dcf-dong-tien-chiet-khau',
        title: 'DCF — định giá bằng dòng tiền chiết khấu',
        summary: 'Dự phóng dòng tiền tự do, chọn tỷ lệ chiết khấu, tính giá trị cuối kỳ và kiểm tra độ nhạy của kết quả.',
        content_md: `## Ý tưởng cốt lõi

Chỉ số P/E cho biết thị trường **đang trả** bao nhiêu cho lợi nhuận. Phương pháp **DCF (Discounted Cash Flow — dòng tiền chiết khấu)** trả lời câu hỏi khác: **doanh nghiệp đáng giá bao nhiêu**, dựa trên toàn bộ tiền mặt nó sẽ tạo ra trong tương lai, quy về giá trị hôm nay.

Vì sao phải "quy về hôm nay"? Vì **1 đồng hôm nay đáng giá hơn 1 đồng năm sau**: bạn có thể đem nó đi đầu tư, và tiền tương lai luôn kèm rủi ro. Nếu yêu cầu lợi suất 9%/năm thì 109 đồng nhận sau một năm chỉ tương đương 100 đồng hôm nay.

> Giá trị hiện tại (PV) = Dòng tiền năm n / (1 + r)^n

## Bước 1: chọn dòng tiền xuất phát

Ở chương trước, Công ty ABC có **FCF = CFO − chi mua tài sản cố định = 140 − 90 = 50 tỷ**. Con số này đã trừ lãi vay, tức là tiền thuộc về cổ đông. Khi định giá **toàn bộ doanh nghiệp** (cả chủ nợ lẫn cổ đông), ta dùng **FCFF — dòng tiền tự do của doanh nghiệp**, bằng cách cộng lại lãi vay sau thuế:

> FCFF ≈ 50 + 25 × (1 − 20%) = 50 + 20 = **70 tỷ**

## Bước 2: dự phóng 5 năm

Năm 2025 ABC chi 90 tỷ mở rộng nhà máy, nhiều hơn khấu hao 60 tỷ. Giả định cơ sở: khi dự án hoàn tất, chi đầu tư giảm bớt và công suất mới giúp FCFF tăng lên 100 tỷ vào năm 2026, sau đó tăng thêm 15 tỷ mỗi năm. Chiết khấu ở mức 9%:

| Năm | FCFF (tỷ) | Hệ số chiết khấu 1/(1,09)^n | Giá trị hiện tại |
|---|---|---|---|
| 2026 | 100 | 0,9174 | 91,7 |
| 2027 | 115 | 0,8417 | 96,8 |
| 2028 | 130 | 0,7722 | 100,4 |
| 2029 | 145 | 0,7084 | 102,7 |
| 2030 | 160 | 0,6499 | 104,0 |
| **Tổng** | | | **495,6** |

## Bước 3: tỷ lệ chiết khấu — trực giác về WACC

Tỷ lệ chiết khấu là **lợi suất mà người góp vốn đòi hỏi**. Với FCFF, ta dùng **WACC — chi phí vốn bình quân gia quyền** giữa cổ đông và chủ nợ:

- Cổ đông chịu rủi ro cao hơn nên đòi hỏi khoảng **9,5%**.
- Chủ nợ nhận lãi 25 / 350 ≈ 7,1%; vì lãi vay được trừ thuế nên chi phí thật ≈ 7,1% × 0,8 ≈ **5,7%**.
- Theo giá trị thị trường, vốn chủ 2.100 tỷ chiếm khoảng 86%, nợ vay 350 tỷ chiếm khoảng 14%.

> WACC ≈ 0,86 × 9,5% + 0,14 × 5,7% ≈ 8,17% + 0,80% ≈ **9%**

Doanh nghiệp càng rủi ro, tỷ lệ chiết khấu càng cao và giá trị hiện tại càng thấp.

## Bước 4: giá trị cuối kỳ (terminal value)

Doanh nghiệp không dừng lại sau năm 2030. Phần giá trị từ năm 2031 trở đi được tính gộp bằng **mô hình tăng trưởng Gordon**, giả định FCFF tăng đều g = 3%/năm mãi mãi:

> TV = FCFF 2030 × (1 + g) / (WACC − g) = 160 × 1,03 / (0,09 − 0,03) = 164,8 / 0,06 ≈ **2.746,7 tỷ**

Quy về hôm nay: 2.746,7 × 0,6499 ≈ **1.785,1 tỷ**. Công thức chỉ có nghĩa khi **g nhỏ hơn WACC**, và g dài hạn không nên vượt tốc độ tăng trưởng danh nghĩa của nền kinh tế.

## Bước 5: từ giá trị doanh nghiệp xuống giá mỗi cổ phiếu

> Giá trị doanh nghiệp (EV) = 495,6 + 1.785,1 = **2.280,7 tỷ**
>
> Giá trị vốn chủ = EV − nợ ròng = 2.280,7 − (350 − 100) = **2.030,7 tỷ**
>
> Giá trị mỗi cổ phiếu = 2.030,7 tỷ / 100 triệu cổ phiếu ≈ **20.300 đ**

## Độ nhạy: kết quả là một vùng, không phải một con số

| WACC (dòng) / g (cột) | g = 2% | g = 3% | g = 4% |
|---|---|---|---|
| 8% | 21.100 | 25.000 | 30.900 |
| 9% | 17.600 | **20.300** | 24.100 |
| 10% | 15.000 | 16.900 | 19.500 |

Chỉ cần xê dịch WACC hoặc g một điểm phần trăm, giá trị đã chạy từ 15.000 đến 30.900 đ. Giá thị trường 21.000 đ nằm gần giữa bảng — DCF không nói "đắt" hay "rẻ" một cách tuyệt đối, nó giúp bạn thấy **giá hiện tại đang ngầm giả định điều gì**.

## Thực hành

Lấy một doanh nghiệp bạn đang theo dõi, tự dự phóng FCFF 5 năm với ba bộ giả định (thận trọng, cơ sở, lạc quan). Ghi vào [Nhật ký](/journal) giả định nào ảnh hưởng mạnh nhất đến kết quả.`,
        questions: [
          {
            prompt: 'Vì sao DCF phải chiết khấu các dòng tiền tương lai về hiện tại?',
            options: ['Vì 1 đồng hôm nay có thể đem đầu tư và không chịu rủi ro chờ đợi, nên đáng giá hơn 1 đồng trong tương lai', 'Vì kế toán bắt buộc làm vậy', 'Vì dòng tiền tương lai luôn âm', 'Vì để giá trị doanh nghiệp luôn bằng giá thị trường'],
            correct_index: 0,
            explanation: 'Giá trị thời gian của tiền: tiền nhận sau có chi phí cơ hội và rủi ro, nên phải chiết khấu.',
          },
          {
            prompt: 'FCFF năm cuối dự phóng = 160 tỷ, g = 3%, WACC = 9%. Giá trị cuối kỳ (chưa chiết khấu) theo mô hình Gordon xấp xỉ bao nhiêu?',
            options: ['1.777,8 tỷ', '2.746,7 tỷ', '2.666,7 tỷ', '5.333,3 tỷ'],
            correct_index: 1,
            explanation: 'TV = 160 × 1,03 / (0,09 − 0,03) = 164,8 / 0,06 ≈ 2.746,7 tỷ.',
          },
          {
            prompt: 'Mô hình tăng trưởng Gordon chỉ cho kết quả có ý nghĩa khi nào?',
            options: ['Khi g lớn hơn WACC', 'Khi g bằng WACC', 'Khi g nhỏ hơn WACC và ở mức bền vững dài hạn', 'Khi doanh nghiệp không có nợ'],
            correct_index: 2,
            explanation: 'Mẫu số là WACC − g; nếu g ≥ WACC, công thức cho giá trị vô hạn hoặc âm — vô nghĩa.',
          },
          {
            prompt: 'EV theo DCF = 2.280,7 tỷ, nợ ròng = 250 tỷ, có 100 triệu cổ phiếu. Giá trị mỗi cổ phiếu xấp xỉ bao nhiêu?',
            options: ['≈ 22.800 đ', '≈ 25.300 đ', '≈ 2.030 đ', '≈ 20.300 đ'],
            correct_index: 3,
            explanation: 'Giá trị vốn chủ = 2.280,7 − 250 = 2.030,7 tỷ; chia 100 triệu cổ phiếu ≈ 20.300 đ.',
          },
        ],
      },
      {
        slug: 'ev-ev-ebitda-va-dinh-gia-so-sanh',
        title: 'EV, EV/EBITDA và định giá so sánh',
        summary: 'Đi từ vốn hoá đến giá trị doanh nghiệp, vì sao EV/EBITDA bổ sung cho P/E và cách định giá bằng bội số của nhóm so sánh.',
        content_md: `## Vốn hoá chưa phải là "giá mua cả công ty"

Vốn hoá thị trường = giá cổ phiếu × số cổ phiếu. Với Công ty ABC: 21.000 đ × 100 triệu cổ phiếu = **2.100 tỷ**. Nhưng nếu bạn mua toàn bộ ABC, bạn còn **gánh luôn khoản nợ vay** và đồng thời **nhận luôn tiền mặt** trong két. Giống như mua một căn nhà đang thế chấp: giá thật bạn trả gồm cả khoản vay ngân hàng còn lại.

## Cầu nối từ vốn hoá đến EV

| Khoản mục | Tỷ đồng |
|---|---|
| Vốn hoá thị trường | 2.100 |
| + Nợ vay (chịu lãi) | 350 |
| − Tiền và tương đương tiền | (100) |
| **= Giá trị doanh nghiệp (EV)** | **2.350** |

> EV = Vốn hoá + Nợ vay − Tiền = 2.100 + 350 − 100 = **2.350 tỷ**

Phần "nợ vay − tiền" = 250 tỷ gọi là **nợ ròng**. Công ty có nhiều tiền hơn nợ thì nợ ròng âm và EV nhỏ hơn vốn hoá. Trong thực tế, phân tích viên còn cộng thêm lợi ích cổ đông không kiểm soát và cổ phiếu ưu đãi nếu có.

## EBITDA và bội số EV/EBITDA

**EBITDA** là lợi nhuận trước lãi vay, thuế và khấu hao:

> EBITDA = EBIT + Khấu hao = 200 + 60 = **260 tỷ**
>
> EV/EBITDA = 2.350 / 260 ≈ **9,0 lần**

So với **P/E = 21.000 / 1.400 = 15 lần**, hai bội số đo hai thứ khác nhau: P/E so **giá cổ phần** với **lợi nhuận của cổ đông**; EV/EBITDA so **giá cả doanh nghiệp** với **lợi nhuận hoạt động của cả doanh nghiệp**.

## Vì sao cần EV/EBITDA bên cạnh P/E?

- **Không bị cơ cấu vốn làm méo:** hai công ty có cùng nhà máy, cùng EBITDA 260 tỷ; công ty M không vay, công ty N vay nhiều. N trả nhiều lãi hơn nên LNST thấp hơn và P/E trông rất khác, dù hoạt động kinh doanh giống hệt. EV/EBITDA đặt cả hai lên cùng một mặt bằng.
- **Bớt ảnh hưởng của chính sách khấu hao và thuế** khác nhau giữa các công ty, các quốc gia.
- **Phù hợp với thương vụ mua bán sáp nhập**, vì người mua cả công ty phải tính đến nợ.

Nhưng EBITDA có điểm mù: nó **bỏ qua chi đầu tư**. ABC chi 90 tỷ mua tài sản cố định, nhiều hơn khấu hao 60 tỷ — EBITDA không phản ánh khoản tiền thật đó. Với doanh nghiệp cần đầu tư nặng, hãy xem thêm EV/EBIT hoặc EV/FCFF. EV/EBITDA cũng **không dùng cho ngân hàng**, vì với ngân hàng nợ chính là "nguyên liệu" kinh doanh.

## Định giá so sánh với nhóm cùng ngành

Ý tưởng: doanh nghiệp tương tự nên được định giá với bội số tương tự. Giả sử ba công ty cùng ngành (hư cấu):

| Công ty | EV/EBITDA |
|---|---|
| Công ty X | 8,0 lần |
| Công ty Y | 10,0 lần |
| Công ty Z | 11,0 lần |
| **Trung vị nhóm** | **10,0 lần** |
| Công ty ABC | 9,0 lần |

Áp bội số trung vị cho ABC:

> EV ước tính = 10,0 × 260 = 2.600 tỷ → Vốn chủ = 2.600 − 250 = 2.350 tỷ → **23.500 đ/cổ phiếu**

Với bội số thấp nhất (8,0 lần): EV = 2.080, vốn chủ = 1.830 tỷ → 18.300 đ. Với bội số cao nhất (11,0 lần): EV = 2.860, vốn chủ = 2.610 tỷ → 26.100 đ. Kết quả là một **vùng 18.300–26.100 đ**, không phải một con số.

Lưu ý: dùng **trung vị** thay vì trung bình để tránh một công ty bất thường kéo lệch kết quả, và chỉ so với doanh nghiệp thật sự tương đồng về quy mô, tăng trưởng, biên lợi nhuận. Định giá so sánh chỉ cho biết ABC **rẻ hay đắt so với nhóm** — nếu cả ngành đang bị định giá quá cao, ABC "rẻ tương đối" vẫn có thể đắt.

## Thực hành

Chọn ba doanh nghiệp cùng ngành, tự tính EV và EV/EBITDA cho từng công ty từ BCTC. Công ty nào có P/E và EV/EBITDA cho tín hiệu trái ngược nhau? Thử giải thích bằng mức nợ của chúng.`,
        questions: [
          {
            prompt: 'Vốn hoá 2.100 tỷ, nợ vay 350 tỷ, tiền và tương đương tiền 100 tỷ. EV bằng bao nhiêu?',
            options: ['2.550 tỷ', '2.350 tỷ', '1.850 tỷ', '2.000 tỷ'],
            correct_index: 1,
            explanation: 'EV = vốn hoá + nợ vay − tiền = 2.100 + 350 − 100 = 2.350 tỷ.',
          },
          {
            prompt: 'EV = 2.350 tỷ, EBIT = 200 tỷ, khấu hao = 60 tỷ. EV/EBITDA xấp xỉ bao nhiêu?',
            options: ['11,8 lần', '15,0 lần', '9,0 lần', '39,2 lần'],
            correct_index: 2,
            explanation: 'EBITDA = 200 + 60 = 260 tỷ; EV/EBITDA = 2.350 / 260 ≈ 9,0 lần.',
          },
          {
            prompt: 'Vì sao EV/EBITDA hữu ích khi so sánh hai công ty có mức vay nợ rất khác nhau?',
            options: ['Vì EBITDA đã trừ hết chi đầu tư', 'Vì EV/EBITDA không bị chi phí lãi vay và cơ cấu vốn làm méo như P/E', 'Vì EV luôn bằng vốn hoá', 'Vì EV/EBITDA dùng được cho mọi ngân hàng'],
            correct_index: 1,
            explanation: 'EV tính cả nợ, EBITDA là lợi nhuận trước lãi vay — nên hai công ty khác cơ cấu vốn vẫn so sánh được.',
          },
          {
            prompt: 'Trung vị EV/EBITDA nhóm ngành là 10 lần. ABC có EBITDA 260 tỷ, nợ ròng 250 tỷ, 100 triệu cổ phiếu. Giá trị mỗi cổ phiếu theo bội số này là bao nhiêu?',
            options: ['26.000 đ', '28.500 đ', '15.000 đ', '23.500 đ'],
            correct_index: 3,
            explanation: 'EV = 10 × 260 = 2.600 tỷ; vốn chủ = 2.600 − 250 = 2.350 tỷ; chia 100 triệu cổ phiếu = 23.500 đ.',
          },
        ],
      },
      {
        slug: 'bien-an-toan-va-gia-tri-noi-tai',
        title: 'Biên an toàn và giá trị nội tại',
        summary: 'Giá trị nội tại là một vùng, phân tích kịch bản và cách dùng biên an toàn để bù cho sai số của chính mình.',
        content_md: `## Giá trị nội tại là một vùng

**Giá trị nội tại** là giá trị mà doanh nghiệp "thật sự" đáng có, dựa trên khả năng tạo tiền trong tương lai. Vì tương lai không chắc chắn, không ai biết con số chính xác. Hai bài trước đã cho ta nhiều ước tính khác nhau cho Công ty ABC:

| Phương pháp | Kết quả (đ/cổ phiếu) |
|---|---|
| DCF kịch bản cơ sở | 20.300 |
| DCF khi WACC 8–10%, g 2–4% | 15.000 – 30.900 |
| EV/EBITDA nhóm ngành (8–11 lần) | 18.300 – 26.100 |

Giá thị trường 21.000 đ nằm **trong** vùng này. Muốn ra quyết định, ta cần thêm hai công cụ: **phân tích kịch bản** và **biên an toàn**.

## Phân tích kịch bản

Thay vì chỉ thay đổi WACC và g, ta kể ba "câu chuyện" khác nhau về doanh nghiệp, mỗi câu chuyện một bộ giả định:

| Kịch bản | Giả định chính | Giá trị/cổ phiếu | Xác suất |
|---|---|---|---|
| Xấu | Dự án mới kém hiệu quả: FCFF 85 → 105 tỷ, WACC 10%, g 2% | 9.400 đ | 25% |
| Cơ sở | Như bài DCF: FCFF 100 → 160 tỷ, WACC 9%, g 3% | 20.300 đ | 50% |
| Tốt | Chiếm thêm thị phần: FCFF 105 → 185 tỷ, WACC 8,5%, g 3,5% | 28.600 đ | 25% |

Giá trị kỳ vọng theo xác suất:

> 0,25 × 9.400 + 0,50 × 20.300 + 0,25 × 28.600 = 2.350 + 10.150 + 7.150 = **19.650 đ**

So với giá 21.000 đ: nếu kịch bản tốt xảy ra, cổ phiếu có thể tăng (28.600 − 21.000) / 21.000 ≈ **+36,2%**; nếu kịch bản xấu xảy ra, có thể giảm (9.400 − 21.000) / 21.000 ≈ **−55,2%**. Rủi ro giảm lớn hơn tiềm năng tăng — một thông tin mà con số "20.300 đ" đứng một mình không cho thấy.

## Biên an toàn (margin of safety)

Benjamin Graham — người thầy của nhiều nhà đầu tư giá trị — đề xuất chỉ mua khi giá **thấp hơn đáng kể** giá trị nội tại ước tính. Khoảng chênh đó là **biên an toàn**:

> Biên an toàn = (Giá trị nội tại − Giá thị trường) / Giá trị nội tại

Với ABC ở giá 21.000 đ so với giá trị cơ sở 20.300 đ:

> (20.300 − 21.000) / 20.300 ≈ **−3,4%** → không có biên an toàn

Nếu yêu cầu biên an toàn 25%, mức giá mua tối đa là 20.300 × (1 − 25%) ≈ **15.200 đ**. Giả sử thị trường hoảng loạn đẩy giá về 15.000 đ, biên an toàn lúc đó là (20.300 − 15.000) / 20.300 ≈ **26,1%**.

## Vì sao cần biên an toàn?

- **Bạn có thể sai:** dự phóng FCFF, WACC hay g đều là ước đoán. Biên an toàn là "khoảng đệm" cho sai số đó.
- **Điều bất ngờ luôn xảy ra:** mất khách hàng lớn, chính sách thay đổi, lãi suất tăng.
- **Lợi suất tốt hơn khi đúng:** mua thấp hơn giá trị thì khi giá hội tụ về giá trị, bạn có thêm lợi nhuận.

Biên an toàn cần lớn hơn với doanh nghiệp khó dự đoán (ngành chu kỳ, công ty non trẻ) và có thể nhỏ hơn với doanh nghiệp ổn định, ít nợ, lịch sử dài.

## Biến phân tích thành kế hoạch

Một nhà đầu tư kỷ luật viết ra **trước** khi thị trường biến động: giá trị nội tại ước tính, vùng giá sẽ mua, điều gì sẽ khiến mình thay đổi giả định. Khi giá về vùng mua, bạn hành động theo kế hoạch thay vì theo cảm xúc. Đây là bài học về phương pháp, không phải khuyến nghị mua hay bán bất kỳ cổ phiếu nào.

## Thực hành

Với doanh nghiệp bạn đã dựng DCF ở bài trước, lập bảng ba kịch bản kèm xác suất, tính giá trị kỳ vọng và mức giá mua ứng với biên an toàn 25%. Ghi kế hoạch đó vào [Nhật ký](/journal).`,
        questions: [
          {
            prompt: 'Giá trị nội tại ước tính 20.000 đ, giá thị trường 15.000 đ. Biên an toàn bằng bao nhiêu?',
            options: ['25%', '33,3%', '75%', '5%'],
            correct_index: 0,
            explanation: 'Biên an toàn = (20.000 − 15.000) / 20.000 = 25% (chia cho giá trị nội tại, không chia cho giá).',
          },
          {
            prompt: 'Ba kịch bản: 9.400 đ (xác suất 25%), 20.300 đ (50%), 28.600 đ (25%). Giá trị kỳ vọng là bao nhiêu?',
            options: ['19.433 đ', '20.300 đ', '19.650 đ', '28.600 đ'],
            correct_index: 2,
            explanation: '0,25 × 9.400 + 0,5 × 20.300 + 0,25 × 28.600 = 2.350 + 10.150 + 7.150 = 19.650 đ. 19.433 đ là trung bình cộng không có trọng số.',
          },
          {
            prompt: 'Vì sao nên xem giá trị nội tại là một vùng thay vì một con số chính xác?',
            options: ['Vì giá trị nội tại thay đổi mỗi phút theo giá', 'Vì kết quả phụ thuộc vào các giả định không chắc chắn, chỉ cần đổi nhẹ là con số thay đổi đáng kể', 'Vì kế toán cho phép làm tròn', 'Vì doanh nghiệp tự công bố giá trị nội tại'],
            correct_index: 1,
            explanation: 'Dự phóng dòng tiền, WACC và g đều là ước đoán; bảng độ nhạy cho thấy giá trị dao động rất rộng.',
          },
          {
            prompt: 'Giá trị cơ sở là 20.300 đ và bạn yêu cầu biên an toàn 25%. Mức giá mua tối đa xấp xỉ bao nhiêu?',
            options: ['25.400 đ', '16.240 đ', '20.300 đ', '15.200 đ'],
            correct_index: 3,
            explanation: 'Giá mua tối đa = 20.300 × (1 − 25%) ≈ 15.200 đ.',
          },
        ],
      },
      {
        slug: 'nhung-bay-khi-dinh-gia',
        title: 'Những bẫy khi định giá',
        summary: 'Rác vào rác ra, giá trị cuối kỳ áp đảo, lợi nhuận đỉnh chu kỳ, quên nợ và pha loãng, và hiệu ứng mỏ neo.',
        content_md: `## Mô hình đẹp chưa chắc đúng

Bảng tính DCF trông rất chính xác với hàng chục ô số, nhưng độ chính xác của bảng tính không bằng độ đúng của giả định. Dưới đây là những bẫy phổ biến nhất, minh hoạ bằng chính Công ty ABC.

## 1. Rác vào, rác ra

Kết quả chỉ tốt bằng giả định đầu vào. Ở bảng độ nhạy, cùng một doanh nghiệp cho ra **15.000 đ** (WACC 10%, g 2%) hoặc **30.900 đ** (WACC 8%, g 4%) — chênh lệch hơn gấp đôi. Dấu hiệu giả định đang "quá tay":

- Tăng trưởng doanh thu 20–30%/năm kéo dài cả thập kỷ, trong khi ngành chỉ tăng 8%.
- Biên lợi nhuận dự phóng cao hơn hẳn mọi đối thủ mà không có lý do rõ ràng.
- Tỷ lệ chiết khấu thấp hơn lãi suất trái phiếu dài hạn cộng một phần bù rủi ro hợp lý.

Cách phòng: luôn so giả định với **lịch sử của chính doanh nghiệp** và **trung bình ngành**, và tự hỏi "điều gì phải xảy ra để giả định này đúng?".

## 2. Giá trị cuối kỳ áp đảo

Trong DCF của ABC, giá trị cuối kỳ quy về hiện tại là 1.785,1 tỷ trên tổng EV 2.280,7 tỷ:

> 1.785,1 / 2.280,7 ≈ **78,3%** giá trị đến từ sau năm thứ 5

Nghĩa là phần lớn kết quả dựa vào hai con số khó biết nhất: g và WACC dài hạn. Chỉ cần tăng g từ 3% lên 4%, giá trị mỗi cổ phiếu tăng từ khoảng 20.300 đ lên 24.100 đ (gần +19%). Nếu bạn thấy giá trị cuối kỳ chiếm 85–90% EV, hãy coi đó là tín hiệu kết quả đang phụ thuộc quá nhiều vào niềm tin. Ngoài ra, **g không được vượt** tốc độ tăng trưởng danh nghĩa dài hạn của nền kinh tế — không công ty nào tăng nhanh hơn cả nền kinh tế mãi mãi.

## 3. Lợi nhuận đỉnh chu kỳ

Với ngành thép, phân bón, vận tải biển, lợi nhuận một năm có thể gấp đôi trung bình chu kỳ. Giả sử LNST 140 tỷ năm 2025 của ABC là đỉnh, còn bình quân cả chu kỳ chỉ khoảng 100 tỷ:

> P/E theo lợi nhuận năm nay = 2.100 / 140 = 15 lần
>
> P/E theo lợi nhuận bình quân chu kỳ = 2.100 / 100 = **21 lần**

Cổ phiếu trông "rẻ" chỉ vì mẫu số đang ở đỉnh. Với doanh nghiệp chu kỳ, hãy dùng **lợi nhuận bình quân qua cả chu kỳ** (5–10 năm), và đặc biệt cẩn thận khi P/E thấp nhất lịch sử.

## 4. Quên nợ và pha loãng

- **Quên trừ nợ ròng:** nếu chia thẳng EV 2.280,7 tỷ cho 100 triệu cổ phiếu, bạn được khoảng 22.800 đ thay vì 20.300 đ — **cao hơn khoảng 2.500 đ**, đúng bằng 250 tỷ nợ ròng chia cho 100 triệu cổ phiếu. Giá trị doanh nghiệp thuộc về cả chủ nợ, cổ đông chỉ nhận phần còn lại.
- **Quên pha loãng:** nếu ABC có quyền chọn cho nhân viên (ESOP) và trái phiếu chuyển đổi tương đương 10 triệu cổ phiếu mới, số cổ phiếu pha loãng là 110 triệu: 2.030,7 tỷ / 110 triệu ≈ **18.500 đ**, thấp hơn khoảng 9,1%. Luôn dùng **số cổ phiếu pha loãng hoàn toàn**.

## 5. Hiệu ứng mỏ neo

Não người dễ bám vào con số đầu tiên nhìn thấy:

- **Neo vào giá mua:** "Tôi mua ở 30.000 đ, đợi về lại giá mua mới bán" — trong khi thị trường không biết và không quan tâm bạn mua giá nào.
- **Neo vào đỉnh cũ:** "Từng lên 35.000 đ nên 21.000 đ là rẻ" — đỉnh cũ có thể là bong bóng.
- **Neo vào giá mục tiêu** của người khác, hoặc chỉnh giả định đến khi DCF ra đúng con số mình muốn (thiên kiến xác nhận).

Cách phòng: dựng mô hình **trước khi nhìn giá**, ghi giả định ra giấy, và chủ động tìm lý do mình có thể sai.

## Bảng kiểm tra trước khi tin vào một định giá

| Câu hỏi | Nếu "có" thì… |
|---|---|
| Giả định tăng trưởng cao hơn lịch sử và ngành? | Hạ xuống hoặc giải thích được vì sao |
| Giá trị cuối kỳ chiếm trên 80% EV? | Xem lại g, WACC và giai đoạn dự phóng |
| Lợi nhuận năm nay cao bất thường? | Dùng lợi nhuận bình quân chu kỳ |
| Đã trừ nợ ròng và dùng số cổ phiếu pha loãng? | Bắt buộc phải có |
| Kết quả "tình cờ" khớp với điều mình mong? | Nhờ người khác phản biện giả định |

## Thực hành

Mở lại mô hình DCF bạn đã dựng, chạy qua bảng kiểm tra ở trên và ghi vào [Nhật ký](/journal) ít nhất một giả định bạn phải sửa.`,
        questions: [
          {
            prompt: 'Trong một mô hình DCF, giá trị cuối kỳ chiếm khoảng 78% EV. Điều này có nghĩa là gì?',
            options: ['Kết quả rất nhạy với các giả định dài hạn như g và WACC', 'Mô hình chắc chắn chính xác', 'Doanh nghiệp không còn nợ', 'Dòng tiền 5 năm đầu không cần dự phóng'],
            correct_index: 0,
            explanation: 'Phần lớn giá trị đến từ sau giai đoạn dự phóng, nên thay đổi nhỏ của g hoặc WACC làm kết quả thay đổi mạnh.',
          },
          {
            prompt: 'EV = 2.280,7 tỷ, nợ ròng = 250 tỷ, 100 triệu cổ phiếu. Nếu quên trừ nợ ròng và chia thẳng EV cho số cổ phiếu, kết quả sai thế nào?',
            options: ['Thấp hơn khoảng 2.500 đ/cổ phiếu', 'Không sai, vì EV đã thuộc về cổ đông', 'Cao hơn khoảng 2.500 đ/cổ phiếu', 'Cao hơn khoảng 250 đ/cổ phiếu'],
            correct_index: 2,
            explanation: '2.280,7 / 100 triệu ≈ 22.800 đ thay vì (2.280,7 − 250) / 100 triệu ≈ 20.300 đ — cao hơn khoảng 2.500 đ.',
          },
          {
            prompt: 'Vốn hoá 2.100 tỷ. LNST năm nay 140 tỷ (đỉnh chu kỳ), LNST bình quân cả chu kỳ 100 tỷ. P/E theo lợi nhuận bình quân chu kỳ là bao nhiêu?',
            options: ['15 lần', '21 lần', '14 lần', '10 lần'],
            correct_index: 1,
            explanation: 'P/E chu kỳ = 2.100 / 100 = 21 lần — đắt hơn nhiều so với con số 15 lần tính trên lợi nhuận đỉnh.',
          },
          {
            prompt: 'Tình huống nào là ví dụ của hiệu ứng mỏ neo?',
            options: ['Dùng lợi nhuận bình quân cả chu kỳ để tính P/E', 'Trừ nợ ròng khi tính giá trị vốn chủ', 'So sánh giả định với trung bình ngành', 'Không chịu bán vì muốn "đợi về lại giá mua 30.000 đ" dù giá trị nội tại đã giảm'],
            correct_index: 3,
            explanation: 'Giá mua là con số bạn tự neo vào; nó không liên quan đến giá trị hiện tại của doanh nghiệp.',
          },
        ],
      },
    ],
  },
  {
    slug: 'quan-ly-danh-muc',
    title: 'Quản lý danh mục đầu tư',
    description: 'Đa dạng hoá, phân bổ tài sản, tái cân bằng, DCA và cách đo hiệu quả của cả danh mục.',
    level: 'advanced',
    lessons: [
      {
        slug: 'da-dang-hoa-va-tuong-quan',
        title: 'Đa dạng hoá và tương quan',
        summary: 'Hệ số tương quan, rủi ro hệ thống và rủi ro riêng, và cần nắm giữ bao nhiêu tài sản là đủ.',
        content_md: `## Đừng bỏ tất cả trứng vào một giỏ

Câu nói quen thuộc nhưng thường bị hiểu sai. Đa dạng hoá không phải là **mua thật nhiều thứ**, mà là mua những thứ **không cùng lên cùng xuống** với nhau. Thước đo cho điều đó là **hệ số tương quan**.

## Hệ số tương quan

Hệ số tương quan (ký hiệu ρ, đọc là "rô") đo mức độ hai tài sản biến động cùng chiều, nằm trong khoảng từ −1 đến +1:

| Hệ số | Ý nghĩa | Ví dụ minh hoạ |
|---|---|---|
| +1 | Luôn cùng tăng, cùng giảm | Hai cổ phiếu ngân hàng rất giống nhau |
| 0 | Không liên quan | Hai tài sản có động lực hoàn toàn khác |
| −1 | Luôn ngược chiều | Hiếm gặp trong thực tế |

Ví dụ: hai tài sản đều có độ biến động 20%/năm, bạn chia đôi tiền 50/50. Độ biến động của danh mục phụ thuộc vào tương quan:

> Độ biến động danh mục = 20% × √((1 + ρ) / 2)

| Tương quan ρ | Độ biến động danh mục |
|---|---|
| +1 | 20% — không giảm chút nào |
| +0,5 | ≈ 17,3% |
| 0 | ≈ 14,1% |
| −1 | 0% |

Lợi suất kỳ vọng của danh mục vẫn là trung bình của hai tài sản, nhưng rủi ro giảm khi tương quan thấp. Đây là lý do đa dạng hoá được gọi là **"bữa trưa miễn phí duy nhất"** trong đầu tư.

## Rủi ro hệ thống và rủi ro riêng

Rủi ro của một cổ phiếu gồm hai phần:

- **Rủi ro riêng (idiosyncratic):** chỉ ảnh hưởng một doanh nghiệp — giám đốc từ chức, mất hợp đồng lớn, sự cố nhà máy. Phần này **giảm được** bằng đa dạng hoá, vì tin xấu của công ty này thường bù bằng tin tốt của công ty khác.
- **Rủi ro hệ thống (systematic):** ảnh hưởng gần như toàn thị trường — lãi suất tăng, suy thoái, khủng hoảng tài chính. Phần này **không loại bỏ được** bằng cách mua thêm cổ phiếu; chỉ giảm được bằng cách giữ các **lớp tài sản khác** (trái phiếu, tiền mặt) hoặc giảm tỷ trọng tài sản rủi ro.

## Nắm giữ bao nhiêu là đủ?

Nghiên cứu học thuật thường cho thấy khoảng **20–30 cổ phiếu thuộc nhiều ngành khác nhau** đã loại bỏ phần lớn rủi ro riêng; thêm nữa thì tác dụng giảm dần. Ba lưu ý:

1. **Số lượng không thay được sự khác biệt:** 20 cổ phiếu bất động sản vẫn là một cú đặt cược vào bất động sản.
2. **Crypto thường tương quan cao với nhau:** khi Bitcoin giảm mạnh, phần lớn altcoin giảm theo. Mười đồng coin khác nhau vẫn là một danh mục rất tập trung.
3. **Tương quan tăng trong khủng hoảng:** lúc thị trường hoảng loạn, nhiều tài sản rủi ro cùng giảm một lúc. Đa dạng hoá giúp, nhưng không phải tấm khiên tuyệt đối.

Ngược lại, nắm quá nhiều thứ mà bạn không hiểu và không theo dõi được — đôi khi gọi vui là "đa dạng hoá tồi" — chỉ làm danh mục giống chỉ số thị trường nhưng tốn thêm phí và công sức. Nếu muốn đa dạng hoá rộng, một quỹ chỉ số thường là cách đơn giản hơn.

## Thực hành

Liệt kê các tài sản bạn đang nắm giữ (kể cả trên tài khoản giao dịch mô phỏng), nhóm chúng theo ngành và lớp tài sản. Nhóm nào chiếm trên 40% tổng giá trị? Các tài sản trong nhóm đó có thường cùng tăng cùng giảm không?`,
        questions: [
          {
            prompt: 'Thêm tài sản có hệ số tương quan nào với danh mục hiện tại thì giúp giảm rủi ro nhiều nhất?',
            options: ['+1', '+0,5', '0', '−0,5'],
            correct_index: 3,
            explanation: 'Tương quan càng thấp (càng âm), các biến động càng bù trừ nhau và rủi ro danh mục càng giảm.',
          },
          {
            prompt: 'Loại rủi ro nào KHÔNG thể loại bỏ bằng cách mua thêm nhiều cổ phiếu khác nhau?',
            options: ['Rủi ro giám đốc một công ty từ chức', 'Rủi ro hệ thống như lãi suất tăng hay suy thoái kinh tế', 'Rủi ro một nhà máy gặp sự cố', 'Rủi ro một công ty mất hợp đồng lớn'],
            correct_index: 1,
            explanation: 'Rủi ro hệ thống ảnh hưởng gần như toàn thị trường nên không đa dạng hoá được bằng thêm cổ phiếu.',
          },
          {
            prompt: 'Hai tài sản cùng có độ biến động 20%, chia 50/50, hệ số tương quan bằng 0. Độ biến động danh mục xấp xỉ bao nhiêu?',
            options: ['20%', '10%', '14,1%', '0%'],
            correct_index: 2,
            explanation: '20% × √((1 + 0) / 2) = 20% × 0,707 ≈ 14,1%.',
          },
          {
            prompt: 'Danh mục gồm 10 đồng crypto khác nhau có được coi là đa dạng hoá tốt không?',
            options: ['Có, vì 10 tài sản là đủ', 'Có, vì mỗi đồng có tên khác nhau', 'Không, vì crypto thì không có rủi ro', 'Không hẳn, vì các đồng crypto thường tương quan cao và cùng giảm mạnh khi thị trường đi xuống'],
            correct_index: 3,
            explanation: 'Đa dạng hoá phụ thuộc vào tương quan, không phải số lượng; crypto thường biến động cùng chiều với nhau.',
          },
        ],
      },
      {
        slug: 'phan-bo-tai-san-va-tai-can-bang',
        title: 'Phân bổ tài sản và tái cân bằng',
        summary: 'Chia tiền giữa cổ phiếu, trái phiếu, tiền mặt và crypto theo khẩu vị rủi ro, rồi tái cân bằng theo lịch hoặc theo ngưỡng.',
        content_md: `## Quyết định quan trọng nhất

Chọn cổ phiếu nào thường được bàn nhiều nhất, nhưng với phần lớn nhà đầu tư, quyết định ảnh hưởng mạnh nhất đến kết quả dài hạn là **phân bổ tài sản**: bao nhiêu phần trăm cho cổ phiếu, trái phiếu, tiền mặt và các tài sản rủi ro cao như crypto. Tỷ lệ này quyết định danh mục có thể giảm sâu đến đâu khi thị trường xấu.

## Bốn lớp tài sản trong ví dụ

- **Cổ phiếu:** tăng trưởng dài hạn tốt nhất trong ba lớp truyền thống, nhưng có thể giảm 30–50% trong khủng hoảng.
- **Trái phiếu:** lợi suất thấp hơn, biến động ít hơn, thường giúp danh mục "êm" hơn.
- **Tiền mặt / tiền gửi:** gần như không biến động, là quỹ dự phòng và "đạn dược" khi có cơ hội.
- **Crypto:** biến động rất mạnh, có thể giảm hơn 70% — nếu có, thường chỉ chiếm phần nhỏ.

## Phân bổ theo khẩu vị rủi ro

Ba mẫu minh hoạ (không phải khuyến nghị):

| Khẩu vị | Cổ phiếu | Trái phiếu | Tiền mặt | Crypto |
|---|---|---|---|---|
| Thận trọng | 30% | 50% | 18% | 2% |
| Cân bằng | 50% | 35% | 10% | 5% |
| Tăng trưởng | 70% | 15% | 5% | 10% |

Không có tỷ lệ "chuẩn" — mỗi nguồn gợi ý một kiểu. Công cụ [Kế hoạch đầu tư](/learn/plans) dùng bộ mẫu riêng cho 4 khẩu vị (gồm cả "Mạo hiểm"), các con số hơi khác bảng trên nhưng cùng tinh thần: càng chấp nhận rủi ro, tỷ trọng cổ phiếu/crypto càng cao.

Khi chọn, hãy tự hỏi:

1. **Thời gian đầu tư:** tiền cần dùng trong 2 năm nữa không nên nằm nhiều ở tài sản có thể giảm 40%.
2. **Khả năng chịu lỗ thật sự:** nếu danh mục giảm 25%, bạn có ngủ được và không bán tháo không?
3. **Quỹ dự phòng:** nên có sẵn vài tháng chi tiêu bằng tiền mặt trước khi đầu tư.

Trang [Kế hoạch đầu tư](/learn/plans) của TradeLab cho phép bạn thử các tỷ lệ phân bổ khác nhau và xem danh mục có thể biến động ra sao.

## Danh mục tự "trôi" khỏi kế hoạch

Giả sử bạn có **100 triệu đồng** theo mẫu Cân bằng. Sau một năm, cổ phiếu tăng 20%, trái phiếu tăng 4%, tiền mặt có lãi 2%, crypto tăng 60%:

| Lớp tài sản | Đầu năm | Cuối năm | Tỷ trọng cuối năm | Mục tiêu (50/35/10/5) | Cần làm |
|---|---|---|---|---|---|
| Cổ phiếu | 50 | 60 | 52,4% | 57,30 | Bán 2,70 |
| Trái phiếu | 35 | 36,4 | 31,8% | 40,11 | Mua 3,71 |
| Tiền mặt | 10 | 10,2 | 8,9% | 11,46 | Thêm 1,26 |
| Crypto | 5 | 8 | 7,0% | 5,73 | Bán 2,27 |
| **Tổng** | **100** | **114,6** | 100% | **114,6** | |

(đơn vị: triệu đồng). Tổng bán 2,70 + 2,27 = 4,97 triệu, đúng bằng tổng mua 3,71 + 1,26 = 4,97 triệu. Không tái cân bằng, danh mục âm thầm trở nên **rủi ro hơn** kế hoạch ban đầu, vì phần tăng mạnh nhất cũng là phần rủi ro nhất.

## Hai cách tái cân bằng

- **Theo lịch:** định kỳ 6 tháng hoặc 1 năm đưa tỷ trọng về mục tiêu. Đơn giản, dễ duy trì kỷ luật.
- **Theo ngưỡng:** chỉ tái cân bằng khi một lớp tài sản lệch quá mức đặt trước. Ví dụ ngưỡng ±20% của tỷ trọng mục tiêu: crypto mục tiêu 5% được phép dao động 4–6%; ở mức 7,0% đã vượt ngưỡng, trong khi cổ phiếu (cho phép 40–60%) vẫn ổn. Các lớp tài sản nhỏ, biến động mạnh thường chạm ngưỡng trước.

Tái cân bằng buộc bạn **bán bớt thứ vừa tăng, mua thêm thứ vừa kém** — đi ngược cảm xúc đám đông. Lưu ý phí giao dịch và thuế: tái cân bằng quá thường xuyên có thể tốn kém. Cách tiết kiệm là dùng **tiền nạp mới** để mua phần đang thiếu thay vì bán phần thừa.

## Thực hành

Vào [Kế hoạch đầu tư](/learn/plans), thử hai mẫu phân bổ khác nhau. Viết ra quy tắc tái cân bằng của bạn: theo lịch hay theo ngưỡng, và ngưỡng là bao nhiêu.`,
        questions: [
          {
            prompt: 'Mục đích chính của việc tái cân bằng danh mục là gì?',
            options: ['Tối đa hoá lợi nhuận trong ngắn hạn', 'Đưa mức rủi ro của danh mục về đúng tỷ lệ phân bổ đã chọn', 'Luôn mua thêm tài sản tăng mạnh nhất', 'Tránh hoàn toàn mọi khoản lỗ'],
            correct_index: 1,
            explanation: 'Danh mục tự trôi về phía tài sản vừa tăng mạnh (thường rủi ro hơn); tái cân bằng kéo rủi ro về kế hoạch.',
          },
          {
            prompt: 'Danh mục 114,6 triệu, mục tiêu cổ phiếu 50%, hiện đang có 60 triệu cổ phiếu. Cần bán bao nhiêu cổ phiếu để về đúng mục tiêu?',
            options: ['10 triệu', '4,97 triệu', '7,3 triệu', '2,7 triệu'],
            correct_index: 3,
            explanation: 'Mục tiêu = 50% × 114,6 = 57,3 triệu; cần bán 60 − 57,3 = 2,7 triệu.',
          },
          {
            prompt: 'Tái cân bằng "theo ngưỡng" nghĩa là gì?',
            options: ['Chỉ tái cân bằng khi tỷ trọng một lớp tài sản lệch khỏi mục tiêu quá mức đặt trước', 'Tái cân bằng mỗi ngày', 'Bán toàn bộ khi thị trường giảm', 'Chỉ mua tài sản có giá thấp nhất'],
            correct_index: 0,
            explanation: 'Theo ngưỡng: đặt sẵn biên độ cho phép, chỉ hành động khi tỷ trọng vượt ra ngoài biên độ đó.',
          },
          {
            prompt: 'Yếu tố nào nên quyết định tỷ lệ phân bổ tài sản của bạn?',
            options: ['Tài sản nào tăng mạnh nhất tháng trước', 'Lời khuyên trên mạng xã hội', 'Thời gian đầu tư và khả năng chịu lỗ thật sự của bạn', 'Số lượng mã cổ phiếu trên sàn'],
            correct_index: 2,
            explanation: 'Phân bổ phải khớp với mục tiêu, thời gian cần tiền và mức sụt giảm bạn chịu được mà không bán tháo.',
          },
        ],
      },
      {
        slug: 'dca-va-dau-tu-mot-lan',
        title: 'DCA và đầu tư một lần',
        summary: 'Trung bình giá định kỳ so với đầu tư toàn bộ một lần: ví dụ bằng số, lợi ích về hành vi và giới hạn của DCA.',
        content_md: `## Hai cách bỏ cùng một số tiền

Bạn có **12 triệu đồng** muốn đầu tư vào một quỹ cổ phiếu. Có hai lựa chọn:

- **Đầu tư một lần (lump sum):** bỏ hết 12 triệu ngay hôm nay.
- **DCA (Dollar-Cost Averaging — trung bình giá định kỳ):** chia đều, mỗi tháng bỏ **2 triệu** trong 6 tháng, bất kể giá lên hay xuống.

## Kịch bản 1: thị trường giảm rồi hồi phục

Giá chứng chỉ quỹ (nghìn đồng) trong 6 tháng: 100, 80, 50, 80, 100, 125.

| Tháng | Giá | Tiền bỏ vào | Số chứng chỉ mua được |
|---|---|---|---|
| 1 | 100 | 2 triệu | 20 |
| 2 | 80 | 2 triệu | 25 |
| 3 | 50 | 2 triệu | 40 |
| 4 | 80 | 2 triệu | 25 |
| 5 | 100 | 2 triệu | 20 |
| 6 | 125 | 2 triệu | 16 |
| **Tổng** | | **12 triệu** | **146** |

> Giá vốn bình quân = 12.000 nghìn / 146 ≈ **82,19 nghìn đồng**

Giá trung bình cộng của 6 tháng là (100 + 80 + 50 + 80 + 100 + 125) / 6 ≈ 89,17 nghìn, nhưng giá vốn DCA thấp hơn — vì cùng số tiền, bạn **mua được nhiều chứng chỉ hơn khi giá rẻ**.

Cuối tháng 6, giá 125 nghìn:

- **DCA:** 146 × 125 = 18,25 triệu → lãi **+52,1%**.
- **Một lần:** 12 triệu mua 120 chứng chỉ ở giá 100 → 120 × 125 = 15 triệu → lãi **+25%**.

## Kịch bản 2: thị trường tăng đều

Giá 6 tháng: 100, 105, 110, 115, 120, 125. Mỗi tháng 2 triệu mua được lần lượt 20; 19,05; 18,18; 17,39; 16,67; 16 chứng chỉ — tổng khoảng **107,29** chứng chỉ.

- **DCA:** 107,29 × 125 ≈ 13,41 triệu → lãi khoảng **+11,8%**.
- **Một lần:** vẫn là 15 triệu → lãi **+25%**.

Khi giá tăng đều, phần tiền chờ đợi của DCA bỏ lỡ đà tăng, nên đầu tư một lần thắng rõ.

## Vậy cách nào tốt hơn?

- **Về toán học:** với tài sản có xu hướng tăng dài hạn, đầu tư một lần **thường** cho kết quả tốt hơn trong đa số giai đoạn, vì tiền được làm việc sớm hơn.
- **Về hành vi:** DCA có lợi thế lớn. Nó loại bỏ áp lực "canh đúng đáy", giảm hối tiếc nếu thị trường giảm ngay sau khi mua, và biến đầu tư thành **thói quen tự động**. Một kế hoạch trung bình mà bạn duy trì được nhiều năm tốt hơn một kế hoạch tối ưu mà bạn bỏ dở sau lần giảm đầu tiên.
- **Với thu nhập hàng tháng:** phần lớn người đi làm vốn dĩ đang DCA một cách tự nhiên — trích một phần lương mỗi tháng để đầu tư.

Một lựa chọn trung gian: khi nhận một khoản tiền lớn, chia ra 3–6 phần và giải ngân trong vài tháng, để cân bằng giữa lợi ích toán học và sự an tâm.

## Giới hạn của DCA

- **DCA không biến tài sản xấu thành tốt.** Nếu tài sản giảm mãi không hồi phục, DCA chỉ giúp bạn lỗ chậm hơn — và có thể lỗ nhiều hơn vì càng giảm càng mua thêm.
- **Phí giao dịch:** chia quá nhỏ thì phí có thể ăn mòn lợi nhuận; hãy chọn tần suất hợp lý.
- **Không phải chiến lược thời điểm:** DCA là kỷ luật bỏ tiền, không phải dự báo giá.

## Thực hành

Dùng tài khoản mô phỏng: chọn một tài sản, ghi lại giá mỗi tuần trong 6 tuần và giả lập mua một số tiền cố định mỗi tuần. So giá vốn bình quân của bạn với giá trung bình cộng của 6 tuần, rồi ghi nhận xét vào [Nhật ký](/journal).`,
        questions: [
          {
            prompt: 'Mỗi tháng đầu tư 2 triệu đồng trong 6 tháng, mua được tổng cộng 146 chứng chỉ quỹ. Giá vốn bình quân xấp xỉ bao nhiêu?',
            options: ['89,17 nghìn đồng', '82,19 nghìn đồng', '100 nghìn đồng', '125 nghìn đồng'],
            correct_index: 1,
            explanation: 'Giá vốn bình quân = 12.000 nghìn / 146 ≈ 82,19 nghìn đồng; 89,17 là giá trung bình cộng, không phải giá vốn.',
          },
          {
            prompt: 'Khi thị trường tăng đều suốt giai đoạn đầu tư, phương án nào thường cho kết quả tốt hơn?',
            options: ['DCA, vì luôn mua được giá rẻ hơn', 'Hai phương án luôn cho kết quả như nhau', 'Đầu tư một lần, vì toàn bộ tiền được hưởng đà tăng từ sớm', 'Không đầu tư gì cả'],
            correct_index: 2,
            explanation: 'Trong kịch bản tăng đều, đầu tư một lần đạt +25% so với khoảng +11,8% của DCA.',
          },
          {
            prompt: 'Lợi ích lớn nhất của DCA về mặt hành vi là gì?',
            options: ['Đảm bảo không bao giờ lỗ', 'Giảm áp lực phải canh đúng thời điểm và giúp duy trì kỷ luật đầu tư đều đặn', 'Luôn thắng đầu tư một lần', 'Không tốn phí giao dịch'],
            correct_index: 1,
            explanation: 'DCA biến đầu tư thành thói quen tự động, giảm hối tiếc và cảm xúc khi thị trường biến động.',
          },
          {
            prompt: 'Nhận định nào về DCA là ĐÚNG?',
            options: ['DCA không bảo vệ bạn nếu tài sản mất giá vĩnh viễn', 'DCA biến mọi tài sản thành khoản đầu tư có lãi', 'DCA là cách dự báo đáy thị trường', 'DCA chỉ dùng được cho crypto'],
            correct_index: 0,
            explanation: 'DCA là kỷ luật bỏ tiền; nếu tài sản giảm mãi không hồi phục, DCA vẫn lỗ.',
          },
        ],
      },
      {
        slug: 'do-hieu-qua-danh-muc',
        title: 'Đo hiệu quả danh mục',
        summary: 'Tổng lợi suất, CAGR, mức sụt giảm tối đa, độ biến động, trực giác về Sharpe và so sánh với chỉ số tham chiếu.',
        content_md: `## "Năm nay tôi lãi bao nhiêu?" chưa đủ

Một danh mục lãi 30% nghe hấp dẫn — nhưng nếu thị trường chung tăng 50%, hoặc nếu để có 30% bạn từng phải chịu cảnh mất một nửa tài sản, bức tranh sẽ khác hẳn. Đo hiệu quả đúng cách cần nhiều góc nhìn.

## Ví dụ: danh mục 3 năm

Bạn bắt đầu với **100 triệu đồng**, không nạp thêm hay rút ra:

| Thời điểm | Giá trị (triệu) | Lợi suất năm |
|---|---|---|
| Đầu năm 1 | 100 | |
| Cuối năm 1 | 125 | +25% |
| Cuối năm 2 | 100 | −20% |
| Cuối năm 3 | 133,1 | +33,1% |

## 1. Tổng lợi suất

> Tổng lợi suất = (133,1 − 100) / 100 = **+33,1%** sau 3 năm

Tổng lợi suất phải gồm cả **cổ tức, lãi nhận được** và trừ **phí, thuế**. Lưu ý: tiền bạn nạp thêm **không phải lợi nhuận** — nếu nạp 20 triệu giữa chừng, phải tách phần đó ra trước khi tính.

## 2. CAGR — tốc độ tăng trưởng kép hằng năm

Tổng lợi suất khó so sánh giữa các khoảng thời gian khác nhau. CAGR quy về **mức tăng đều mỗi năm**:

> CAGR = (Giá trị cuối / Giá trị đầu)^(1 / số năm) − 1 = (133,1 / 100)^(1/3) − 1 = **10%/năm**

Kiểm tra: 100 × 1,1 × 1,1 × 1,1 = 133,1. Để ý rằng trung bình cộng các lợi suất năm là (25 − 20 + 33,1) / 3 = 12,7% — **cao hơn** CAGR. Trung bình cộng đánh giá quá cao trải nghiệm thật, vì giảm 20% cần tăng 25% mới về lại chỗ cũ.

## 3. Mức sụt giảm tối đa (max drawdown)

Đo cú rơi lớn nhất từ đỉnh xuống đáy:

> Max drawdown = (Đáy − Đỉnh) / Đỉnh = (100 − 125) / 125 = **−20%**

Đây là con số trả lời câu hỏi "trong tình huống tệ nhất, tôi đã mất bao nhiêu từ đỉnh?". Với dữ liệu theo ngày, mức sụt giảm thật thường sâu hơn số liệu cuối năm.

## 4. Độ biến động

Độ biến động (volatility) là **độ lệch chuẩn của lợi suất** — lợi suất dao động quanh mức trung bình mạnh đến đâu. Danh mục ở trên có các năm +25%, −20%, +33,1%: dao động rất rộng. Hai danh mục có cùng CAGR 10%, danh mục ít biến động hơn dễ nắm giữ hơn và ít khiến bạn bán tháo sai thời điểm.

## 5. Tỷ lệ Sharpe — lợi suất trên mỗi đơn vị rủi ro

> Sharpe = (Lợi suất danh mục − Lợi suất phi rủi ro) / Độ biến động

Một ví dụ riêng, với lợi suất phi rủi ro (ví dụ lãi tiền gửi) 4%/năm:

| Danh mục | Lợi suất | Độ biến động | Sharpe |
|---|---|---|---|
| A | 10% | 15% | (10 − 4) / 15 = **0,40** |
| B | 12% | 25% | (12 − 4) / 25 = **0,32** |

B lãi nhiều hơn, nhưng A tạo ra **nhiều lợi suất hơn trên mỗi đơn vị rủi ro**. Sharpe cao hơn nghĩa là phần thưởng xứng đáng hơn với rủi ro bỏ ra.

## 6. So với chỉ số tham chiếu (benchmark)

Hãy luôn hỏi: **nếu chỉ mua một quỹ chỉ số đơn giản, tôi được bao nhiêu?** Giả sử cùng 3 năm, chỉ số thị trường đi từ 100 lên 135, xuống 94,5 rồi lên 140,5:

- CAGR chỉ số ≈ 12%/năm (vì 1,12³ ≈ 1,405), cao hơn danh mục của bạn (10%).
- Nhưng max drawdown của chỉ số là (94,5 − 135) / 135 = −30%, sâu hơn danh mục (−20%).

Kết luận cân bằng: danh mục kém chỉ số khoảng 2 điểm phần trăm mỗi năm, đổi lại rủi ro thấp hơn. Việc đó đáng hay không phụ thuộc vào mục tiêu của bạn — nhưng nếu nhiều năm liền vừa lãi kém vừa rủi ro ngang chỉ số, một quỹ chỉ số có thể là lựa chọn hợp lý hơn. Chọn benchmark phù hợp với danh mục: danh mục 50% cổ phiếu, 50% trái phiếu không nên so với chỉ số 100% cổ phiếu.

## Thực hành

Với tài khoản mô phỏng của bạn, ghi lại giá trị danh mục cuối mỗi tháng. Sau vài tháng, tính tổng lợi suất, max drawdown và so với một chỉ số tham chiếu; ghi nhận xét vào [Nhật ký](/journal).`,
        questions: [
          {
            prompt: 'Danh mục tăng từ 100 triệu lên 133,1 triệu sau 3 năm. CAGR bằng bao nhiêu?',
            options: ['11,03%/năm', '33,1%/năm', '10%/năm', '12,7%/năm'],
            correct_index: 2,
            explanation: 'CAGR = (133,1 / 100)^(1/3) − 1 = 10%, vì 1,1³ = 1,331.',
          },
          {
            prompt: 'Danh mục lên đỉnh 125 triệu rồi giảm về 100 triệu. Mức sụt giảm tối đa (max drawdown) là bao nhiêu?',
            options: ['−20%', '−25%', '−80%', '−12,5%'],
            correct_index: 0,
            explanation: 'Max drawdown = (100 − 125) / 125 = −20% (tính trên đỉnh, không phải trên đáy).',
          },
          {
            prompt: 'Lợi suất danh mục 10%, lợi suất phi rủi ro 4%, độ biến động 15%. Tỷ lệ Sharpe bằng bao nhiêu?',
            options: ['0,67', '0,27', '2,5', '0,4'],
            correct_index: 3,
            explanation: 'Sharpe = (10% − 4%) / 15% = 0,4.',
          },
          {
            prompt: 'Vì sao nên so sánh hiệu quả danh mục với một chỉ số tham chiếu phù hợp?',
            options: ['Để biết công sức chọn lựa của mình có tốt hơn một phương án đơn giản với rủi ro tương đương hay không', 'Vì chỉ số luôn lãi', 'Để chứng minh danh mục không bao giờ lỗ', 'Vì luật bắt buộc'],
            correct_index: 0,
            explanation: 'Benchmark là phương án thay thế dễ dàng nhất; nếu không vượt được nó (tính cả rủi ro), cần xem lại chiến lược.',
          },
        ],
      },
    ],
  },
]
