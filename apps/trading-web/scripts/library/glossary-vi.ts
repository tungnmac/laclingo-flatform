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
]
