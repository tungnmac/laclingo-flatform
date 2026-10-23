import type { SeedChapter } from './types'

// Tâm lý thị trường (vi) — nối tiếp chương 'quan-ly-rui-ro' (stop-loss, cỡ vị thế, nhật ký & FOMO):
// chương này nhìn từ cảm xúc cá nhân ra cảm xúc của cả đám đông. Không đưa số đọc hiện tại của chỉ báo nào.
export const VI_PSYCHOLOGY: SeedChapter[] = [
  {
    slug: 'tam-ly-thi-truong',
    title: 'Tâm lý thị trường và hành vi đám đông',
    description:
      'Chu kỳ cảm xúc, cách đo tâm lý thị trường Việt Nam và thế giới, thiên kiến hành vi, tin tức – kỳ vọng và tư duy ngược đám đông.',
    level: 'intermediate',
    lessons: [
      {
        slug: 'chu-ky-cam-xuc-thi-truong',
        title: 'Chu kỳ cảm xúc của thị trường',
        summary:
          'Thị trường đi qua một vòng cảm xúc lặp lại từ lạc quan tới hưng phấn tột độ rồi hoảng loạn. Nhận ra mình đang ở đâu trong vòng đó giúp bạn bớt mua đỉnh, bán đáy.',
        content_md: `## Giá là kết quả của cảm xúc tập thể

Ở chương **Quản lý rủi ro và tâm lý**, bạn đã học cách kiểm soát cảm xúc của **chính mình** bằng stop-loss, cỡ vị thế và nhật ký. Chương này nhìn rộng hơn: cảm xúc của **cả đám đông**. Mỗi mức giá là điểm gặp nhau của hàng nghìn người mua và người bán, và mỗi người đều mang theo hy vọng, lòng tham, nỗi sợ. Khi phần đông cùng cảm thấy một thứ, giá bị đẩy đi xa hơn mức mà dữ liệu cơ bản biện minh được.

## Vòng cảm xúc của thị trường

Một mô hình minh hoạ rất phổ biến là **"chu kỳ cảm xúc thị trường"** (cycle of market emotions), thường được gắn với một biểu đồ của quỹ Westcore cuối thập niên 1990 và về sau được nhiều công ty quản lý quỹ như Russell Investments dùng lại. Mô hình chia vòng cảm xúc thành các giai đoạn chính (bản gốc có 14 giai đoạn, tách thêm các pha như tuyệt vọng, hoảng loạn, suy sụp):

**Lạc quan → Phấn khởi → Hồi hộp → Hưng phấn tột độ → Lo lắng → Phủ nhận → Sợ hãi → Đầu hàng → Chán nản → Hy vọng → Nhẹ nhõm → (Lạc quan trở lại)**

Đây là **mô hình minh hoạ**, không phải quy luật: không chu kỳ nào giống hệt nhau, độ dài mỗi pha có thể vài tuần hoặc vài năm, và đôi khi thị trường bỏ qua hẳn một pha.

## Mỗi pha thường trông như thế nào?

| Pha | Giá | Thanh khoản | Dòng tin tức & mạng xã hội |
|---|---|---|---|
| **Lạc quan, phấn khởi** | Tăng đều, điều chỉnh nông | Tăng dần | Tin tốt bắt đầu được chú ý |
| **Hồi hộp** | Tăng nhanh hơn | Cao | Nhiều người khoe lãi, "lần này khác" |
| **Hưng phấn tột độ** | Tăng dốc đứng | Đột biến, kỷ lục | Báo chí, hội nhóm bàn tán; người mới ồ ạt vào |
| **Lo lắng, phủ nhận** | Giảm mạnh lần đầu rồi hồi yếu | Giảm khi hồi | "Chỉ là điều chỉnh khỏe", bình quân giá xuống |
| **Sợ hãi** | Đáy sau thấp hơn đáy trước | Tăng khi giảm | Tin xấu nhiều lên, tranh luận gay gắt |
| **Đầu hàng** | Giảm sâu, nhiều phiên giảm sàn liên tiếp | Rất cao (bán tháo) | Hoảng loạn, bán bất kể giá, bị gọi ký quỹ |
| **Chán nản** | Đi ngang ở vùng thấp | Cạn kiệt | Không ai muốn nói về thị trường |
| **Hy vọng, nhẹ nhõm** | Bắt đầu tạo đáy cao dần | Tăng nhẹ | Hoài nghi: "chắc chỉ là nhịp hồi" |

Hai điểm đáng chú ý:

- **Rủi ro lớn nhất** thường nằm ở pha **hưng phấn tột độ** — khi cảm giác an toàn cao nhất.
- **Cơ hội tiềm năng lớn nhất** thường nằm ở pha **đầu hàng / chán nản** — khi cảm giác an toàn thấp nhất. Nhưng chỉ nhìn lại mới thấy rõ đáy; lúc đang ở trong đó, bạn không biết giá còn giảm bao xa.

## "Đám đông đúng ở giữa, sai ở hai đầu"

Câu này tóm tắt cách dùng tâm lý đám đông:

- **Ở giữa xu hướng**, đám đông thường **đúng**: giá tăng vì nhiều người mua, và tiếp tục mua kéo giá tăng thêm. Đi ngược đám đông lúc này thường là đứng chắn trước đoàn tàu.
- **Ở hai đầu cực đoan**, đám đông thường **sai**: khi gần như ai cũng đã mua (hưng phấn), còn rất ít người mới để đẩy giá lên; khi gần như ai cũng đã bán (đầu hàng), áp lực bán còn lại rất ít.

Vì vậy tâm lý đám đông **không phải tín hiệu vào/ra lệnh hằng ngày**, mà là thông tin bối cảnh để bạn biết khi nào nên thận trọng hơn và khi nào nên kiên nhẫn hơn.

## Vì sao bạn khó nhận ra mình đang ở pha nào?

Bạn cũng là một phần của đám đông. Ở pha hưng phấn, những người xung quanh đều lãi, nên ngồi ngoài tạo cảm giác "ngu ngốc". Ở pha đầu hàng, tài khoản đang lỗ khiến việc nhìn khách quan gần như không thể. Ba cách tự kiểm tra:

1. **Đọc lại nhật ký**: mấy tuần gần đây cảm xúc bạn ghi lại chủ yếu là gì — tự tin, FOMO, hay sợ hãi?
2. **Nhìn vào hành vi người xung quanh**: người chưa từng đầu tư hỏi bạn mua mã gì? Hay ai cũng tránh nhắc tới chứng khoán?
3. **So với số liệu**: thanh khoản và độ rộng thị trường (bài sau) có xác nhận cảm giác của bạn không?

## Thực hành

Chọn một mã hoặc chỉ số bạn quen (ví dụ VN-Index hoặc BTC) trong [Thị trường](/markets), mở khung tuần và xem lại 2–3 năm gần nhất. Đánh dấu bằng tay những đoạn bạn nghĩ tương ứng với **hưng phấn tột độ**, **đầu hàng** và **hy vọng**. Ghi vào nhật ký: thanh khoản lúc đó ra sao, bạn (hoặc người quen) đã cảm thấy gì, và nếu được làm lại bạn sẽ điều chỉnh tỷ trọng thế nào.

## Nguồn tham khảo

- [Russell Investments — Keep calm in volatile markets: the cycle of market emotions](https://russellinvestments.com/au/insights/library/keep-calm-in-volatile-markets-cycle-of-emotions)
- [StockBrokers.com — Trading psychology: stages of investor emotions](https://www.stockbrokers.com/education/trading-psychology-stages-investor-emotions)`,
        questions: [
          {
            prompt: 'Theo mô hình chu kỳ cảm xúc, rủi ro thường lớn nhất ở pha nào?',
            options: ['Chán nản', 'Hưng phấn tột độ', 'Hy vọng', 'Đầu hàng'],
            correct_index: 1,
            explanation:
              'Ở pha hưng phấn tột độ, giá đã tăng dốc, gần như ai cũng đã mua và cảm giác an toàn cao nhất — đó cũng là lúc rủi ro giảm giá lớn nhất. Chán nản và đầu hàng là các pha gần đáy.',
          },
          {
            prompt: 'Câu "đám đông đúng ở giữa, sai ở hai đầu" gợi ý cách dùng tâm lý đám đông như thế nào?',
            options: [
              'Luôn làm ngược lại số đông trong mọi phiên',
              'Luôn đi theo số đông vì số đông luôn đúng',
              'Theo xu hướng khi tâm lý bình thường, chỉ thận trọng hoặc cân nhắc ngược dòng khi tâm lý ở mức cực đoan',
              'Bỏ qua hoàn toàn tâm lý vì nó không ảnh hưởng tới giá',
            ],
            correct_index: 2,
            explanation:
              'Giữa xu hướng, việc nhiều người mua tiếp tục đẩy giá — đi ngược lúc này thường thua. Chỉ ở hai đầu cực đoan, khi gần như ai cũng đã mua hoặc đã bán, tâm lý đám đông mới trở thành tín hiệu cảnh báo.',
          },
          {
            prompt: 'Đặc điểm nào phù hợp nhất với pha "đầu hàng" (capitulation)?',
            options: [
              'Giá đi ngang, thanh khoản cạn kiệt, không ai quan tâm',
              'Giá tăng đều, điều chỉnh nông',
              'Giá giảm sâu với thanh khoản rất cao, nhà đầu tư bán bất kể giá',
              'Giá tăng dốc đứng, báo chí bàn tán khắp nơi',
            ],
            correct_index: 2,
            explanation:
              'Đầu hàng là lúc bán tháo hoảng loạn: giá rơi mạnh, khối lượng rất lớn, nhiều người bị gọi ký quỹ. Đi ngang với thanh khoản cạn là pha chán nản ngay sau đó.',
          },
          {
            prompt: 'Lan nhận thấy bạn bè chưa từng đầu tư liên tục hỏi mua mã gì và thanh khoản liên tục lập kỷ lục. Phản ứng nào hợp lý nhất?',
            options: [
              'Vay thêm margin để tận dụng sóng',
              'Xem đây là dấu hiệu tâm lý nóng, rà lại stop-loss và cân nhắc không tăng tỷ trọng',
              'Bán khống toàn bộ ngay lập tức vì chắc chắn sắp sập',
              'Không cần làm gì vì tâm lý đám đông không liên quan tới rủi ro',
            ],
            correct_index: 1,
            explanation:
              'Người mới ồ ạt vào và thanh khoản kỷ lục là đặc điểm của pha hưng phấn. Đó là lý do để thận trọng hơn (siết quản lý rủi ro, không tăng đòn bẩy), chứ không phải bằng chứng chắc chắn rằng thị trường sẽ sập ngay.',
          },
        ],
      },
      {
        slug: 'do-tam-ly-thi-truong-viet-nam',
        title: 'Đọc tâm lý thị trường chứng khoán Việt Nam',
        summary:
          'Thanh khoản, dư nợ margin, số tài khoản mở mới, khối ngoại, độ rộng thị trường và số mã trần/sàn — mỗi chỉ báo kể một phần câu chuyện về tâm lý nhà đầu tư Việt Nam.',
        content_md: `## Vì sao cần chỉ báo riêng cho thị trường Việt Nam?

Thị trường chứng khoán Việt Nam có vài đặc điểm khiến tâm lý đám đông tác động mạnh: tỷ trọng giao dịch của **nhà đầu tư cá nhân** rất lớn, **margin** (vay ký quỹ) phổ biến, và có **biên độ giá** trong ngày (thông thường ±7% trên HOSE, ±10% trên HNX, ±15% trên UPCoM, trừ một số trường hợp đặc biệt). Biên độ khiến các đợt hưng phấn hay hoảng loạn hiện rõ qua **số mã tăng trần / giảm sàn**.

Không có chỉ báo nào đủ một mình. Hãy coi mỗi chỉ báo dưới đây là một "nhiệt kế" đo một khía cạnh khác nhau.

## 1. Thanh khoản (giá trị giao dịch — GTGD)

**Đọc thế nào:** so GTGD của phiên hoặc tuần với **trung bình 20 phiên** (hoặc 50 phiên) của chính nó, đừng so con số tuyệt đối giữa các năm vì quy mô thị trường thay đổi.

- Giá tăng + GTGD cao hơn trung bình nhiều lần, kéo dài → dòng tiền hăng hái, có thể đang nóng.
- Giá giảm mạnh + GTGD đột biến → có thể là bán tháo, đôi khi gần pha đầu hàng.
- GTGD cạn kiệt kéo dài ở vùng giá thấp → pha chán nản.

## 2. Dư nợ margin

**Đọc thế nào:** theo dõi dư nợ cho vay ký quỹ mà các công ty chứng khoán công bố theo quý (trong báo cáo tài chính), so với chính lịch sử của nó và với vốn hoá thị trường.

- Dư nợ tăng nhanh lên mức cao kỷ lục → nhiều người dùng đòn bẩy, thị trường nhạy cảm với cú giảm vì **gọi ký quỹ (call margin) và bán giải chấp** có thể tạo vòng xoáy bán.
- Dư nợ giảm mạnh sau đợt sụt giảm → đòn bẩy đã được "xả", áp lực bán cưỡng bức giảm.

Lưu ý: số liệu theo quý nên **có độ trễ**.

## 3. Số tài khoản mở mới — "làn sóng F0"

**F0** là cách gọi nhà đầu tư mới. Số tài khoản mở mới hằng tháng do VSDC (Tổng công ty Lưu ký và Bù trừ Chứng khoán Việt Nam) công bố là thước đo tốt cho mức độ "lan toả" của thị trường. Một làn sóng F0 lớn thường đi cùng giai đoạn tăng mạnh và câu chuyện "ai cũng lãi"; khi số tài khoản mới tăng vọt lên mức hiếm thấy, đó là dấu hiệu tâm lý đã lan ra ngoài giới đầu tư quen thuộc.

## 4. Khối ngoại mua/bán ròng

**Đọc thế nào:** cộng dồn giá trị mua ròng / bán ròng của nhà đầu tư nước ngoài theo tuần, tháng.

- Khối ngoại thường bị chi phối bởi **yếu tố vĩ mô toàn cầu** (lãi suất USD, tỷ giá, phân bổ của các quỹ ETF), không chỉ tâm lý trong nước.
- Một phiên mua/bán ròng lớn có thể chỉ là **cơ cấu danh mục ETF** hoặc giao dịch thoả thuận — đừng diễn giải quá mức một phiên đơn lẻ.
- Nội bán ròng trong khi ngoại mua ròng kéo dài (hoặc ngược lại) cho thấy hai nhóm có góc nhìn khác nhau — đáng để tìm hiểu nguyên nhân.

## 5. Độ rộng thị trường (market breadth)

- **Số mã tăng / số mã giảm** mỗi phiên: chỉ số tăng mà số mã giảm nhiều hơn số mã tăng → đà tăng hẹp, phụ thuộc vài trụ.
- **Tỷ lệ % cổ phiếu nằm trên đường MA200**: khi rất cao (phần lớn cổ phiếu đã tăng) thì thị trường "đã được mua nhiều"; khi rất thấp, phần lớn cổ phiếu đang trong xu hướng giảm dài hạn — gần vùng bi quan.

## 6. Số mã tăng trần / giảm sàn

Nhờ biên độ, đây là "nhiệt kế cảm xúc" rất trực quan của thị trường Việt Nam:

- Hàng trăm mã giảm sàn, nhiều mã **trắng bên mua** → hoảng loạn, bán bất kể giá.
- Rất nhiều mã tăng trần liên tiếp, đặc biệt mã nhỏ, đầu cơ → hưng phấn, đầu cơ lan rộng.

## 7. Tỷ trọng cá nhân và tổ chức

Khi tỷ trọng giao dịch của nhà đầu tư cá nhân tăng cao và dòng tiền tập trung vào nhóm vốn hoá nhỏ, thị trường thường biến động mạnh hơn và nhạy với tin đồn. Tổ chức (quỹ, tự doanh) thì giao dịch theo quy trình và chậm hơn.

## Bảng tóm tắt (ngưỡng mang tính minh hoạ)

| Chỉ báo | Gợi ý "nóng" | Gợi ý "lạnh" |
|---|---|---|
| GTGD so với TB 20 phiên | Cao hơn nhiều lần, kéo dài | Thấp hơn rõ rệt, kéo dài |
| Dư nợ margin | Kỷ lục, tăng nhanh | Giảm mạnh sau bán giải chấp |
| Tài khoản mở mới | Tăng vọt, hiếm thấy | Giảm về mức thấp |
| % mã trên MA200 | Ví dụ minh hoạ: trên 80% | Ví dụ minh hoạ: dưới 20% |
| Số mã trần / sàn | Trần hàng loạt ở mã nhỏ | Sàn hàng loạt, trắng bên mua |

Các ngưỡng 80%/20% chỉ là **ví dụ minh hoạ**, không phải chuẩn mực. Ngưỡng phù hợp **phụ thuộc bối cảnh**: quy mô thị trường hôm nay khác 5 năm trước, chính sách margin thay đổi, và có những giai đoạn thị trường duy trì trạng thái "nóng" khá lâu.

## Thực hành

Lập một bảng gồm 5 cột: GTGD so với TB 20 phiên, khối ngoại (ròng trong tuần), số mã tăng/giảm, số mã trần/sàn, và ghi chú tin tức. Điền liên tục **4 tuần** từ dữ liệu bảng điện của công ty chứng khoán bạn dùng. Cuối mỗi tuần, tự đánh giá thị trường đang "nóng", "trung tính" hay "lạnh", rồi xem lại sau 1–2 tháng xem đánh giá đó có giúp bạn quyết định tỷ trọng tốt hơn không.

## Nguồn tham khảo

- [DSC — Biên độ giao dịch sàn chứng khoán HOSE, HNX, UPCoM](https://www.dsc.com.vn/kien-thuc/bien-do-giao-dich-san-chung-khoan-hose-hnx-upcom)
- [DNSE — Biên độ dao động giá cổ phiếu](https://www.dnse.com.vn/hoc/bien-do-dao-dong-gia-co-phieu)`,
        questions: [
          {
            prompt: 'Vì sao nên so thanh khoản với trung bình 20 phiên của chính nó thay vì so con số tuyệt đối giữa các năm?',
            options: [
              'Vì quy mô thị trường thay đổi theo thời gian nên con số tuyệt đối khó so sánh',
              'Vì quy định bắt buộc phải dùng trung bình 20 phiên',
              'Vì thanh khoản tuyệt đối không bao giờ thay đổi',
              'Vì trung bình 20 phiên dự báo chính xác giá ngày mai',
            ],
            correct_index: 0,
            explanation:
              'Số công ty niêm yết, số nhà đầu tư và vốn hoá thay đổi qua các năm. So với trung bình gần đây cho biết thanh khoản đang cao hay thấp một cách tương đối, phù hợp để đọc tâm lý hiện tại.',
          },
          {
            prompt: 'Dư nợ margin tăng nhanh lên mức kỷ lục khiến thị trường dễ tổn thương hơn chủ yếu vì sao?',
            options: [
              'Vì margin làm phí giao dịch tăng gấp đôi',
              'Vì một cú giảm có thể kích hoạt gọi ký quỹ và bán giải chấp, tạo thêm áp lực bán',
              'Vì khối ngoại bị cấm mua khi margin cao',
              'Vì cổ phiếu không thể tăng trần khi margin cao',
            ],
            correct_index: 1,
            explanation:
              'Khi nhiều người dùng đòn bẩy, giá giảm làm tài khoản thiếu ký quỹ; công ty chứng khoán bán giải chấp, đẩy giá giảm thêm và có thể tạo vòng xoáy bán cưỡng bức.',
          },
          {
            prompt: 'VN-Index tăng điểm nhưng số mã giảm nhiều hơn hẳn số mã tăng. Điều này gợi ý gì?',
            options: [
              'Thị trường tăng rất rộng và khỏe',
              'Khối ngoại chắc chắn đang mua ròng',
              'Đà tăng hẹp, có thể chỉ dựa vào vài cổ phiếu trụ',
              'Phiên đó không có giao dịch thoả thuận',
            ],
            correct_index: 2,
            explanation:
              'Độ rộng thị trường cho biết bao nhiêu cổ phiếu tham gia xu hướng. Chỉ số tăng nhờ vài mã vốn hoá lớn trong khi đa số giảm là đà tăng kém bền vững.',
          },
          {
            prompt: 'Một phiên khối ngoại bán ròng rất lớn. Cách diễn giải nào thận trọng nhất?',
            options: [
              'Chắc chắn thị trường sẽ giảm mạnh nhiều tuần tới',
              'Kiểm tra xem có phải cơ cấu ETF hoặc giao dịch thoả thuận không, và xem xu hướng cộng dồn nhiều tuần',
              'Bán toàn bộ danh mục ngay trong phiên',
              'Bỏ qua vì khối ngoại không bao giờ ảnh hưởng tới giá',
            ],
            correct_index: 1,
            explanation:
              'Giao dịch của khối ngoại chịu ảnh hưởng từ ETF, tỷ giá, lãi suất toàn cầu. Một phiên đơn lẻ có thể do kỹ thuật; xu hướng cộng dồn theo tuần/tháng mới có ý nghĩa hơn.',
          },
        ],
      },
      {
        slug: 'chi-bao-tam-ly-toan-cau',
        title: 'Các thước đo tâm lý toàn cầu',
        summary:
          'VIX, Fear & Greed Index của CNN, khảo sát AAII, tỷ lệ put/call, khảo sát quỹ đầu tư và Crypto Fear & Greed: mỗi chỉ báo đo gì, hạn chế ra sao, và vì sao chỉ nên dùng ngược dòng ở mức cực đoan.',
        content_md: `## Vì sao nhà đầu tư Việt Nam cũng nên biết?

Tâm lý trên thị trường Mỹ và thị trường crypto lan sang khắp nơi qua dòng vốn ngoại, tỷ giá và mạng xã hội. Các chỉ báo dưới đây được công bố công khai, có lịch sử dài, nên rất tiện để luyện cách đọc tâm lý. Bài này chỉ giải thích cách đọc — không đưa số đọc hiện tại.

## 1. VIX — "chỉ số sợ hãi"

**VIX** do sàn Cboe tính, là thước đo **mức biến động kỳ vọng của chỉ số S&P 500 trong 30 ngày tới**, suy ra từ giá các quyền chọn (option) trên S&P 500. Đây là biến động **ngụ ý** (nhìn tới tương lai), khác với biến động **thực tế** đo từ giá quá khứ.

- VIX tăng vọt → nhà đầu tư trả giá cao để mua bảo hiểm (put), thị trường đang lo sợ.
- VIX rất thấp kéo dài → tâm lý chủ quan, ít ai phòng ngừa.

**Hạn chế:** VIX đo kỳ vọng biến động, không cho biết hướng đi; VIX thấp có thể duy trì rất lâu trong xu hướng tăng.

## 2. CNN Fear & Greed Index

Thang điểm **0 (sợ hãi cực độ) tới 100 (tham lam cực độ)**, 50 là trung tính, tổng hợp từ **7 thành phần** có trọng số bằng nhau:

| Thành phần | Đo cái gì |
|---|---|
| Động lượng thị trường | S&P 500 so với đường trung bình 125 ngày |
| Sức mạnh giá cổ phiếu | Số mã đạt đỉnh 52 tuần so với đáy 52 tuần (NYSE) |
| Độ rộng giá | Khối lượng ở cổ phiếu tăng so với cổ phiếu giảm |
| Quyền chọn put/call | Tỷ lệ giao dịch put so với call |
| Nhu cầu trái phiếu rác | Chênh lệch lợi suất trái phiếu rác và trái phiếu hạng đầu tư |
| Biến động thị trường | VIX so với trung bình 50 ngày |
| Nhu cầu tài sản trú ẩn | Lợi nhuận cổ phiếu so với trái phiếu Chính phủ Mỹ trong 20 phiên gần nhất |

**Hạn chế:** nhiều thành phần chồng chéo (đều phản ứng theo giá), nên chỉ số thường chỉ "xác nhận" điều đã xảy ra.

## 3. Khảo sát AAII

Hiệp hội Nhà đầu tư Cá nhân Mỹ (**AAII**) hỏi thành viên **mỗi tuần** (từ năm 1987): thị trường cổ phiếu Mỹ sau **6 tháng** tới sẽ tăng, giảm hay đi ngang? Kết quả là ba tỷ lệ **lạc quan / trung tính / bi quan**. Theo AAII, trung bình dài hạn của tỷ lệ lạc quan vào khoảng 37,5% — con số này là trung bình động qua thời gian nên thay đổi nhẹ theo năm.

**Hạn chế:** mẫu khảo sát nhỏ, là ý kiến chứ không phải tiền thật; số đọc dao động mạnh từ tuần này sang tuần khác. Chỉ những lần lệch rất xa trung bình mới đáng chú ý.

## 4. Tỷ lệ put/call

**Put/call ratio** = khối lượng quyền chọn bán (put) / khối lượng quyền chọn mua (call). Tỷ lệ cao → nhiều người mua bảo hiểm giảm giá (sợ hãi); thấp → nhiều người đặt cược tăng (tham lam). **Hạn chế:** một phần put là phòng hộ thường xuyên của tổ chức, không hẳn là đặt cược; cần so với lịch sử của chính nó.

## 5. Khảo sát nhà quản lý quỹ

Ví dụ nổi tiếng là **khảo sát nhà quản lý quỹ toàn cầu của Bank of America** hằng tháng. Các bình luận thường chú ý **tỷ lệ tiền mặt** trong danh mục: tiền mặt rất thấp nghĩa là các quỹ đã "mua gần hết", còn ít sức mua dự trữ — được ngân hàng này dùng như một tín hiệu cảnh báo ngược dòng. **Hạn chế:** chỉ khách hàng của ngân hàng mới xem được báo cáo đầy đủ; thống kê về hiệu quả của tín hiệu chủ yếu do chính ngân hàng công bố và mẫu số lần tín hiệu xuất hiện khá nhỏ.

## 6. Crypto Fear & Greed Index

Phiên bản phổ biến của alternative.me cũng dùng thang 0–100, kết hợp **biến động** và **động lượng/khối lượng** của Bitcoin, **mạng xã hội**, **khảo sát** (thành phần này hiện đang tạm dừng), **tỷ lệ thống trị (dominance) của Bitcoin** và **Google Trends**. **Hạn chế:** thị trường crypto biến động mạnh nên chỉ số có thể nằm ở vùng cực đoan khá lâu; phương pháp do một trang web tự định nghĩa và có thể thay đổi.

## Dùng ngược dòng — nhưng chỉ ở cực đoan

| Tình huống | Cách hiểu hợp lý |
|---|---|
| Chỉ báo ở vùng trung bình | Gần như không có thông tin — theo xu hướng và kế hoạch của bạn |
| Sợ hãi cực độ | Rủi ro giảm thêm vẫn có, nhưng tâm lý đã rất bi quan — lúc để chuẩn bị danh sách theo dõi, không phải bắt đáy toàn bộ |
| Tham lam cực độ | Không có nghĩa sẽ giảm ngay — lúc để siết stop-loss, hạn chế đòn bẩy |

Nguyên tắc: **cực đoan có thể kéo dài hơn bạn nghĩ**. Chỉ báo tâm lý cho biết **rủi ro đang nghiêng về đâu**, không cho biết **thời điểm** đảo chiều.

## Thực hành

Chọn 2 chỉ báo trong bài (ví dụ VIX và Crypto Fear & Greed). Trong 4 tuần, mỗi thứ Hai ghi số đọc của chúng vào nhật ký cùng diễn biến giá S&P 500 hoặc BTC tuần trước. Cuối kỳ, trả lời: chỉ báo phản ứng **trước** hay **sau** giá? Có lần nào chạm vùng cực đoan không?

## Nguồn tham khảo

- [Cboe — VIX FAQs](https://www.cboe.com/tradable_products/vix/faqs)
- [CNN — Fear & Greed Index (kèm giải thích 7 thành phần)](https://www.cnn.com/markets/fear-and-greed)
- [AAII — Sentiment Survey](https://www.aaii.com/sentimentsurvey)
- [Alternative.me — Crypto Fear & Greed Index](https://alternative.me/crypto/fear-and-greed-index/)`,
        questions: [
          {
            prompt: 'VIX đo điều gì?',
            options: [
              'Lợi nhuận kỳ vọng của S&P 500 trong năm tới',
              'Biến động kỳ vọng của S&P 500 trong 30 ngày tới, suy ra từ giá quyền chọn',
              'Số cổ phiếu tăng giá trên sàn NYSE',
              'Biến động thực tế của S&P 500 trong 30 ngày đã qua',
            ],
            correct_index: 1,
            explanation:
              'VIX là biến động ngụ ý, nhìn về 30 ngày tới, tính từ giá quyền chọn trên S&P 500. Nó không đo lợi nhuận hay hướng đi, và khác với biến động thực tế đo từ dữ liệu quá khứ.',
          },
          {
            prompt: 'Thành phần nào KHÔNG nằm trong 7 thành phần của CNN Fear & Greed Index?',
            options: ['Tỷ lệ put/call', 'Nhu cầu trái phiếu rác', 'Số lượng tìm kiếm Google về chứng khoán', 'S&P 500 so với trung bình 125 ngày'],
            correct_index: 2,
            explanation:
              'Google Trends là một thành phần của Crypto Fear & Greed (alternative.me), không phải của chỉ số CNN. CNN dùng động lượng, sức mạnh giá, độ rộng, put/call, trái phiếu rác, biến động và tài sản trú ẩn.',
          },
          {
            prompt: 'Khảo sát AAII cho thấy tỷ lệ lạc quan chỉ cao hơn trung bình dài hạn một chút. Diễn giải nào đúng nhất?',
            options: [
              'Tín hiệu bán mạnh theo lối ngược dòng',
              'Gần như không có thông tin ngược dòng — chỉ số lệch rất xa trung bình mới đáng chú ý',
              'Thị trường chắc chắn tăng 6 tháng tới',
              'Phải mua thêm vì nhà đầu tư cá nhân luôn đúng',
            ],
            correct_index: 1,
            explanation:
              'Chỉ báo tâm lý chỉ hữu ích theo lối ngược dòng ở vùng cực đoan. Lệch nhẹ so với trung bình là nhiễu thông thường của một khảo sát hằng tuần.',
          },
          {
            prompt: 'Crypto Fear & Greed đang ở vùng "sợ hãi cực độ". Hành động nào phù hợp với tinh thần bài học?',
            options: [
              'Dồn toàn bộ vốn mua ngay vì chắc chắn đã chạm đáy',
              'Bán hết vì sợ hãi luôn dẫn tới giảm tiếp',
              'Coi đây là bối cảnh: xem lại danh sách theo dõi, kế hoạch mua từng phần với stop-loss rõ ràng',
              'Tăng đòn bẩy để tận dụng biến động',
            ],
            correct_index: 2,
            explanation:
              'Cực đoan cho biết rủi ro đang nghiêng về đâu nhưng không cho biết thời điểm. Cách hợp lý là chuẩn bị kế hoạch và vào lệnh từng phần với quản lý rủi ro, thay vì quyết định tất tay.',
          },
        ],
      },
      {
        slug: 'thien-kien-hanh-vi-trong-dau-tu',
        title: 'Thiên kiến hành vi trong đầu tư',
        summary:
          'Ngại thua lỗ, hiệu ứng phân bổ, mỏ neo, thiên kiến xác nhận, tự tin thái quá, thiên kiến gần đây, tâm lý bầy đàn, chi phí chìm và kế toán tinh thần — kèm ví dụ giao dịch và biện pháp đối phó cụ thể.',
        content_md: `## Bộ não không được thiết kế cho thị trường

**Tài chính hành vi** nghiên cứu cách con người thực sự ra quyết định — thường lệch khỏi mô hình "nhà đầu tư lý trí". Nền tảng quan trọng là **lý thuyết triển vọng (prospect theory)** của Daniel Kahneman và Amos Tversky, công bố năm **1979** trên tạp chí Econometrica. Lý thuyết này cho thấy người ta đánh giá kết quả theo **lãi/lỗ so với một điểm tham chiếu**, và **nỗi đau khi mất mát lớn hơn niềm vui khi được** một khoản tương đương.

Nhận biết thiên kiến chưa đủ — bạn cần **quy tắc viết sẵn** để chặn chúng lúc cảm xúc dâng cao. Đó là lý do mỗi thiên kiến dưới đây đi kèm một biện pháp cụ thể.

## 1. Ngại thua lỗ (loss aversion)

Mức độ "đau" khi lỗ thường được ước tính **khoảng gấp đôi** niềm vui khi lãi cùng số tiền (con số phổ biến từ các nghiên cứu sau này của Tversky & Kahneman, không phải định luật chính xác). **Ví dụ:** không chịu cắt lỗ 5% vì "chưa bán thì chưa lỗ". **Đối phó:** đặt stop-loss ngay khi vào lệnh, không được dời xa hơn.

## 2. Hiệu ứng phân bổ (disposition effect)

Shefrin và Statman (1985) mô tả xu hướng **bán mã đang lãi quá sớm và giữ mã đang lỗ quá lâu**. **Ví dụ:** danh mục chỉ còn toàn mã lỗ vì mã lãi đã bị chốt hết. **Đối phó:** quy tắc thoát lệnh dựa trên **kế hoạch** (TP, trailing stop), không dựa vào việc lệnh đang lãi hay lỗ; trong nhật ký thêm trường "Nếu hôm nay chưa có vị thế này, tôi có mua không?".

## 3. Mỏ neo (anchoring)

Bám vào một con số tuỳ ý — thường là **giá mua** hoặc **đỉnh cũ**. **Ví dụ:** "cổ phiếu từng lên 60 nghìn, giờ 30 nghìn là rẻ". **Đối phó:** định giá lại từ dữ liệu hiện tại; ghi lý do mua mà **không nhắc tới giá cũ**.

## 4. Thiên kiến xác nhận (confirmation bias)

Chỉ tìm thông tin ủng hộ quan điểm sẵn có. **Ví dụ:** đã mua rồi thì chỉ đọc bài khen doanh nghiệp. **Đối phó:** trong nhật ký, bắt buộc ghi **3 lý do khiến lệnh này có thể sai** trước khi vào lệnh.

## 5. Tự tin thái quá (overconfidence)

Đánh giá quá cao khả năng của mình. Nghiên cứu của Barber và Odean (2000) trên hơn 66 nghìn hộ gia đình tại một công ty môi giới Mỹ cho thấy nhóm giao dịch nhiều nhất có lợi nhuận ròng thấp hơn rõ rệt so với thị trường. **Ví dụ:** thắng 5 lệnh liền rồi tăng gấp ba khối lượng. **Đối phó:** giới hạn rủi ro mỗi lệnh (quy tắc 1–2%), giới hạn số lệnh mỗi tuần.

## 6. Thiên kiến gần đây (recency bias)

Cho rằng điều vừa xảy ra sẽ tiếp tục. **Ví dụ:** thị trường tăng 3 tháng liền nên nghĩ "rủi ro thấp". **Đối phó:** luôn xem biểu đồ **khung dài** (tuần, tháng) trước khi quyết định trên khung ngắn.

## 7. Tâm lý bầy đàn (herd behaviour)

Làm theo số đông vì sợ bị bỏ lại — gốc rễ của FOMO mà bạn đã học. **Ví dụ:** mua mã đang được cả hội nhóm hô hào. **Đối phó:** quy tắc "**chờ 24 giờ**" với mọi ý tưởng đến từ hội nhóm; chỉ vào lệnh nếu vẫn tìm được thiết lập rõ ràng.

## 8. Chi phí chìm (sunk cost)

Tiếp tục vì đã "bỏ ra quá nhiều". **Ví dụ:** liên tục bình quân giá xuống một mã sai hướng vì "đã lỗ nhiều rồi". **Đối phó:** cấm bình quân giá xuống trừ khi đã có trong kế hoạch ban đầu với tổng rủi ro cố định.

## 9. Kế toán tinh thần (mental accounting)

Đối xử khác nhau với tiền tuỳ "nguồn" của nó. **Ví dụ:** coi tiền lãi là "tiền của thị trường" nên đánh liều hơn. **Đối phó:** mọi đồng trong tài khoản đều là vốn của bạn — tính rủi ro theo **tổng vốn hiện tại**.

## Bảng tổng hợp

| Thiên kiến | Câu tự nhủ quen thuộc | Biện pháp |
|---|---|---|
| Ngại thua lỗ | "Chưa bán thì chưa lỗ" | Stop-loss cố định |
| Hiệu ứng phân bổ | "Chốt lời cho chắc" | Thoát lệnh theo kế hoạch |
| Mỏ neo | "Từng 60 nghìn mà" | Định giá lại từ đầu |
| Xác nhận | "Ai cũng nói tốt" | Ghi 3 lý do có thể sai |
| Tự tin thái quá | "Lần này chắc chắn" | Giới hạn rủi ro & số lệnh |
| Gần đây | "Mấy tháng nay toàn tăng" | Xem khung dài trước |
| Bầy đàn | "Cả nhóm đều mua" | Quy tắc chờ 24 giờ |
| Chi phí chìm | "Lỗ nhiều rồi, gồng tiếp" | Cấm bình quân giá xuống ngoài kế hoạch |
| Kế toán tinh thần | "Tiền lãi mà, chơi thoải mái" | Tính rủi ro trên tổng vốn |

## Thực hành

Mở [Nhật ký](/journal), xem lại 10 lệnh gần nhất. Với mỗi lệnh, gắn tag thiên kiến có thể đã ảnh hưởng (ví dụ *neo-gia*, *bay-dan*, *chi-phi-chim*). Chọn **một** thiên kiến xuất hiện nhiều nhất, viết một quy tắc chống lại nó và áp dụng nghiêm túc trong 2 tuần tới.

## Nguồn tham khảo

- [Econometric Society — Prospect Theory: An Analysis of Decision under Risk (1979)](https://www.econometricsociety.org/publications/econometrica/1979/03/01/prospect-theory-analysis-decision-under-risk)
- [Wikipedia — Disposition effect](https://en.wikipedia.org/wiki/Disposition_effect)
- [Barber & Odean — The Common Stock Investment Performance of Individual Investors](https://faculty.haas.berkeley.edu/odean/papers/returns/Returns.html)`,
        questions: [
          {
            prompt: 'Hiệu ứng phân bổ (disposition effect) mô tả hành vi nào?',
            options: [
              'Phân bổ đều vốn vào mọi cổ phiếu',
              'Bán mã đang lãi quá sớm và giữ mã đang lỗ quá lâu',
              'Chỉ mua cổ phiếu có cổ tức cao',
              'Luôn mua theo khuyến nghị của công ty chứng khoán',
            ],
            correct_index: 1,
            explanation:
              'Shefrin & Statman (1985) mô tả xu hướng "bán người thắng, giữ kẻ thua" — một hệ quả của ngại thua lỗ: chốt lãi cho chắc và né việc hiện thực hoá khoản lỗ.',
          },
          {
            prompt: 'Minh nghĩ "cổ phiếu này từng lên 60 nghìn, giờ 30 nghìn là quá rẻ". Đây là thiên kiến gì?',
            options: ['Tự tin thái quá', 'Kế toán tinh thần', 'Mỏ neo', 'Thiên kiến gần đây'],
            correct_index: 2,
            explanation:
              'Minh dùng đỉnh cũ làm điểm tham chiếu (mỏ neo) thay vì định giá lại doanh nghiệp từ dữ liệu hiện tại. Giá cũ không cho biết giá trị hiện tại.',
          },
          {
            prompt: 'Biện pháp nào trực tiếp chống thiên kiến xác nhận?',
            options: [
              'Ghi ít nhất 3 lý do khiến lệnh có thể sai trước khi vào lệnh',
              'Tăng khối lượng sau chuỗi thắng',
              'Chỉ đọc tin tức về mã mình đang nắm',
              'Bình quân giá xuống khi giá giảm',
            ],
            correct_index: 0,
            explanation:
              'Thiên kiến xác nhận khiến ta chỉ tìm bằng chứng ủng hộ. Buộc bản thân viết ra lý do phản bác là cách chủ động tìm thông tin trái chiều.',
          },
          {
            prompt: 'Sau khi lãi lớn, Hà coi khoản lãi là "tiền của thị trường" và vào lệnh với rủi ro 10% tài khoản. Thiên kiến và biện pháp phù hợp là gì?',
            options: [
              'Chi phí chìm — bình quân giá xuống',
              'Kế toán tinh thần — tính rủi ro mỗi lệnh trên tổng vốn hiện tại',
              'Bầy đàn — chờ 24 giờ',
              'Mỏ neo — xem đỉnh cũ',
            ],
            correct_index: 1,
            explanation:
              'Phân loại tiền theo nguồn gốc là kế toán tinh thần. Tiền lãi đã là vốn của bạn; rủi ro mỗi lệnh nên tính theo tổng vốn với giới hạn cố định như 1–2%.',
          },
        ],
      },
      {
        slug: 'tin-tuc-ky-vong-va-tin-don',
        title: 'Tin tức, kỳ vọng và "mua tin đồn, bán sự thật"',
        summary:
          'Giá phản ánh kỳ vọng chứ không chỉ kết quả. Bài học giải thích vì sao tin tốt vẫn có thể làm giá giảm, cách đọc bất ngờ lợi nhuận và dấu hiệu cảnh báo của chiêu "thổi giá rồi xả".',
        content_md: `## Giá đã "phản ánh" những gì?

Thị trường luôn nhìn về phía trước. Khi một thông tin được nhiều người dự đoán, giá thường **đã điều chỉnh từ trước** — người ta nói thông tin đó đã được **"phản ánh vào giá" (priced in)**. Vì vậy câu hỏi quan trọng không phải "tin này tốt hay xấu?", mà là **"tin này tốt hơn hay xấu hơn điều thị trường đang kỳ vọng?"**

## Bất ngờ quan trọng hơn kết quả tuyệt đối

Lấy ví dụ minh hoạ với một công ty giả định:

| Tình huống | Lợi nhuận quý | Thị trường kỳ vọng | Phản ứng giá có thể xảy ra |
|---|---|---|---|
| A | Tăng 30% | Tăng 50% | Giảm — thấp hơn kỳ vọng |
| B | Giảm 10% | Giảm 30% | Tăng — tốt hơn kỳ vọng |
| C | Tăng 20% | Tăng 20% | Ít biến động — đúng như dự kiến |

**Bất ngờ lợi nhuận (earnings surprise)** = kết quả thực tế − kỳ vọng (thường là dự báo trung bình của các công ty chứng khoán). Ngoài con số quá khứ, thị trường còn phản ứng mạnh với **triển vọng** ban lãnh đạo đưa ra cho các kỳ tới.

## Vì sao tin tốt vẫn làm giá giảm?

1. **Kỳ vọng quá cao:** kết quả tốt nhưng không đủ tốt như "tin đồn" lan trước đó.
2. **Mua tin đồn, bán sự thật (buy the rumour, sell the news):** người mua sớm theo tin đồn đã lãi, nên **chốt lời đúng lúc tin chính thức ra** — khi người mua muộn tràn vào.
3. **Triển vọng yếu đi:** quý này tốt nhưng ban lãnh đạo cảnh báo quý sau chậm lại.
4. **Chất lượng lợi nhuận:** lợi nhuận tăng nhờ thu nhập bất thường (bán tài sản, hoàn nhập dự phòng) chứ không từ hoạt động cốt lõi.

Ngược lại, tin xấu có thể làm giá tăng nếu nó **ít tệ hơn** những gì đã được phản ánh, hoặc nếu nó **xoá bỏ sự bất định** kéo dài.

## Chu kỳ câu chuyện (narrative cycle)

Thị trường thường chạy theo các **câu chuyện**: đầu tư công, nâng hạng thị trường, AI, khu công nghiệp, một đợt nâng cấp blockchain... Một câu chuyện thường đi qua các giai đoạn: **ít người biết → lan rộng, giá tăng mạnh → ai cũng biết, truyền thông dày đặc → kết quả thực tế không theo kịp kỳ vọng → câu chuyện nguội**. Khi một câu chuyện xuất hiện khắp báo chí và hội nhóm, phần lớn kỳ vọng có thể đã nằm trong giá.

## Mạng xã hội, hội nhóm và "thổi giá rồi xả"

Cơ quan quản lý chứng khoán Mỹ (SEC) mô tả **pump-and-dump** gồm hai bước: kẻ chủ mưu **thổi giá** bằng thông tin sai lệch hoặc gây hiểu lầm, rồi **bán ra** cho những người mua muộn. Mục tiêu thường là cổ phiếu vốn hoá nhỏ hoặc token ít thanh khoản.

**Dấu hiệu cảnh báo:**

- Thúc giục **mua ngay**, "không mua là lỡ", đếm ngược thời gian.
- Tự nhận có **thông tin nội bộ** hoặc phương pháp "không bao giờ sai".
- Hứa hẹn **mục tiêu giá cụ thể** và lợi nhuận "chắc chắn".
- Mã **thanh khoản thấp**, tăng trần liên tục không có tin chính thức.
- Người hô hào không công khai họ đang **nắm giữ** cổ phiếu/token đó.
- Hội nhóm kín, thu phí "room VIP", cấm thành viên nghi ngờ.

## Giao dịch quanh các sự kiện đã lên lịch

Ngày công bố kết quả kinh doanh, cuộc họp chính sách hay kỳ cơ cấu chỉ số đều biết trước, nên bạn có thể lên kế hoạch thay vì phản ứng:

- **Biết ngày.** Ghi lại các sự kiện sắp tới của mọi mã bạn đang nắm.
- **Quyết định trước, không quyết định trong lúc tin ra.** Viết rõ bạn sẽ giữ qua sự kiện, giảm tỷ trọng hay đứng ngoài — và vì sao.
- **Tôn trọng rủi ro nhảy giá.** Giá có thể vượt qua mức stop-loss khi tin ra, nên khoản lỗ thực tế có thể lớn hơn dự tính. Giảm cỡ vị thế thường là cách bảo vệ đơn giản nhất.
- **Chờ bụi lắng.** Phản ứng đầu tiên thường nhiễu; phản ứng giữ được qua vài phiên nói lên nhiều điều hơn.

## Kiểm chứng nguồn tin

Trước khi hành động theo một tin, hãy đi qua checklist:

1. **Nguồn gốc:** tin có xuất hiện trên **công bố thông tin chính thức** của doanh nghiệp, sở giao dịch hoặc cơ quan quản lý không?
2. **Thời điểm:** tin mới hay đã cũ được "xào lại"?
3. **Động cơ:** người đưa tin được lợi gì nếu bạn mua/bán?
4. **Mức độ đã phản ánh:** giá đã tăng/giảm bao nhiêu trước khi tin ra?
5. **Kịch bản ngược:** nếu tin đúng mà giá vẫn giảm, kế hoạch của bạn là gì?

## Thực hành

Chọn một doanh nghiệp vừa công bố kết quả kinh doanh. Tìm kỳ vọng trước đó (bài phân tích hoặc dự báo của công ty chứng khoán), so với kết quả thực tế, rồi ghi lại phản ứng giá trong 3 phiên sau công bố. Viết 3–5 câu vào nhật ký: tin có "bất ngờ" không, và phản ứng giá có khớp với bất ngờ đó không?

## Nguồn tham khảo

- [Investor.gov (SEC) — Pump and Dump Schemes](https://www.investor.gov/protect-your-investments/fraud/types-fraud/pump-and-dump-schemes)
- [Investor.gov (SEC) — Social Media and Investing: Avoiding Fraud](https://www.investor.gov/news-alerts/investor-alerts/investor-alert-social-media-investing-avoiding-fraud)`,
        questions: [
          {
            prompt: 'Một công ty báo lợi nhuận tăng 30% nhưng giá cổ phiếu giảm. Lý do nào hợp lý nhất?',
            options: [
              'Sàn giao dịch tính sai giá',
              'Thị trường đã kỳ vọng mức tăng cao hơn nên kết quả gây thất vọng',
              'Lợi nhuận tăng luôn làm giá giảm',
              'Cổ phiếu không được phép tăng sau khi công bố kết quả',
            ],
            correct_index: 1,
            explanation:
              'Giá phản ánh kỳ vọng. Nếu kỳ vọng là tăng 50%, kết quả tăng 30% là một bất ngờ tiêu cực dù con số tuyệt đối vẫn tốt.',
          },
          {
            prompt: '"Mua tin đồn, bán sự thật" nghĩa là gì?',
            options: [
              'Chỉ mua khi có tin chính thức',
              'Người mua sớm theo kỳ vọng thường chốt lời khi tin chính thức được công bố',
              'Tin đồn luôn sai nên phải bán khống',
              'Không bao giờ giao dịch quanh ngày công bố tin',
            ],
            correct_index: 1,
            explanation:
              'Giá tăng trước theo kỳ vọng; khi tin ra, không còn bất ngờ và những người mua sớm chốt lời đúng lúc người mua muộn tràn vào.',
          },
          {
            prompt: 'Dấu hiệu nào là cảnh báo rõ nhất của một chiêu thổi giá rồi xả?',
            options: [
              'Doanh nghiệp công bố báo cáo tài chính đã kiểm toán',
              'Cổ phiếu vốn hoá lớn tăng nhẹ cùng thị trường',
              'Hội nhóm hô hào mua gấp một mã thanh khoản thấp với "thông tin nội bộ" và mục tiêu giá chắc chắn',
              'Một công ty chứng khoán phát hành báo cáo phân tích có cả rủi ro',
            ],
            correct_index: 2,
            explanation:
              'Thúc giục mua gấp, tự nhận có thông tin nội bộ, hứa hẹn lợi nhuận chắc chắn trên mã thanh khoản thấp là các dấu hiệu SEC nêu cho pump-and-dump.',
          },
          {
            prompt: 'Bạn nhận được tin "doanh nghiệp X sắp trúng hợp đồng lớn" từ một nhóm chat. Bước kiểm chứng nào nên làm ĐẦU TIÊN?',
            options: [
              'Mua ngay trước khi giá tăng',
              'Chuyển tiếp tin cho bạn bè để xem họ nghĩ gì',
              'Kiểm tra mục công bố thông tin chính thức của doanh nghiệp và sở giao dịch',
              'Tăng margin để có thêm sức mua',
            ],
            correct_index: 2,
            explanation:
              'Nguồn gốc là bước đầu tiên: tin chưa có trên kênh công bố thông tin chính thức thì chưa đáng tin. Sau đó mới xét thời điểm, động cơ và mức độ đã phản ánh vào giá.',
          },
        ],
      },
      {
        slug: 'tu-duy-nguoc-dong-va-bang-tam-ly',
        title: 'Tư duy ngược dòng và bảng theo dõi tâm lý cá nhân',
        summary:
          'Khi nào nên đi ngược đám đông và khi nào không, cùng cách gộp 3–5 chỉ báo thành một bảng chấm điểm hằng tuần để điều chỉnh tỷ trọng và tiền mặt thay vì quyết định tất tay.',
        content_md: `## Ngược dòng không có nghĩa là "luôn làm ngược"

**Nhà đầu tư ngược dòng (contrarian)** không đơn giản là mua khi người khác bán. Họ tìm những thời điểm mà **tâm lý đã đi quá xa so với thực tế**, và chỉ hành động khi có thêm bằng chứng. Ngược dòng sai lúc — ví dụ bán khống giữa một xu hướng tăng khỏe chỉ vì "tăng nhiều rồi" — là cách mất tiền nhanh.

## Xu hướng hay cực đoan?

| Tình trạng | Đặc điểm | Thái độ hợp lý |
|---|---|---|
| **Xu hướng bình thường** | Chỉ báo tâm lý ở vùng giữa, giá tạo đỉnh/đáy theo một hướng | Đi theo xu hướng, quản lý rủi ro như thường lệ |
| **Cực đoan tham lam** | Nhiều chỉ báo cùng "nóng", người mới đổ vào, margin cao | Thận trọng dần: giảm đòn bẩy, chốt một phần, nâng tiền mặt |
| **Cực đoan sợ hãi** | Nhiều chỉ báo cùng "lạnh", bán tháo, ai cũng tránh | Chuẩn bị: danh sách theo dõi, kế hoạch mua từng phần |

Hai điều kiện tối thiểu trước khi nghĩ tới ngược dòng:

1. **Nhiều chỉ báo cùng cực đoan**, không chỉ một.
2. **Giá bắt đầu xác nhận** — ví dụ ngừng tạo đáy thấp hơn, hoặc gãy một đường xu hướng — thay vì đoán đỉnh/đáy.

## Xây bảng theo dõi tâm lý của riêng bạn

Chọn **3–5 chỉ báo** bạn lấy được dữ liệu dễ dàng mỗi tuần. Ví dụ cho người giao dịch cổ phiếu Việt Nam:

| Chỉ báo | −1 (lạnh) | 0 (trung tính) | +1 (nóng) |
|---|---|---|---|
| GTGD so với TB 20 phiên | Thấp hơn rõ rệt | Quanh mức TB | Cao hơn nhiều, kéo dài |
| % mã trên MA200 (minh hoạ) | Dưới 20% | 20–80% | Trên 80% |
| Số mã sàn / trần trong tuần | Sàn hàng loạt | Cân bằng | Trần hàng loạt ở mã nhỏ |
| Tâm lý hội nhóm, báo chí | Không ai nói tới | Bình thường | Ai cũng khoe lãi |
| Nhật ký cảm xúc của bạn | Sợ hãi, chán nản | Bình tĩnh | FOMO, tự tin quá mức |

Người giao dịch crypto có thể thay bằng Crypto Fear & Greed, funding rate, Google Trends... Các ngưỡng trên chỉ là **ví dụ minh hoạ** — hãy điều chỉnh theo dữ liệu và bối cảnh bạn quan sát.

**Tổng điểm** chạy từ −5 tới +5. Đừng thay đổi bộ chỉ báo liên tục — tính nhất quán quan trọng hơn sự hoàn hảo.

## Dùng điểm số để điều chỉnh, không để "tất tay"

Sai lầm phổ biến là biến chỉ báo tâm lý thành lệnh mua/bán toàn bộ. Cách bền vững hơn là dùng điểm để **điều chỉnh mức độ rủi ro**:

| Tổng điểm | Ví dụ điều chỉnh |
|---|---|
| +4 tới +5 | Không mở vị thế mới bằng margin, siết stop-loss, giảm rủi ro mỗi lệnh (ví dụ từ 1% xuống 0,5%) |
| +2 tới +3 | Giữ kế hoạch, ưu tiên chốt lời từng phần theo TP |
| −1 tới +1 | Giao dịch bình thường theo hệ thống |
| −2 tới −3 | Rà danh sách theo dõi, chuẩn bị kế hoạch mua |
| −4 tới −5 | Giải ngân từng phần nhỏ khi giá xác nhận, luôn có stop-loss |

Những con số trên là **ví dụ**, không phải khuyến nghị. Điểm cốt lõi: bảng tâm lý chỉ **điều chỉnh** hệ thống giao dịch của bạn (cỡ vị thế, tỷ lệ tiền mặt, đòn bẩy) chứ không thay thế nó. Mọi lệnh vẫn phải có stop-loss và cỡ vị thế đúng quy tắc bạn đã học.

## Ví dụ minh hoạ (giả định)

Giả sử trong một tuần, thanh khoản cao hơn hẳn trung bình (+1), phần lớn cổ phiếu nằm trên MA200 (+1), mã nhỏ tăng trần liên tục (+1), hội nhóm toàn ảnh khoe lãi (+1), nhưng bản thân bạn thấy bình tĩnh (0). Tổng: **+4**.

Theo các quy tắc ví dụ ở trên, bạn giữ các vị thế đang có cùng stop-loss của chúng, không mở vị thế mới bằng margin và giảm rủi ro cho lệnh mới. Bạn **không** dự đoán thị trường sẽ sập — bạn chỉ chấp nhận rằng khả năng có một cú giảm mạnh do tâm lý đang cao hơn bình thường và điều chỉnh cỡ vị thế cho phù hợp. Nếu thị trường tiếp tục tăng, bạn vẫn tham gia; nếu đảo chiều, thiệt hại nhỏ hơn.

## Ghi lại cảm xúc của chính bạn

Chỉ báo quan trọng nhất có khi là **chính bạn**. Nếu bạn thấy háo hức, muốn vay thêm, hay khó chịu khi đứng ngoài, hãy coi đó là một điểm "+1". Nếu bạn không muốn mở ứng dụng giao dịch, đó có thể là "−1". Ghi đều đặn vào nhật ký giúp bạn so sánh cảm xúc của mình với dữ liệu thị trường theo thời gian.

## Thực hành

1. Chọn 4 chỉ báo cho bảng của bạn và viết rõ ngưỡng −1/0/+1 cho từng chỉ báo.
2. Mỗi cuối tuần, chấm điểm và ghi vào [Nhật ký](/journal) kèm một dòng về **cảm xúc** của bạn tuần đó (dùng tag ví dụ *tam-ly-tuan*).
3. Sau 8 tuần, xem lại: điểm số có giúp bạn tránh mua đuổi hoặc bán hoảng loạn không? Chỉ báo nào thừa, chỉ báo nào nên thêm?`,
        questions: [
          {
            prompt: 'Điều kiện nào nên có trước khi cân nhắc hành động ngược dòng?',
            options: [
              'Chỉ cần một chỉ báo chạm vùng cực đoan',
              'Nhiều chỉ báo cùng cực đoan và giá bắt đầu xác nhận',
              'Giá đã tăng 3 phiên liên tiếp',
              'Một người nổi tiếng trên mạng xã hội khuyên làm vậy',
            ],
            correct_index: 1,
            explanation:
              'Một chỉ báo đơn lẻ dễ nhiễu, và cực đoan có thể kéo dài. Sự đồng thuận của nhiều chỉ báo cộng với tín hiệu xác nhận từ giá giúp giảm rủi ro đoán đỉnh/đáy.',
          },
          {
            prompt: 'Tổng điểm bảng tâm lý của bạn là +5. Cách phản ứng nào phù hợp với bài học?',
            options: [
              'Bán khống toàn bộ tài khoản',
              'Vay margin để mua thêm vì thị trường đang mạnh',
              'Giảm rủi ro: không dùng margin mới, siết stop-loss, nâng tỷ lệ tiền mặt dần',
              'Xoá bảng điểm vì nó không còn tác dụng',
            ],
            correct_index: 2,
            explanation:
              'Điểm cao cho thấy tâm lý nóng ở nhiều mặt. Bảng điểm dùng để điều chỉnh mức độ rủi ro dần dần, không phải ra quyết định tất tay theo hướng nào.',
          },
          {
            prompt: 'Vì sao bán khống giữa một xu hướng tăng khỏe chỉ vì "giá tăng nhiều rồi" là ngược dòng sai lúc?',
            options: [
              'Vì ở giữa xu hướng, đám đông thường đúng và lực mua có thể tiếp tục đẩy giá',
              'Vì bán khống bị cấm trên mọi thị trường',
              'Vì giá không bao giờ giảm sau khi tăng',
              'Vì chỉ báo tâm lý luôn ở vùng trung tính',
            ],
            correct_index: 0,
            explanation:
              '"Tăng nhiều" không phải là cực đoan tâm lý. Giữa xu hướng, dòng tiền vẫn có thể tiếp tục chảy vào; đi ngược mà không có bằng chứng cực đoan và xác nhận từ giá là rủi ro cao.',
          },
          {
            prompt: 'Vì sao nên giữ cố định bộ chỉ báo trong bảng tâm lý thay vì đổi liên tục?',
            options: [
              'Vì đổi chỉ báo làm tài khoản bị khoá',
              'Vì tính nhất quán giúp so sánh điểm số qua thời gian và đánh giá được bảng có hữu ích không',
              'Vì chỉ báo càng cũ càng chính xác',
              'Vì quy định của sàn bắt buộc như vậy',
            ],
            correct_index: 1,
            explanation:
              'Nếu liên tục đổi chỉ báo (thường để "khớp" với cảm giác hiện tại), bạn không thể so sánh các tuần với nhau và dễ rơi vào thiên kiến xác nhận.',
          },
        ],
      },
    ],
  },
]
