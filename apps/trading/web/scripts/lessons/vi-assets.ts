import type { SeedChapter } from './types'

// Các loại tài sản đầu tư (vi) — mọi con số là minh hoạ, không phải giá/lãi suất hiện tại, không phải khuyến nghị.
export const VI_ASSETS: SeedChapter[] = [
  {
    slug: 'cac-loai-tai-san',
    title: 'Các loại tài sản đầu tư',
    description: 'Trái phiếu, quỹ mở và ETF, phái sinh, vàng, tiền gửi, bất động sản, crypto — và cách so sánh, kết hợp chúng.',
    level: 'intermediate',
    lessons: [
      {
        slug: 'trai-phieu-co-ban',
        title: 'Trái phiếu: lợi suất, rủi ro và bài học thị trường',
        summary: 'Trái phiếu chính phủ và doanh nghiệp, coupon, lợi suất đáo hạn, quan hệ ngược chiều giá–lợi suất, duration và rủi ro tín dụng.',
        content_md: `## Trái phiếu là gì?

Mua cổ phiếu là trở thành **chủ sở hữu** một phần doanh nghiệp. Mua trái phiếu thì khác: bạn trở thành **chủ nợ**. Tổ chức phát hành vay tiền của bạn, cam kết trả **lãi định kỳ (coupon)** và hoàn trả **mệnh giá** vào **ngày đáo hạn**. Lợi nhuận của bạn vì thế bị giới hạn ở mức đã hứa — đổi lại, dòng tiền dễ dự đoán hơn cổ phiếu, miễn là bên vay **trả được nợ**.

## Chính phủ và doanh nghiệp

| Tiêu chí | Trái phiếu chính phủ | Trái phiếu doanh nghiệp |
|---|---|---|
| Bên vay | Nhà nước (ở Việt Nam do Kho bạc Nhà nước phát hành) | Công ty cổ phần, ngân hàng, tập đoàn… |
| Rủi ro tín dụng | Thấp nhất trong nền kinh tế nội địa | Từ thấp đến rất cao, tuỳ doanh nghiệp |
| Lợi suất | Thấp hơn | Cao hơn để bù rủi ro |
| Người mua chủ yếu | Ngân hàng, bảo hiểm, quỹ | Tổ chức và cá nhân |

Phần lợi suất cao hơn trái phiếu chính phủ cùng kỳ hạn gọi là **chênh lệch tín dụng (credit spread)** — "giá" của rủi ro vỡ nợ.

## Coupon khác lợi suất đáo hạn

- **Lãi suất coupon:** cố định trên mệnh giá. Trái phiếu mệnh giá 100, coupon 8%/năm trả 8 mỗi năm, dù giá thị trường là bao nhiêu.
- **Lợi suất đáo hạn (YTM):** mức lợi suất mỗi năm bạn nhận được nếu **mua ở giá hiện tại** và giữ đến đáo hạn. Về kỹ thuật, YTM là mức lãi suất làm cho tổng giá trị hiện tại của mọi dòng tiền (coupon + mệnh giá) **bằng đúng giá mua**.

Mua dưới mệnh giá thì YTM cao hơn coupon; mua trên mệnh giá thì YTM thấp hơn coupon.

## Giá và lợi suất luôn ngược chiều

Coupon đã cố định. Khi lãi suất thị trường tăng, trái phiếu cũ trả lãi thấp hơn trái phiếu mới phát hành, nên **giá trái phiếu cũ phải giảm** để người mua mới đạt được lợi suất mới. Ví dụ minh hoạ — trái phiếu mệnh giá 100, coupon 8%/năm trả cuối mỗi năm, còn 5 năm, đang giao dịch đúng mệnh giá (YTM = 8%):

> Giá = 8/(1+y) + 8/(1+y)² + 8/(1+y)³ + 8/(1+y)⁴ + 108/(1+y)⁵

| Lợi suất thị trường y | Giá trái phiếu | Thay đổi |
|---|---|---|
| 6% | 108,42 | +8,42% |
| 8% | 100,00 | — |
| 10% | 92,42 | −7,58% |

Lợi suất chỉ tăng 2 điểm phần trăm, giá đã mất 7,58%. Đây là **rủi ro lãi suất** — kể cả trái phiếu chính phủ an toàn tuyệt đối về tín dụng vẫn có thể lỗ nếu bạn phải bán trước hạn khi lãi suất tăng.

## Duration: đo độ nhạy với lãi suất

**Duration** cho biết giá trái phiếu nhạy với lãi suất đến đâu. Với trái phiếu trên, duration Macaulay ≈ 4,31 năm và **duration điều chỉnh** ≈ 4,31 / 1,08 ≈ 3,99. Quy tắc gần đúng:

> % thay đổi giá ≈ − duration điều chỉnh × thay đổi lợi suất

Lợi suất +2%: giá ≈ −3,99 × 2% ≈ −7,99%, tức ≈ 92,0 — gần với giá chính xác 92,42 (sai số đến từ **độ lồi**). Ghi nhớ: **kỳ hạn càng dài, coupon càng thấp → duration càng lớn → giá càng biến động**.

## Rủi ro tín dụng, xếp hạng và tài sản bảo đảm

- **Xếp hạng tín nhiệm** (AAA, BBB, B…) do tổ chức xếp hạng đưa ra, giúp so sánh khả năng trả nợ; dưới mức "đầu tư" là trái phiếu **lợi suất cao/rủi ro cao**.
- **Có bảo đảm** (bằng tài sản như bất động sản, cổ phiếu) và **không có bảo đảm**. Có tài sản bảo đảm chưa chắc đã an toàn: tài sản có thể bị định giá cao, khó xử lý, hoặc chính là cổ phiếu của cùng nhóm doanh nghiệp — giảm giá đúng lúc doanh nghiệp gặp khó.

## Bài học trái phiếu doanh nghiệp riêng lẻ 2022–2023

Giai đoạn trước 2022, nhiều trái phiếu doanh nghiệp **phát hành riêng lẻ** với lợi suất hấp dẫn được phân phối rộng tới nhà đầu tư cá nhân, đôi khi được giới thiệu như "sản phẩm tiết kiệm". Khi một số vụ vi phạm bị xử lý và thanh khoản thắt chặt, nhiều tổ chức phát hành chậm trả gốc lãi, thị trường gần như đóng băng. Chính phủ ban hành **Nghị định 65/2022/NĐ-CP** (16/9/2022) siết điều kiện phát hành, việc sử dụng vốn, công bố thông tin và tiêu chí xác định nhà đầu tư chứng khoán chuyên nghiệp được mua; sau đó **Nghị định 08/2023/NĐ-CP** (5/3/2023) tạm hoãn một số quy định đó đến hết năm 2023 và cho phép doanh nghiệp đàm phán với trái chủ để gia hạn kỳ hạn (tối đa 2 năm) hoặc thanh toán bằng tài sản khác.

Bài học chung, không riêng doanh nghiệp nào:

1. **Lợi suất cao luôn đi kèm rủi ro cao** — không có "tiết kiệm lãi cao mà không rủi ro".
2. Trái phiếu riêng lẻ thường **khó bán lại**: khi cần tiền, bạn có thể không tìm được người mua.
3. Đọc kỹ **tình hình tài chính bên phát hành**, tài sản bảo đảm và điều khoản mua lại — không chỉ nhìn lãi suất.
4. Phân biệt rõ **ai phát hành** và **ai chỉ phân phối**: công ty môi giới không bảo lãnh trả nợ.

## Nhà đầu tư cá nhân tiếp cận trái phiếu thế nào?

- **Trái phiếu chào bán ra công chúng** và niêm yết trên sở giao dịch, mua qua tài khoản chứng khoán.
- **Trái phiếu chính phủ** giao dịch trên HNX — thị trường chủ yếu là tổ chức, giao dịch theo lô lớn.
- **Quỹ trái phiếu** (quỹ mở): đa dạng hoá nhiều trái phiếu, có đội ngũ phân tích tín dụng, phù hợp với số vốn nhỏ.
- **Trái phiếu riêng lẻ:** chỉ dành cho nhà đầu tư chứng khoán chuyên nghiệp theo luật định.

## Thực hành

Dùng công thức ở trên, tự tính giá trái phiếu mệnh giá 100, coupon 8%, còn 5 năm khi lợi suất thị trường là 9%. So với 100, giá tăng hay giảm và vì sao? Sau đó ghi vào [Nhật ký](/journal) ba câu hỏi bạn sẽ đặt ra trước khi mua bất kỳ trái phiếu doanh nghiệp nào.

## Nguồn tham khảo

- FINRA — Brush Up on Bonds: Interest Rate Changes and Duration: https://www.finra.org/investors/insights/bonds-interest-rate-changes-duration
- Diễn đàn Doanh nghiệp — Nghị định 65/2022 và thị trường trái phiếu doanh nghiệp: https://diendandoanhnghiep.vn/nghi-dinh-65-2022-khoi-lai-huyet-mach-thi-truong-trai-phieu-doanh-nghiep-230867.html
- Allen & Gledhill — Nghị định 08/2023 sửa đổi, tạm hoãn một số quy định về trái phiếu doanh nghiệp riêng lẻ (tiếng Anh): https://www.allenandgledhill.com/vn/publication/articles/23488/amends-supplements-and-suspends-implementation-of-key-provisions-on-private-offering-and-trading-of-corporate-bonds`,
        questions: [
          {
            prompt: 'Lãi suất thị trường tăng mạnh. Giá một trái phiếu coupon cố định đang lưu hành sẽ thế nào?',
            options: ['Tăng, vì lãi suất cao hơn', 'Giảm, vì coupon cố định kém hấp dẫn hơn trái phiếu mới', 'Không đổi cho đến khi đáo hạn', 'Luôn về đúng mệnh giá ngay lập tức'],
            correct_index: 1,
            explanation: 'Giá và lợi suất ngược chiều: giá trái phiếu cũ phải giảm để người mua mới nhận được lợi suất ngang với lãi suất thị trường mới.',
          },
          {
            prompt: 'Trái phiếu có duration điều chỉnh ≈ 4. Lợi suất tăng 1 điểm phần trăm, giá thay đổi xấp xỉ bao nhiêu?',
            options: ['+4%', '−1%', '−4%', '−40%'],
            correct_index: 2,
            explanation: '% thay đổi giá ≈ −duration điều chỉnh × thay đổi lợi suất = −4 × 1% = −4%.',
          },
          {
            prompt: 'Bài học quan trọng nhất từ giai đoạn trái phiếu doanh nghiệp riêng lẻ 2022–2023 là gì?',
            options: ['Trái phiếu doanh nghiệp luôn an toàn như tiền gửi', 'Có tài sản bảo đảm thì không bao giờ mất tiền', 'Chỉ cần chọn trái phiếu có lãi suất cao nhất', 'Lợi suất cao đi kèm rủi ro tín dụng và thanh khoản, cần đọc kỹ bên phát hành'],
            correct_index: 3,
            explanation: 'Lợi suất cao là phần bù cho rủi ro. Trái phiếu riêng lẻ còn khó bán lại, và tài sản bảo đảm có thể mất giá đúng lúc doanh nghiệp gặp khó.',
          },
          {
            prompt: 'Bạn mua trái phiếu với giá THẤP hơn mệnh giá. So với lãi suất coupon, lợi suất đáo hạn (YTM) của bạn sẽ ra sao?',
            options: ['Cao hơn coupon', 'Thấp hơn coupon', 'Luôn bằng coupon', 'Bằng 0'],
            correct_index: 0,
            explanation: 'Ngoài coupon, bạn còn được hưởng phần chênh lệch khi nhận lại đủ mệnh giá lúc đáo hạn, nên YTM cao hơn coupon.',
          },
        ],
      },
      {
        slug: 'quy-mo-va-etf',
        title: 'Quỹ mở và ETF',
        summary: 'Quỹ mở, ETF và quỹ đóng khác nhau thế nào; NAV, chi phí quỹ, sai lệch bám sát chỉ số và tác động của phí sau 20 năm.',
        content_md: `## Vì sao có quỹ đầu tư?

Với số vốn nhỏ, tự mua đủ 20–30 cổ phiếu để đa dạng hoá là khó và tốn phí. **Quỹ đầu tư** gom tiền của nhiều người, giao cho **công ty quản lý quỹ** đầu tư theo một chiến lược công bố trước. Tài sản của quỹ được **ngân hàng giám sát** lưu ký riêng, tách khỏi tài sản của công ty quản lý quỹ.

## Ba loại quỹ phổ biến

| Đặc điểm | Quỹ mở | ETF (quỹ hoán đổi danh mục) | Quỹ đóng |
|---|---|---|---|
| Mua/bán với ai | Trực tiếp với quỹ | Trên sàn như cổ phiếu | Trên sàn |
| Giá giao dịch | Theo NAV của kỳ giao dịch | Giá thị trường, dao động quanh NAV | Giá thị trường, có thể lệch xa NAV |
| Tần suất | Theo kỳ giao dịch quỹ quy định | Liên tục trong phiên | Liên tục trong phiên |
| Số chứng chỉ quỹ | Tăng/giảm theo tiền vào/ra | Tăng/giảm qua cơ chế hoán đổi | Cố định sau khi phát hành |

**NAV (giá trị tài sản ròng) trên mỗi chứng chỉ quỹ** = (tổng tài sản − nợ phải trả) / số chứng chỉ quỹ đang lưu hành. Đây là "giá trị thật" của một chứng chỉ quỹ tại thời điểm tính.

## ETF hoạt động thế nào?

ETF thường mô phỏng một **chỉ số**. Điểm đặc biệt là **cơ chế hoán đổi**: thành viên lập quỹ (thường là công ty chứng khoán lớn) có thể nộp **một rổ cổ phiếu** để đổi lấy **lô chứng chỉ quỹ ETF** (tạo lập), hoặc ngược lại (mua lại). Nếu giá ETF trên sàn cao hơn NAV, họ tạo thêm chứng chỉ quỹ để bán ra; nếu thấp hơn, họ mua ETF và đổi lấy cổ phiếu. Nhờ đó giá ETF thường bám sát NAV.

Tại Việt Nam, các ETF niêm yết trên HOSE mô phỏng nhiều chỉ số như **VN30** (30 cổ phiếu vốn hoá và thanh khoản lớn trên HOSE — có nhiều ETF cùng bám chỉ số này), **VNFIN LEAD** (nhóm cổ phiếu ngành tài chính dẫn đầu), **VNDiamond** (nhóm cổ phiếu đã gần hết "room" cho nhà đầu tư nước ngoài), **VNFIN SELECT** và **VN100**. Bài này không khuyến nghị quỹ cụ thể nào.

## Chỉ số tái cơ cấu tác động tới cổ phiếu ra sao?

Các chỉ số được rà soát **định kỳ** (theo quý hoặc nửa năm tuỳ chỉ số). Khi một cổ phiếu được **thêm vào** chỉ số hoặc tăng tỷ trọng, các ETF mô phỏng phải **mua vào**; khi bị **loại ra**, các quỹ phải **bán ra** — thường dồn vào phiên cuối trước ngày hiệu lực. Vì danh mục mới được công bố trước, thị trường thường "đoán trước" và giá có thể đã phản ánh một phần. Với nhà đầu tư dài hạn, đây là biến động ngắn hạn, không phải thay đổi về giá trị doanh nghiệp.

## Thụ động hay chủ động?

- **Quỹ thụ động (chỉ số):** chỉ cố gắng bám sát chỉ số, chi phí thấp. Thước đo chất lượng là **sai lệch bám sát (tracking error)** — mức chênh giữa lợi nhuận quỹ và chỉ số; càng nhỏ càng tốt.
- **Quỹ chủ động:** nhà quản lý tự chọn cổ phiếu để cố **vượt** chỉ số, chi phí cao hơn. Nghiên cứu ở nhiều thị trường cho thấy sau phí, phần lớn quỹ chủ động khó duy trì việc vượt chỉ số trong dài hạn — nhưng điều này không đúng với mọi quỹ, mọi giai đoạn.

## Chi phí quỹ: nhỏ mỗi năm, lớn sau 20 năm

**Tổng chi phí quỹ (TER)** gồm phí quản lý, phí giám sát, lưu ký… tính theo % tài sản mỗi năm, trừ thẳng vào NAV. Ngoài ra có thể có phí mua/bán chứng chỉ quỹ. Ví dụ **minh hoạ**: đầu tư 100 triệu đồng, danh mục sinh lời 8%/năm trước phí, giữ 20 năm:

| Chi phí/năm | Lợi suất ròng | Giá trị sau 20 năm |
|---|---|---|
| 0% | 8,0% | 100 × 1,08²⁰ ≈ 466,1 triệu |
| 0,5% | 7,5% | 100 × 1,075²⁰ ≈ 424,8 triệu |
| 2,0% | 6,0% | 100 × 1,06²⁰ ≈ 320,7 triệu |

Chênh lệch giữa mức phí 0,5% và 2% là khoảng **104,1 triệu đồng** — hơn cả số vốn ban đầu. (Ví dụ giản lược phí bằng cách trừ thẳng vào lợi suất mỗi năm; con số 8% chỉ để minh hoạ, không phải dự báo.)

## Thực hành

Chọn một quỹ mở hoặc ETF bất kỳ, tìm trong bản cáo bạch hoặc báo cáo định kỳ: chỉ số tham chiếu (nếu có), tổng chi phí quỹ, NAV gần nhất và sai lệch bám sát. Ghi vào [Nhật ký](/journal): mức phí đó ăn mòn bao nhiêu sau 20 năm với 100 triệu đồng?

## Nguồn tham khảo

- Thị trường Tài chính Tiền tệ — SSI ước tính giao dịch của 6 quỹ ETF nội sau kỳ công bố danh mục chỉ số quý I/2024: https://thitruongtaichinhtiente.vn/ssi-uoc-tinh-giao-dich-cua-6-quy-etfs-noi-sau-khi-hose-cong-bo-danh-muc-chi-so-quy-i-2024-55608.html
- Thị trường Tài chính Tiền tệ — Kết quả tái cơ cấu danh mục ETF kỳ quý II/2023: https://thitruongtaichinhtiente.vn/ket-qua-tai-co-cau-danh-muc-etf-ky-quy-ii-2023-vn-diamond-loai-eib-vn30-khong-co-thay-doi-ve-thanh-phan-45287.html
- Thị trường Tài chính Tiền tệ — VNFIN Lead điều chỉnh danh mục kỳ quý I/2022: https://thitruongtaichinhtiente.vn/vnfin-lead-bo-sung-vnd-nang-ty-trong-tcb-vpb-ssi-trong-ky-quy-i-2022-38996.html`,
        questions: [
          {
            prompt: 'Điểm khác biệt chính giữa quỹ mở và ETF là gì?',
            options: ['ETF giao dịch liên tục trên sàn như cổ phiếu; quỹ mở mua bán trực tiếp với quỹ theo NAV của kỳ giao dịch', 'Quỹ mở không có phí', 'ETF luôn có lợi nhuận cao hơn quỹ mở', 'Quỹ mở chỉ đầu tư vào crypto'],
            correct_index: 0,
            explanation: 'ETF niêm yết và khớp lệnh trên sàn trong phiên; quỹ mở giao dịch với chính quỹ theo NAV tại kỳ giao dịch.',
          },
          {
            prompt: 'Cơ chế nào giúp giá ETF trên sàn thường bám sát NAV?',
            options: ['Sở giao dịch cố định giá ETF', 'Cơ chế hoán đổi: thành viên lập quỹ đổi rổ cổ phiếu lấy chứng chỉ quỹ và ngược lại khi có chênh lệch', 'Ngân hàng giám sát mua bù', 'Quỹ cấm bán khi giá thấp'],
            correct_index: 1,
            explanation: 'Khi giá lệch NAV, thành viên lập quỹ tạo lập hoặc mua lại chứng chỉ quỹ để hưởng chênh lệch, kéo giá về gần NAV.',
          },
          {
            prompt: '100 triệu đồng, lợi suất ròng 6%/năm trong 20 năm cho kết quả xấp xỉ bao nhiêu?',
            options: ['220 triệu', '466 triệu', '321 triệu', '120 triệu'],
            correct_index: 2,
            explanation: '100 × 1,06²⁰ ≈ 320,7 triệu đồng. 220 triệu là kết quả nếu tính lãi đơn, không phải lãi kép.',
          },
          {
            prompt: 'Một cổ phiếu được thêm vào chỉ số mà nhiều ETF mô phỏng. Điều gì thường xảy ra quanh ngày tái cơ cấu?',
            options: ['Các ETF phải bán cổ phiếu đó', 'Không có ảnh hưởng gì', 'Doanh nghiệp đó chắc chắn lãi nhiều hơn', 'Các ETF phải mua cổ phiếu đó, tạo thêm lực cầu ngắn hạn'],
            correct_index: 3,
            explanation: 'Quỹ thụ động phải nắm theo đúng danh mục chỉ số nên phải mua vào; đây là dòng tiền ngắn hạn, không làm thay đổi giá trị doanh nghiệp.',
          },
        ],
      },
      {
        slug: 'phai-sinh-hop-dong-tuong-lai-va-chung-quyen',
        title: 'Phái sinh: hợp đồng tương lai VN30 và chứng quyền',
        summary: 'Đặc điểm hợp đồng tương lai chỉ số VN30, đòn bẩy và ký quỹ, chứng quyền có bảo đảm, và cách phòng hộ danh mục bằng phái sinh.',
        content_md: `## Phái sinh là gì?

**Chứng khoán phái sinh** là công cụ có giá trị **phụ thuộc** vào một tài sản khác (tài sản cơ sở) như chỉ số, cổ phiếu. Ở Việt Nam, sản phẩm phổ biến nhất với nhà đầu tư cá nhân là **hợp đồng tương lai chỉ số VN30** (giao dịch trên HNX) và **chứng quyền có bảo đảm** (giao dịch trên HOSE). Từ tháng 10/2025, HNX niêm yết thêm hợp đồng tương lai chỉ số VN100; bài này tập trung vào VN30.

## Hợp đồng tương lai chỉ số VN30

Hợp đồng tương lai là thoả thuận mua/bán chỉ số tại một mức giá xác định vào một ngày trong tương lai. Bạn có thể **mua (Long)** nếu kỳ vọng tăng hoặc **bán (Short)** nếu kỳ vọng giảm, kể cả khi không sở hữu cổ phiếu nào.

| Thông số | Nội dung (theo mẫu hợp đồng HNX) |
|---|---|
| Tài sản cơ sở | Chỉ số VN30 |
| Hệ số nhân | 100.000 đồng/điểm chỉ số |
| Bước giá | 0,1 điểm (= 10.000 đồng) |
| Biên độ giá | ±7% so với giá tham chiếu |
| Tháng đáo hạn | Tháng hiện tại, tháng kế tiếp và 2 tháng cuối của 2 quý gần nhất |
| Ngày giao dịch cuối cùng | Thứ Năm thứ ba của tháng đáo hạn |
| Thanh toán khi đáo hạn | Bằng tiền, theo giá thanh toán cuối cùng tính từ chỉ số |
| Ký quỹ | Tỷ lệ do VSDC quy định từng thời kỳ (đã có giai đoạn ở mức 17%) |

Hai điểm cần hiểu:

- **T+0:** có thể mở và đóng vị thế ngay trong ngày, khác cổ phiếu cơ sở phải chờ tiền/hàng về.
- **Thanh toán lãi lỗ hàng ngày:** cuối mỗi ngày, vị thế được đánh giá theo **giá thanh toán hàng ngày**; lãi được cộng, lỗ bị trừ trực tiếp vào tài khoản ký quỹ. Nếu tài khoản xuống dưới mức yêu cầu, bạn phải **nộp thêm ký quỹ** hoặc bị **đóng vị thế bắt buộc**.

## Toán đòn bẩy (minh hoạ)

Giả sử hợp đồng đang ở **1.300 điểm** và tỷ lệ ký quỹ **17%** (các con số chỉ để minh hoạ):

- Giá trị hợp đồng = 1.300 × 100.000 = **130 triệu đồng**.
- Ký quỹ cần có ≈ 17% × 130 = **22,1 triệu đồng** → đòn bẩy ≈ 1 / 0,17 ≈ **5,9 lần**.
- Chỉ số đi ngược 2% (26 điểm): lỗ 26 × 100.000 = **2,6 triệu**, tức ≈ **11,8%** số ký quỹ.
- Chỉ số đi ngược 10% (130 điểm): lỗ **13 triệu** ≈ **58,8%** số ký quỹ.

## Vì sao phần lớn nhà đầu tư cá nhân thua lỗ?

1. **Trò chơi có tổng bằng không, trước phí:** lãi của bên này là lỗ của bên kia; sau phí giao dịch và thuế, tổng số còn lại là âm.
2. **Đòn bẩy phóng đại sai lầm:** một nhịp biến động bình thường có thể "cháy" một phần lớn ký quỹ.
3. **T+0 khuyến khích giao dịch quá nhiều** và quyết định theo cảm xúc.
4. **Đối thủ là tổ chức** có dữ liệu, hệ thống và kỷ luật tốt hơn.

Nếu thử sức, hãy dùng quy tắc quản lý vốn 1–2% và luôn đặt điểm dừng lỗ — xem bài [Cỡ vị thế và quy tắc 1–2%](/learn/co-vi-the-va-quy-tac-1-2).

## Chứng quyền có bảo đảm

**Chứng quyền có bảo đảm (CW)** do công ty chứng khoán phát hành, cho người nắm giữ quyền hưởng chênh lệch khi giá cổ phiếu cơ sở vượt **giá thực hiện**. Ở Việt Nam hiện phổ biến loại **chứng quyền mua, kiểu châu Âu, thanh toán bằng tiền**. **Tỷ lệ chuyển đổi** cho biết cần bao nhiêu chứng quyền tương ứng một cổ phiếu.

Ví dụ minh hoạ: giá thực hiện 25.000 đ, tỷ lệ chuyển đổi 5:1, bạn mua chứng quyền giá 1.000 đ.

- **Điểm hoà vốn** = giá thực hiện + giá CW × tỷ lệ = 25.000 + 1.000 × 5 = **30.000 đ**.
- Giá thanh toán khi đáo hạn 32.000 đ: mỗi CW nhận (32.000 − 25.000) / 5 = **1.400 đ** → lãi 40%.
- Giá thanh toán 29.000 đ: nhận (29.000 − 25.000) / 5 = **800 đ** → lỗ 20% dù cổ phiếu cao hơn giá thực hiện.
- Giá thanh toán ≤ 25.000 đ: chứng quyền **về 0**, mất 100% số tiền bỏ ra.

Rủi ro tối đa giới hạn ở số tiền mua chứng quyền, nhưng **giá trị thời gian** hao mòn dần khi gần đáo hạn.

## Phòng hộ danh mục bằng hợp đồng tương lai (minh hoạ)

Bạn có danh mục **1 tỷ đồng** biến động gần giống VN30 (beta ≈ 1), lo ngại thị trường giảm nhưng không muốn bán cổ phiếu. Với hợp đồng ở 1.300 điểm:

> Số hợp đồng cần bán ≈ 1.000.000.000 / 130.000.000 ≈ 7,7 → làm tròn **8 hợp đồng**

Nếu VN30 giảm 5% (từ 1.300 xuống 1.235, tức 65 điểm): danh mục lỗ ≈ **50 triệu**, vị thế Short lãi 8 × 65 × 100.000 = **52 triệu**. Hai khoản gần như bù trừ. Ngược lại, nếu thị trường tăng, phần lãi của cổ phiếu cũng bị vị thế Short "ăn" mất — phòng hộ là **mua bảo hiểm**, không phải kiếm lời thêm. Trên thực tế còn có chênh lệch giữa giá hợp đồng và chỉ số (basis), danh mục không giống hệt VN30 và phải chuyển vị thế khi hợp đồng đáo hạn.

## Thực hành

Tự tính: hợp đồng ở 1.250 điểm, ký quỹ 17%. Giá trị hợp đồng, số ký quỹ và khoản lỗ khi chỉ số đi ngược 3% là bao nhiêu? Ghi kết quả và cảm nhận của bạn về đòn bẩy vào [Nhật ký](/journal).

## Nguồn tham khảo

- HSC — Mẫu hợp đồng tương lai chỉ số VN30: https://hsc.com.vn/en/transaction-regulations/31-vn30-index-futures-contract-template-1.html
- Vietstock — Quy định, hướng dẫn chứng khoán phái sinh: https://finance.vietstock.vn/chung-khoan-phai-sinh/qui-dinh-huong-dan.htm
- Vietstock — Thông tin thị trường chứng quyền: https://finance.vietstock.vn/derivatives/covered-warrant.htm`,
        questions: [
          {
            prompt: 'Hợp đồng tương lai VN30 có hệ số nhân 100.000 đ/điểm. Ở mức 1.200 điểm, giá trị một hợp đồng là bao nhiêu?',
            options: ['12 triệu đồng', '1,2 tỷ đồng', '1,2 triệu đồng', '120 triệu đồng'],
            correct_index: 3,
            explanation: '1.200 × 100.000 = 120.000.000 đồng.',
          },
          {
            prompt: '"Thanh toán lãi lỗ hàng ngày" trong hợp đồng tương lai nghĩa là gì?',
            options: ['Lãi lỗ chỉ được tính khi đáo hạn', 'Cuối mỗi ngày lãi lỗ được ghi nhận vào tài khoản ký quỹ; thiếu ký quỹ phải nộp thêm hoặc bị đóng vị thế', 'Mỗi ngày phải mua một hợp đồng mới', 'Sở giao dịch bù lỗ cho nhà đầu tư'],
            correct_index: 1,
            explanation: 'Vị thế được đánh giá theo giá thanh toán hàng ngày; lỗ trừ thẳng vào ký quỹ nên đòn bẩy có thể buộc bạn nộp thêm tiền rất nhanh.',
          },
          {
            prompt: 'Chứng quyền mua: giá thực hiện 20.000 đ, tỷ lệ 2:1, giá CW 1.500 đ. Điểm hoà vốn là bao nhiêu?',
            options: ['23.000 đ', '21.500 đ', '20.750 đ', '30.000 đ'],
            correct_index: 0,
            explanation: 'Hoà vốn = 20.000 + 1.500 × 2 = 23.000 đ.',
          },
          {
            prompt: 'Bán (Short) hợp đồng tương lai để phòng hộ danh mục cổ phiếu có tác dụng gì?',
            options: ['Nhân đôi lợi nhuận khi thị trường tăng', 'Loại bỏ mọi chi phí giao dịch', 'Bù đắp phần lớn khoản lỗ của cổ phiếu khi thị trường giảm, đổi lại mất phần lãi khi thị trường tăng', 'Đảm bảo danh mục luôn có lãi'],
            correct_index: 2,
            explanation: 'Phòng hộ giống mua bảo hiểm: giảm rủi ro giảm giá nhưng cũng triệt tiêu phần lớn lợi nhuận nếu thị trường đi lên.',
          },
        ],
      },
      {
        slug: 'vang-tien-gui-va-tai-san-thay-the',
        title: 'Vàng, tiền gửi và các tài sản thay thế',
        summary: 'Vàng miếng trong nước và vàng thế giới, tiền gửi tiết kiệm, bất động sản và REIT, crypto như một tài sản đầu cơ.',
        content_md: `## Ngoài cổ phiếu và trái phiếu

Phần lớn tài sản của các gia đình Việt Nam nằm ở **tiền gửi, vàng và bất động sản** chứ không phải chứng khoán. Hiểu đặc điểm từng loại giúp bạn đặt chúng đúng chỗ trong kế hoạch tài chính.

## Vàng: trong nước và thế giới

**Giá vàng thế giới** được niêm yết bằng USD/ounce trên thị trường quốc tế. **Giá vàng miếng trong nước** (đơn vị VND/lượng) chịu thêm tác động của tỷ giá, chi phí, thuế và đặc biệt là **cung–cầu nội địa**. Khi nguồn cung vàng miếng bị hạn chế mà nhu cầu cao, giá trong nước có thể cao hơn giá thế giới quy đổi một khoản đáng kể — gọi là **chênh lệch (premium)**.

Một số điểm cần biết:

- Trong nhiều năm, theo **Nghị định 24/2012/NĐ-CP**, Nhà nước độc quyền sản xuất vàng miếng và SJC được Ngân hàng Nhà nước chọn làm thương hiệu vàng miếng quốc gia; chênh lệch với giá thế giới có lúc rất lớn.
- **Nghị định 232/2025/NĐ-CP** (hiệu lực từ 10/10/2025) đã bỏ cơ chế độc quyền đó (cả độc quyền xuất, nhập khẩu vàng nguyên liệu để sản xuất vàng miếng), chuyển sản xuất vàng miếng thành hoạt động kinh doanh có điều kiện: doanh nghiệp và ngân hàng thương mại đáp ứng điều kiện về vốn và giấy phép kinh doanh vàng miếng có thể xin Ngân hàng Nhà nước cấp phép. Tác động thực tế lên chênh lệch giá phụ thuộc vào tiến độ cấp phép và nguồn cung mới.
- Hệ quả với nhà đầu tư: nếu mua khi premium cao, bạn có thể **lỗ dù giá thế giới không đổi** khi premium thu hẹp. Ngoài ra còn **chênh lệch mua–bán** tại cửa hàng.

**Vàng như công cụ phòng hộ:** vàng không trả lãi hay cổ tức, nhưng thường được mua để giữ giá trị khi lạm phát cao, tiền tệ mất giá hoặc khủng hoảng. Mức độ phòng hộ **không ổn định**: có những giai đoạn dài giá vàng đi ngang hoặc giảm sâu. Hãy coi vàng là một phần nhỏ để đa dạng hoá, không phải "tài sản không bao giờ giảm".

## Tiền gửi tiết kiệm và chứng chỉ tiền gửi

- **Tiền gửi tiết kiệm:** lãi suất cố định theo kỳ hạn, gần như không biến động. Rút trước hạn thường chỉ được hưởng lãi không kỳ hạn rất thấp.
- **Chứng chỉ tiền gửi:** do ngân hàng phát hành, lãi suất có thể cao hơn tiết kiệm nhưng điều kiện rút trước hạn chặt hơn — đọc kỹ điều khoản.
- **Bảo hiểm tiền gửi:** từ 13/7/2026, theo Thông tư 05/2026/TT-NHNN, hạn mức chi trả là **350 triệu đồng/người/tổ chức tham gia bảo hiểm tiền gửi** (gồm gốc và lãi), tăng từ mức 125 triệu đồng áp dụng từ cuối năm 2021. Hạn mức có thể được điều chỉnh — hãy kiểm tra mức hiện hành trước khi dựa vào con số này.
- **Rủi ro chính là lạm phát:** nếu lãi suất tiền gửi thấp hơn lạm phát, sức mua của bạn vẫn giảm dù số dư tăng.

Tiền gửi là nơi phù hợp cho **quỹ dự phòng** và tiền sẽ dùng trong ngắn hạn.

## Bất động sản và REIT

**Bất động sản trực tiếp** (nhà, đất) có thể tạo dòng tiền cho thuê và tăng giá dài hạn, nhưng:

| Đặc điểm | Bất động sản trực tiếp | REIT / quỹ bất động sản niêm yết |
|---|---|---|
| Vốn tối thiểu | Rất lớn | Nhỏ, mua theo chứng chỉ quỹ |
| Thanh khoản | Thấp, bán mất vài tuần đến vài tháng | Giao dịch trên sàn (dù thanh khoản có thể thấp) |
| Đa dạng hoá | Tập trung vào một tài sản | Nhiều tài sản cho thuê |
| Chi phí giao dịch | Cao (thuế, phí công chứng, môi giới) | Phí giao dịch chứng khoán và chi phí quỹ |
| Đòn bẩy | Thường dùng vay ngân hàng | Tuỳ chính sách quỹ |

**REIT** (quỹ đầu tư tín thác bất động sản) sở hữu các bất động sản tạo thu nhập (văn phòng, trung tâm thương mại…) và phân phối phần lớn thu nhập cho nhà đầu tư. Thị trường Việt Nam hiện mới có **rất ít** sản phẩm loại này, thanh khoản còn hạn chế. Cũng đừng nhầm REIT với **cổ phiếu doanh nghiệp phát triển bất động sản** — loại sau phụ thuộc vào bán dự án, chu kỳ tín dụng và pháp lý (xem bài [BCTC doanh nghiệp bất động sản](/learn/bctc-bat-dong-san)).

## Crypto: tài sản đầu cơ biến động cao

Crypto (như Bitcoin, Ethereum) giao dịch 24/7, không có báo cáo tài chính hay dòng tiền như doanh nghiệp, và giá chủ yếu do kỳ vọng và dòng tiền đầu cơ quyết định. Lịch sử cho thấy crypto có thể **giảm hơn 70%** trong các đợt thị trường giá xuống. Rủi ro thêm: sàn giao dịch sụp đổ, mất khoá ví, lừa đảo, và khung pháp lý còn đang hình thành ở nhiều nước.

Nếu muốn tìm hiểu, cách an toàn nhất là **luyện tập bằng tiền ảo**: tài khoản mô phỏng trong [Thị trường](/markets) của TradeLab cho phép bạn đặt lệnh crypto, dùng stop-loss và theo dõi biến động mà không mất tiền thật.

## Thực hành

Liệt kê tài sản của bạn (hoặc gia đình) theo 4 nhóm: tiền gửi, vàng, bất động sản, chứng khoán/crypto. Nhóm nào chiếm hơn một nửa? Nhóm đó có dễ bán khi cần tiền gấp không? Sau đó vào [Thị trường](/markets), mở một vị thế crypto mô phỏng nhỏ và quan sát biến động trong một tuần.

## Nguồn tham khảo

- SGGP — Chính thức xoá bỏ cơ chế Nhà nước độc quyền sản xuất vàng miếng: https://www.sggp.org.vn/chinh-thuc-xoa-bo-co-che-nha-nuoc-doc-quyen-san-xuat-vang-mieng-post810260.html
- Thị trường Tài chính Tiền tệ — Nghị định 232/2025/NĐ-CP: https://thitruongtaichinhtiente.vn/nghi-dinh-so-232-2025-nd-cp-dat-nen-mong-minh-bach-on-dinh-cho-thi-truong-vang-70129.html
- Luật sư Việt Nam — Nâng hạn mức bảo hiểm tiền gửi lên 350 triệu đồng: https://lsvn.vn/nang-han-muc-bao-hiem-tien-gui-len-350-trieu-dong-a176030.html`,
        questions: [
          {
            prompt: 'Bạn mua vàng miếng khi chênh lệch so với giá thế giới đang rất cao. Rủi ro riêng của tình huống này là gì?',
            options: ['Vàng sẽ trả cổ tức thấp hơn', 'Có thể lỗ khi chênh lệch thu hẹp, kể cả khi giá vàng thế giới không đổi', 'Không có rủi ro gì vì vàng luôn tăng', 'Ngân hàng sẽ thu hồi vàng'],
            correct_index: 1,
            explanation: 'Giá trong nước = giá thế giới quy đổi + chênh lệch. Khi chênh lệch giảm, giá trong nước giảm dù giá thế giới đứng yên.',
          },
          {
            prompt: 'Rủi ro chính của việc giữ phần lớn tài sản ở tiền gửi tiết kiệm trong nhiều năm là gì?',
            options: ['Giá tiền gửi dao động mạnh hằng ngày', 'Ngân hàng không trả lãi', 'Sức mua có thể giảm nếu lãi suất thấp hơn lạm phát', 'Không thể rút tiền khi đáo hạn'],
            correct_index: 2,
            explanation: 'Số dư tăng nhưng giá cả tăng nhanh hơn thì sức mua thực tế vẫn giảm — đó là rủi ro lạm phát.',
          },
          {
            prompt: 'So với mua bất động sản trực tiếp, REIT có ưu điểm nào?',
            options: ['Cần vốn nhỏ hơn và đa dạng hoá trên nhiều tài sản cho thuê', 'Không bao giờ giảm giá', 'Được nhà nước bảo đảm lợi nhuận', 'Không chịu bất kỳ chi phí nào'],
            correct_index: 0,
            explanation: 'REIT cho phép sở hữu một phần nhiều bất động sản tạo thu nhập với số vốn nhỏ, dù giá vẫn biến động và thanh khoản có thể thấp.',
          },
          {
            prompt: 'Cách phù hợp nhất để người mới tìm hiểu crypto là gì?',
            options: ['Vay tiền để mua thật nhiều', 'Bỏ toàn bộ quỹ dự phòng vào một đồng coin', 'Mua theo lời khuyên trên mạng xã hội', 'Luyện tập bằng tài khoản mô phỏng và chỉ dùng phần nhỏ số tiền có thể mất'],
            correct_index: 3,
            explanation: 'Crypto biến động rất mạnh; luyện tập bằng tiền ảo giúp hiểu rủi ro trước khi bỏ tiền thật.',
          },
        ],
      },
      {
        slug: 'so-sanh-va-ket-hop-cac-loai-tai-san',
        title: 'So sánh và kết hợp các loại tài sản',
        summary: 'Bảng so sánh rủi ro, lợi nhuận, thanh khoản; trực giác về tương quan; khớp tài sản với mục tiêu và thời gian đầu tư.',
        content_md: `## Không có tài sản "tốt nhất"

Mỗi lớp tài sản là một **sự đánh đổi** giữa lợi nhuận kỳ vọng, rủi ro, thanh khoản và công sức theo dõi. Câu hỏi đúng không phải "tài sản nào tốt nhất?" mà là "**tài sản nào phù hợp với khoản tiền này, cho mục tiêu này, trong thời gian này?**"

## Bảng so sánh định tính

Bảng dưới chỉ mang tính **định tính, tương đối**, không phải số liệu đo lường hay dự báo:

| Lớp tài sản | Lợi nhuận kỳ vọng dài hạn | Biến động | Thanh khoản | Rủi ro đặc thù |
|---|---|---|---|---|
| Tiền gửi | Thấp | Rất thấp | Cao (mất lãi nếu rút trước hạn) | Lạm phát |
| Trái phiếu chính phủ | Thấp–trung bình | Thấp–trung bình | Trung bình với cá nhân | Lãi suất |
| Trái phiếu doanh nghiệp | Trung bình | Trung bình | Thấp–trung bình | Tín dụng, thanh khoản |
| Cổ phiếu / ETF cổ phiếu | Cao | Cao | Cao | Thị trường, doanh nghiệp |
| Vàng | Không ổn định | Trung bình–cao | Cao (có chênh lệch mua–bán) | Chênh lệch giá trong nước |
| Bất động sản trực tiếp | Trung bình–cao | Khó đo (ít giao dịch) | Thấp | Pháp lý, tập trung, đòn bẩy |
| Phái sinh | Trò chơi tổng bằng không trước phí | Rất cao (đòn bẩy) | Cao | Đòn bẩy, ký quỹ |
| Crypto | Không chắc chắn | Rất cao | Cao (24/7) | Đầu cơ, sàn, pháp lý |

Lưu ý: bất động sản trông "ít biến động" một phần vì **ít khi được định giá lại** chứ không hẳn vì an toàn hơn.

## Trực giác về tương quan

Kết hợp các tài sản **không cùng lên cùng xuống** giúp danh mục êm hơn — chi tiết công thức có trong bài [Đa dạng hoá và tương quan](/learn/da-dang-hoa-va-tuong-quan). Một vài trực giác thường gặp (không phải quy luật cố định):

- **Cổ phiếu và trái phiếu chính phủ** thường phản ứng khác nhau trong suy thoái, khi lãi suất được hạ: cổ phiếu giảm, trái phiếu có thể tăng giá. Nhưng khi **lạm phát cao khiến lãi suất tăng**, cả hai có thể **cùng giảm**.
- **Vàng** đôi khi tăng khi tài sản rủi ro giảm, nhưng không đều đặn.
- **Crypto** thường tương quan cao với nhau và có giai đoạn biến động cùng chiều với cổ phiếu công nghệ.
- Trong **khủng hoảng**, tương quan giữa các tài sản rủi ro thường **tăng lên** — đúng lúc bạn cần đa dạng hoá nhất.

## Khớp tài sản với mục tiêu và thời gian

Hãy chia tiền theo **mục tiêu**, mỗi mục tiêu một "ngăn":

| Mục tiêu | Thời gian | Tài sản thường phù hợp hơn |
|---|---|---|
| Quỹ dự phòng (3–6 tháng chi tiêu) | Có thể cần bất cứ lúc nào | Tiền gửi, quỹ thị trường tiền tệ |
| Mua xe, học phí | 1–3 năm | Tiền gửi, trái phiếu/quỹ trái phiếu chất lượng cao |
| Mua nhà | 3–7 năm | Kết hợp trái phiếu và một phần cổ phiếu, giảm dần cổ phiếu khi gần đến hạn |
| Hưu trí, tự do tài chính | Trên 10 năm | Tỷ trọng cổ phiếu/ETF cao hơn, thêm trái phiếu và một phần nhỏ tài sản khác |

Nguyên tắc: **tiền càng sớm cần dùng, càng ít nên nằm ở tài sản biến động mạnh**. Với khoản dài hạn, biến động ngắn hạn có thời gian để hồi phục — nhưng chỉ khi bạn **không bị buộc phải bán** ở đáy.

## Khung tham khảo 4 bước (không phải lời khuyên)

1. **Nền móng:** quỹ dự phòng bằng tiền gửi; trả bớt nợ lãi suất cao trước khi đầu tư rủi ro.
2. **Lõi:** phần lớn tiền dài hạn ở tài sản đa dạng, chi phí thấp (ví dụ quỹ chỉ số cổ phiếu và quỹ trái phiếu), tỷ lệ theo khẩu vị rủi ro.
3. **Vệ tinh:** một phần nhỏ cho cổ phiếu tự chọn, vàng hoặc crypto — phần mà mất đi cũng không ảnh hưởng mục tiêu chính.
4. **Kỷ luật:** đặt quy tắc tái cân bằng và rà soát mỗi năm hoặc khi hoàn cảnh thay đổi.

Phái sinh, nếu dùng, nên được coi là **công cụ phòng hộ hoặc giao dịch ngắn hạn có giới hạn vốn chặt**, không phải phần "lõi".

Để chọn tỷ lệ cụ thể và hiểu cách tái cân bằng, xem bài [Phân bổ tài sản và tái cân bằng](/learn/phan-bo-tai-san-va-tai-can-bang) trong chương Quản lý danh mục, rồi thử với công cụ [Kế hoạch đầu tư](/learn/plans) của TradeLab.

## Thực hành

Vào [Kế hoạch đầu tư](/learn/plans), tạo một kế hoạch cho một mục tiêu cụ thể (ví dụ hưu trí sau 20 năm). Viết ra: mục tiêu, thời gian, quỹ dự phòng hiện có, tỷ lệ lõi/vệ tinh, và lớp tài sản bạn sẽ **không** dùng — kèm lý do.

## Nguồn tham khảo

- Investor.gov (SEC) — Beginners' Guide to Asset Allocation, Diversification, and Rebalancing (PDF, tiếng Anh): https://www.investor.gov/sites/investorgov/files/2019-02/Beginners-Guide-to-Asset-Allocation.pdf
- Investor.gov (SEC) — Asset Allocation and Diversification (tiếng Anh): https://www.investor.gov/introduction-investing/getting-started/asset-allocation`,
        questions: [
          {
            prompt: 'Bạn cần tiền mua xe sau 18 tháng. Lựa chọn nào hợp lý hơn cả?',
            options: ['Toàn bộ vào hợp đồng tương lai', 'Chủ yếu tiền gửi hoặc trái phiếu chất lượng cao', 'Toàn bộ vào crypto', 'Toàn bộ vào cổ phiếu một ngành'],
            correct_index: 1,
            explanation: 'Thời gian ngắn thì không đủ để hồi phục nếu thị trường giảm; nên ưu tiên tài sản ít biến động.',
          },
          {
            prompt: 'Vì sao bất động sản trực tiếp đôi khi "trông" ít biến động hơn cổ phiếu?',
            options: ['Vì bất động sản không bao giờ giảm giá', 'Vì nhà nước cố định giá nhà đất', 'Vì có bảo hiểm tiền gửi', 'Vì ít được định giá lại thường xuyên như cổ phiếu niêm yết'],
            correct_index: 3,
            explanation: 'Cổ phiếu có giá mỗi phút; bất động sản ít giao dịch nên biến động bị "ẩn" chứ không hẳn thấp hơn.',
          },
          {
            prompt: 'Trường hợp nào cổ phiếu và trái phiếu dễ CÙNG giảm?',
            options: ['Lạm phát cao khiến lãi suất tăng mạnh', 'Lãi suất được hạ trong suy thoái', 'Doanh nghiệp công bố lợi nhuận tốt', 'Không bao giờ xảy ra'],
            correct_index: 0,
            explanation: 'Lãi suất tăng làm giá trái phiếu giảm, đồng thời làm giảm định giá cổ phiếu — tương quan có thể chuyển sang dương.',
          },
          {
            prompt: 'Trong khung "lõi – vệ tinh", phần vệ tinh nên là gì?',
            options: ['Toàn bộ quỹ dự phòng', 'Phần lớn tiền hưu trí', 'Phần nhỏ dành cho tài sản rủi ro cao mà mất đi cũng không ảnh hưởng mục tiêu chính', 'Khoản vay ngân hàng để đầu tư'],
            correct_index: 2,
            explanation: 'Lõi là phần đa dạng, chi phí thấp; vệ tinh là phần nhỏ để thử nghiệm, có giới hạn rủi ro rõ ràng.',
          },
        ],
      },
    ],
  },
]
