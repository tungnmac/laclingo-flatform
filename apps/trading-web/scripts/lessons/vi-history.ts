import type { SeedChapter } from './types'

// Lịch sử biến động thị trường (vi) — các mốc điểm số làm tròn, đã đối chiếu nguồn ghi ở cuối mỗi bài.
// Số liệu chỉ số là mức giá (không gồm cổ tức) trừ khi ghi rõ khác.
export const VI_HISTORY: SeedChapter[] = [
  {
    slug: 'lich-su-bien-dong-thi-truong',
    title: 'Bài học từ những giai đoạn biến động',
    description: 'Nhìn lại các cơn bong bóng, sụp đổ và giai đoạn ảm đạm của chứng khoán Việt Nam và thế giới — và cách sống sót qua chúng.',
    level: 'intermediate',
    lessons: [
      {
        slug: 'viet-nam-2006-2009-bong-bong-va-sup-do',
        title: 'Việt Nam 2006–2009: bong bóng và sụp đổ',
        summary: 'VN-Index tăng phi mã lên khoảng 1.170 điểm năm 2007 rồi mất gần 80% đến đầu 2009 — bài học về đòn bẩy, định giá và thanh khoản.',
        content_md: `## Cơn sốt đầu tiên của thị trường non trẻ

Thị trường chứng khoán Việt Nam mở cửa năm 2000 với vài mã cổ phiếu. Đến 2006, nhiều yếu tố cùng lúc đổ dồn: làn sóng **cổ phần hoá** doanh nghiệp nhà nước, kỳ vọng vào việc Việt Nam gia nhập **WTO** (chính thức đầu năm 2007), dòng vốn ngoại đổ vào và hàng loạt nhà đầu tư cá nhân lần đầu mở tài khoản. VN-Index tăng vọt chỉ trong khoảng hơn một năm và lập đỉnh **khoảng 1.170 điểm ngày 12/3/2007**.

Không khí lúc đó rất quen thuộc với mọi cơn sốt: người ta bỏ việc để "đi chợ chứng khoán", xếp hàng mua cổ phiếu IPO, và câu chuyện "ai mua cũng lãi" lan khắp nơi. Nhiều người **vay ngân hàng, cầm cố chính cổ phiếu** để mua thêm — tức là dùng **đòn bẩy**.

## Dòng thời gian

| Thời điểm | Diễn biến |
|---|---|
| 2006 – đầu 2007 | Cổ phần hoá, kỳ vọng WTO, tiền nóng đổ vào; giá cổ phiếu tăng gấp nhiều lần |
| 12/3/2007 | VN-Index lập đỉnh khoảng **1.170 điểm** |
| Tháng 4/2007 | Chỉ số đã rơi về quanh 900 điểm chỉ sau vài tuần |
| 2007 | Ngân hàng Nhà nước yêu cầu các ngân hàng hạ dư nợ cho vay kinh doanh chứng khoán xuống dưới **3% tổng dư nợ** (Chỉ thị 03/2007) |
| 2008 | Lạm phát có lúc khoảng **28%/năm** (tháng 8); lãi suất cơ bản bị nâng lên **14%**; khủng hoảng tài chính toàn cầu nổ ra |
| Cả năm 2008 | VN-Index giảm khoảng **66%**, thuộc nhóm kém nhất châu Á |
| 24/2/2009 | Đáy khoảng **235 điểm** — thấp hơn đỉnh 2007 gần **80%** |
| 2009 | Hồi phục mạnh, vượt 500 rồi lên trên 600 điểm trong năm |

## Vì sao bong bóng vỡ?

**1. Tín dụng bị siết đúng lúc thị trường "nghiện" vốn vay.** Khi lạm phát tăng nóng, Nhà nước phải thắt chặt tiền tệ. Giới hạn cho vay chứng khoán và lãi suất tăng mạnh khiến dòng tiền vay — vốn là nhiên liệu của đợt tăng — bị rút lại.

**2. Lạm phát và lãi suất cao làm cổ phiếu kém hấp dẫn.** Khi gửi tiết kiệm có lãi suất cao, nhà đầu tư đòi hỏi lợi nhuận cao hơn từ cổ phiếu, nên mức giá họ sẵn sàng trả giảm xuống. Năm 2008, lạm phát cả năm vào khoảng 23%.

**3. Cú sốc toàn cầu.** Khủng hoảng tài chính Mỹ lan ra toàn cầu cuối 2008 khiến khối ngoại rút vốn và tâm lý sụp đổ hoàn toàn.

**4. Định giá ở đỉnh đã quá cao.** Ở đỉnh 2007, giá nhiều cổ phiếu phản ánh kỳ vọng tăng trưởng nhiều năm. Khi kỳ vọng được điều chỉnh về thực tế, giá không chỉ giảm mà còn **rơi quá đà**.

## Đòn bẩy biến cú giảm thành thảm hoạ

Giả sử bạn có 100 triệu đồng, vay thêm 100 triệu để mua 200 triệu cổ phiếu. Thị trường giảm 50% → danh mục còn 100 triệu, trả nợ xong bạn **mất trắng**. Người không vay chỉ mất một nửa và vẫn còn cổ phiếu để chờ hồi phục.

Tệ hơn, khi giá giảm, bên cho vay yêu cầu **bổ sung tài sản đảm bảo** hoặc **bán giải chấp**. Hàng loạt lệnh bán bắt buộc đẩy giá giảm thêm, kéo theo đợt giải chấp tiếp theo — một **vòng xoáy bán tháo**.

## Thanh khoản biến mất khi bạn cần nó nhất

Trong những tháng tồi tệ nhất, có nhiều phiên lệnh bán giá sàn xếp hàng dài nhưng gần như không có người mua. Bài học: **thanh khoản là thứ "có khi trời đẹp"**. Một cổ phiếu dễ mua lúc thị trường hưng phấn có thể không bán được lúc hoảng loạn, nhất là cổ phiếu nhỏ.

## Những bài học còn nguyên giá trị

- **Đòn bẩy không làm bạn giỏi hơn, chỉ làm kết quả cực đoan hơn.** Nó có thể khiến bạn bị buộc phải bán đúng đáy.
- **Giá tăng mạnh không có nghĩa là rẻ.** Hãy hỏi doanh nghiệp đang được định giá gấp bao nhiêu lần lợi nhuận, chứ không chỉ hỏi giá đã tăng bao nhiêu.
- **Theo dõi vĩ mô:** lạm phát, lãi suất và chính sách tín dụng có thể đổi chiều thị trường nhanh hơn mọi tin tốt của doanh nghiệp.
- **Phục hồi có thể đến bất ngờ:** năm 2009 VN-Index tăng hơn gấp đôi từ đáy — nhưng chỉ người còn vốn và còn bình tĩnh mới hưởng được.

## Nguồn tham khảo

- VnExpress — Những dấu mốc để đời của Vn-Index: https://vnexpress.net/nhung-dau-moc-de-doi-cua-vn-index-2822965.html
- Báo Pháp luật — Vn-Index, 9 năm nhìn lại (đỉnh 1.170,67 ngày 12/3/2007, đáy 235,5 ngày 24/2/2009): https://baophapluat.vn/vn-index-9-nam-nhin-lai-co-dinh-moi-at-co-day-moi-post15363.html
- Vietnam Briefing — A Look at Vietnam's Stock Index (VN-Index giảm 66% năm 2008): https://www.vietnam-briefing.com/news/a-look-vietnams-stock-index.html/
- Lanka Business Online/AFP — Vietnam inflation at 28.3% (tháng 8/2008): https://lankabusinessonline.com/vietnam-inflation-at-28-3-pct-after-sterilized-intervention-blunder
- Quyết định 1434/QĐ-NHNN về lãi suất cơ bản 14%: https://dulieuphapluat.vn/van-ban/tien-te-ngan-hang-van-ban/decision-no-1434qd-nhnn-of-june-26-2008-on-the-base-interest-rate-in-vietnam-dong-1108585.html
- Tạp chí Công Thương — Thực hiện Chỉ thị 03/2007/CT-NHNN: https://tapchicongthuong.vn/thuc-hien-chi-thi-03-2007-ct-nhnn--lieu-cac-ngan-hang-co-ve-kip-dich-5546.htm

## Thực hành

Mở **Thị trường › CK Việt Nam**, xem biểu đồ VN-Index khung dài nhất có thể. Nếu dữ liệu không kéo về tới 2007, hãy dùng chính giai đoạn dài nhất đang có: đánh dấu **đỉnh**, **đáy** và đo **mức giảm %** giữa hai điểm. Sau đó tự hỏi: nếu mình dùng margin 1:1 ở đỉnh, mình còn bao nhiêu vốn ở đáy?`,
        questions: [
          {
            prompt: 'Vì sao đòn bẩy (vay để mua cổ phiếu) khiến đợt sụp đổ 2008 tàn khốc hơn với nhiều nhà đầu tư?',
            options: [
              'Vì vay tiền thì phải trả phí giao dịch cao hơn',
              'Vì khi giá giảm, người vay có thể bị bán giải chấp, mất trắng và còn đẩy giá giảm thêm',
              'Vì cổ phiếu mua bằng tiền vay không được nhận cổ tức',
              'Vì ngân hàng cấm người vay bán cổ phiếu',
            ],
            correct_index: 1,
            explanation: 'Với đòn bẩy, mức giảm của danh mục bị nhân lên trên vốn tự có. Khi bị gọi ký quỹ/giải chấp, người vay buộc phải bán ở giá thấp, và các lệnh bán bắt buộc đó lại kéo giá giảm thêm.',
          },
          {
            prompt: 'Yếu tố vĩ mô nào góp phần lớn làm thị trường đổi chiều trong giai đoạn 2007–2008?',
            options: [
              'Lạm phát tăng nóng buộc thắt chặt tín dụng và nâng lãi suất',
              'Lãi suất giảm về 0%',
              'Số công ty niêm yết giảm mạnh',
              'Nhà nước cấm nhà đầu tư nước ngoài mua cổ phiếu',
            ],
            correct_index: 0,
            explanation: 'Lạm phát cao dẫn tới thắt chặt tiền tệ: lãi suất tăng và cho vay chứng khoán bị giới hạn, làm cạn nguồn vốn vay từng thổi phồng thị trường.',
          },
          {
            prompt: 'Bài học về thanh khoản rút ra từ 2008 là gì?',
            options: [
              'Cổ phiếu luôn bán được ngay ở giá thị trường',
              'Thanh khoản dồi dào lúc hưng phấn có thể biến mất khi thị trường hoảng loạn',
              'Cổ phiếu nhỏ thanh khoản tốt hơn cổ phiếu lớn khi thị trường giảm',
              'Thanh khoản không ảnh hưởng tới rủi ro',
            ],
            correct_index: 1,
            explanation: 'Trong những phiên tồi tệ, lệnh bán giá sàn xếp hàng nhưng không có người mua. Đừng mặc định rằng mình luôn thoát được vị thế đúng lúc muốn.',
          },
          {
            prompt: 'Một cổ phiếu đã tăng gấp ba trong một năm. Câu hỏi nào hữu ích nhất trước khi mua?',
            options: [
              'Nó còn có thể tăng gấp ba nữa không?',
              'Bạn bè mình đã mua chưa?',
              'Mức giá hiện tại đang định giá doanh nghiệp gấp bao nhiêu lần lợi nhuận, và kỳ vọng đó có thực tế không?',
              'Giá có đang ở gần đỉnh lịch sử không, nếu có thì càng tốt?',
            ],
            correct_index: 2,
            explanation: 'Ở đỉnh bong bóng, giá phản ánh kỳ vọng rất xa. Đánh giá định giá so với lợi nhuận thực tế giúp tránh mua chỉ vì giá đã tăng.',
          },
        ],
      },
      {
        slug: 'viet-nam-2011-2012-va-2018-that-chat-va-dieu-chinh',
        title: 'Việt Nam 2011–2012 và 2018: thắt chặt, nợ xấu và điều chỉnh',
        summary: 'Lãi suất cao, nợ xấu ngân hàng và những năm thị trường ảm đạm; rồi cú điều chỉnh khoảng 26% sau đỉnh 2018 giữa căng thẳng thương mại toàn cầu.',
        content_md: `## Không phải biến động nào cũng là "sụp đổ"

Sau cú hồi 2009, thị trường Việt Nam bước vào một giai đoạn **ảm đạm kéo dài**: các đỉnh năm sau thấp hơn năm trước, thanh khoản teo tóp, nhà đầu tư chán nản. Đây là kiểu thị trường gây hại theo cách khác — không phải bằng một phiên giảm sàn, mà bằng **sự mài mòn kiên nhẫn**.

## 2011: lạm phát và thắt chặt

Năm 2011 lạm phát lại tăng cao, cả năm vào khoảng **18,6%**. Tháng 2/2011, Chính phủ ban hành **Nghị quyết 11** ưu tiên kiềm chế lạm phát, ổn định vĩ mô: thắt chặt tiền tệ, cắt giảm đầu tư công. Lãi suất ở mức rất cao khiến doanh nghiệp khó vay, lợi nhuận suy giảm, còn tiền gửi tiết kiệm trở thành đối thủ đáng gờm của cổ phiếu.

Kết quả: VN-Index **giảm khoảng 27–28% trong năm 2011**, từ quanh 486 xuống quanh 352 điểm, và thanh khoản sụt mạnh. Đầu tháng 1/2012, chỉ số có lúc xuống dưới **340 điểm**.

## 2012: nợ xấu và tái cơ cấu ngân hàng

Tăng trưởng tín dụng nóng những năm trước để lại **nợ xấu** lớn trong hệ thống ngân hàng. Theo số liệu các tổ chức tín dụng báo cáo, nợ xấu cuối tháng 9/2012 khoảng **4,9% tổng dư nợ** — nhiều chuyên gia cho rằng con số thực còn cao hơn. Đầu 2012, Chính phủ phê duyệt **Đề án cơ cấu lại hệ thống tổ chức tín dụng 2011–2015**, và năm 2013 thành lập **VAMC** (Công ty Quản lý tài sản của các TCTD) để mua và xử lý nợ xấu.

Tháng 8/2012, việc một cựu lãnh đạo, nhà sáng lập của một ngân hàng thương mại cổ phần lớn bị bắt giữ khiến VN-Index **giảm khoảng 10% chỉ trong ba phiên**. Bài học ở đây không nằm ở cá nhân nào, mà ở **rủi ro hệ thống**: khi niềm tin vào ngân hàng — "mạch máu" của nền kinh tế — bị lung lay, cả thị trường bị bán tháo, kể cả cổ phiếu tốt.

## 2018: đỉnh mới và cú điều chỉnh

Phải mất **11 năm** VN-Index mới vượt lại đỉnh 2007 (tháng 3/2018). Đợt tăng 2017 – đầu 2018 được dẫn dắt bởi các cổ phiếu vốn hoá lớn, và chỉ số lập đỉnh **khoảng 1.204 điểm (đóng cửa) ngày 9/4/2018**.

Sau đó thị trường quay đầu nhanh:

| Thời điểm | Diễn biến |
|---|---|
| 5/2/2018 | VN-Index giảm hơn 56 điểm trong một phiên, khi chứng khoán toàn cầu chao đảo |
| 9/4/2018 | Đỉnh khoảng **1.204 điểm** |
| 28/5/2018 | Đóng cửa quanh 932 điểm, thấp hơn đỉnh hơn 22% |
| 11/7/2018 | Rơi xuống dưới **900 điểm**, thấp hơn đỉnh khoảng **26%** |
| Cuối 2018 | Đóng cửa khoảng 893 điểm, cả năm giảm khoảng 9% |

Nguyên nhân thường được nhắc tới: **Fed tăng lãi suất**, **căng thẳng thương mại** giữa Mỹ và các đối tác, khối ngoại bán ròng, Việt Nam chưa được MSCI nâng hạng, cùng việc nhiều cổ phiếu lớn đã được định giá cao sau một năm tăng mạnh. Điều đáng chú ý: GDP năm 2018 vẫn tăng trưởng tốt — **kinh tế tốt không bảo đảm chứng khoán tăng** trong ngắn hạn.

## Bài học rút ra

- **Lãi suất là "trọng lực" của định giá.** Khi lãi suất cao kéo dài, cổ phiếu khó tăng bền vững dù doanh nghiệp vẫn hoạt động.
- **Sức khoẻ ngân hàng ảnh hưởng toàn thị trường.** Nợ xấu và các cú sốc niềm tin ở ngân hàng lan ra mọi ngành.
- **Đỉnh có thể mất rất lâu mới quay lại.** Người mua ở đỉnh 2007 phải chờ hơn một thập kỷ (chưa tính cổ tức) — vì vậy **mua ở giá nào** quan trọng không kém **mua cái gì**.
- **Điều chỉnh 20–30% là chuyện bình thường** kể cả trong xu hướng tăng dài hạn. Hãy chuẩn bị tâm lý và tỷ trọng cho điều đó trước khi nó xảy ra.
- **Yếu tố bên ngoài** (lãi suất Mỹ, thương mại toàn cầu, dòng vốn ngoại) có thể chi phối thị trường Việt Nam trong ngắn hạn.

## Nguồn tham khảo

- SSI — Báo cáo hoạt động 2011 (lạm phát 18,58%, VN-Index giảm 27,7%): https://www.ssi.com.vn/upload/files/Presentation/SSI%20-%202011%20operation%20report%20and%202012%20plan%20at%20annual%20GSM.pdf
- VietnamPlus — Bad debt ratio slashed to 3.21 percent (nợ xấu 4,93% tháng 9/2012): https://en.vietnamplus.vn/bad-debt-ratio-slashed-to-321-percent-post82707.vnp
- Vietstock — Vietnam stock market loses $3.85 bln in 3 days (8/2012): https://en.vietstock.vn/2012/08/vietnam-stock-market-loses-$3-85-bln-in-3-days-36-134110.htm
- SGGP — Chứng khoán Việt Nam chính thức phá đỉnh lịch sử (22/3/2018): https://www.sggp.org.vn/chung-khoan-viet-nam-chinh-thuc-pha-dinh-lich-su-post470068.html
- Thời báo Tài chính — VN-Index lỡ hẹn đỉnh lịch sử 1.204 điểm: https://thitruongtaichinhtiente.vn/vn-index-lo-hen-dinh-lich-su-1-204-diem-33115.html
- Viet Nam News — VN stocks set new low since December (28/5/2018): https://vietnamnews.vn/economy/448816/vn-stocks-set-new-low-since-december.html
- VCSC Daily — Banks drag stocks down to eight-month low (11/7/2018, giảm 26% từ đỉnh): https://vietcap.com.vn/en/research-center/vcsc-daily-banks-drag-stocks-down-to-eight-month-low-hvn-vjc
- Viet Nam News — A disappointing year for VN stocks (tổng kết 2018): https://vietnamnews.vn/economy/483001/a-disappointing-year-for-vn-stocks.html

## Thực hành

Trên **Thị trường › CK Việt Nam**, tìm giai đoạn gần nhất mà VN-Index **đi ngang** hơn 6 tháng. Đánh dấu vùng đi ngang, rồi ghi vào nhật ký: lãi suất tiết kiệm lúc đó cao hay thấp, và thanh khoản thị trường tăng hay giảm?`,
        questions: [
          {
            prompt: 'Vì sao lãi suất cao kéo dài (như năm 2011) thường gây áp lực lên giá cổ phiếu?',
            options: [
              'Vì cổ phiếu bị cấm giao dịch khi lãi suất cao',
              'Vì chi phí vốn của doanh nghiệp tăng và tiền gửi tiết kiệm trở thành lựa chọn cạnh tranh với cổ phiếu',
              'Vì lãi suất cao luôn làm doanh nghiệp phá sản',
              'Vì lãi suất cao làm tăng cổ tức bắt buộc',
            ],
            correct_index: 1,
            explanation: 'Lãi suất cao làm chi phí vay của doanh nghiệp tăng, lợi nhuận giảm; đồng thời nhà đầu tư đòi hỏi lợi suất cao hơn từ cổ phiếu, nên mức định giá chấp nhận được giảm xuống.',
          },
          {
            prompt: 'Cú sốc niềm tin ở một ngân hàng lớn năm 2012 làm cả thị trường giảm mạnh. Điều này minh hoạ khái niệm nào?',
            options: ['Rủi ro hệ thống', 'Cổ tức tiền mặt', 'Hiệu ứng tháng Giêng', 'Phân tích nến Nhật'],
            correct_index: 0,
            explanation: 'Ngân hàng là mạch máu của nền kinh tế. Khi niềm tin vào hệ thống ngân hàng lung lay, nhà đầu tư bán tháo trên diện rộng — đó là rủi ro hệ thống, không đa dạng hoá hết được.',
          },
          {
            prompt: 'Năm 2018 GDP Việt Nam vẫn tăng trưởng tốt nhưng VN-Index giảm khoảng 26% từ đỉnh. Bài học nào phù hợp nhất?',
            options: [
              'Số liệu GDP luôn sai',
              'Kinh tế tốt không bảo đảm chứng khoán tăng trong ngắn hạn; định giá, dòng vốn và yếu tố quốc tế cũng quan trọng',
              'Nên bán hết cổ phiếu mỗi khi GDP tăng',
              'Chứng khoán và kinh tế không bao giờ liên quan',
            ],
            correct_index: 1,
            explanation: 'Giá cổ phiếu phản ánh kỳ vọng và định giá. Sau một đợt tăng mạnh, lãi suất Mỹ tăng, căng thẳng thương mại và khối ngoại bán ròng đủ để kéo thị trường điều chỉnh dù kinh tế vẫn tốt.',
          },
          {
            prompt: 'VN-Index mất khoảng 11 năm mới vượt lại đỉnh 2007. Điều đó nhắc nhà đầu tư điều gì?',
            options: [
              'Mua ở giá nào quan trọng: mua ở vùng định giá quá cao có thể phải chờ rất lâu mới hoà vốn',
              'Chỉ số luôn quay lại đỉnh trong vòng một năm',
              'Không bao giờ nên đầu tư cổ phiếu',
              'Đỉnh cũ luôn là mức giá rẻ',
            ],
            correct_index: 0,
            explanation: 'Thời gian chờ hoà vốn phụ thuộc lớn vào mức giá mua. Mua ở đỉnh bong bóng có thể mất cả thập kỷ (chưa tính cổ tức) mới về lại vốn.',
          },
        ],
      },
      {
        slug: 'viet-nam-2020-2022-covid-f0-va-sup-giam',
        title: 'Việt Nam 2020–2022: Covid, làn sóng F0 và cú sụt giảm',
        summary: 'Từ đáy Covid tháng 3/2020 lên đỉnh khoảng 1.530 điểm đầu 2022 nhờ dòng tiền cá nhân và margin, rồi giảm khoảng 43% đến tháng 11/2022.',
        content_md: `## Một chu kỳ trọn vẹn trong ba năm

Giai đoạn 2020–2022 là "bài học nén" về chu kỳ thị trường: hoảng loạn → hưng phấn → sụp đổ → hồi phục, tất cả gói gọn trong khoảng ba năm, với hàng triệu nhà đầu tư mới tham gia.

## Dòng thời gian

| Thời điểm | Diễn biến |
|---|---|
| Cuối 2019 | VN-Index quanh **960 điểm** |
| Cuối tháng 3/2020 | Hoảng loạn Covid, chỉ số về vùng khoảng **660 điểm** (giảm khoảng 31%) |
| Cuối 2020 | Hồi phục, đóng cửa khoảng **1.104 điểm**, cả năm tăng khoảng 15% |
| 2021 | Tăng khoảng **36%**, khoảng 1,5 triệu tài khoản cá nhân mở mới, thanh khoản và dư nợ margin lập kỷ lục |
| Đầu tháng 1/2022 | Đỉnh khoảng **1.530 điểm** |
| Tháng 3–4/2022 | Các vụ việc thao túng giá, sai phạm phát hành trái phiếu bị xử lý; thị trường giảm mạnh |
| Tháng 9–10/2022 | Ngân hàng Nhà nước tăng lãi suất điều hành hai lần (lần đầu kể từ 2011) |
| 16/11/2022 | Đáy trong phiên khoảng **874 điểm**, thấp hơn đỉnh khoảng **43%** |
| Cuối 2022 | Đóng cửa khoảng 1.007 điểm, cả năm giảm khoảng 33% |
| 2023 | Lãi suất điều hành được hạ bốn lần, thị trường hồi phục |

## 2020: hoảng loạn rồi hồi phục chữ V

Đầu 2020, đại dịch khiến chứng khoán toàn cầu lao dốc. Ở Việt Nam, VN-Index rơi về quanh 660 điểm cuối tháng 3. Nhưng lãi suất được hạ, các gói hỗ trợ được tung ra và dịch bệnh trong nước được kiểm soát tương đối sớm, nên thị trường hồi phục nhanh và kết thúc năm 2020 **cao hơn đầu năm**. Ai bán tháo trong tháng 3 vì sợ hãi đã khoá khoản lỗ ngay trước một đợt tăng mạnh.

## 2021: làn sóng nhà đầu tư F0

Lãi suất tiết kiệm thấp, nhiều người ở nhà vì giãn cách, giao dịch trực tuyến dễ dàng — hàng loạt **nhà đầu tư mới (F0)** gia nhập. Năm 2021 có khoảng **1,53 triệu tài khoản** cá nhân trong nước mở mới, gần gấp 4 lần năm 2020. Giá trị giao dịch bình quân trên HOSE tăng hơn ba lần so với 2020, và **dư nợ cho vay ký quỹ (margin)** lên mức cao nhất lịch sử, gần 180.000 tỷ đồng cuối năm.

Dấu hiệu hưng phấn rất rõ: cổ phiếu nhỏ, cơ bản yếu tăng gấp nhiều lần; "hội nhóm phím hàng" nở rộ; nhiều người nghĩ lãi 5–10% mỗi tuần là bình thường.

## 2022: khi mọi thứ đảo chiều cùng lúc

- **Xử lý thao túng và sai phạm:** từ cuối tháng 3/2022, nhà chức trách khởi tố một loạt vụ việc liên quan đến thao túng giá cổ phiếu và gian lận trong phát hành trái phiếu. Những cổ phiếu từng tăng nóng giảm sàn nhiều phiên liên tiếp.
- **Thị trường trái phiếu doanh nghiệp đóng băng:** lượng phát hành riêng lẻ cả năm giảm khoảng 60%, quy định phát hành được siết lại (Nghị định 65 từ tháng 9/2022). Doanh nghiệp, nhất là bất động sản, thiếu vốn và áp lực đáo hạn tăng.
- **Lãi suất tăng:** lạm phát toàn cầu khiến các ngân hàng trung ương tăng lãi suất mạnh; tỷ giá chịu áp lực, Ngân hàng Nhà nước nâng lãi suất điều hành vào tháng 9 và tháng 10/2022.
- **Bán giải chấp:** khi giá giảm sâu, nhiều tài khoản margin bị bán bắt buộc — có trường hợp cổ phiếu của chính lãnh đạo doanh nghiệp bị công ty chứng khoán bán giải chấp — tạo thêm vòng xoáy giảm.

Từ khoảng 1.530 điểm, VN-Index rơi xuống đáy trong phiên khoảng 874 điểm ngày 16/11/2022. Đúng lúc tâm lý tệ nhất, khối ngoại lại **mua ròng** mạnh từ đầu tháng 11, trong khi nhà đầu tư cá nhân bán ròng kỷ lục.

## Hồi phục

Năm 2023, Ngân hàng Nhà nước **hạ lãi suất điều hành bốn lần**, các biện pháp gỡ khó cho thị trường trái phiếu được đưa ra và thị trường dần hồi phục. Nhưng nhiều cổ phiếu "nóng" của 2021 vẫn ở rất xa đỉnh cũ — **chỉ số hồi phục không có nghĩa là mọi cổ phiếu hồi phục**.

## Bài học

- **Đám đông hưng phấn + margin kỷ lục = rủi ro tích tụ**, dù chưa biết khi nào vỡ.
- **Cổ phiếu tăng vì đầu cơ giảm nhanh nhất** khi dòng tiền rút ra.
- **Bán tháo vì sợ hãi (2020) và mua đuổi vì tham lam (2021)** là hai mặt của cùng một sai lầm: để cảm xúc quyết định.
- **Theo dõi tín dụng và lãi suất:** trái phiếu doanh nghiệp, margin và lãi suất điều hành là "nhiệt kế" của thị trường Việt Nam.

## Nguồn tham khảo

- Vietstock — VN-Index ends the year at over 1,100 points (2020): https://en.vietstock.vn/2021/01/vn-index-ends-the-year-at-over-1100-points-36-432581.htm
- VnBusiness — Cổ phiếu chứng khoán bắt đáy cùng dòng tiền margin (tài khoản mới, dư nợ 2021): https://vnbusiness.vn/co-phieu-chung-khoan-bat-day-cung-dong-tien-margin.html
- The Investor — Vietnam stock market up, down with many records in 2022: https://theinvestor.vn/vietnam-stock-market-up-down-with-many-records-in-2022-d3045.html
- The Investor — Vietnam's 2022 stock market provides investors mixed emotions (đáy 16/11/2022): https://theinvestor.vn/vietnams-2022-stock-market-provides-investors-mixed-emotions-d3139.html
- VinaCapital — Vietnam's interest rate cuts are boosting stock prices (2023): https://vinacapital.com/wp-content/uploads/2023/08/VinaCapital-Insights-Vietnams-Interest-Rate-Cuts-are-Boosting-Stock-Prices.pdf

## Thực hành

Trên **Thị trường › CK Việt Nam**, mở biểu đồ VN-Index khung tuần và đánh dấu bốn pha: **hoảng loạn 2020**, **hưng phấn 2021**, **sụp đổ 2022**, **hồi phục 2023**. Với mỗi pha, ghi một câu: lúc đó mình có thể đã cảm thấy gì, và quy tắc nào sẽ giúp mình không hành động theo cảm xúc ấy?`,
        questions: [
          {
            prompt: 'Nhà đầu tư bán toàn bộ cổ phiếu cuối tháng 3/2020 vì sợ Covid. Bài học chính là gì?',
            options: [
              'Bán tháo vì hoảng loạn thường khoá khoản lỗ ngay trước giai đoạn hồi phục',
              'Luôn luôn nên bán khi có tin xấu',
              'Thị trường không bao giờ hồi phục sau dịch bệnh',
              'Nên vay margin để mua ngay lập tức',
            ],
            correct_index: 0,
            explanation: 'Năm 2020 thị trường hồi phục hình chữ V và kết thúc năm cao hơn đầu năm. Quyết định trong hoảng loạn thường biến khoản lỗ tạm thời thành lỗ thật.',
          },
          {
            prompt: 'Dấu hiệu nào của năm 2021 cho thấy rủi ro đang tích tụ?',
            options: [
              'Lãi suất tiết kiệm tăng mạnh',
              'Dư nợ margin lập kỷ lục và cổ phiếu cơ bản yếu tăng gấp nhiều lần nhờ đầu cơ',
              'Thanh khoản thị trường giảm dần',
              'Số tài khoản mở mới giảm',
            ],
            correct_index: 1,
            explanation: 'Đòn bẩy cao và giá tách rời giá trị là dấu hiệu kinh điển của hưng phấn. Nó không cho biết thời điểm đảo chiều, nhưng cho biết cú giảm sẽ đau thế nào khi xảy ra.',
          },
          {
            prompt: 'Vì sao năm 2022 các cổ phiếu tăng nóng nhất năm 2021 thường giảm sâu nhất?',
            options: [
              'Vì chúng có cổ tức cao',
              'Vì giá được đẩy lên bởi dòng tiền đầu cơ và vốn vay; khi dòng tiền rút và margin bị giải chấp, không có giá trị nền tảng nào đỡ giá',
              'Vì chúng bị huỷ niêm yết ngay lập tức',
              'Vì nhà đầu tư nước ngoài bị cấm mua',
            ],
            correct_index: 1,
            explanation: 'Khi giá chỉ dựa vào kỳ vọng và tiền vay, việc rút dòng tiền và bán giải chấp tạo ra vòng xoáy giảm mà không có nền tảng lợi nhuận nào đỡ lại.',
          },
          {
            prompt: 'Sau đáy tháng 11/2022, VN-Index hồi phục. Điều nào là đúng?',
            options: [
              'Mọi cổ phiếu đều về lại đỉnh cũ',
              'Chỉ số hồi phục không có nghĩa mọi cổ phiếu hồi phục; nhiều mã đầu cơ vẫn ở rất xa đỉnh',
              'Hồi phục là do lãi suất tăng tiếp',
              'Nhà đầu tư cá nhân mua ròng kỷ lục ở đáy',
            ],
            correct_index: 1,
            explanation: 'Chỉ số được dẫn dắt bởi cổ phiếu lớn. Những mã tăng nhờ đầu cơ năm 2021 có thể không bao giờ quay lại đỉnh — vì vậy chất lượng doanh nghiệp quan trọng khi đi qua khủng hoảng.',
          },
        ],
      },
      {
        slug: 'khung-hoang-toan-cau-tu-1929-den-2022',
        title: 'Các cuộc khủng hoảng toàn cầu: từ 1929 đến 2022',
        summary: 'Đại khủng hoảng, Thứ Hai Đen tối, bong bóng dot-com, khủng hoảng tài chính 2008, Covid và năm 2022 — mức giảm và thời gian hồi phục.',
        content_md: `## Vì sao cần học lịch sử thế giới?

Chứng khoán Việt Nam còn trẻ. Thị trường Mỹ có dữ liệu gần một thế kỷ, cho thấy những khuôn mẫu lặp lại: **mỗi cuộc khủng hoảng có nguyên nhân khác nhau, nhưng hành vi con người thì rất giống nhau**.

Lưu ý: các con số dưới đây là **mức giá chỉ số (price-only), không tính cổ tức và lạm phát**, đo từ đỉnh đến đáy theo giá đóng cửa. Nếu tính cả cổ tức, thời gian hồi phục thường ngắn hơn.

## Bảng tổng hợp

| Sự kiện | Chỉ số | Mức giảm đỉnh–đáy | Thời gian về lại đỉnh cũ (giá) |
|---|---|---|---|
| Đại khủng hoảng 1929–1932 | Dow Jones | khoảng **89%** | khoảng **25 năm** (1954) |
| Thứ Hai Đen tối 19/10/1987 | Dow Jones | **22,6% trong một ngày** | dưới 2 năm (1989) |
| Bong bóng dot-com 2000–2002 | Nasdaq | gần **78%** | khoảng **15 năm** (2015) |
| Bong bóng dot-com 2000–2002 | S&P 500 | khoảng **49%** | khoảng 7 năm (2007) |
| Khủng hoảng tài chính 2007–2009 | S&P 500 | khoảng **57%** | khoảng 5,5 năm (2013) |
| Covid 2020 | S&P 500 | khoảng **34%** trong hơn một tháng | khoảng 5 tháng (8/2020) |
| Lạm phát và tăng lãi suất 2022 | S&P 500 | khoảng **25%** | khoảng 2 năm (1/2024) |

## 1929: đòn bẩy và Đại khủng hoảng

Thập niên 1920 ở Mỹ là thời kỳ hưng thịnh. Nhà đầu tư thường chỉ trả khoảng **10% giá cổ phiếu**, phần còn lại đi vay với chính cổ phiếu làm tài sản đảm bảo. Dow Jones lập đỉnh tháng 9/1929; tháng 10 sụp đổ, đến giữa tháng 11 đã mất gần một nửa. Đáy cuối cùng tới tháng 7/1932, thấp hơn đỉnh khoảng 89%. Tính theo giá danh nghĩa, Dow mất đến 1954 mới vượt đỉnh — dù nhiều nhà nghiên cứu chỉ ra rằng nếu tính cổ tức và giảm phát, nhà đầu tư đa dạng hoá hồi vốn sớm hơn nhiều. Bài học: **đòn bẩy cao + chính sách sai lầm** có thể biến suy thoái thành thảm hoạ.

## 1987: sụp đổ trong một ngày

Ngày 19/10/1987, Dow Jones giảm **22,6%** — mức giảm một ngày lớn nhất lịch sử. Các chiến lược "bảo hiểm danh mục" tự động bán hợp đồng tương lai khi giá giảm đã khuếch đại cú rơi. Fed nhanh chóng cam kết cung cấp thanh khoản; thị trường vượt đỉnh cũ chưa đầy hai năm sau. Bài học: **sụp đổ không cần suy thoái kinh tế** — cấu trúc thị trường và bán tháo dây chuyền cũng đủ.

## 2000–2002: câu chuyện hay, định giá vô lý

Internet thực sự thay đổi thế giới — nhưng giá cổ phiếu công nghệ cuối thập niên 1990 đã đi trước thực tế nhiều năm. Nasdaq lập đỉnh khoảng 5.048 điểm tháng 3/2000, rồi rơi xuống khoảng 1.114 điểm tháng 10/2002. Nhiều công ty "dot-com" biến mất hoàn toàn. Bài học: **một công nghệ đúng vẫn có thể là một khoản đầu tư sai nếu mua quá đắt**.

## 2007–2009: khủng hoảng tín dụng

Cho vay nhà đất dễ dãi, sản phẩm tài chính phức tạp và đòn bẩy cực cao ở các ngân hàng đầu tư. Khi giá nhà giảm, cả hệ thống tín dụng đóng băng; S&P 500 giảm khoảng 57% từ tháng 10/2007 đến tháng 3/2009 và đến tháng 3/2013 mới đóng cửa vượt đỉnh. Bài học: **khi khủng hoảng nằm ở hệ thống ngân hàng, hồi phục thường chậm**.

## 2020: nhanh nhất lịch sử

S&P 500 giảm khoảng 34% chỉ trong khoảng một tháng (19/2 – 23/3/2020) — thị trường giá xuống nhanh nhất từng ghi nhận. Nhờ hỗ trợ tiền tệ và tài khoá quy mô lớn, chỉ số lập đỉnh mới ngày 18/8/2020. Bài học: **phản ứng chính sách có thể rút ngắn khủng hoảng rất nhiều**.

## 2022: khi lãi suất quay lại

Lạm phát cao nhất nhiều thập kỷ buộc Fed tăng lãi suất mạnh. S&P 500 giảm khoảng 25% từ đầu tháng 1 đến tháng 10/2022; cổ phiếu tăng trưởng định giá cao và trái phiếu cùng giảm. Bài học: **lãi suất thay đổi định giá của mọi tài sản**.

## Điểm chung

- Mức giảm 30–50% không phải hiếm; mức 80–90% thường gắn với **bong bóng cực đoan và đòn bẩy**.
- Thời gian hồi phục **khác nhau rất lớn** — từ vài tháng đến vài thập kỷ — tuỳ định giá ban đầu và phản ứng chính sách.
- Không ai báo trước chính xác đáy; những ngày tăng mạnh nhất thường xuất hiện giữa giai đoạn hỗn loạn.

## Nguồn tham khảo

- Federal Reserve History — Stock Market Crash of 1929: https://www.federalreservehistory.org/essays/stock-market-crash-of-1929
- Federal Reserve History — Stock Market Crash of 1987: https://www.federalreservehistory.org/essays/stock-market-crash-of-1987
- BizNews/AFP — Nasdaq shakes off dot-com losses 15 years later: https://www.biznews.com/briefs/nasdaq-shakes-off-dot-com-losses-15-years-later
- Wikipedia — Closing milestones of the S&P 500 (các mốc đỉnh/đáy 2000, 2007, 2009, 2013, 2020, 2022): https://en.wikipedia.org/wiki/Closing_milestones_of_the_S%26P_500
- Boston Globe/AP — S&P 500 closes at record, erasing last of pandemic losses: https://www.bostonglobe.com/2020/08/18/business/sp-500-closes-record-erasing-last-pandemic-losses/
- NBC News — S&P 500 hits all-time high, surpassing previous record set in 2022 (19/1/2024): https://www.nbcnews.com/business/markets/sp-500-hits-time-high-surpassing-previous-record-set-2022-rcna134839
- History News Network — Mark Hulbert: 25 years to bounce back? Try 4 1/2 (1929 khi tính cổ tức và giảm phát): https://historynewsnetwork.org/article/79770

## Thực hành

Chọn hai sự kiện trong bảng có **mức giảm gần nhau** nhưng **thời gian hồi phục khác xa** (ví dụ dot-com trên S&P 500 và Covid 2020). Viết 3–4 dòng vào nhật ký giải thích vì sao: định giá lúc bắt đầu, nguyên nhân khủng hoảng và phản ứng chính sách khác nhau thế nào? Sau đó mở **Thị trường › CK Việt Nam** và so sánh với cú giảm 2022 của VN-Index.`,
        questions: [
          {
            prompt: 'Vì sao Nasdaq mất khoảng 15 năm để về lại đỉnh 2000, trong khi S&P 500 chỉ mất vài tháng sau cú giảm 2020?',
            options: [
              'Vì năm 2000 có ít công ty niêm yết hơn',
              'Vì định giá đầu năm 2000 cực kỳ cao so với lợi nhuận, còn cú giảm 2020 đến từ một cú sốc tạm thời được chính sách hỗ trợ mạnh',
              'Vì Nasdaq không có cổ phiếu công nghệ',
              'Vì năm 2020 không có ai bán cổ phiếu',
            ],
            correct_index: 1,
            explanation: 'Thời gian hồi phục phụ thuộc lớn vào định giá ban đầu và bản chất cú sốc. Bong bóng định giá cần nhiều năm để lợi nhuận "đuổi kịp" giá; cú sốc tạm thời kèm hỗ trợ mạnh có thể hồi phục nhanh.',
          },
          {
            prompt: 'Thứ Hai Đen tối 1987 cho thấy điều gì?',
            options: [
              'Sụp đổ chỉ xảy ra khi kinh tế suy thoái',
              'Cấu trúc thị trường và bán tháo dây chuyền (ví dụ bán tự động) có thể gây sụp đổ mà không cần suy thoái',
              'Fed không bao giờ can thiệp vào thị trường',
              'Thị trường mất hàng chục năm để hồi phục',
            ],
            correct_index: 1,
            explanation: 'Năm 1987 không có suy thoái lớn đi kèm. Chiến lược bán tự động khuếch đại cú giảm, và thị trường vượt đỉnh cũ chưa tới hai năm sau.',
          },
          {
            prompt: 'Khi đọc con số "Dow mất 25 năm để về lại đỉnh 1929", cần lưu ý điều gì?',
            options: [
              'Con số đó tính theo giá danh nghĩa, chưa gồm cổ tức và giảm phát, nên hồi vốn thực tế của nhà đầu tư đa dạng hoá có thể sớm hơn',
              'Con số đó đã bao gồm cổ tức',
              'Con số đó áp dụng cho mọi cổ phiếu',
              'Con số đó chứng minh cổ phiếu không bao giờ sinh lời',
            ],
            correct_index: 0,
            explanation: 'Số liệu chỉ số thường là price-only. Cổ tức và mặt bằng giá thay đổi có thể khiến bức tranh thực tế khác đáng kể — luôn hỏi "con số này đo cái gì?".',
          },
          {
            prompt: 'Những cú giảm 80–90% trong lịch sử (1929, Nasdaq 2000) có điểm chung nào?',
            options: [
              'Đều xảy ra vào mùa hè',
              'Đều bắt nguồn từ bong bóng định giá cực đoan và/hoặc đòn bẩy cao',
              'Đều do một công ty duy nhất gây ra',
              'Đều hồi phục trong vòng một năm',
            ],
            correct_index: 1,
            explanation: 'Các cú giảm sâu nhất thường đến sau giai đoạn giá tách rời giá trị thực và vốn vay tràn lan — đúng như bong bóng Việt Nam 2007.',
          },
        ],
      },
      {
        slug: 'giai-phau-mot-cuoc-sup-do-va-thi-truong-am-dam',
        title: 'Giải phẫu một cuộc sụp đổ và thị trường ảm đạm',
        summary: 'Các pha lặp lại của một cuộc sụp đổ — từ tích tụ đòn bẩy đến hồi phục chậm — dấu hiệu đỉnh, dấu hiệu đáy và vì sao canh thời điểm rất khó.',
        content_md: `## Lịch sử không lặp lại, nhưng có vần điệu

Nhìn lại 2007 ở Việt Nam, 2000 hay 2008 ở Mỹ, ta thấy một "kịch bản" chung. Nhà kinh tế **Hyman Minsky** mô tả nó bằng ý tưởng: **sự ổn định kéo dài sinh ra bất ổn** — vì thời gian yên bình khiến người ta vay nhiều hơn và chấp nhận rủi ro lớn hơn.

## Bảy pha của một chu kỳ sụp đổ

| Pha | Điều gì xảy ra | Tâm lý phổ biến |
|---|---|---|
| 1. **Câu chuyện mới** | Công nghệ, cải cách, chính sách nới lỏng — lý do thật để lạc quan | "Lần này khác" |
| 2. **Tích tụ tín dụng, đòn bẩy** | Lãi suất thấp, margin và vay nợ tăng nhanh | "Không vay là thiệt" |
| 3. **Hưng phấn** | Người mới ồ ạt vào, cổ phiếu yếu tăng mạnh nhất, định giá bị bỏ qua | "Ai cũng giàu" |
| 4. **Ngòi nổ** | Lãi suất tăng, siết tín dụng, một vụ đổ vỡ, cú sốc bên ngoài | "Chỉ là điều chỉnh" |
| 5. **Bán bắt buộc** | Gọi ký quỹ, giải chấp, quỹ bị rút vốn — bán bất kể giá | "Sẽ hồi thôi" → lo lắng |
| 6. **Đầu hàng (capitulation)** | Thanh khoản tăng vọt trong các phiên giảm mạnh, tin xấu tràn ngập | "Không bao giờ chơi chứng khoán nữa" |
| 7. **Phản ứng chính sách và hồi phục chậm** | Hạ lãi suất, bơm thanh khoản, xử lý nợ xấu; giá đi ngang rất lâu | Chán nản, hoài nghi |

Không phải chu kỳ nào cũng đủ bảy pha, và độ dài mỗi pha khác nhau rất nhiều. Năm 2020 các pha 4–7 diễn ra trong vài tuần; giai đoạn 2008–2012 ở Việt Nam kéo dài nhiều năm.

## Thị trường ảm đạm kéo dài

Sau sụp đổ, thị trường thường không bật lên ngay mà **đi ngang hoặc giảm dần** trong thời gian dài: thanh khoản thấp, tin tức không ai quan tâm, những người còn ở lại kiệt sức. Đây là giai đoạn **nguy hiểm theo kiểu khác**: không mất tiền nhiều trong một ngày, nhưng dễ bỏ cuộc, giao dịch quá nhiều cho đỡ chán, hoặc bán đúng trước khi xu hướng mới bắt đầu.

## Thị trường giá xuống kéo dài bao lâu?

Theo thống kê của Hartford Funds trên S&P 500 từ 1928:

- Thị trường giá xuống (giảm từ 20% trở lên) trung bình kéo dài khoảng **289 ngày (khoảng 9,6 tháng)** và giảm trung bình khoảng **35%**.
- Thị trường giá lên trung bình kéo dài khoảng **2,7 năm** và tăng trung bình khoảng **112%**.
- Kể từ 1928 đã có khoảng **27 lần** thị trường giá xuống — trung bình vài năm một lần.

Nói cách khác: **giai đoạn giá xuống thường ngắn hơn giai đoạn giá lên**, nhưng thời gian để **về lại đỉnh cũ** có thể dài hơn nhiều so với độ dài của chính cú giảm. Thị trường mới nổi như Việt Nam thường biến động mạnh hơn các con số trung bình của Mỹ.

## Dấu hiệu gần đỉnh và gần đáy

| Thường thấy gần đỉnh | Thường thấy gần đáy |
|---|---|
| Margin, vay nợ lập kỷ lục | Margin đã giảm mạnh sau giải chấp |
| Tài khoản mở mới tăng vọt, người không quan tâm tài chính cũng bàn chứng khoán | Truyền thông bi quan, nhiều người tuyên bố bỏ thị trường |
| Cổ phiếu kém chất lượng tăng mạnh nhất | Cổ phiếu tốt bị bán cùng cổ phiếu xấu |
| Định giá cao so với lịch sử | Định giá thấp so với lịch sử |
| Ngân hàng trung ương bắt đầu thắt chặt | Ngân hàng trung ương chuyển sang nới lỏng |

**Nhưng hãy trung thực:** những dấu hiệu này có thể tồn tại hàng tháng, thậm chí nhiều năm, trước khi đỉnh hay đáy thật sự xuất hiện. Thị trường "đắt" có thể còn đắt hơn; "đáy" có thể có nhiều đáy thấp hơn. Theo Hartford Funds, khoảng **42%** những ngày tăng mạnh nhất của S&P 500 trong 20 năm gần đây rơi vào giai đoạn thị trường giá xuống — tức là ngày tốt nhất và ngày xấu nhất thường **đứng sát nhau**.

Vì vậy, các dấu hiệu nên dùng để **điều chỉnh mức rủi ro** (giảm đòn bẩy khi hưng phấn, giữ kỷ luật khi bi quan), không phải để đặt cược tất tay vào một thời điểm.

## Nguồn tham khảo

- Hartford Funds — Bear Markets (thống kê S&P 500 từ 1928): https://hartfordfunds.com/practice-management/client-conversations/managing-volatility/bear-markets.html
- Federal Reserve History — Stock Market Crash of 1929: https://www.federalreservehistory.org/essays/stock-market-crash-of-1929
- The Investor — Vietnam stock market up, down with many records in 2022: https://theinvestor.vn/vietnam-stock-market-up-down-with-many-records-in-2022-d3045.html

## Thực hành

Trên **Thị trường › CK Việt Nam**, chọn một cú giảm lớn của VN-Index trên biểu đồ và thử gán **bảy pha** ở trên vào các đoạn giá. Ghi chú: pha nào rõ nhất, pha nào khó nhận ra nhất khi nó đang diễn ra? Viết thêm một quy tắc cá nhân, ví dụ: "Khi mình thấy dấu hiệu hưng phấn, mình không dùng margin."`,
        questions: [
          {
            prompt: 'Theo ý tưởng của Minsky, vì sao giai đoạn ổn định kéo dài lại có thể sinh ra khủng hoảng?',
            options: [
              'Vì ổn định khiến người ta tự tin vay nhiều hơn và chấp nhận rủi ro lớn hơn',
              'Vì ổn định làm lãi suất tăng tự động',
              'Vì công ty ngừng hoạt động khi thị trường ổn định',
              'Vì không có nhà đầu tư nào mua cổ phiếu khi thị trường ổn định',
            ],
            correct_index: 0,
            explanation: 'Yên bình kéo dài làm rủi ro có vẻ nhỏ đi, nên đòn bẩy và đầu cơ tích tụ — tạo điều kiện cho một cú sụp đổ khi có ngòi nổ.',
          },
          {
            prompt: 'Pha "bán bắt buộc" trong một cuộc sụp đổ nguy hiểm vì sao?',
            options: [
              'Vì người bán được chọn giá tốt nhất',
              'Vì người bán phải bán bất kể giá (giải chấp, rút vốn), đẩy giá giảm thêm và kích hoạt thêm lệnh bán',
              'Vì nó làm tăng cổ tức',
              'Vì chỉ diễn ra ở thị trường giá lên',
            ],
            correct_index: 1,
            explanation: 'Bán bắt buộc tạo vòng xoáy: giá giảm → giải chấp → bán thêm → giá giảm tiếp. Đó là lý do đòn bẩy khuếch đại khủng hoảng.',
          },
          {
            prompt: 'Nên dùng các "dấu hiệu gần đỉnh" như margin kỷ lục, người mới ồ ạt vào thị trường thế nào?',
            options: [
              'Bán khống toàn bộ tài sản ngay lập tức',
              'Như tín hiệu để giảm đòn bẩy và kiểm soát rủi ro, vì chúng không cho biết chính xác thời điểm đỉnh',
              'Bỏ qua hoàn toàn',
              'Vay thêm để mua trước khi giá tăng tiếp',
            ],
            correct_index: 1,
            explanation: 'Các dấu hiệu có thể kéo dài nhiều tháng trước khi đỉnh xuất hiện. Dùng chúng để điều chỉnh mức rủi ro hợp lý hơn là đặt cược vào một thời điểm.',
          },
          {
            prompt: 'Theo thống kê dài hạn của S&P 500, nhận định nào đúng?',
            options: [
              'Thị trường giá xuống trung bình dài hơn thị trường giá lên',
              'Thị trường giá xuống trung bình ngắn hơn thị trường giá lên, và nhiều ngày tăng mạnh nhất rơi vào giai đoạn giá xuống',
              'Thị trường giá xuống chỉ xảy ra mỗi 50 năm',
              'Ngày tăng mạnh nhất luôn xuất hiện khi thị trường bình yên',
            ],
            correct_index: 1,
            explanation: 'Trung bình, giá xuống kéo dài khoảng 9–10 tháng, giá lên khoảng 2,7 năm. Ngày tăng và giảm mạnh thường xen kẽ trong giai đoạn hỗn loạn, nên rời thị trường để "né" rất dễ bỏ lỡ cú hồi.',
          },
        ],
      },
      {
        slug: 'song-sot-va-hanh-dong-trong-bao-thi-truong',
        title: 'Sống sót và hành động trong bão thị trường',
        summary: 'Cỡ vị thế, không margin, tiền mặt dự phòng, DCA, tái cân bằng, nhật ký và một "checklist mùa bão" để không phải bán ở đáy.',
        content_md: `## Mục tiêu số một: không bị loại khỏi cuộc chơi

Các bài trước cho thấy: người thua nặng nhất trong khủng hoảng thường không phải người chọn sai cổ phiếu, mà là người **bị buộc phải bán ở đáy** — vì vay nợ, vì cần tiền gấp, hoặc vì không chịu nổi tâm lý. Toán học của thua lỗ cũng rất khắc nghiệt:

| Mức giảm | Cần tăng bao nhiêu để hoà vốn |
|---|---|
| 20% | 25% |
| 33% | 50% |
| 50% | 100% |
| 80% | 400% |

Vì vậy, chiến lược tốt cho mùa bão bắt đầu **trước khi bão đến**.

## 1. Cỡ vị thế và không dùng margin

Như bài **Cỡ vị thế và quy tắc 1–2%**, hãy quyết định số tiền tối đa bạn chấp nhận mất. Trong khủng hoảng, cổ phiếu riêng lẻ có thể giảm 50–80%; nếu một mã chiếm 40% danh mục, cú đó đủ để làm bạn hoảng loạn. **Không dùng margin** (hoặc dùng rất ít) là cách đơn giản nhất để không bao giờ bị giải chấp.

## 2. Quỹ tiền mặt dự phòng

Giữ **tiền mặt cho sinh hoạt** (nhiều chuyên gia gợi ý vài tháng chi tiêu) ngoài tài khoản chứng khoán. Khủng hoảng tài chính thường đi kèm khó khăn kinh tế — mất việc, giảm thu nhập. Nếu phải bán cổ phiếu để trả tiền nhà đúng lúc thị trường đáy, đó là bán bắt buộc dù không ai gọi margin. Một phần **tiền mặt trong danh mục** cũng cho bạn lựa chọn mua khi giá rẻ.

## 3. DCA hay đầu tư một lần?

- **DCA (mua đều định kỳ):** chia tiền mua theo tháng. Ưu điểm lớn nhất là **tâm lý**: bạn không cần đoán đáy, và giá giảm giúp mua được nhiều cổ phần hơn.
- **Đầu tư một lần:** nghiên cứu của Vanguard trên nhiều thị trường cho thấy đầu tư một lần cho kết quả tốt hơn DCA trong khoảng **hai phần ba** số giai đoạn, vì thị trường tăng nhiều hơn giảm.

Không có lựa chọn "luôn đúng". Nếu số tiền lớn khiến bạn mất ngủ, DCA trong vài tháng là sự đánh đổi hợp lý giữa lợi nhuận kỳ vọng và khả năng giữ kỷ luật.

## 4. Tái cân bằng

Đặt trước một tỷ trọng mục tiêu, ví dụ 60% cổ phiếu – 40% tiền gửi/trái phiếu. Khi cổ phiếu giảm mạnh, tỷ trọng cổ phiếu tụt xuống; **tái cân bằng** nghĩa là chuyển bớt từ phần an toàn sang cổ phiếu để về lại mục tiêu — tự động "mua khi rẻ" mà không cần đoán đáy. Ngược lại, khi hưng phấn, nó buộc bạn chốt bớt.

## 5. Ưu tiên chất lượng

Khủng hoảng là bài kiểm tra **bảng cân đối kế toán**. Doanh nghiệp ít nợ, dòng tiền thật, sản phẩm thiết yếu có cơ hội sống sót và hồi phục cao hơn. Năm 2022 cho thấy những mã tăng nhờ đầu cơ có thể không bao giờ về lại đỉnh.

## 6. Nhật ký trong bão

Viết ra **trước khi hành động**: mình định làm gì, vì sao, đang cảm thấy gì. Đọc lại sau 3–6 tháng sẽ cho bạn dữ liệu thật về phản ứng của chính mình — thứ quý hơn mọi dự báo.

## Các bẫy hành vi

- **Bán tháo theo đám đông** khi tin xấu dồn dập, rồi đứng ngoài cả đợt hồi phục.
- **Bắt dao rơi bằng tiền vay**, hoặc dồn hết tiền vào lần "bắt đáy" đầu tiên.
- **Neo vào giá mua**: "về bờ rồi bán" thay vì đánh giá lại doanh nghiệp.
- **Bình quân giá xuống vô kỷ luật** cho cổ phiếu đang xấu đi.
- **Chán nản trong giai đoạn đi ngang**: giao dịch liên tục cho đỡ buồn, đổi chiến lược mỗi tháng, hoặc bỏ cuộc ngay trước khi xu hướng mới bắt đầu.
- **Xem bảng giá mỗi phút**: càng xem nhiều càng dễ hành động theo cảm xúc.

## Checklist mùa bão

1. Mình có đang dùng margin không? Nếu có, giá giảm thêm bao nhiêu thì bị gọi ký quỹ?
2. Mình có đủ tiền mặt sinh hoạt vài tháng ngoài tài khoản chứng khoán chưa?
3. Mã lớn nhất chiếm bao nhiêu % danh mục? Nếu nó giảm 50%, mình mất bao nhiêu % tổng tài sản?
4. Doanh nghiệp mình nắm giữ còn ổn về nợ và dòng tiền không, hay chỉ có giá giảm?
5. Tỷ trọng cổ phiếu hiện tại lệch mục tiêu bao nhiêu? Có cần tái cân bằng không?
6. Kế hoạch mua thêm (nếu có) được chia thành nhiều đợt, với số tiền định trước chưa?
7. Mình đã ghi nhật ký lý do và cảm xúc trước khi đặt lệnh chưa?
8. Quyết định này mình có đưa ra nếu thị trường đang bình yên không?

## Nguồn tham khảo

- Hartford Funds — Bear Markets (thống kê S&P 500 từ 1928): https://hartfordfunds.com/practice-management/client-conversations/managing-volatility/bear-markets.html
- A Wealth of Common Sense — The Lump Sum vs. Dollar Cost Averaging Decision (tóm tắt nghiên cứu Vanguard): https://awealthofcommonsense.com/2018/05/the-lump-sum-vs-dollar-cost-averaging-decision/
- Federal Reserve History — Stock Market Crash of 1929 (đòn bẩy margin): https://www.federalreservehistory.org/essays/stock-market-crash-of-1929

## Thực hành

Trả lời **checklist mùa bão** cho danh mục hiện tại của bạn trong [Nhật ký](/journal). Sau đó mở **Thị trường › CK Việt Nam**, chọn cú giảm sâu nhất bạn thấy trên biểu đồ VN-Index và mô phỏng: nếu danh mục của bạn giảm đúng bằng mức đó, bạn sẽ làm gì theo từng bước của checklist?`,
        questions: [
          {
            prompt: 'Danh mục giảm 50%. Cần tăng bao nhiêu % để về lại vốn ban đầu?',
            options: ['50%', '75%', '100%', '150%'],
            correct_index: 2,
            explanation: 'Từ 100 còn 50, muốn về 100 phải tăng thêm 50 trên nền 50, tức 100%. Vì vậy hạn chế thua lỗ lớn quan trọng hơn cố gắng kiếm lãi lớn.',
          },
          {
            prompt: 'Vì sao quỹ tiền mặt sinh hoạt bên ngoài tài khoản chứng khoán quan trọng trong khủng hoảng?',
            options: [
              'Vì tiền mặt luôn sinh lời cao hơn cổ phiếu',
              'Vì nó giúp không phải bán cổ phiếu ở đáy khi gặp khó khăn tài chính cá nhân',
              'Vì công ty chứng khoán yêu cầu',
              'Vì tiền mặt được miễn thuế',
            ],
            correct_index: 1,
            explanation: 'Khủng hoảng tài chính thường đi kèm khó khăn kinh tế. Có tiền dự phòng giúp bạn tránh "bán bắt buộc" vì nhu cầu cá nhân đúng lúc giá thấp nhất.',
          },
          {
            prompt: 'Tái cân bằng danh mục trong lúc thị trường giảm mạnh có tác dụng gì?',
            options: [
              'Tự động mua thêm cổ phiếu khi giá rẻ để về lại tỷ trọng mục tiêu, không cần đoán đáy',
              'Bán hết cổ phiếu để giữ tiền mặt',
              'Tăng margin để mua nhiều hơn',
              'Không có tác dụng gì',
            ],
            correct_index: 0,
            explanation: 'Khi cổ phiếu giảm, tỷ trọng của nó tụt dưới mục tiêu. Tái cân bằng chuyển bớt từ phần an toàn sang cổ phiếu — một quy tắc kỷ luật thay cho cảm xúc.',
          },
          {
            prompt: 'Về DCA và đầu tư một lần, nhận định nào hợp lý nhất?',
            options: [
              'DCA luôn cho lợi nhuận cao hơn đầu tư một lần',
              'Đầu tư một lần thường cho kết quả tốt hơn về mặt thống kê, nhưng DCA có thể giúp giữ kỷ luật và giảm hối tiếc',
              'Không bao giờ nên mua khi thị trường giảm',
              'DCA chỉ dùng được với tiền vay',
            ],
            correct_index: 1,
            explanation: 'Nghiên cứu của Vanguard cho thấy đầu tư một lần thắng khoảng hai phần ba số giai đoạn, nhưng một kế hoạch bạn thực sự giữ được trong bão quan trọng hơn kế hoạch tối ưu trên giấy.',
          },
        ],
      },
    ],
  },
]
