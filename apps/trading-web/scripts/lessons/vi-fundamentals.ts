import type { SeedChapter } from './types'

// Phân tích cơ bản (vi) — mọi bài dùng chung số liệu năm 2025 của "Công ty ABC" (đơn vị: tỷ đồng, 100 triệu cổ phiếu, giá 21.000 đ)
// để các con số khớp nhau giữa 3 báo cáo và các chỉ số.
export const VI_FUNDAMENTALS: SeedChapter[] = [
  {
    slug: 'doc-bao-cao-tai-chinh',
    title: 'Đọc báo cáo tài chính',
    description: 'Ba báo cáo tài chính cốt lõi: kết quả kinh doanh, cân đối kế toán và lưu chuyển tiền tệ.',
    lessons: [
      {
        slug: 'tong-quan-bao-cao-tai-chinh',
        title: 'Tổng quan về báo cáo tài chính',
        summary: 'Báo cáo tài chính là gì, gồm những phần nào, tìm ở đâu và vì sao nhà đầu tư cần đọc.',
        content_md: `## Phân tích cơ bản là gì?

Phân tích kỹ thuật nhìn vào **biểu đồ giá** để đoán hành vi đám đông. Phân tích cơ bản thì hỏi một câu khác: **doanh nghiệp này thực sự đáng giá bao nhiêu?** Khi mua một cổ phiếu, bạn đang mua một phần nhỏ của doanh nghiệp — nên bạn cần biết nó kiếm tiền ra sao, nợ bao nhiêu và tiền mặt đi đâu. Câu trả lời nằm trong **báo cáo tài chính (BCTC)**.

## Bộ BCTC gồm những gì?

| Báo cáo | Trả lời câu hỏi | Ví von |
|---|---|---|
| **Kết quả hoạt động kinh doanh** (KQKD) | Trong kỳ, công ty lãi hay lỗ bao nhiêu? | Thước phim về một khoảng thời gian |
| **Bảng cân đối kế toán** (CĐKT) | Tại một ngày, công ty có gì và nợ ai? | Bức ảnh chụp tại một thời điểm |
| **Lưu chuyển tiền tệ** (LCTT) | Tiền mặt thực sự vào/ra bao nhiêu? | Sao kê tài khoản ngân hàng |
| **Thuyết minh BCTC** | Các con số được tính thế nào? | Phần chú thích chi tiết |

Ba báo cáo liên kết chặt với nhau: lợi nhuận trong KQKD làm tăng vốn chủ sở hữu trên CĐKT, còn LCTT giải thích vì sao số dư tiền đầu kỳ biến thành số dư cuối kỳ.

## Kỳ báo cáo và kiểm toán

- **BCTC quý:** công bố sau mỗi quý, chưa kiểm toán — cập nhật nhanh nhưng độ tin cậy thấp hơn.
- **BCTC bán niên:** được kiểm toán viên **soát xét**.
- **BCTC năm:** được **kiểm toán** — đáng tin cậy nhất. Hãy đọc kỹ **ý kiến kiểm toán**: "chấp nhận toàn phần" là tốt; "ngoại trừ" là tín hiệu cảnh báo; "trái ngược" hay "từ chối đưa ra ý kiến" là cảnh báo nghiêm trọng.

Doanh nghiệp có công ty con sẽ công bố cả **BCTC riêng** (công ty mẹ) và **BCTC hợp nhất** (cả tập đoàn). Nhà đầu tư thường dùng **báo cáo hợp nhất** vì nó phản ánh toàn bộ hoạt động.

## Tìm BCTC ở đâu?

- Mục "Quan hệ cổ đông" trên website của doanh nghiệp.
- Website sở giao dịch (HOSE, HNX) và các trang dữ liệu tài chính.
- Với cổ phiếu Mỹ: báo cáo năm **10-K** và báo cáo quý **10-Q** trên hệ thống SEC EDGAR.

## Công ty ví dụ của chương này

Các bài tiếp theo dùng chung số liệu năm 2025 của **Công ty ABC** (đơn vị: tỷ đồng): doanh thu **1.000**, lợi nhuận sau thuế **140**, tổng tài sản **1.200**, vốn chủ sở hữu **700**, **100 triệu** cổ phiếu đang lưu hành, giá thị trường **21.000 đ/cổ phiếu**. Nhờ dùng chung một công ty, bạn sẽ thấy rõ các báo cáo khớp với nhau như thế nào.

## Thực hành

Chọn một doanh nghiệp niêm yết mà bạn quen (ngân hàng, bán lẻ, sữa…), tải BCTC năm gần nhất và chỉ ra 3 thứ: tổng doanh thu, lợi nhuận sau thuế và ý kiến của kiểm toán viên.`,
        questions: [
          {
            prompt: 'Báo cáo nào cho biết công ty có gì và nợ ai tại MỘT thời điểm?',
            options: ['Báo cáo kết quả kinh doanh', 'Bảng cân đối kế toán', 'Báo cáo lưu chuyển tiền tệ', 'Biên bản họp cổ đông'],
            correct_index: 1,
            explanation: 'Bảng cân đối kế toán là "bức ảnh" tài sản, nợ và vốn chủ tại ngày lập báo cáo.',
          },
          {
            prompt: 'BCTC kỳ nào có độ tin cậy cao nhất?',
            options: ['BCTC quý', 'BCTC năm đã kiểm toán', 'Bản tin nội bộ', 'Kế hoạch kinh doanh năm sau'],
            correct_index: 1,
            explanation: 'BCTC năm được kiểm toán độc lập kiểm tra nên đáng tin cậy nhất.',
          },
          {
            prompt: 'Ý kiến kiểm toán nào là tín hiệu TỐT?',
            options: ['Từ chối đưa ra ý kiến', 'Ý kiến trái ngược', 'Chấp nhận toàn phần', 'Ý kiến ngoại trừ'],
            correct_index: 2,
            explanation: '"Chấp nhận toàn phần" nghĩa là kiểm toán viên cho rằng BCTC trình bày trung thực, hợp lý.',
          },
          {
            prompt: 'Với doanh nghiệp có nhiều công ty con, nhà đầu tư nên ưu tiên đọc báo cáo nào?',
            options: ['BCTC riêng của công ty mẹ', 'BCTC hợp nhất', 'Báo cáo thường niên của đối thủ', 'Chỉ cần đọc tin tức'],
            correct_index: 1,
            explanation: 'BCTC hợp nhất gộp cả tập đoàn, phản ánh đầy đủ hoạt động mà cổ đông đang sở hữu.',
          },
        ],
      },
      {
        slug: 'bao-cao-ket-qua-kinh-doanh',
        title: 'Báo cáo kết quả hoạt động kinh doanh',
        summary: 'Đi từ doanh thu xuống lợi nhuận sau thuế: lợi nhuận gộp, lợi nhuận hoạt động và các khoản chi phí.',
        content_md: `## Đọc từ trên xuống dưới

Báo cáo kết quả kinh doanh (KQKD) đi từ **doanh thu** ở dòng trên cùng, trừ dần từng loại chi phí, xuống tới **lợi nhuận sau thuế** ở dòng dưới cùng. Đây là KQKD năm 2025 của Công ty ABC (tỷ đồng):

| Khoản mục | Số tiền |
|---|---|
| Doanh thu thuần | 1.000 |
| − Giá vốn hàng bán | (600) |
| **= Lợi nhuận gộp** | **400** |
| − Chi phí bán hàng và quản lý doanh nghiệp | (200) |
| **= Lợi nhuận hoạt động (EBIT — trước lãi vay và thuế)** | **200** |
| − Chi phí lãi vay | (25) |
| **= Lợi nhuận trước thuế** | **175** |
| − Thuế thu nhập doanh nghiệp (20%) | (35) |
| **= Lợi nhuận sau thuế (LNST)** | **140** |

## Ý nghĩa của từng tầng lợi nhuận

- **Doanh thu thuần:** tiền bán hàng sau khi trừ chiết khấu, hàng bán bị trả lại. Doanh thu tăng đều qua các năm cho thấy sản phẩm đang được thị trường đón nhận.
- **Lợi nhuận gộp:** doanh thu trừ chi phí trực tiếp làm ra sản phẩm. Nó cho biết sản phẩm "lãi" bao nhiêu trước khi tính bộ máy vận hành.
- **EBIT:** lợi nhuận từ **hoạt động cốt lõi**, chưa tính chi phí vay và thuế. Dùng EBIT để so sánh các công ty có cơ cấu nợ khác nhau. Lưu ý: trên BCTC theo chuẩn mực Việt Nam, chỉ tiêu "Lợi nhuận thuần từ hoạt động kinh doanh" đã trừ chi phí tài chính (gồm lãi vay), nên không phải EBIT; có thể ước tính EBIT ≈ lợi nhuận trước thuế + chi phí lãi vay.
- **LNST:** phần lợi nhuận cuối cùng thuộc về cổ đông. Đây là "bottom line" mà báo chí hay nhắc đến.

## Chia cho số cổ phiếu: EPS

Chia LNST cho số cổ phiếu đang lưu hành ta được **EPS — lợi nhuận trên mỗi cổ phiếu**:

> EPS = 140 tỷ đ / 100 triệu cổ phiếu = **1.400 đ/cổ phiếu**

Lưu ý: với BCTC hợp nhất, EPS công bố được tính từ LNST **của cổ đông công ty mẹ** chia số cổ phiếu lưu hành **bình quân** trong kỳ (ở Việt Nam còn trừ quỹ khen thưởng, phúc lợi), nên con số tự tính có thể lệch đôi chút. EPS sẽ là nền tảng của chỉ số P/E ở chương sau.

## Những điểm cần cảnh giác

- **Lợi nhuận bất thường:** lãi từ bán đất, thanh lý công ty con, hoàn nhập dự phòng… làm LNST tăng vọt một lần nhưng không lặp lại. Hãy tách riêng "lợi nhuận khác" và lợi nhuận tài chính để thấy sức khoẻ của mảng kinh doanh chính.
- **Doanh thu tăng nhưng lợi nhuận gộp giảm:** công ty có thể đang giảm giá bán để giành thị phần, hoặc chi phí đầu vào tăng.
- **So sánh cùng kỳ:** nhiều ngành có tính mùa vụ (bán lẻ mạnh dịp Tết), nên so quý 4 năm nay với **quý 4 năm trước**, đừng so với quý 3.

## Thực hành

Với KQKD của ABC, hãy tự tính lại: nếu giá vốn tăng lên 650 tỷ (các khoản khác giữ nguyên) thì lợi nhuận gộp, lợi nhuận trước thuế và LNST còn bao nhiêu? (Gợi ý: LNST giảm 40 tỷ, còn 100 tỷ.)`,
        questions: [
          {
            prompt: 'Lợi nhuận gộp được tính như thế nào?',
            options: ['Doanh thu thuần − giá vốn hàng bán', 'Doanh thu − thuế', 'LNST + lãi vay', 'Tổng tài sản − nợ phải trả'],
            correct_index: 0,
            explanation: 'Lợi nhuận gộp = doanh thu thuần trừ chi phí trực tiếp làm ra sản phẩm (giá vốn).',
          },
          {
            prompt: 'Công ty có LNST 140 tỷ đồng và 100 triệu cổ phiếu. EPS bằng bao nhiêu?',
            options: ['140 đ', '1.400 đ', '14.000 đ', '1,4 đ'],
            correct_index: 1,
            explanation: 'EPS = 140.000.000.000 / 100.000.000 = 1.400 đ mỗi cổ phiếu.',
          },
          {
            prompt: 'Vì sao nên dùng EBIT khi so sánh hai công ty cùng ngành?',
            options: ['Vì EBIT luôn lớn hơn doanh thu', 'Vì EBIT loại bỏ khác biệt về chi phí vay và thuế, phản ánh hoạt động cốt lõi', 'Vì EBIT đã gồm cả cổ tức', 'Vì EBIT không cần kiểm toán'],
            correct_index: 1,
            explanation: 'EBIT là lợi nhuận trước lãi vay và thuế, nên công ty vay nhiều hay ít vẫn so sánh được hoạt động kinh doanh chính.',
          },
          {
            prompt: 'LNST tăng 80% chủ yếu nhờ bán một khu đất. Nhà đầu tư nên hiểu thế nào?',
            options: ['Doanh nghiệp chắc chắn tăng trưởng bền vững', 'Đây là lợi nhuận bất thường, khó lặp lại — cần xem mảng kinh doanh chính', 'Nên mua ngay vì EPS tăng', 'Báo cáo bị sai'],
            correct_index: 1,
            explanation: 'Lãi từ thanh lý tài sản chỉ xảy ra một lần; sức mạnh thật nằm ở lợi nhuận từ hoạt động kinh doanh cốt lõi.',
          },
        ],
      },
      {
        slug: 'bang-can-doi-ke-toan',
        title: 'Bảng cân đối kế toán',
        summary: 'Tài sản = Nợ phải trả + Vốn chủ sở hữu: công ty sở hữu gì, nợ bao nhiêu và thuộc về cổ đông bao nhiêu.',
        content_md: `## Phương trình cân đối

Mọi bảng cân đối kế toán (CĐKT) đều tuân theo một phương trình:

> **Tài sản = Nợ phải trả + Vốn chủ sở hữu**

Vế trái cho biết công ty **đang nắm giữ gì**; vế phải cho biết **tiền để mua các tài sản đó đến từ đâu** — đi vay (nợ) hay của cổ đông (vốn chủ). Hai vế luôn bằng nhau, nên mới gọi là "cân đối".

## CĐKT của Công ty ABC tại 31/12/2025 (tỷ đồng)

| Tài sản | | Nguồn vốn | |
|---|---|---|---|
| Tiền và tương đương tiền | 100 | Phải trả nhà cung cấp | 150 |
| Phải thu khách hàng | 200 | Vay ngắn hạn | 250 |
| Hàng tồn kho | 300 | **Nợ ngắn hạn** | **400** |
| **Tài sản ngắn hạn** | **600** | Vay dài hạn | 100 |
| Tài sản cố định, dài hạn khác | 600 | **Nợ phải trả** | **500** |
| | | **Vốn chủ sở hữu** | **700** |
| **Tổng tài sản** | **1.200** | **Tổng nguồn vốn** | **1.200** |

## Ngắn hạn và dài hạn

- **Tài sản ngắn hạn:** có thể chuyển thành tiền trong vòng 12 tháng — tiền, khoản phải thu, hàng tồn kho.
- **Tài sản dài hạn:** nhà xưởng, máy móc, đất đai… phục vụ sản xuất nhiều năm.
- **Nợ ngắn hạn:** phải trả trong 12 tháng. Nếu nợ ngắn hạn lớn hơn tài sản ngắn hạn, công ty có thể gặp khó khăn trả nợ.
- **Nợ dài hạn:** khoản vay kéo dài nhiều năm.

Chú ý: **nợ phải trả không phải lúc nào cũng là vay**. Ở ABC, 150 tỷ phải trả nhà cung cấp là tiền hàng chưa thanh toán, không mất lãi. Phần **nợ vay** (chịu lãi) chỉ là 250 + 100 = **350 tỷ**.

## Vốn chủ sở hữu và giá trị sổ sách

Vốn chủ sở hữu = tổng tài sản − nợ phải trả = 1.200 − 500 = **700 tỷ**. Đây là phần thuộc về cổ đông nếu (về lý thuyết) bán hết tài sản và trả hết nợ. Chia cho số cổ phiếu ta có **giá trị sổ sách mỗi cổ phiếu (BVPS)**:

> BVPS = 700 tỷ / 100 triệu cp = **7.000 đ/cổ phiếu**

LNST hằng năm (sau khi chia cổ tức) được giữ lại và cộng vào vốn chủ — nên một công ty làm ăn tốt sẽ thấy vốn chủ tăng đều qua các năm.

## Những điểm cần cảnh giác

- **Phải thu tăng nhanh hơn doanh thu:** công ty có thể đang bán chịu dễ dãi để "đẩy" doanh thu, rủi ro không thu được tiền.
- **Hàng tồn kho phình to:** hàng bán chậm, có thể phải giảm giá hoặc trích lập dự phòng.
- **Vốn chủ âm:** lỗ lũy kế đã ăn hết vốn của cổ đông — rủi ro rất cao.

## Thực hành

So sánh CĐKT của cùng một doanh nghiệp ở hai năm liên tiếp: vốn chủ tăng hay giảm? Khoản phải thu và hàng tồn kho tăng nhanh hơn hay chậm hơn doanh thu?`,
        questions: [
          {
            prompt: 'Phương trình cơ bản của bảng cân đối kế toán là gì?',
            options: ['Doanh thu = Chi phí + Lợi nhuận', 'Tài sản = Nợ phải trả + Vốn chủ sở hữu', 'Tiền = Doanh thu − Thuế', 'Vốn chủ = Tài sản + Nợ'],
            correct_index: 1,
            explanation: 'Tài sản luôn được tài trợ bởi nợ hoặc vốn của cổ đông, nên hai vế luôn bằng nhau.',
          },
          {
            prompt: 'Tổng tài sản 1.200 tỷ, nợ phải trả 500 tỷ. Vốn chủ sở hữu bằng bao nhiêu?',
            options: ['1.700 tỷ', '500 tỷ', '700 tỷ', '2,4 tỷ'],
            correct_index: 2,
            explanation: 'Vốn chủ = tài sản − nợ phải trả = 1.200 − 500 = 700 tỷ.',
          },
          {
            prompt: 'Khoản nào sau đây là tài sản ngắn hạn?',
            options: ['Nhà xưởng', 'Hàng tồn kho', 'Vay dài hạn', 'Vốn góp của chủ sở hữu'],
            correct_index: 1,
            explanation: 'Hàng tồn kho dự kiến bán và thu tiền trong vòng 12 tháng nên là tài sản ngắn hạn.',
          },
          {
            prompt: 'Khoản phải thu tăng 60% trong khi doanh thu chỉ tăng 10%. Điều này gợi ý gì?',
            options: ['Công ty thu tiền ngày càng nhanh', 'Công ty có thể đang bán chịu dễ dãi, rủi ro không thu được tiền', 'Công ty sắp chia cổ tức lớn', 'Không có ý nghĩa gì'],
            correct_index: 1,
            explanation: 'Phải thu tăng nhanh hơn doanh thu nghĩa là tiền bị khách hàng chiếm dụng nhiều hơn — cần theo dõi chất lượng doanh thu.',
          },
        ],
      },
      {
        slug: 'bao-cao-luu-chuyen-tien-te',
        title: 'Báo cáo lưu chuyển tiền tệ',
        summary: 'Lợi nhuận chưa chắc là tiền: ba dòng tiền kinh doanh, đầu tư, tài chính và dòng tiền tự do.',
        content_md: `## Lợi nhuận khác tiền mặt

Kế toán ghi nhận doanh thu khi **bán hàng**, chứ không phải khi **thu được tiền**. Vì vậy một công ty có thể báo lãi lớn nhưng vẫn cạn tiền — nếu khách hàng chưa trả hoặc tiền bị chôn trong hàng tồn kho. Báo cáo lưu chuyển tiền tệ (LCTT) cho biết **tiền mặt thật** vào và ra.

## Ba dòng tiền

LCTT năm 2025 của Công ty ABC (tỷ đồng): (trình bày theo phương pháp gián tiếp, bắt đầu từ LNST cho dễ theo dõi; trên BCTC Việt Nam, dòng đầu tiên là lợi nhuận trước thuế và thuế TNDN đã nộp được trừ ở bên dưới)

| Khoản mục | Số tiền |
|---|---|
| Lợi nhuận sau thuế | 140 |
| + Khấu hao (chi phí không dùng tiền) | 60 |
| − Tăng phải thu khách hàng | (30) |
| − Tăng hàng tồn kho | (40) |
| + Tăng phải trả nhà cung cấp | 10 |
| **Dòng tiền từ hoạt động kinh doanh (CFO)** | **140** |
| Mua sắm tài sản cố định | (90) |
| **Dòng tiền từ hoạt động đầu tư (CFI)** | **(90)** |
| Trả cổ tức | (40) |
| Vay ròng thêm | 10 |
| **Dòng tiền từ hoạt động tài chính (CFF)** | **(30)** |
| **Tăng/giảm tiền trong năm** | **20** |

Tiền đầu năm 80 + 20 = **100 tỷ** cuối năm — đúng bằng dòng "tiền" trên bảng cân đối kế toán. Ba báo cáo khớp nhau.

## Ý nghĩa từng dòng

- **CFO (kinh doanh):** tiền mà hoạt động cốt lõi tạo ra. Một doanh nghiệp khoẻ có CFO **dương và xấp xỉ hoặc lớn hơn LNST** qua nhiều năm.
- **CFI (đầu tư):** thường **âm** vì công ty chi tiền mua máy móc, mở rộng. Âm không xấu — miễn là đầu tư hiệu quả.
- **CFF (tài chính):** tiền vay/trả nợ, phát hành cổ phiếu, chia cổ tức.

## Dòng tiền tự do (FCF)

> **FCF = CFO − chi mua tài sản cố định = 140 − 90 = 50 tỷ**

FCF là tiền còn lại sau khi duy trì và mở rộng hoạt động — nguồn để trả cổ tức, trả nợ hoặc mua lại cổ phiếu mà không phải đi vay. ABC chia 40 tỷ cổ tức, nhỏ hơn FCF 50 tỷ → cổ tức đang được trả bằng tiền thật kiếm được.

## Những điểm cần cảnh giác

- **LNST dương nhưng CFO âm nhiều năm liền:** lợi nhuận "trên giấy", tiền bị kẹt ở phải thu/tồn kho. Đây là một trong những dấu hiệu cảnh báo quan trọng nhất.
- **Chia cổ tức lớn trong khi FCF âm:** công ty đang đi vay để trả cổ tức — khó bền vững.
- **CFF dương liên tục và lớn:** doanh nghiệp sống nhờ vay (nợ ngày càng tăng) hoặc phát hành cổ phiếu mới (pha loãng phần sở hữu của bạn).

## Thực hành

Lấy LCTT 3 năm gần nhất của một doanh nghiệp, so sánh CFO với LNST từng năm. Nếu CFO thường xuyên thấp hơn nhiều so với LNST, hãy tìm trong bảng cân đối xem tiền đang bị kẹt ở đâu.`,
        questions: [
          {
            prompt: 'Vì sao một công ty báo lãi vẫn có thể thiếu tiền mặt?',
            options: ['Vì kế toán ghi nhận doanh thu khi bán hàng, tiền có thể chưa thu về hoặc nằm trong hàng tồn kho', 'Vì lợi nhuận luôn bằng tiền mặt', 'Vì thuế được trả hai lần', 'Vì cổ đông rút vốn mỗi ngày'],
            correct_index: 0,
            explanation: 'Lợi nhuận là con số kế toán; tiền thật có thể bị kẹt ở khoản phải thu, hàng tồn kho.',
          },
          {
            prompt: 'CFO = 140 tỷ, chi mua tài sản cố định = 90 tỷ. Dòng tiền tự do (FCF) bằng bao nhiêu?',
            options: ['230 tỷ', '50 tỷ', '140 tỷ', '−90 tỷ'],
            correct_index: 1,
            explanation: 'FCF = CFO − chi đầu tư tài sản cố định = 140 − 90 = 50 tỷ.',
          },
          {
            prompt: 'Dòng tiền từ hoạt động đầu tư (CFI) âm thường có nghĩa là gì?',
            options: ['Công ty sắp phá sản', 'Công ty đang chi tiền mua tài sản, mở rộng hoạt động', 'Công ty bị lỗ', 'Công ty không trả cổ tức'],
            correct_index: 1,
            explanation: 'CFI âm vì tiền đi ra để mua máy móc, nhà xưởng — điều bình thường ở doanh nghiệp đang phát triển.',
          },
          {
            prompt: 'Dấu hiệu cảnh báo nào sau đây là nghiêm trọng nhất?',
            options: ['CFI âm một năm', 'LNST dương nhưng CFO âm nhiều năm liên tiếp', 'CFO lớn hơn LNST', 'Có trả cổ tức tiền mặt'],
            correct_index: 1,
            explanation: 'Lãi trên giấy mà không ra tiền trong nhiều năm cho thấy chất lượng lợi nhuận rất kém.',
          },
        ],
      },
    ],
  },
  {
    slug: 'chi-so-tai-chinh-co-ban',
    title: 'Các chỉ số tài chính cơ bản',
    description: 'Định giá (EPS, P/E, P/B), khả năng sinh lời (ROE, ROA, biên lợi nhuận) và sức khoẻ tài chính.',
    lessons: [
      {
        slug: 'eps-pe-pb',
        title: 'Chỉ số định giá: EPS, P/E và P/B',
        summary: 'Cổ phiếu đắt hay rẻ so với lợi nhuận và tài sản của doanh nghiệp.',
        content_md: `## Giá cổ phiếu cao chưa chắc là đắt

Cổ phiếu giá 100.000 đ chưa chắc đắt hơn cổ phiếu giá 10.000 đ. Điều quan trọng là **với số tiền đó, bạn nhận được bao nhiêu lợi nhuận và tài sản**. Các chỉ số định giá trả lời câu hỏi này.

## EPS — lợi nhuận trên mỗi cổ phiếu

> **EPS = LNST / số cổ phiếu đang lưu hành**

Công ty ABC: 140 tỷ / 100 triệu cp = **1.400 đ**. EPS **tăng đều qua nhiều năm** là dấu hiệu doanh nghiệp tăng trưởng thật. Lưu ý: khi công ty phát hành thêm cổ phiếu, EPS có thể giảm dù tổng lợi nhuận không đổi — gọi là **pha loãng**.

## P/E — giá trên lợi nhuận

> **P/E = Giá cổ phiếu / EPS**

ABC: 21.000 / 1.400 = **15 lần**. Hiểu đơn giản: bạn đang trả **15 đồng cho mỗi 1 đồng lợi nhuận** hằng năm; nếu lợi nhuận giữ nguyên, cần khoảng 15 năm để lợi nhuận "hoàn vốn" giá mua.

- P/E **thấp** có thể là rẻ — hoặc thị trường kỳ vọng lợi nhuận sẽ giảm.
- P/E **cao** có thể là đắt — hoặc nhà đầu tư kỳ vọng tăng trưởng mạnh.
- P/E **không dùng được** khi công ty lỗ (EPS âm).

Vì vậy P/E chỉ có ý nghĩa khi **so sánh**: với các công ty cùng ngành, với P/E trung bình của chính nó trong quá khứ, và với tốc độ tăng trưởng lợi nhuận.

## P/B — giá trên giá trị sổ sách

> **P/B = Giá cổ phiếu / Giá trị sổ sách mỗi cổ phiếu (BVPS)**

ABC: BVPS = 7.000 đ → P/B = 21.000 / 7.000 = **3 lần**. Thị trường đang trả gấp 3 lần giá trị vốn chủ trên sổ sách, vì ABC dùng vốn đó sinh lời tốt (ROE 20% — xem bài sau).

P/B đặc biệt hữu ích với **ngân hàng, bảo hiểm, chứng khoán** — những ngành mà tài sản chủ yếu là tài sản tài chính, giá trị sổ sách phản ánh khá sát giá trị thật. Với công ty công nghệ, phần mềm, P/B ít ý nghĩa vì tài sản chính (thương hiệu, con người) không nằm trên sổ sách.

## Vốn hoá thị trường

> **Vốn hoá = Giá cổ phiếu × số cổ phiếu = 21.000 × 100 triệu = 2.100 tỷ đ**

Cách tính khác cho cùng kết quả: P/E = vốn hoá / LNST = 2.100 / 140 = 15.

## Thực hành

Một công ty có giá 30.000 đ, EPS 2.000 đ, BVPS 15.000 đ. Hãy tính P/E và P/B. (Đáp án: P/E = 15, P/B = 2.) Sau đó tra P/E của hai doanh nghiệp cùng ngành và tự hỏi: vì sao thị trường trả giá khác nhau?`,
        questions: [
          {
            prompt: 'Giá cổ phiếu 21.000 đ, EPS 1.400 đ. P/E bằng bao nhiêu?',
            options: ['1,5', '15', '29.400', '0,067'],
            correct_index: 1,
            explanation: 'P/E = giá / EPS = 21.000 / 1.400 = 15.',
          },
          {
            prompt: 'P/E bằng 15 có thể hiểu là gì?',
            options: ['Cổ phiếu tăng 15% mỗi năm', 'Nhà đầu tư trả 15 đồng cho mỗi 1 đồng lợi nhuận hằng năm', 'Công ty có 15 năm hoạt động', 'Cổ tức bằng 15%'],
            correct_index: 1,
            explanation: 'P/E đo số tiền nhà đầu tư sẵn sàng trả cho mỗi đồng lợi nhuận của doanh nghiệp.',
          },
          {
            prompt: 'Chỉ số P/B đặc biệt hữu ích khi định giá ngành nào?',
            options: ['Phần mềm', 'Ngân hàng', 'Trò chơi điện tử', 'Thương hiệu thời trang'],
            correct_index: 1,
            explanation: 'Tài sản ngân hàng chủ yếu là tài sản tài chính, nên giá trị sổ sách phản ánh khá sát giá trị thật.',
          },
          {
            prompt: 'Vì sao không thể chỉ nhìn P/E thấp để kết luận cổ phiếu rẻ?',
            options: ['Vì P/E thấp luôn là lừa đảo', 'Vì thị trường có thể đang kỳ vọng lợi nhuận sắp giảm', 'Vì P/E chỉ dùng cho crypto', 'Vì P/E không tính được'],
            correct_index: 1,
            explanation: 'P/E thấp có thể phản ánh triển vọng xấu; cần so với ngành, lịch sử và tốc độ tăng trưởng.',
          },
        ],
      },
      {
        slug: 'roe-roa-bien-loi-nhuan',
        title: 'Khả năng sinh lời: ROE, ROA và biên lợi nhuận',
        summary: 'Doanh nghiệp tạo ra bao nhiêu lợi nhuận từ doanh thu, tài sản và vốn của cổ đông.',
        content_md: `## Lớn chưa chắc đã giỏi

Hai công ty cùng lãi 140 tỷ chưa chắc giỏi như nhau: một công ty cần 700 tỷ vốn, công ty kia cần 3.000 tỷ. Các chỉ số **khả năng sinh lời** đo lợi nhuận **so với nguồn lực** đã bỏ ra.

## Ba biên lợi nhuận

Từ KQKD của Công ty ABC (doanh thu 1.000 tỷ):

| Chỉ số | Công thức | ABC |
|---|---|---|
| Biên lợi nhuận gộp | Lợi nhuận gộp / Doanh thu | 400 / 1.000 = **40%** |
| Biên lợi nhuận hoạt động | EBIT / Doanh thu | 200 / 1.000 = **20%** |
| Biên lợi nhuận ròng | LNST / Doanh thu | 140 / 1.000 = **14%** |

- **Biên gộp cao và ổn định** thường cho thấy lợi thế cạnh tranh: thương hiệu mạnh, sản phẩm khác biệt, khách hàng chấp nhận giá cao.
- **Biên hoạt động** cho thấy bộ máy vận hành có gọn nhẹ không.
- Biên lợi nhuận **khác nhau rất xa giữa các ngành**: siêu thị có biên ròng chỉ vài phần trăm, phần mềm có thể trên 20%. Chỉ so sánh trong cùng ngành.

## ROA — lợi nhuận trên tổng tài sản

> **ROA = LNST / Tổng tài sản = 140 / 1.200 ≈ 11,7%**

ROA cho biết mỗi 100 đồng tài sản tạo ra bao nhiêu đồng lợi nhuận — đo hiệu quả sử dụng **toàn bộ** tài sản, bất kể tài trợ bằng nợ hay vốn chủ. Ngân hàng thường có ROA chỉ 1–2% vì tài sản rất lớn, nên đừng so ROA ngân hàng với công ty sản xuất.

## ROE — lợi nhuận trên vốn chủ sở hữu

> **ROE = LNST / Vốn chủ sở hữu = 140 / 700 = 20%**

ROE là chỉ số cổ đông quan tâm nhất: **mỗi 100 đồng vốn của cổ đông sinh ra bao nhiêu đồng lãi mỗi năm**. ROE duy trì **trên 15% trong nhiều năm** thường là dấu hiệu của doanh nghiệp chất lượng.

## Phân tích DuPont: ROE đến từ đâu?

> **ROE = Biên ròng × Vòng quay tài sản × Đòn bẩy tài chính**
>
> = (LNST / Doanh thu) × (Doanh thu / Tổng tài sản) × (Tổng tài sản / Vốn chủ)
>
> = 14% × 0,83 × 1,71 ≈ **20%**

Cùng ROE 20%, nhưng nếu đến từ **biên lợi nhuận cao** thì bền vững hơn nhiều so với đến từ **vay nợ nhiều** (đòn bẩy cao). Vì vậy ROE cao bất thường cần kiểm tra xem công ty có đang gánh nhiều nợ không.

## Thực hành

Doanh nghiệp X có doanh thu 2.000 tỷ, LNST 100 tỷ, tổng tài sản 2.500 tỷ, vốn chủ 500 tỷ. Tính biên ròng, ROA, ROE. (Đáp án: 5%, 4%, 20%.) ROE bằng ABC — nhưng X đạt được nhờ đâu? (Gợi ý: đòn bẩy 2.500 / 500 = 5 lần.)`,
        questions: [
          {
            prompt: 'LNST 140 tỷ, vốn chủ sở hữu 700 tỷ. ROE bằng bao nhiêu?',
            options: ['14%', '20%', '11,7%', '5%'],
            correct_index: 1,
            explanation: 'ROE = LNST / vốn chủ = 140 / 700 = 20%.',
          },
          {
            prompt: 'Biên lợi nhuận gộp cao và ổn định qua nhiều năm thường cho thấy điều gì?',
            options: ['Công ty có lợi thế cạnh tranh, định giá sản phẩm tốt', 'Công ty vay nợ nhiều', 'Công ty sắp phát hành cổ phiếu', 'Công ty không đóng thuế'],
            correct_index: 0,
            explanation: 'Giữ được biên gộp cao nghĩa là khách hàng chấp nhận mức giá — dấu hiệu của thương hiệu hoặc sản phẩm khác biệt.',
          },
          {
            prompt: 'Vì sao không nên so sánh biên lợi nhuận ròng của siêu thị với công ty phần mềm?',
            options: ['Vì siêu thị không có lợi nhuận', 'Vì mô hình kinh doanh mỗi ngành khác nhau, biên lợi nhuận đặc thù rất khác', 'Vì phần mềm không có doanh thu', 'Vì biên lợi nhuận chỉ dùng cho ngân hàng'],
            correct_index: 1,
            explanation: 'Mỗi ngành có cấu trúc chi phí riêng; chỉ so biên lợi nhuận giữa các công ty cùng ngành.',
          },
          {
            prompt: 'Theo phân tích DuPont, ROE cao nhưng chủ yếu nhờ đòn bẩy tài chính lớn có nghĩa là gì?',
            options: ['Công ty hoàn toàn không có rủi ro', 'ROE đến từ vay nợ nhiều — kém bền vững và rủi ro hơn', 'Biên lợi nhuận rất cao', 'Công ty không có nợ'],
            correct_index: 1,
            explanation: 'Đòn bẩy cao khuếch đại cả lãi lẫn lỗ; ROE dựa vào nợ dễ sụt mạnh khi kinh doanh đi xuống.',
          },
        ],
      },
      {
        slug: 'suc-khoe-tai-chinh',
        title: 'Sức khoẻ tài chính: nợ và khả năng thanh toán',
        summary: 'Hệ số nợ, khả năng thanh toán ngắn hạn và khả năng trả lãi vay.',
        content_md: `## Vì sao phải xem nợ?

Lợi nhuận cho biết công ty **giỏi kiếm tiền** đến đâu; các chỉ số sức khoẻ tài chính cho biết công ty **có trụ được qua giai đoạn khó khăn** hay không. Nhiều doanh nghiệp làm ăn có lãi vẫn phá sản vì **không trả được nợ đến hạn**.

## Hệ số nợ vay trên vốn chủ (D/E)

> **D/E = Nợ vay (chịu lãi) / Vốn chủ sở hữu = (250 + 100) / 700 = 0,5**

Mỗi đồng vốn của cổ đông, ABC vay thêm 0,5 đồng. Một số nguồn tính D/E bằng **tổng nợ phải trả** / vốn chủ (500 / 700 ≈ 0,71) — hãy xem rõ định nghĩa khi so sánh.

- D/E **dưới 1** thường được xem là an toàn với doanh nghiệp sản xuất, thương mại.
- Ngành **ngân hàng, bất động sản** có đặc thù dùng đòn bẩy cao — so trong cùng ngành.
- Nợ không xấu: vay để đầu tư dự án có lãi cao hơn lãi vay sẽ làm tăng ROE. Nhưng khi lợi nhuận giảm hoặc lãi suất tăng, nợ trở thành gánh nặng.

## Khả năng thanh toán ngắn hạn

> **Hệ số thanh toán hiện hành = Tài sản ngắn hạn / Nợ ngắn hạn = 600 / 400 = 1,5**

Mỗi đồng nợ phải trả trong 12 tháng, ABC có 1,5 đồng tài sản ngắn hạn để đối ứng. Dưới 1 là tín hiệu cần chú ý.

Nhưng hàng tồn kho không phải lúc nào cũng bán nhanh được. Hệ số **thanh toán nhanh** loại hàng tồn kho ra:

> **Hệ số thanh toán nhanh = (Tài sản ngắn hạn − Hàng tồn kho) / Nợ ngắn hạn = (600 − 300) / 400 = 0,75**

0,75 nghĩa là nếu không bán được hàng, ABC chưa đủ tiền và khoản phải thu để trả toàn bộ nợ ngắn hạn — cần theo dõi thêm dòng tiền kinh doanh.

## Khả năng trả lãi vay

> **Hệ số khả năng trả lãi = EBIT / Chi phí lãi vay = 200 / 25 = 8 lần**

Lợi nhuận hoạt động gấp 8 lần tiền lãi phải trả — rất thoải mái. Hệ số **dưới 1,5–2 lần** là đáng lo: chỉ cần lợi nhuận giảm nhẹ, công ty có thể không đủ tiền trả lãi.

## Tóm tắt Công ty ABC

| Chỉ số | Giá trị | Đánh giá |
|---|---|---|
| D/E (nợ vay) | 0,5 | An toàn |
| Thanh toán hiện hành | 1,5 | Ổn |
| Thanh toán nhanh | 0,75 | Phụ thuộc bán hàng tồn kho |
| Trả lãi vay | 8 lần | Rất tốt |

## Thực hành

Tìm một doanh nghiệp bất động sản và một doanh nghiệp bán lẻ, tính D/E và hệ số khả năng trả lãi của cả hai. Doanh nghiệp nào "mỏng manh" hơn nếu lãi suất tăng mạnh?`,
        questions: [
          {
            prompt: 'Nợ vay 350 tỷ, vốn chủ sở hữu 700 tỷ. Hệ số D/E bằng bao nhiêu?',
            options: ['2', '0,5', '1,05', '0,35'],
            correct_index: 1,
            explanation: 'D/E = nợ vay / vốn chủ = 350 / 700 = 0,5.',
          },
          {
            prompt: 'Hệ số thanh toán nhanh khác hệ số thanh toán hiện hành ở điểm nào?',
            options: ['Cộng thêm tài sản cố định', 'Loại hàng tồn kho ra khỏi tài sản ngắn hạn', 'Chỉ tính nợ dài hạn', 'Không khác gì'],
            correct_index: 1,
            explanation: 'Hàng tồn kho có thể khó bán nhanh, nên hệ số thanh toán nhanh loại nó ra để đánh giá thận trọng hơn.',
          },
          {
            prompt: 'EBIT 200 tỷ, chi phí lãi vay 25 tỷ. Hệ số khả năng trả lãi bằng bao nhiêu?',
            options: ['8 lần', '0,125 lần', '175 lần', '225 lần'],
            correct_index: 0,
            explanation: 'Hệ số khả năng trả lãi = EBIT / lãi vay = 200 / 25 = 8.',
          },
          {
            prompt: 'Vì sao một công ty có lãi vẫn có thể phá sản?',
            options: ['Vì lãi luôn bị đánh thuế 100%', 'Vì không có đủ tiền trả các khoản nợ đến hạn', 'Vì cổ phiếu giảm giá', 'Vì có quá nhiều cổ đông'],
            correct_index: 1,
            explanation: 'Phá sản xảy ra khi không trả được nợ đúng hạn — dòng tiền và cơ cấu nợ quan trọng không kém lợi nhuận.',
          },
        ],
      },
      {
        slug: 'ket-hop-chi-so-va-bay-thuong-gap',
        title: 'Kết hợp các chỉ số và những bẫy thường gặp',
        summary: 'Đọc chỉ số theo bối cảnh: so ngành, xem xu hướng nhiều năm và tránh các bẫy định giá.',
        content_md: `## Không có chỉ số "thần kỳ"

Mỗi chỉ số chỉ là một góc nhìn. Một cổ phiếu có P/E thấp nhưng nợ cao và dòng tiền âm có thể là bẫy; một cổ phiếu P/E cao nhưng ROE bền vững và tăng trưởng mạnh có thể vẫn hợp lý. Hãy đọc chỉ số **theo nhóm** và **theo bối cảnh**.

## Bảng kiểm tra nhanh

Áp dụng cho Công ty ABC:

| Nhóm | Câu hỏi | ABC |
|---|---|---|
| Tăng trưởng | Doanh thu và EPS có tăng đều 3–5 năm? | Cần xem lịch sử |
| Sinh lời | ROE trên 15%? Biên lợi nhuận ổn định? | ROE 20%, biên ròng 14% |
| Chất lượng lợi nhuận | CFO xấp xỉ hoặc lớn hơn LNST? | CFO 140 = LNST 140 |
| Sức khoẻ | D/E hợp lý? Trả lãi thoải mái? | D/E 0,5; trả lãi 8 lần |
| Định giá | P/E, P/B so với ngành và lịch sử? | P/E 15, P/B 3 |

## Ba nguyên tắc so sánh

1. **So với chính nó qua thời gian:** một năm đẹp chưa đủ — xu hướng 3–5 năm mới cho thấy chất lượng thật.
2. **So với doanh nghiệp cùng ngành:** ngân hàng, bán lẻ, công nghệ có "chuẩn" chỉ số rất khác nhau.
3. **So với kỳ vọng tăng trưởng:** P/E 25 với công ty tăng trưởng lợi nhuận 30%/năm có thể rẻ hơn P/E 10 với công ty đang đi xuống.

## Những bẫy thường gặp

- **Bẫy giá trị (value trap):** P/E thấp vì ngành đang suy thoái hoặc lợi nhuận năm nay có khoản bất thường. Giá rẻ và càng ngày càng rẻ hơn.
- **Lợi nhuận đỉnh chu kỳ:** ngành thép, phân bón, vận tải biển có lợi nhuận dao động mạnh. P/E trông rất thấp đúng lúc lợi nhuận đạt đỉnh — thường là thời điểm tệ để mua.
- **ROE "đẹp" nhờ nợ:** luôn kiểm tra đòn bẩy bằng phân tích DuPont.
- **Pha loãng cổ phiếu:** phát hành thêm nhiều cổ phiếu có thể làm EPS giảm dù tổng lợi nhuận tăng.
- **Chỉ đọc tin tức, không đọc báo cáo:** tiêu đề "lãi kỷ lục" có thể đến từ bán tài sản một lần.

## Phân tích cơ bản và crypto

Các chỉ số trong chương này áp dụng cho **cổ phiếu** — doanh nghiệp có doanh thu, lợi nhuận và BCTC được kiểm toán. Phần lớn đồng crypto **không có** báo cáo tài chính như vậy; khi đánh giá crypto, nhà đầu tư dùng các thước đo khác như vốn hoá, nguồn cung lưu hành, lịch mở khoá token và mức độ sử dụng thực tế của mạng lưới. Tư duy thì vẫn giống nhau: **hiểu thứ mình mua tạo ra giá trị từ đâu, và mình đang trả giá bao nhiêu cho giá trị đó**.

## Kết hợp với phân tích kỹ thuật

Nhiều nhà đầu tư dùng phân tích cơ bản để chọn **mua cái gì**, và phân tích kỹ thuật để chọn **mua lúc nào**. Dù dùng phương pháp nào, quy tắc quản lý rủi ro ở chương trước vẫn áp dụng: cắt lỗ, cỡ vị thế 1–2% và ghi nhật ký.

## Thực hành

Chọn hai doanh nghiệp cùng ngành, điền bảng kiểm tra nhanh ở trên cho cả hai. Ghi kết luận vào [Nhật ký](/journal) như một kế hoạch đầu tư: bạn chọn doanh nghiệp nào, vì sao, và điều gì sẽ khiến bạn đổi ý?`,
        questions: [
          {
            prompt: '"Bẫy giá trị" (value trap) là gì?',
            options: ['Cổ phiếu có P/E thấp vì triển vọng xấu, giá tiếp tục giảm', 'Cổ phiếu tăng giá quá nhanh', 'Một loại lệnh dừng lỗ', 'Phí ẩn khi mua cổ phiếu'],
            correct_index: 0,
            explanation: 'Value trap trông rẻ theo chỉ số nhưng rẻ vì lý do xấu — lợi nhuận tương lai có thể tiếp tục giảm.',
          },
          {
            prompt: 'Với ngành có tính chu kỳ (thép, phân bón), P/E rất thấp lúc lợi nhuận đạt đỉnh thường có nghĩa là gì?',
            options: ['Thời điểm mua chắc chắn tốt nhất', 'Có thể là thời điểm rủi ro vì lợi nhuận sắp đi xuống theo chu kỳ', 'Công ty không có nợ', 'Cổ phiếu sẽ chia cổ tức lớn'],
            correct_index: 1,
            explanation: 'Lợi nhuận đỉnh chu kỳ làm P/E trông thấp; khi chu kỳ đảo chiều, lợi nhuận giảm và P/E tăng vọt.',
          },
          {
            prompt: 'Cách đánh giá chỉ số tài chính nào hợp lý nhất?',
            options: ['Chỉ xem P/E của một năm', 'So với chính doanh nghiệp qua nhiều năm và với các công ty cùng ngành', 'So với giá Bitcoin', 'Chỉ đọc tiêu đề tin tức'],
            correct_index: 1,
            explanation: 'Chỉ số có ý nghĩa khi có bối cảnh: xu hướng nhiều năm và chuẩn của ngành.',
          },
          {
            prompt: 'Vì sao các chỉ số như P/E, ROE thường không áp dụng trực tiếp cho phần lớn đồng crypto?',
            options: ['Vì crypto giao dịch 24/7', 'Vì phần lớn đồng crypto không có doanh thu, lợi nhuận và BCTC được kiểm toán như doanh nghiệp', 'Vì crypto không có giá', 'Vì crypto luôn tăng giá'],
            correct_index: 1,
            explanation: 'Chỉ số tài chính dựa trên BCTC doanh nghiệp; crypto cần thước đo khác như vốn hoá, nguồn cung, mức sử dụng mạng lưới.',
          },
        ],
      },
    ],
  },
]
