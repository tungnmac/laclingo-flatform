import type { SeedTerm } from './types'

// 40 thuật ngữ — cùng thứ tự với glossary-en.ts
export const GLOSSARY_VI: SeedTerm[] = [
  // Thị trường cơ bản
  {
    term: 'Cặp giao dịch',
    definition_md: 'Mã gồm hai tài sản: tài sản cơ sở / tài sản định giá. Ví dụ **BTC/USDT** cho biết cần bao nhiêu USDT để mua 1 BTC.',
    lesson_slug: 'thi-truong-crypto-va-cap-giao-dich',
  },
  {
    term: 'Thanh khoản',
    definition_md: 'Mức độ dễ dàng mua hoặc bán một tài sản mà giá không bị xô lệch nhiều. Khối lượng giao dịch lớn thường đi kèm thanh khoản tốt.',
    lesson_slug: 'thi-truong-crypto-va-cap-giao-dich',
  },
  {
    term: 'Chênh lệch giá mua – bán (Spread)',
    definition_md: 'Khoảng cách giữa giá chào mua cao nhất và giá chào bán thấp nhất. Spread càng hẹp, chi phí ẩn khi khớp lệnh market càng thấp.',
    lesson_slug: 'lenh-market-va-limit',
  },
  {
    term: 'Lệnh thị trường (Market)',
    definition_md: 'Lệnh mua hoặc bán ngay lập tức theo giá tốt nhất đang có. Khớp nhanh nhưng bạn không kiểm soát chính xác giá khớp.',
    lesson_slug: 'lenh-market-va-limit',
  },
  {
    term: 'Lệnh giới hạn (Limit)',
    definition_md: 'Lệnh chỉ khớp ở mức giá bạn đặt hoặc tốt hơn. Bạn kiểm soát được giá nhưng lệnh có thể không bao giờ khớp.',
    lesson_slug: 'lenh-market-va-limit',
  },
  {
    term: 'Phí giao dịch',
    definition_md: 'Khoản sàn thu trên mỗi lệnh khớp, thường tính theo % giá trị lệnh. Ví dụ phí 0,1% trên lệnh 1.000 USDT là 1 USDT.',
    lesson_slug: 'phi-va-cach-tinh-lai-lo',
  },
  {
    term: 'Vị thế mua (Long)',
    definition_md: 'Mua tài sản với kỳ vọng giá tăng. Lãi khi giá bán ra cao hơn giá mua (sau khi trừ phí).',
    lesson_slug: 'long-va-short',
  },
  {
    term: 'Vị thế bán (Short)',
    definition_md: 'Bán trước tài sản đi vay với kỳ vọng giá giảm, rồi mua lại để trả. Lãi khi giá mua lại thấp hơn giá bán.',
    lesson_slug: 'long-va-short',
  },
  {
    term: 'Ký quỹ (Margin)',
    definition_md: 'Số tiền bạn đặt làm tài sản bảo đảm để mở một vị thế, nhất là vị thế Short hoặc có đòn bẩy. Ký quỹ càng thấp so với vị thế, rủi ro càng cao.',
    lesson_slug: 'long-va-short',
  },
  // Phân tích kỹ thuật
  {
    term: 'Nến Nhật',
    definition_md: 'Cách hiển thị giá mở cửa, cao nhất, thấp nhất và đóng cửa trong một khung thời gian. Thân nến xanh: đóng cửa cao hơn mở cửa; thân đỏ: ngược lại.',
    lesson_slug: 'doc-nen-nhat',
  },
  {
    term: 'Hỗ trợ',
    definition_md: 'Vùng giá mà lực mua thường đủ mạnh để chặn đà giảm. Giá nhiều lần bật lên từ một vùng thì vùng đó càng đáng chú ý.',
    lesson_slug: 'ho-tro-va-khang-cu',
  },
  {
    term: 'Kháng cự',
    definition_md: 'Vùng giá mà lực bán thường đủ mạnh để chặn đà tăng. Khi bị phá vỡ rõ ràng, kháng cự cũ có thể trở thành hỗ trợ mới.',
    lesson_slug: 'ho-tro-va-khang-cu',
  },
  {
    term: 'Xu hướng',
    definition_md: 'Hướng di chuyển chính của giá theo thời gian: tăng (đỉnh và đáy sau cao hơn), giảm (đỉnh và đáy sau thấp hơn) hoặc đi ngang.',
    lesson_slug: 'xu-huong-va-duong-ma',
  },
  {
    term: 'Đường trung bình động (MA)',
    definition_md: 'Đường nối giá trung bình của N phiên gần nhất, giúp làm mượt biến động và nhận diện xu hướng. Ví dụ MA20 = trung bình giá đóng cửa 20 phiên.',
    lesson_slug: 'xu-huong-va-duong-ma',
  },
  // Quản trị rủi ro
  {
    term: 'Lệnh cắt lỗ (Stop-loss)',
    definition_md: 'Mức giá đặt trước để tự động thoát lệnh khi thị trường đi ngược kỳ vọng, giúp giới hạn khoản lỗ tối đa.',
    lesson_slug: 'stop-loss-va-take-profit',
  },
  {
    term: 'Lệnh chốt lời (Take-profit)',
    definition_md: 'Mức giá đặt trước để tự động thoát lệnh khi đạt mục tiêu lợi nhuận, tránh việc chần chừ để rồi mất phần lãi.',
    lesson_slug: 'stop-loss-va-take-profit',
  },
  {
    term: 'Tỷ lệ lợi nhuận/rủi ro (R:R)',
    definition_md: 'So sánh khoản lãi kỳ vọng với khoản lỗ chấp nhận. R:R = (chốt lời − giá vào) / (giá vào − cắt lỗ). Ví dụ 1:2 nghĩa là chấp nhận lỗ 1 để có cơ hội lãi 2.',
    lesson_slug: 'stop-loss-va-take-profit',
  },
  {
    term: 'Cỡ vị thế',
    definition_md: 'Lượng tài sản mua hoặc bán trong một lệnh, nên tính từ số tiền bạn chấp nhận mất. Cỡ vị thế = số tiền rủi ro / khoảng cách đến điểm cắt lỗ.',
    lesson_slug: 'co-vi-the-va-quy-tac-1-2',
  },
  {
    term: 'Mức sụt giảm tài khoản (Drawdown)',
    definition_md: 'Mức giảm của tài khoản tính từ đỉnh cao nhất xuống đáy thấp nhất sau đó, thường đo bằng %. Drawdown càng sâu càng khó gỡ lại.',
    lesson_slug: 'co-vi-the-va-quy-tac-1-2',
  },
  {
    term: 'Hội chứng sợ bỏ lỡ (FOMO)',
    definition_md: 'Cảm giác sợ bị bỏ lại khiến bạn vội mua đuổi khi giá đã tăng mạnh, thường không theo kế hoạch và dễ mua ở vùng giá cao.',
    lesson_slug: 'nhat-ky-giao-dich-va-fomo',
  },
  {
    term: 'Nhật ký giao dịch',
    definition_md: 'Ghi chép lý do vào lệnh, điểm vào/ra, kết quả và cảm xúc của từng giao dịch. Xem lại định kỳ giúp phát hiện lỗi lặp lại.',
    lesson_slug: 'nhat-ky-giao-dich-va-fomo',
  },
  // Phân tích cơ bản
  {
    term: 'Báo cáo tài chính (BCTC)',
    definition_md: 'Bộ tài liệu doanh nghiệp công bố định kỳ, gồm báo cáo kết quả kinh doanh, bảng cân đối kế toán và báo cáo lưu chuyển tiền tệ.',
    lesson_slug: 'tong-quan-bao-cao-tai-chinh',
  },
  {
    term: 'Doanh thu',
    definition_md: 'Tổng số tiền doanh nghiệp thu được từ bán hàng và cung cấp dịch vụ trong kỳ, trước khi trừ chi phí. Thường là dòng đầu tiên của báo cáo kết quả kinh doanh.',
    lesson_slug: 'bao-cao-ket-qua-kinh-doanh',
  },
  {
    term: 'Lợi nhuận sau thuế (LNST)',
    definition_md: 'Phần lợi nhuận còn lại sau khi trừ mọi chi phí, lãi vay và thuế. Đây là phần thuộc về cổ đông, còn gọi là lợi nhuận ròng.',
    lesson_slug: 'bao-cao-ket-qua-kinh-doanh',
  },
  {
    term: 'Lợi nhuận trên mỗi cổ phiếu (EPS)',
    definition_md: 'Phần lợi nhuận sau thuế ứng với một cổ phiếu. EPS = LNST thuộc cổ đông phổ thông / số cổ phiếu đang lưu hành.',
    lesson_slug: 'eps-pe-pb',
  },
  {
    term: 'Hệ số giá trên lợi nhuận (P/E)',
    definition_md: 'Cho biết nhà đầu tư đang trả bao nhiêu đồng cho 1 đồng lợi nhuận. P/E = giá cổ phiếu / EPS. Nên so với doanh nghiệp cùng ngành.',
    lesson_slug: 'eps-pe-pb',
  },
  {
    term: 'Hệ số giá trên giá trị sổ sách (P/B)',
    definition_md: 'So sánh giá thị trường với giá trị sổ sách của vốn chủ sở hữu. P/B = giá cổ phiếu / giá trị sổ sách mỗi cổ phiếu.',
    lesson_slug: 'eps-pe-pb',
  },
  {
    term: 'Vốn hoá thị trường',
    definition_md: 'Tổng giá trị thị trường của doanh nghiệp. Vốn hoá = giá cổ phiếu × số cổ phiếu đang lưu hành.',
    lesson_slug: 'eps-pe-pb',
  },
  {
    term: 'Tỷ suất lợi nhuận trên vốn chủ sở hữu (ROE)',
    definition_md: 'Đo mức sinh lời trên mỗi đồng vốn của cổ đông. ROE = LNST / vốn chủ sở hữu bình quân.',
    lesson_slug: 'roe-roa-bien-loi-nhuan',
  },
  {
    term: 'Tỷ suất lợi nhuận trên tổng tài sản (ROA)',
    definition_md: 'Đo hiệu quả doanh nghiệp dùng toàn bộ tài sản để tạo ra lợi nhuận. ROA = LNST / tổng tài sản bình quân.',
    lesson_slug: 'roe-roa-bien-loi-nhuan',
  },
  {
    term: 'Hệ số nợ trên vốn chủ sở hữu (D/E)',
    definition_md: 'Cho biết doanh nghiệp dùng bao nhiêu nợ so với vốn chủ. D/E = tổng nợ / vốn chủ sở hữu. Càng cao, rủi ro tài chính càng lớn.',
    lesson_slug: 'suc-khoe-tai-chinh',
  },
  {
    term: 'Dòng tiền tự do (FCF)',
    definition_md: 'Tiền mặt còn lại sau khi doanh nghiệp chi cho hoạt động và đầu tư tài sản cố định. FCF = dòng tiền từ hoạt động kinh doanh − chi đầu tư tài sản cố định (capex).',
    lesson_slug: 'bao-cao-luu-chuyen-tien-te',
  },
  // Nâng cao
  {
    term: 'Chiết khấu dòng tiền (DCF)',
    definition_md: 'Phương pháp định giá bằng cách quy các dòng tiền dự kiến trong tương lai về giá trị hiện tại theo một tỷ lệ chiết khấu. Kết quả rất nhạy với các giả định.',
    lesson_slug: 'dcf-dong-tien-chiet-khau',
  },
  {
    term: 'Hệ số EV/EBITDA',
    definition_md: 'So sánh giá trị doanh nghiệp (EV = vốn hoá + nợ − tiền mặt) với lợi nhuận trước lãi vay, thuế và khấu hao. Hữu ích khi so sánh doanh nghiệp có cấu trúc nợ khác nhau.',
    lesson_slug: 'ev-ev-ebitda-va-dinh-gia-so-sanh',
  },
  {
    term: 'Biên an toàn',
    definition_md: 'Khoảng chênh giữa giá trị ước tính và giá mua. Mua thấp hơn nhiều so với giá trị ước tính giúp bạn có "đệm" khi phân tích sai.',
    lesson_slug: 'bien-an-toan-va-gia-tri-noi-tai',
  },
  {
    term: 'Đa dạng hoá',
    definition_md: 'Phân bổ vốn vào nhiều tài sản, ngành hoặc loại tài sản khác nhau để một khoản thua lỗ không ảnh hưởng quá lớn đến toàn danh mục.',
    lesson_slug: 'da-dang-hoa-va-tuong-quan',
  },
  {
    term: 'Tái cân bằng danh mục',
    definition_md: 'Định kỳ mua bán để đưa tỷ trọng các tài sản trở về mức đã đặt ra ban đầu, ví dụ giữ 60% cổ phiếu và 40% trái phiếu.',
    lesson_slug: 'phan-bo-tai-san-va-tai-can-bang',
  },
  {
    term: 'Trung bình giá định kỳ (DCA)',
    definition_md: 'Đầu tư một số tiền cố định theo lịch đều đặn bất kể giá. Cách này giảm áp lực chọn thời điểm và làm mượt giá vốn bình quân.',
    lesson_slug: 'dca-va-dau-tu-mot-lan',
  },
  {
    term: 'Tốc độ tăng trưởng kép hằng năm (CAGR)',
    definition_md: 'Tốc độ tăng trưởng bình quân mỗi năm nếu tăng đều. CAGR = (giá trị cuối / giá trị đầu)^(1/số năm) − 1.',
    lesson_slug: 'do-hieu-qua-danh-muc',
  },
  {
    term: 'Chỉ số Sharpe',
    definition_md: 'Đo lợi nhuận vượt trội trên mỗi đơn vị rủi ro. Sharpe = (lợi nhuận danh mục − lãi suất phi rủi ro) / độ lệch chuẩn của lợi nhuận. Càng cao càng tốt.',
    lesson_slug: 'do-hieu-qua-danh-muc',
  },
  // ── Forex (thị trường ngoại hối) ──
  {
    term: 'Thị trường ngoại hối (Forex)',
    definition_md: 'Thị trường mua bán các đồng tiền với nhau, giao dịch gần như 24 giờ trong ngày làm việc và có thanh khoản lớn nhất thế giới. Lưu ý: giao dịch forex ký quỹ qua sàn nước ngoài có thể chưa được pháp luật nơi bạn sống cho phép — hãy kiểm tra quy định hiện hành trước khi tham gia.',
    lesson_slug: null,
  },
  {
    term: 'Cặp tiền tệ',
    definition_md: 'Forex luôn yết giá theo cặp, ví dụ EUR/USD = 1,0850 nghĩa là 1 euro đổi được 1,0850 đô la Mỹ. Mua cặp là mua đồng đứng trước và bán đồng đứng sau.',
    lesson_slug: 'thi-truong-crypto-va-cap-giao-dich',
  },
  {
    term: 'Đồng tiền cơ sở và đồng tiền định giá',
    definition_md: 'Trong cặp EUR/USD, EUR là đồng tiền cơ sở (thứ bạn mua/bán), USD là đồng tiền định giá (đơn vị tính giá và tính lãi lỗ).',
    lesson_slug: null,
  },
  {
    term: 'Cặp tiền chính (Majors)',
    definition_md: 'Các cặp có USD ghép với đồng tiền lớn khác như EUR/USD, USD/JPY, GBP/USD, USD/CHF, AUD/USD, USD/CAD, NZD/USD. Thanh khoản cao nhất nên spread thường hẹp nhất.',
    lesson_slug: null,
  },
  {
    term: 'Cặp tiền phụ và cặp ngoại lai (Minors/Exotics)',
    definition_md: 'Cặp phụ là cặp giữa các đồng tiền lớn không có USD (vd EUR/GBP). Cặp ngoại lai ghép một đồng tiền lớn với đồng tiền của nền kinh tế nhỏ hơn (vd USD/TRY) — spread rộng và biến động mạnh hơn.',
    lesson_slug: null,
  },
  {
    term: 'Tỷ giá chéo (Cross rate)',
    definition_md: 'Tỷ giá giữa hai đồng tiền được suy ra qua một đồng tiền thứ ba (thường là USD). Ví dụ EUR/JPY ≈ EUR/USD × USD/JPY.',
    lesson_slug: null,
  },
  {
    term: 'Pip',
    definition_md: 'Đơn vị biến động giá nhỏ nhất theo quy ước: chữ số thập phân thứ 4 với hầu hết các cặp (0,0001), thứ 2 với cặp có JPY (0,01). EUR/USD từ 1,0850 lên 1,0870 là tăng 20 pip.',
    lesson_slug: null,
  },
  {
    term: 'Pipette',
    definition_md: 'Một phần mười pip — chữ số thập phân thứ 5 (hoặc thứ 3 với cặp JPY) mà nhiều nền tảng hiển thị để báo giá chi tiết hơn.',
    lesson_slug: null,
  },
  {
    term: 'Giá trị pip (Pip value)',
    definition_md: 'Số tiền lãi/lỗ khi giá đi 1 pip, phụ thuộc khối lượng. Với EUR/USD, 1 lot chuẩn (100.000 EUR) × 0,0001 = 10 USD mỗi pip; 20 pip = 200 USD.',
    lesson_slug: 'phi-va-cach-tinh-lai-lo',
  },
  {
    term: 'Lot',
    definition_md: 'Đơn vị khối lượng giao dịch forex: lot chuẩn = 100.000 đơn vị đồng tiền cơ sở, mini lot = 10.000, micro lot = 1.000. Khối lượng quyết định giá trị mỗi pip, tức quyết định mức lãi lỗ.',
    lesson_slug: 'co-vi-the-va-quy-tac-1-2',
  },
  {
    term: 'Đòn bẩy (Leverage)',
    definition_md: 'Cho phép mở vị thế lớn hơn nhiều lần số tiền ký quỹ, vd 1:100 nghĩa là 1.000 USD kiểm soát vị thế 100.000 USD. Đòn bẩy khuếch đại cả lãi lẫn LỖ: giá đi ngược 1% có thể làm mất toàn bộ tiền ký quỹ.',
    lesson_slug: 'long-va-short',
  },
  {
    term: 'Ký quỹ yêu cầu (Required margin)',
    definition_md: 'Số tiền phải đặt cọc để mở vị thế = giá trị vị thế ÷ đòn bẩy. Ví dụ 1 lot EUR/USD ở giá 1,0850 trị giá 108.500 USD; với đòn bẩy 1:100 cần ký quỹ khoảng 1.085 USD.',
    lesson_slug: null,
  },
  {
    term: 'Mức ký quỹ (Margin level)',
    definition_md: 'Tỷ lệ = vốn hiện có (equity) ÷ ký quỹ đang dùng × 100%. Khi lỗ tăng, equity giảm và mức ký quỹ giảm theo; xuống dưới ngưỡng của sàn sẽ bị gọi ký quỹ hoặc đóng lệnh.',
    lesson_slug: null,
  },
  {
    term: 'Lệnh gọi ký quỹ (Margin call)',
    definition_md: 'Cảnh báo khi mức ký quỹ xuống dưới ngưỡng quy định (thường quanh 100%, tuỳ sàn): bạn phải nạp thêm tiền hoặc giảm vị thế, nếu không sẽ bị đóng lệnh bắt buộc.',
    lesson_slug: null,
  },
  {
    term: 'Dừng lỗ bắt buộc (Stop out)',
    definition_md: 'Ngưỡng mức ký quỹ (vd 50%, tuỳ sàn) mà tại đó hệ thống tự đóng các vị thế đang lỗ để tài khoản không âm thêm. Đây là lý do giao dịch đòn bẩy cao dễ "cháy tài khoản".',
    lesson_slug: null,
  },
  {
    term: 'Phí qua đêm (Swap/Rollover)',
    definition_md: 'Khoản tiền cộng hoặc trừ khi giữ vị thế qua ngày, dựa trên chênh lệch lãi suất giữa hai đồng tiền trong cặp cộng phí của sàn. Giữ lệnh lâu, swap có thể ăn mòn đáng kể lợi nhuận.',
    lesson_slug: null,
  },
  {
    term: 'Giao dịch chênh lệch lãi suất (Carry trade)',
    definition_md: 'Vay (bán) đồng tiền lãi suất thấp để mua đồng tiền lãi suất cao, hưởng phần chênh lệch lãi qua swap. Rủi ro: tỷ giá biến động ngược có thể xoá sạch phần lãi suất kiếm được.',
    lesson_slug: null,
  },
  {
    term: 'Trượt giá (Slippage)',
    definition_md: 'Chênh lệch giữa giá bạn đặt và giá lệnh thực sự khớp, hay xảy ra khi thị trường biến động mạnh (công bố tin tức) hoặc thanh khoản mỏng. Lệnh cắt lỗ cũng có thể bị trượt.',
    lesson_slug: 'lenh-market-va-limit',
  },
  {
    term: 'Phiên giao dịch forex',
    definition_md: 'Thị trường chạy theo các phiên Á (Tokyo, Sydney), Âu (London) và Mỹ (New York). Khoảng giao nhau giữa phiên Âu và Mỹ thường có khối lượng và biến động lớn nhất.',
    lesson_slug: null,
  },
  {
    term: 'Lịch kinh tế',
    definition_md: 'Lịch công bố số liệu và sự kiện vĩ mô (quyết định lãi suất của ngân hàng trung ương, CPI, việc làm phi nông nghiệp của Mỹ…). Giá tiền tệ thường biến động mạnh quanh các thời điểm này.',
    lesson_slug: null,
  },
]
