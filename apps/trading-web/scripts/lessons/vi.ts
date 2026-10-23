import type { SeedChapter } from './types'
import { VI_ADVANCED } from './vi-advanced'
import { VI_FUNDAMENTALS } from './vi-fundamentals'
import { VI_PRACTICE } from './vi-practice'
import { VI_SECTORS } from './vi-sectors'

// Bộ bài khởi đầu tiếng Việt — số liệu khớp TradeLab: phí 0,1%, ví 10.000 USDT, không đòn bẩy, Short ký quỹ 100%.
export const VI: SeedChapter[] = [
  {
    slug: 'nhap-mon',
    title: 'Nhập môn giao dịch',
    description: 'Thị trường crypto, các loại lệnh, phí và hai chiều Long / Short.',
    lessons: [
      {
        slug: 'thi-truong-crypto-va-cap-giao-dich',
        title: 'Thị trường crypto và cặp giao dịch',
        summary: 'Sàn giao dịch hoạt động thế nào, cặp BTC/USDT nghĩa là gì và giá được hình thành ra sao.',
        content_md: `## Thị trường là gì?

Thị trường là nơi người mua và người bán gặp nhau. Trên sàn crypto, mọi người đặt **lệnh mua** và **lệnh bán**; khi giá hai bên khớp nhau thì một giao dịch xảy ra. Giá bạn thấy trên màn hình chính là **giá của giao dịch gần nhất** — không ai "quy định" giá, nó do cung và cầu quyết định từng giây.

Thị trường crypto mở **24/7**, kể cả cuối tuần và ngày lễ. Điều này khác với chứng khoán (chỉ giao dịch trong giờ hành chính) và là lý do giá crypto có thể biến động mạnh vào lúc bạn đang ngủ.

## Cặp giao dịch

Mỗi mã trên sàn là một **cặp**: tài sản cơ sở / tài sản định giá. Ví dụ **BTCUSDT** nghĩa là:

- **BTC** (Bitcoin) là thứ bạn mua hoặc bán.
- **USDT** (Tether) là đồng dùng để trả tiền — một stablecoin giữ giá xấp xỉ 1 USD.

Giá BTCUSDT = 65.000 nghĩa là cần 65.000 USDT để mua 1 BTC. Bạn không bắt buộc mua cả 1 BTC: có thể mua 0,01 BTC với khoảng 650 USDT.

## Vì sao giá thay đổi?

- **Cung – cầu:** nhiều người muốn mua hơn muốn bán → giá tăng, và ngược lại.
- **Tin tức:** quy định pháp lý, sự cố sàn, dòng tiền từ quỹ lớn.
- **Tâm lý đám đông:** sợ hãi và tham lam khiến giá thường đi quá đà so với giá trị hợp lý.

## Các con số trên bảng giá

| Cột | Ý nghĩa |
|---|---|
| Giá | Giá khớp gần nhất |
| 24h | % thay đổi so với 24 giờ trước |
| Cao / Thấp 24h | Vùng giá trong 24 giờ qua |
| Khối lượng 24h | Tổng lượng giao dịch — càng lớn, thị trường càng sôi động |

Khối lượng lớn thường đi kèm **thanh khoản** tốt: bạn mua bán dễ dàng mà giá không bị xô lệch nhiều. Với người mới, nên bắt đầu ở các cặp có khối lượng lớn như BTC, ETH.

## Thực hành trong TradeLab

Mở trang [Thị trường](/markets), so sánh % thay đổi 24h và khối lượng của vài mã. Bấm vào **BTCUSDT** để xem biểu đồ nến và tự hỏi: hôm nay phe mua hay phe bán đang chiếm ưu thế?`,
        questions: [
          {
            prompt: 'Trong cặp BTCUSDT, USDT đóng vai trò gì?',
            options: ['Tài sản bạn mua', 'Đồng dùng để định giá và thanh toán', 'Phí giao dịch', 'Tên sàn giao dịch'],
            correct_index: 1,
            explanation: 'USDT là đồng định giá: giá BTCUSDT cho biết cần bao nhiêu USDT để mua 1 BTC.',
          },
          {
            prompt: 'Giá hiển thị trên sàn được hình thành như thế nào?',
            options: ['Sàn tự đặt giá mỗi ngày', 'Theo giá của giao dịch khớp gần nhất giữa người mua và người bán', 'Do ngân hàng trung ương quy định', 'Cố định trong 24 giờ'],
            correct_index: 1,
            explanation: 'Giá là kết quả của cung – cầu: mỗi lần lệnh mua và bán khớp nhau sẽ tạo ra một giá mới.',
          },
          {
            prompt: 'Thị trường crypto mở cửa khi nào?',
            options: ['Chỉ giờ hành chính', 'Thứ Hai đến thứ Sáu', '24/7, kể cả cuối tuần', 'Chỉ buổi tối'],
            correct_index: 2,
            explanation: 'Crypto giao dịch liên tục 24/7, nên giá có thể biến động bất kỳ lúc nào.',
          },
          {
            prompt: 'Khối lượng giao dịch 24h lớn thường cho thấy điều gì?',
            options: ['Giá chắc chắn sẽ tăng', 'Thanh khoản tốt, mua bán dễ mà ít bị trượt giá', 'Phí giao dịch cao hơn', 'Mã sắp bị huỷ niêm yết'],
            correct_index: 1,
            explanation: 'Khối lượng lớn = nhiều người tham gia, nên lệnh của bạn dễ khớp ở giá gần với giá hiển thị.',
          },
        ],
      },
      {
        slug: 'lenh-market-va-limit',
        title: 'Lệnh Market và lệnh Limit',
        summary: 'Khi nào nên khớp ngay theo giá thị trường, khi nào nên chờ ở mức giá mình chọn.',
        content_md: `## Hai loại lệnh cơ bản

Mọi giao dịch đều bắt đầu từ một **lệnh**. Hai loại phổ biến nhất là **Market** và **Limit**.

### Lệnh Market (thị trường)

Lệnh Market nghĩa là: *"mua/bán ngay, giá nào cũng được"*. Lệnh khớp gần như tức thì theo giá tốt nhất đang có.

- **Ưu điểm:** chắc chắn khớp, nhanh.
- **Nhược điểm:** bạn không kiểm soát giá chính xác. Khi thị trường biến động mạnh hoặc thanh khoản mỏng, giá khớp có thể khác giá bạn vừa thấy — gọi là **trượt giá**.

Dùng Market khi việc **vào/ra ngay** quan trọng hơn vài đồng chênh lệch, ví dụ cần thoát lệnh vì tin xấu.

### Lệnh Limit (giới hạn)

Lệnh Limit nghĩa là: *"chỉ mua ở giá này hoặc thấp hơn"* (hoặc *"chỉ bán ở giá này hoặc cao hơn"*). Lệnh nằm chờ trong sổ lệnh cho tới khi giá chạm mức bạn đặt.

- **Ưu điểm:** kiểm soát được giá, không bị trượt giá.
- **Nhược điểm:** có thể **không bao giờ khớp** nếu giá không quay về mức đó.

**Ví dụ:** BTC đang ở 65.000. Bạn nghĩ giá sẽ chỉnh về 63.000 rồi mới tăng tiếp, nên đặt **Limit mua** 0,01 BTC giá 63.000. Nếu giá giảm chạm 63.000, lệnh khớp; nếu giá tăng thẳng lên 70.000, lệnh vẫn nằm chờ và bạn lỡ nhịp tăng.

## Tiền bị "giữ chỗ"

Khi đặt lệnh Limit mua, sàn **giữ chỗ** số tiền cần thiết (cộng phí) để đảm bảo bạn đủ tiền khi lệnh khớp. Trong TradeLab, phần này hiện ở mục **Đang giữ chỗ** trên trang Danh mục. Huỷ lệnh thì tiền được trả lại ngay.

## Chọn loại lệnh nào?

| Tình huống | Nên dùng |
|---|---|
| Cần vào/ra ngay lập tức | Market |
| Có mức giá mục tiêu rõ ràng, không vội | Limit |
| Thị trường biến động mạnh, sợ trượt giá | Limit |

Người mới thường lạm dụng lệnh Market vì nóng vội. Tập thói quen **lên kế hoạch giá vào trước**, rồi đặt Limit và kiên nhẫn chờ.

## Thực hành trong TradeLab

Vào một mã trong [Thị trường](/markets), đặt thử một lệnh **Limit mua** thấp hơn giá hiện tại khoảng 1–2%. Quan sát lệnh nằm trong **Lệnh đang chờ** và số tiền **đang giữ chỗ**, sau đó thử huỷ lệnh.`,
        questions: [
          {
            prompt: 'Đặc điểm chính của lệnh Market là gì?',
            options: ['Chỉ khớp ở đúng giá bạn chọn', 'Khớp ngay theo giá tốt nhất hiện có', 'Không bao giờ bị trượt giá', 'Chỉ dùng được khi bán'],
            correct_index: 1,
            explanation: 'Lệnh Market ưu tiên tốc độ: khớp ngay, đổi lại bạn không kiểm soát chính xác giá khớp.',
          },
          {
            prompt: 'BTC đang 65.000, bạn đặt Limit mua giá 63.000. Giá tăng thẳng lên 70.000. Điều gì xảy ra?',
            options: ['Lệnh khớp ở 70.000', 'Lệnh khớp ở 65.000', 'Lệnh vẫn nằm chờ, chưa khớp', 'Lệnh tự chuyển thành lệnh Market'],
            correct_index: 2,
            explanation: 'Limit mua chỉ khớp khi giá xuống tới 63.000 hoặc thấp hơn; giá không quay lại thì lệnh vẫn chờ.',
          },
          {
            prompt: 'Trượt giá là gì?',
            options: ['Chênh lệch giữa giá mong muốn và giá thực khớp', 'Phí rút tiền', 'Lệnh bị huỷ tự động', 'Giá giảm trong 24h'],
            correct_index: 0,
            explanation: 'Trượt giá xảy ra chủ yếu với lệnh Market khi thị trường biến động nhanh hoặc thanh khoản mỏng.',
          },
          {
            prompt: 'Vì sao một phần tiền bị "giữ chỗ" khi đặt Limit mua?',
            options: ['Sàn thu phí trước', 'Để đảm bảo đủ tiền khi lệnh khớp', 'Tiền bị khoá vĩnh viễn', 'Để trả lãi cho bạn'],
            correct_index: 1,
            explanation: 'Tiền giữ chỗ đảm bảo bạn có đủ tiền (cộng phí) khi lệnh khớp; huỷ lệnh thì tiền được trả lại.',
          },
        ],
      },
      {
        slug: 'phi-va-cach-tinh-lai-lo',
        title: 'Phí giao dịch và cách tính lãi/lỗ',
        summary: 'Phí 0,1% nghe nhỏ nhưng cộng dồn rất nhanh — và lãi/lỗ thật phải tính sau phí.',
        content_md: `## Phí giao dịch

Mỗi lần lệnh khớp, sàn thu một khoản **phí** tính theo phần trăm giá trị lệnh. Trong TradeLab, phí là **0,1%** cho mỗi lần khớp, cả khi mua lẫn khi bán.

**Ví dụ:** mua 0,02 BTC giá 50.000 USDT.

- Giá trị lệnh = 0,02 × 50.000 = **1.000 USDT**
- Phí = 1.000 × 0,1% = **1 USDT**

Một vòng mua rồi bán tốn **hai lần phí**. Nếu bán lại cũng ở khoảng 1.000 USDT, tổng phí khoảng 2 USDT — tức giá phải tăng hơn **0,2%** bạn mới bắt đầu có lãi.

## Lãi/lỗ tạm tính và lãi/lỗ đã chốt

- **Lãi/lỗ tạm tính (unrealized):** vị thế còn mở, tính theo giá hiện tại. Con số này thay đổi liên tục và **chưa phải tiền thật** của bạn.
- **Lãi/lỗ đã chốt (realized):** phát sinh khi bạn đóng (một phần) vị thế. Đây mới là kết quả thật.

Công thức cho vị thế mua (Long):

> Lãi/lỗ = (Giá bán − Giá vào) × Số lượng − Phí

**Ví dụ đầy đủ:** mua 0,02 BTC giá 50.000 (phí 1 USDT), bán ở 52.000.

- Giá trị bán = 0,02 × 52.000 = 1.040 USDT, phí bán = 1,04 USDT
- Chênh lệch giá = (52.000 − 50.000) × 0,02 = 40 USDT
- Lãi ròng = 40 − 1 − 1,04 = **37,96 USDT**

## Giá vào trung bình

Nếu mua nhiều lần ở các giá khác nhau, sàn tính **giá vào trung bình** theo khối lượng. Mua 0,01 BTC giá 50.000 và 0,01 BTC giá 52.000 → giá vào trung bình là 51.000.

## Vì sao phí quan trọng?

Giao dịch càng dày, phí càng lớn. Một người vào ra 10 lần mỗi ngày với lệnh 1.000 USDT sẽ trả khoảng **20 USDT phí/ngày** — hơn 600 USDT mỗi tháng — trước khi kiếm được đồng lãi nào. Đây là lý do "giao dịch ít mà chất" thường hiệu quả hơn.

## Thực hành trong TradeLab

Đặt một lệnh nhỏ, xem dòng **Phí ước tính** trước khi gửi lệnh. Sau đó mở [Nhật ký](/journal) để xem **Tổng phí** và **Lãi/lỗ ròng** — chỉ số ròng đã trừ toàn bộ phí.`,
        questions: [
          {
            prompt: 'Phí 0,1% cho lệnh trị giá 1.000 USDT là bao nhiêu?',
            options: ['0,1 USDT', '1 USDT', '10 USDT', '100 USDT'],
            correct_index: 1,
            explanation: '1.000 × 0,1% = 1 USDT.',
          },
          {
            prompt: 'Lãi/lỗ tạm tính khác lãi/lỗ đã chốt ở điểm nào?',
            options: ['Không khác gì nhau', 'Tạm tính là của vị thế còn mở và thay đổi theo giá; đã chốt là kết quả khi đóng vị thế', 'Tạm tính đã trừ phí, đã chốt thì chưa', 'Đã chốt chỉ áp dụng cho lệnh Limit'],
            correct_index: 1,
            explanation: 'Chỉ khi đóng vị thế, lãi/lỗ mới thành kết quả thật; trước đó nó chỉ là con số tạm tính.',
          },
          {
            prompt: 'Mua 0,01 BTC giá 50.000 và 0,01 BTC giá 52.000. Giá vào trung bình là?',
            options: ['50.000', '51.000', '52.000', '102.000'],
            correct_index: 1,
            explanation: 'Hai lần mua cùng khối lượng nên giá trung bình là (50.000 + 52.000) / 2 = 51.000.',
          },
          {
            prompt: 'Với phí 0,1% mỗi chiều, giá cần tăng khoảng bao nhiêu để một vòng mua – bán bắt đầu có lãi?',
            options: ['0,01%', 'Khoảng 0,2%', '1%', '10%'],
            correct_index: 1,
            explanation: 'Mua và bán đều mất 0,1%, nên giá phải tăng hơn khoảng 0,2% mới bù được phí.',
          },
        ],
      },
      {
        slug: 'long-va-short',
        title: 'Long và Short',
        summary: 'Kiếm lợi khi giá tăng bằng Long, khi giá giảm bằng Short — và rủi ro riêng của Short.',
        content_md: `## Long — đặt cược giá tăng

**Long** (mua lên) là cách quen thuộc nhất: mua trước, bán sau với giá cao hơn.

> Mua 0,1 ETH giá 3.000 → bán ở 3.300 → lãi (3.300 − 3.000) × 0,1 = 30 USDT (chưa trừ phí).

Rủi ro tối đa của Long (không đòn bẩy) là mất toàn bộ số tiền đã bỏ ra nếu giá về 0.

## Short — đặt cược giá giảm

**Short** (bán xuống) đảo ngược thứ tự: **bán trước, mua lại sau**. Bạn kiếm lời khi giá giảm.

> Short 0,1 ETH giá 3.000 → mua lại ở 2.700 → lãi (3.000 − 2.700) × 0,1 = 30 USDT (chưa trừ phí).

Trong TradeLab, nếu bạn **bán nhiều hơn số đang giữ**, phần vượt sẽ mở vị thế Short. Short dùng **ký quỹ 100%**: số tiền bằng giá trị vị thế bị giữ lại làm bảo đảm, không có đòn bẩy.

## Rủi ro đặc biệt của Short

Giá chỉ giảm được tới 0, nhưng **có thể tăng không giới hạn**. Vì vậy lỗ của Short về lý thuyết là vô hạn. Khi giá tăng quá xa so với giá vào, khoản ký quỹ không còn đủ bù lỗ và vị thế sẽ bị **thanh lý** (tự động đóng). TradeLab hiển thị **Giá thanh lý** ngay trên biểu đồ để bạn thấy mình còn cách ngưỡng đó bao xa.

| | Long | Short |
|---|---|---|
| Kiếm lời khi | Giá tăng | Giá giảm |
| Thứ tự | Mua → bán | Bán → mua lại |
| Lỗ tối đa (không đòn bẩy) | Số vốn bỏ ra | Lớn, có thể bị thanh lý |

## Khi nào nên Short?

- Xu hướng giảm rõ ràng (đỉnh sau thấp hơn đỉnh trước).
- Giá bị từ chối tại vùng kháng cự mạnh.
- **Luôn** đặt stop-loss — với Short, điều này còn quan trọng hơn Long.

Người mới nên làm quen với Long trước, rồi mới thử Short với khối lượng nhỏ.

## Thực hành trong TradeLab

Trên một mã bất kỳ trong [Thị trường](/markets), mở một vị thế Short nhỏ bằng cách bán khi không giữ coin nào. Quan sát chiều **Short**, **Giá thanh lý** và lãi/lỗ tạm tính thay đổi ngược chiều giá.`,
        questions: [
          {
            prompt: 'Vị thế Short kiếm lời khi nào?',
            options: ['Khi giá tăng', 'Khi giá giảm', 'Khi giá đi ngang', 'Khi khối lượng tăng'],
            correct_index: 1,
            explanation: 'Short bán trước ở giá cao rồi mua lại ở giá thấp hơn, nên có lãi khi giá giảm.',
          },
          {
            prompt: 'Short 0,1 ETH giá 3.000 rồi mua lại ở 2.700. Lãi trước phí là bao nhiêu?',
            options: ['3 USDT', '30 USDT', '300 USDT', 'Lỗ 30 USDT'],
            correct_index: 1,
            explanation: '(3.000 − 2.700) × 0,1 = 30 USDT.',
          },
          {
            prompt: 'Vì sao Short rủi ro hơn Long?',
            options: ['Phí Short cao gấp đôi', 'Giá có thể tăng không giới hạn nên lỗ có thể rất lớn', 'Short không thể đóng lệnh', 'Short chỉ khớp bằng lệnh Limit'],
            correct_index: 1,
            explanation: 'Giá chỉ giảm tới 0 nhưng có thể tăng mãi; Short lỗ khi giá tăng nên rủi ro về lý thuyết là vô hạn.',
          },
          {
            prompt: 'Trong TradeLab, điều gì xảy ra khi bạn bán nhiều hơn số coin đang giữ?',
            options: ['Lệnh bị từ chối', 'Phần vượt mở vị thế Short với ký quỹ 100%', 'Sàn cho vay với đòn bẩy 10x', 'Lệnh tự chuyển thành Limit'],
            correct_index: 1,
            explanation: 'Phần bán vượt số đang giữ sẽ mở Short, giữ ký quỹ bằng 100% giá trị vị thế.',
          },
        ],
      },
    ],
  },
  {
    slug: 'phan-tich-ky-thuat',
    title: 'Phân tích kỹ thuật cơ bản',
    description: 'Đọc nến, tìm hỗ trợ – kháng cự và nhận diện xu hướng.',
    lessons: [
      {
        slug: 'doc-nen-nhat',
        title: 'Đọc nến Nhật',
        summary: 'Mỗi cây nến kể câu chuyện giằng co giữa phe mua và phe bán trong một khoảng thời gian.',
        content_md: `## Cấu tạo một cây nến

Mỗi cây nến thể hiện giá trong **một khung thời gian** (1 phút, 1 giờ, 1 ngày…). Nó có 4 mức giá:

- **Mở cửa (Open):** giá đầu khung.
- **Đóng cửa (Close):** giá cuối khung.
- **Cao nhất (High)** và **Thấp nhất (Low)** trong khung.

Phần thân nối giá mở và giá đóng. Hai **râu nến** (bóng nến) kéo dài tới giá cao nhất và thấp nhất.

- **Nến xanh (tăng):** giá đóng cao hơn giá mở.
- **Nến đỏ (giảm):** giá đóng thấp hơn giá mở.

## Thân nến nói gì?

- **Thân dài:** một phe áp đảo rõ ràng trong khung đó.
- **Thân ngắn:** hai phe giằng co, thị trường do dự.

## Râu nến nói gì?

Râu dài cho thấy giá từng đi xa nhưng **bị đẩy ngược lại**.

- **Râu dưới dài:** phe bán đẩy giá xuống sâu nhưng phe mua kéo lên lại — dấu hiệu lực mua.
- **Râu trên dài:** phe mua đẩy lên cao nhưng bị bán xuống — dấu hiệu lực bán.

## Vài mẫu nến phổ biến

| Mẫu | Hình dạng | Gợi ý |
|---|---|---|
| Doji | Thân rất nhỏ, giá mở ≈ giá đóng | Do dự, xu hướng có thể chững lại |
| Búa (Hammer) | Thân nhỏ ở trên, râu dưới dài | Sau nhịp giảm: khả năng đảo chiều tăng |
| Sao băng (Shooting star) | Thân nhỏ ở dưới, râu trên dài | Sau nhịp tăng: khả năng đảo chiều giảm |
| Nhấn chìm tăng | Nến xanh thân lớn bao trùm nến đỏ trước | Phe mua giành lại quyền kiểm soát |

## Lưu ý quan trọng

Một cây nến riêng lẻ **không đủ** để ra quyết định. Mẫu nến có ý nghĩa hơn khi xuất hiện ở **vùng giá quan trọng** (hỗ trợ, kháng cự — bài sau) và trên khung thời gian lớn hơn (khung 1 ngày đáng tin hơn khung 1 phút). Hãy dùng nến để xác nhận, không dùng để đoán.

## Thực hành trong TradeLab

Mở biểu đồ **BTCUSDT** trong [Thị trường](/markets), chuyển qua lại giữa khung 1 giờ và 1 ngày. Tìm một cây nến có râu dưới dài và xem giá sau đó diễn biến thế nào.`,
        questions: [
          {
            prompt: 'Nến xanh (nến tăng) nghĩa là gì?',
            options: ['Khối lượng tăng', 'Giá đóng cửa cao hơn giá mở cửa', 'Giá cao nhất vượt đỉnh cũ', 'Phí giao dịch thấp'],
            correct_index: 1,
            explanation: 'Màu nến chỉ so sánh giá đóng với giá mở trong cùng khung thời gian.',
          },
          {
            prompt: 'Một cây nến có râu dưới rất dài cho thấy điều gì?',
            options: ['Phe bán áp đảo hoàn toàn', 'Giá từng giảm sâu nhưng phe mua đã kéo lên lại', 'Thị trường đóng cửa', 'Giá sẽ chắc chắn tăng'],
            correct_index: 1,
            explanation: 'Râu dưới dài là dấu hiệu giá thấp bị từ chối — lực mua xuất hiện.',
          },
          {
            prompt: 'Nến Doji (thân rất nhỏ) thường thể hiện điều gì?',
            options: ['Xu hướng tăng mạnh', 'Sự do dự giữa hai phe', 'Lỗi dữ liệu', 'Giá bị thanh lý'],
            correct_index: 1,
            explanation: 'Giá mở và đóng gần bằng nhau nghĩa là không phe nào thắng trong khung đó.',
          },
          {
            prompt: 'Cách dùng mẫu nến hợp lý nhất là?',
            options: ['Vào lệnh ngay khi thấy một mẫu nến', 'Kết hợp với vùng giá quan trọng và khung thời gian lớn để xác nhận', 'Chỉ dùng khung 1 phút', 'Bỏ qua râu nến'],
            correct_index: 1,
            explanation: 'Một cây nến đơn lẻ dễ gây nhiễu; mẫu nến đáng tin hơn tại hỗ trợ/kháng cự và trên khung lớn.',
          },
        ],
      },
      {
        slug: 'ho-tro-va-khang-cu',
        title: 'Hỗ trợ và kháng cự',
        summary: 'Những vùng giá mà thị trường "nhớ": nơi lực mua hoặc lực bán thường xuất hiện.',
        content_md: `## Hỗ trợ là gì?

**Hỗ trợ** là vùng giá mà khi giảm tới, giá thường **dừng lại hoặc bật lên**, vì nhiều người coi đó là giá "rẻ" và sẵn sàng mua. Hãy hình dung nó như sàn nhà.

## Kháng cự là gì?

**Kháng cự** là vùng giá mà khi tăng tới, giá thường **chững lại hoặc quay đầu**, vì nhiều người muốn chốt lời hoặc bán ra. Hãy hình dung nó như trần nhà.

## Cách tìm hỗ trợ và kháng cự

1. **Đỉnh và đáy cũ:** nơi giá từng đảo chiều nhiều lần.
2. **Số tròn:** 60.000, 3.000… — con người thích đặt lệnh ở số tròn.
3. **Vùng giá đi ngang lâu:** nơi hai phe từng cân bằng.

Hãy vẽ **vùng** chứ không phải một đường chính xác tuyệt đối. Giá thường xuyên "đâm" nhẹ qua rồi quay lại.

## Càng chạm nhiều càng mạnh?

Một vùng được giá chạm và bật lại nhiều lần thì càng được nhiều người chú ý. Nhưng mỗi lần chạm cũng làm lượng lệnh chờ ở đó hao mòn dần — vì vậy vùng bị thử quá nhiều lần cũng có thể sắp bị phá.

## Đổi vai: hỗ trợ thành kháng cự

Khi giá **phá vỡ** một vùng kháng cự và đóng cửa phía trên, vùng đó thường trở thành **hỗ trợ** mới — và ngược lại. Ví dụ BTC nhiều lần bị chặn ở 60.000; sau khi vượt lên 62.000, nếu giá quay về 60.000 thì vùng này thường được mua lại.

## Ứng dụng vào giao dịch

| Ý tưởng | Cách làm |
|---|---|
| Mua gần hỗ trợ | Đặt Limit mua trong vùng hỗ trợ, stop-loss ngay dưới vùng |
| Chốt lời gần kháng cự | Đặt take-profit ngay dưới vùng kháng cự |
| Giao dịch phá vỡ | Chờ nến đóng cửa vượt hẳn vùng, tránh vào khi mới chạm |

Điểm mấu chốt: hỗ trợ/kháng cự giúp bạn biết **đặt stop-loss ở đâu** một cách có lý do, thay vì đặt tuỳ hứng.

## Thực hành trong TradeLab

Trên biểu đồ một mã trong [Thị trường](/markets), tìm 2 đáy gần nhau ở cùng vùng giá (hỗ trợ) và 2 đỉnh ở cùng vùng giá (kháng cự). Thử đặt một lệnh Limit mua gần vùng hỗ trợ đó.`,
        questions: [
          {
            prompt: 'Hỗ trợ là gì?',
            options: ['Vùng giá mà khi tăng tới thường bị bán ra', 'Vùng giá mà khi giảm tới thường có lực mua đỡ giá', 'Mức phí thấp nhất', 'Giá mở cửa của ngày'],
            correct_index: 1,
            explanation: 'Hỗ trợ giống sàn nhà: nhiều người sẵn sàng mua ở đó nên giá thường dừng giảm.',
          },
          {
            prompt: 'Sau khi giá phá vỡ và đóng cửa trên một vùng kháng cự, vùng đó thường trở thành gì?',
            options: ['Kháng cự mạnh hơn', 'Hỗ trợ mới', 'Vô nghĩa', 'Giá thanh lý'],
            correct_index: 1,
            explanation: 'Đây là hiện tượng đổi vai: kháng cự bị phá thường trở thành hỗ trợ.',
          },
          {
            prompt: 'Vì sao nên vẽ hỗ trợ/kháng cự là một vùng thay vì một đường chính xác?',
            options: ['Cho đẹp biểu đồ', 'Vì giá thường đâm nhẹ qua rồi quay lại', 'Vì sàn yêu cầu', 'Vì vùng không bao giờ bị phá'],
            correct_index: 1,
            explanation: 'Lệnh của nhiều người nằm rải rác quanh một mức, nên phản ứng giá diễn ra trong một vùng.',
          },
          {
            prompt: 'Khi mua gần hỗ trợ, đặt stop-loss ở đâu hợp lý?',
            options: ['Ngay trên vùng kháng cự', 'Ngay dưới vùng hỗ trợ', 'Tại giá vào lệnh', 'Không cần stop-loss'],
            correct_index: 1,
            explanation: 'Nếu giá thủng hẳn hỗ trợ thì ý tưởng mua đã sai — stop-loss ngay dưới vùng giúp cắt lỗ sớm.',
          },
        ],
      },
      {
        slug: 'xu-huong-va-duong-ma',
        title: 'Xu hướng và đường trung bình động (MA)',
        summary: 'Giao dịch thuận xu hướng và dùng đường MA để lọc nhiễu.',
        content_md: `## Ba trạng thái của thị trường

1. **Xu hướng tăng:** đỉnh sau cao hơn đỉnh trước, đáy sau cao hơn đáy trước.
2. **Xu hướng giảm:** đỉnh sau thấp hơn, đáy sau thấp hơn.
3. **Đi ngang (sideway):** giá dao động trong một biên độ, không có đỉnh/đáy mới rõ ràng.

Câu nói nổi tiếng: **"Xu hướng là bạn"**. Mua trong xu hướng tăng (hoặc Short trong xu hướng giảm) có xác suất thành công cao hơn đi ngược dòng.

## Đường trung bình động (MA)

**MA** là giá đóng cửa trung bình của N cây nến gần nhất, nối lại thành một đường. Ví dụ MA20 trên khung ngày là giá trung bình 20 ngày gần nhất.

> Giá đóng 5 ngày: 100, 102, 104, 103, 106 → MA5 = (100 + 102 + 104 + 103 + 106) / 5 = **103**

MA làm **mượt** biến động, giúp bạn nhìn thấy hướng đi chính thay vì từng cây nến nhiễu.

## Đọc tín hiệu từ MA

- **Giá nằm trên MA và MA dốc lên:** xu hướng tăng.
- **Giá nằm dưới MA và MA dốc xuống:** xu hướng giảm.
- **MA đi ngang, giá cắt qua cắt lại:** thị trường đi ngang — tín hiệu MA kém tin cậy.

Trong xu hướng tăng, MA thường đóng vai trò **hỗ trợ động**: giá điều chỉnh về MA rồi bật lên.

## MA ngắn và MA dài

| | MA ngắn (ví dụ 20) | MA dài (ví dụ 50, 200) |
|---|---|---|
| Phản ứng | Nhanh | Chậm |
| Nhiễu | Nhiều | Ít |
| Dùng để | Xem nhịp ngắn hạn | Xác định xu hướng lớn |

Khi MA ngắn cắt **lên** MA dài, nhiều người coi là tín hiệu tăng; cắt **xuống** là tín hiệu giảm. Nhưng MA là chỉ báo **trễ** — nó chỉ xác nhận điều đã xảy ra, nên đừng kỳ vọng mua đúng đáy hay bán đúng đỉnh.

## Thực hành trong TradeLab

Mở biểu đồ khung 1 ngày của một mã trong [Thị trường](/markets). Tự xác định: chuỗi đỉnh/đáy gần đây đang tăng, giảm hay đi ngang? Ghi nhận định đó vào phần lý do vào lệnh nếu bạn đặt lệnh.`,
        questions: [
          {
            prompt: 'Dấu hiệu của xu hướng tăng là gì?',
            options: ['Đỉnh sau thấp hơn đỉnh trước', 'Đỉnh sau cao hơn đỉnh trước và đáy sau cao hơn đáy trước', 'Giá không đổi', 'Khối lượng bằng 0'],
            correct_index: 1,
            explanation: 'Xu hướng tăng được nhận diện qua chuỗi đỉnh cao dần và đáy cao dần.',
          },
          {
            prompt: 'Giá đóng 5 ngày là 100, 102, 104, 103, 106. MA5 bằng bao nhiêu?',
            options: ['100', '103', '104', '106'],
            correct_index: 1,
            explanation: 'Tổng 515 chia 5 = 103.',
          },
          {
            prompt: 'Vì sao MA được gọi là chỉ báo trễ?',
            options: ['Vì cập nhật chậm 1 ngày', 'Vì nó tính từ giá quá khứ nên chỉ xác nhận điều đã xảy ra', 'Vì sàn tính sai', 'Vì chỉ dùng được vào buổi tối'],
            correct_index: 1,
            explanation: 'MA là trung bình của giá đã qua, nên luôn phản ứng sau giá.',
          },
          {
            prompt: 'Khi MA đi ngang và giá liên tục cắt qua lại, điều đó gợi ý gì?',
            options: ['Xu hướng tăng mạnh', 'Thị trường đi ngang, tín hiệu MA kém tin cậy', 'Sắp bị thanh lý', 'Nên tăng khối lượng lệnh'],
            correct_index: 1,
            explanation: 'Trong thị trường đi ngang, giá cắt MA liên tục tạo nhiều tín hiệu giả.',
          },
        ],
      },
    ],
  },
  {
    slug: 'quan-ly-rui-ro',
    title: 'Quản lý rủi ro và tâm lý',
    description: 'Stop-loss, cỡ vị thế, nhật ký giao dịch và cách kiểm soát cảm xúc.',
    level: 'intermediate',
    lessons: [
      {
        slug: 'stop-loss-va-take-profit',
        title: 'Stop-loss và Take-profit',
        summary: 'Quyết định điểm thoát lệnh trước khi vào lệnh — và tỷ lệ lợi nhuận / rủi ro.',
        content_md: `## Vì sao cần stop-loss?

Không ai đúng 100%. **Stop-loss (SL)** là lệnh tự động đóng vị thế khi giá đi ngược ý bạn tới một mức đã định. Nó biến một khoản lỗ **không biết trước** thành một khoản lỗ **đã tính trước**.

Không có stop-loss, một lệnh sai nhỏ có thể trở thành khoản lỗ lớn vì bạn cứ hy vọng "giá sẽ quay lại".

## Take-profit là gì?

**Take-profit (TP)** là lệnh tự động chốt lời khi giá đạt mục tiêu. Nó giúp bạn không tham lam giữ lệnh quá lâu rồi để lãi biến thành lỗ.

## Đặt SL và TP ở đâu?

Đặt theo **cấu trúc giá**, không theo con số tuỳ hứng:

- **Lệnh mua:** SL ngay dưới vùng hỗ trợ gần nhất; TP ngay dưới vùng kháng cự tiếp theo.
- **Lệnh Short:** SL ngay trên vùng kháng cự; TP ngay trên vùng hỗ trợ.

## Tỷ lệ lợi nhuận / rủi ro (R:R)

> R:R = (TP − Giá vào) / (Giá vào − SL)

**Ví dụ:** mua ETH giá 3.000, SL 2.900, TP 3.300.

- Rủi ro = 100, lợi nhuận kỳ vọng = 300 → **R:R = 1:3**

Với R:R 1:3, bạn chỉ cần đúng **khoảng 1/4 số lệnh** là đã hoà vốn (chưa tính phí). Đó là lý do trader chuyên nghiệp thường chỉ vào lệnh khi R:R từ 1:2 trở lên.

| R:R | Tỷ lệ thắng tối thiểu để hoà vốn |
|---|---|
| 1:1 | 50% |
| 1:2 | ~33% |
| 1:3 | 25% |

## Những sai lầm thường gặp

- **Dời SL xa hơn** khi giá sắp chạm — biến khoản lỗ nhỏ thành lỗ lớn.
- **Đặt SL quá sát** — bị "quét" bởi biến động bình thường.
- **Không đặt TP**, rồi nhìn lãi tan biến.

## Thực hành trong TradeLab

Khi đặt lệnh Market trong [Thị trường](/markets), điền cả ô **Stop-loss** và **Take-profit**. Hai đường SL/TP sẽ hiện trên biểu đồ. Tính trước R:R của lệnh và ghi vào lý do vào lệnh.`,
        questions: [
          {
            prompt: 'Mục đích chính của stop-loss là gì?',
            options: ['Tăng lợi nhuận', 'Giới hạn khoản lỗ ở mức đã tính trước', 'Giảm phí giao dịch', 'Mở thêm vị thế'],
            correct_index: 1,
            explanation: 'Stop-loss tự động đóng lệnh khi giá đi ngược tới mức đã định, giúp khoản lỗ không vượt kế hoạch.',
          },
          {
            prompt: 'Mua giá 3.000, SL 2.900, TP 3.300. Tỷ lệ R:R là bao nhiêu?',
            options: ['1:1', '1:2', '1:3', '3:1'],
            correct_index: 2,
            explanation: 'Rủi ro 100, lợi nhuận 300 → R:R = 1:3.',
          },
          {
            prompt: 'Với R:R 1:2, cần tỷ lệ thắng tối thiểu khoảng bao nhiêu để hoà vốn (chưa tính phí)?',
            options: ['10%', 'Khoảng 33%', '50%', '75%'],
            correct_index: 1,
            explanation: 'Thắng 1 lệnh được 2R bù được 2 lệnh thua 1R, nên cần thắng khoảng 1/3 số lệnh.',
          },
          {
            prompt: 'Hành động nào là sai lầm khi quản lý stop-loss?',
            options: ['Đặt SL dưới vùng hỗ trợ', 'Dời SL xa hơn khi giá sắp chạm', 'Tính R:R trước khi vào lệnh', 'Đặt SL ngay khi mở lệnh'],
            correct_index: 1,
            explanation: 'Dời SL ra xa là phá vỡ kế hoạch và thường biến lỗ nhỏ thành lỗ lớn.',
          },
          {
            prompt: 'Với lệnh Short, stop-loss nên đặt ở đâu?',
            options: ['Ngay dưới vùng hỗ trợ', 'Ngay trên vùng kháng cự', 'Bằng giá vào', 'Không cần đặt'],
            correct_index: 1,
            explanation: 'Short lỗ khi giá tăng, nên SL đặt phía trên — ngay trên vùng kháng cự gần nhất.',
          },
        ],
      },
      {
        slug: 'co-vi-the-va-quy-tac-1-2',
        title: 'Cỡ vị thế và quy tắc 1–2%',
        summary: 'Mua bao nhiêu là đủ? Tính khối lượng lệnh từ số tiền bạn chấp nhận mất.',
        content_md: `## Câu hỏi quan trọng nhất

Người mới thường hỏi "mua mã nào?". Trader lâu năm hỏi **"mua bao nhiêu?"**. Cỡ vị thế quyết định một lệnh sai làm bạn đau nhẹ hay cháy tài khoản.

## Quy tắc 1–2%

Mỗi lệnh chỉ nên mạo hiểm **1–2% tổng vốn**. "Mạo hiểm" ở đây là số tiền bạn mất **nếu stop-loss bị chạm** — không phải tổng tiền bỏ vào lệnh.

Với ví 10.000 USDT trong TradeLab:

- Rủi ro 1% = **100 USDT** mỗi lệnh
- Rủi ro 2% = **200 USDT** mỗi lệnh

## Công thức tính khối lượng

> Khối lượng = Số tiền rủi ro / (Giá vào − Giá stop-loss)

**Ví dụ:** vốn 10.000 USDT, rủi ro 1% = 100 USDT. Mua BTC giá 60.000, stop-loss 58.000.

- Khoảng cách tới SL = 2.000 USDT mỗi BTC
- Khối lượng = 100 / 2.000 = **0,05 BTC** (giá trị lệnh 3.000 USDT)

Nếu SL bị chạm, bạn mất khoảng 100 USDT (cộng thêm phí) — đúng 1% vốn như kế hoạch.

Lưu ý: SL càng xa thì khối lượng càng nhỏ, SL càng gần thì khối lượng càng lớn. **Rủi ro tính bằng tiền luôn giữ nguyên.**

## Vì sao 1–2% lại quan trọng?

Chuỗi thua liên tiếp là chuyện bình thường, kể cả với chiến lược tốt.

| Thua liên tiếp | Rủi ro 1%/lệnh | Rủi ro 10%/lệnh |
|---|---|---|
| 5 lệnh | còn ~95% vốn | còn ~59% vốn |
| 10 lệnh | còn ~90% vốn | còn ~35% vốn |

Mất 65% vốn thì phải lãi gần **190%** mới quay về ban đầu. Giữ rủi ro nhỏ giúp bạn **sống sót đủ lâu** để chiến lược phát huy tác dụng.

## Những điều cần tránh

- Dồn toàn bộ vốn vào một lệnh vì "chắc chắn".
- Tăng khối lượng để gỡ lại lệnh vừa thua.
- Mở nhiều lệnh cùng lúc trên các mã chạy cùng chiều (BTC và ETH thường tăng/giảm cùng nhau) — tổng rủi ro thực tế lớn hơn bạn nghĩ.

## Thực hành trong TradeLab

Trước lệnh tiếp theo trong [Thị trường](/markets), chọn mức stop-loss rồi tính khối lượng sao cho rủi ro đúng 1% ví. Dùng chế độ **Nhập theo số lượng** để điền chính xác.`,
        questions: [
          {
            prompt: 'Theo quy tắc 1%, với ví 10.000 USDT bạn nên mạo hiểm tối đa bao nhiêu mỗi lệnh?',
            options: ['10 USDT', '100 USDT', '1.000 USDT', '10.000 USDT'],
            correct_index: 1,
            explanation: '1% của 10.000 = 100 USDT — số tiền mất nếu stop-loss bị chạm.',
          },
          {
            prompt: 'Rủi ro 100 USDT, mua giá 60.000, SL 58.000. Khối lượng là bao nhiêu?',
            options: ['0,005 BTC', '0,05 BTC', '0,5 BTC', '1 BTC'],
            correct_index: 1,
            explanation: '100 / (60.000 − 58.000) = 0,05 BTC.',
          },
          {
            prompt: '"Số tiền rủi ro" trong quy tắc 1–2% là gì?',
            options: ['Tổng tiền bỏ vào lệnh', 'Số tiền mất nếu stop-loss bị chạm', 'Phí giao dịch', 'Lợi nhuận kỳ vọng'],
            correct_index: 1,
            explanation: 'Rủi ro là khoản lỗ khi SL bị chạm, không phải giá trị cả lệnh.',
          },
          {
            prompt: 'Khi đặt stop-loss xa hơn mà vẫn giữ rủi ro 1%, khối lượng lệnh phải thế nào?',
            options: ['Tăng lên', 'Giảm xuống', 'Giữ nguyên', 'Không liên quan'],
            correct_index: 1,
            explanation: 'Khoảng cách tới SL lớn hơn thì mỗi đơn vị mất nhiều hơn, nên phải mua ít hơn để tổng rủi ro không đổi.',
          },
        ],
      },
      {
        slug: 'nhat-ky-giao-dich-va-fomo',
        title: 'Nhật ký giao dịch và tâm lý FOMO',
        summary: 'Kẻ thù lớn nhất của trader thường là chính mình — nhật ký giúp bạn nhìn thấy điều đó.',
        content_md: `## Tâm lý quyết định kết quả

Hai người dùng cùng một chiến lược có thể cho kết quả rất khác nhau, vì một người **tuân thủ kế hoạch**, người kia để cảm xúc dẫn dắt. Những cảm xúc nguy hiểm nhất:

- **FOMO** (sợ bỏ lỡ): thấy giá tăng mạnh liền mua đuổi, thường mua ngay đỉnh.
- **Tham lam:** không chốt lời, tăng khối lượng quá mức.
- **Sợ hãi:** cắt lệnh tốt quá sớm, hoặc không dám vào lệnh đúng kế hoạch.
- **Gỡ gạc (revenge trading):** vừa thua liền vào lệnh to hơn để gỡ — cách nhanh nhất để thua nặng.

## Dấu hiệu bạn đang FOMO

- Vào lệnh vì "ai cũng đang mua", không có lý do kỹ thuật.
- Không xác định được stop-loss trước khi vào.
- Giá đã chạy xa khỏi hỗ trợ gần nhất, R:R rất xấu.

Cách chữa: tự đặt quy tắc **"không có kế hoạch, không vào lệnh"**. Lỡ một cơ hội không làm bạn mất tiền; mua đuổi ở đỉnh thì có.

## Nhật ký giao dịch

Nhật ký biến cảm giác mơ hồ thành **dữ liệu**. Với mỗi lệnh, ghi lại:

1. **Lý do vào lệnh:** thiết lập kỹ thuật nào? SL/TP ở đâu, R:R bao nhiêu?
2. **Cảm xúc lúc đó:** bình tĩnh, tự tin hay FOMO?
3. **Kết quả và bài học:** đúng/sai ở đâu, lần sau làm gì khác?
4. **Tag:** ví dụ *breakout*, *ho-tro*, *fomo* để lọc lại sau này.

Sau 20–30 lệnh, hãy xem lại: các lệnh gắn cảm xúc *FOMO* hay *gỡ gạc* thường có tỷ lệ thắng thế nào? Hầu hết trader phát hiện ra phần lớn khoản lỗ lớn đến từ một vài thói quen xấu lặp đi lặp lại.

## Các chỉ số nên theo dõi

| Chỉ số | Cho biết |
|---|---|
| Tỷ lệ thắng | Bao nhiêu % lệnh chốt có lãi |
| Profit factor | Tổng lãi / tổng lỗ — trên 1 là có lãi |
| Sụt giảm lớn nhất | Mức tụt vốn sâu nhất từ đỉnh |

## Thực hành trong TradeLab

Mở [Nhật ký](/journal), chọn một giao dịch gần đây và ghi **lý do, cảm xúc, bài học**, tự chấm sao. Khi đặt lệnh mới, dùng ô **Lý do vào lệnh** trong khung đặt lệnh để ghi kế hoạch ngay từ đầu.`,
        questions: [
          {
            prompt: 'FOMO trong giao dịch là gì?',
            options: ['Chiến lược theo xu hướng', 'Sợ bỏ lỡ nên mua đuổi khi giá đã tăng mạnh', 'Một loại lệnh', 'Phí ẩn của sàn'],
            correct_index: 1,
            explanation: 'FOMO khiến trader vào lệnh không theo kế hoạch, thường mua ở vùng giá rất xấu.',
          },
          {
            prompt: '"Gỡ gạc" (revenge trading) nguy hiểm vì sao?',
            options: ['Vì phí cao', 'Vì vào lệnh lớn hơn theo cảm xúc sau khi thua, dễ thua nặng hơn', 'Vì bị khoá tài khoản', 'Vì chỉ dùng được Short'],
            correct_index: 1,
            explanation: 'Sau khi thua, quyết định bị cảm xúc chi phối; tăng khối lượng để gỡ thường khuếch đại thua lỗ.',
          },
          {
            prompt: 'Điều nào KHÔNG cần thiết phải ghi trong nhật ký giao dịch?',
            options: ['Lý do vào lệnh', 'Cảm xúc lúc vào lệnh', 'Bài học rút ra', 'Giá BTC của năm trước'],
            correct_index: 3,
            explanation: 'Nhật ký tập trung vào quyết định của bạn: lý do, cảm xúc, kết quả và bài học.',
          },
          {
            prompt: 'Profit factor lớn hơn 1 nghĩa là gì?',
            options: ['Tổng lãi lớn hơn tổng lỗ', 'Tỷ lệ thắng trên 100%', 'Không có lệnh thua', 'Phí bằng 0'],
            correct_index: 0,
            explanation: 'Profit factor = tổng lãi / tổng lỗ; lớn hơn 1 nghĩa là chiến lược đang có lãi.',
          },
        ],
      },
    ],
  },
  ...VI_FUNDAMENTALS,
  ...VI_ADVANCED,
  ...VI_SECTORS,
  ...VI_PRACTICE,
]
