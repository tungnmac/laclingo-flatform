import type { SeedResource } from './types'

/** Nguồn học — URL đã kiểm tra tồn tại ngày 2026-10-21; mô tả tự viết. */
export const RESOURCES: SeedResource[] = [
  // ── Khóa học ──────────────────────────────────────────────
  {
    title: 'Financial Markets (Yale University)',
    provider: 'Coursera',
    url: 'https://www.coursera.org/learn/financial-markets-global',
    type: 'course',
    language: 'en',
    is_free: true,
    level: 'basic',
    topic: 'investing',
    description_vi:
      'Khóa học của giáo sư Robert Shiller (Nobel Kinh tế) giới thiệu cách thị trường tài chính vận hành: rủi ro, cổ phiếu, trái phiếu, ngân hàng, bảo hiểm và tâm lý hành vi. Có thể học miễn phí ở chế độ dự thính.',
    description_en:
      'Nobel laureate Robert Shiller explains how financial markets work: risk, stocks, bonds, banking, insurance and behavioral finance. Free to audit.',
  },
  {
    title: 'Finance and Capital Markets',
    provider: 'Khan Academy',
    url: 'https://www.khanacademy.org/economics-finance-domain/core-finance',
    type: 'course',
    language: 'en',
    is_free: true,
    level: 'basic',
    topic: 'economics',
    description_vi:
      'Chuỗi bài giảng video ngắn, miễn phí về lãi suất, lãi kép, cổ phiếu, trái phiếu, quỹ, phái sinh và cách ngân hàng tạo tiền. Phù hợp người mới cần nền tảng vững.',
    description_en:
      'Free short video lessons on interest, compounding, stocks, bonds, funds, derivatives and how banks create money. A solid foundation for beginners.',
  },
  {
    title: 'Finance Theory I (MIT 15.401)',
    provider: 'MIT OpenCourseWare',
    url: 'https://ocw.mit.edu/courses/15-401-finance-theory-i-fall-2008/',
    type: 'course',
    language: 'en',
    is_free: true,
    level: 'intermediate',
    topic: 'fundamental',
    description_vi:
      'Khóa tài chính bậc sau đại học của giáo sư Andrew Lo tại MIT Sloan, có video và bài tập: giá trị hiện tại, định giá cổ phiếu và trái phiếu, CAPM, hiệu quả thị trường và ngân sách vốn.',
    description_en:
      'Andrew Lo’s graduate finance course at MIT Sloan with videos and problem sets: present value, stock and bond valuation, CAPM, market efficiency and capital budgeting.',
  },
  {
    title: 'Khóa học online chứng khoán Vietstock',
    provider: 'Vietstock',
    url: 'https://dichvu.vietstock.vn/dao-tao/',
    type: 'course',
    language: 'vi',
    is_free: false,
    level: 'intermediate',
    topic: 'fundamental',
    description_vi:
      'Các khóa học trực tuyến có phí về chứng khoán cơ bản, đọc báo cáo tài chính, phân tích và định giá cổ phiếu, phân tích kỹ thuật ứng dụng và phân tích ngành, dành cho nhà đầu tư Việt Nam.',
    description_en:
      'Paid online courses in Vietnamese covering stock market basics, reading financial statements, stock valuation, applied technical analysis and industry analysis.',
  },
  // ── Chương trình chứng chỉ ────────────────────────────────
  {
    title: 'CFA Program',
    provider: 'CFA Institute',
    url: 'https://www.cfainstitute.org/programs/cfa-program',
    type: 'program',
    language: 'en',
    is_free: false,
    level: 'advanced',
    topic: 'fundamental',
    description_vi:
      'Chứng chỉ Chuyên gia phân tích tài chính (CFA) gồm ba cấp độ, bao quát đạo đức nghề nghiệp, kế toán, định giá, quản lý danh mục. Được công nhận rộng rãi trong ngành quản lý đầu tư toàn cầu.',
    description_en:
      'The three-level Chartered Financial Analyst credential covering ethics, accounting, valuation and portfolio management, widely recognized across the global investment industry.',
  },
  {
    title: 'Chartered Market Technician (CMT) Program',
    provider: 'CMT Association',
    url: 'https://cmtassociation.org/cmt-program/',
    type: 'program',
    language: 'en',
    is_free: false,
    level: 'advanced',
    topic: 'trading',
    description_vi:
      'Chứng chỉ chuyên sâu về phân tích kỹ thuật gồm ba cấp độ: mô hình biểu đồ, chỉ báo, lý thuyết thị trường, kiểm định hệ thống giao dịch và quản trị rủi ro.',
    description_en:
      'A three-level professional credential in technical analysis: chart patterns, indicators, market theory, trading system testing and risk management.',
  },
  {
    title: 'Financial Risk Manager (FRM)',
    provider: 'GARP',
    url: 'https://www.garp.org/frm',
    type: 'program',
    language: 'en',
    is_free: false,
    level: 'advanced',
    topic: 'investing',
    description_vi:
      'Chứng chỉ quản trị rủi ro tài chính gồm hai phần thi: định lượng rủi ro, rủi ro thị trường, tín dụng, thanh khoản và vận hành. Hữu ích cho ai muốn hiểu sâu cách đo lường và kiểm soát rủi ro.',
    description_en:
      'A two-part risk management credential covering quantitative analysis and market, credit, liquidity and operational risk. Useful for anyone who wants to measure and control risk properly.',
  },
  // ── YouTube ────────────────────────────────────────────────
  {
    title: 'The Plain Bagel',
    provider: 'YouTube',
    url: 'https://www.youtube.com/@ThePlainBagel',
    type: 'youtube',
    language: 'en',
    is_free: true,
    level: 'basic',
    topic: 'investing',
    description_vi:
      'Kênh do một chuyên gia CFA người Canada thực hiện, giải thích các khái niệm đầu tư và tin tức tài chính một cách khách quan, dễ hiểu, đồng thời cảnh báo các chiêu lừa đảo phổ biến.',
    description_en:
      'Run by a Canadian CFA charterholder, this channel explains investing concepts and financial news in a clear, balanced way and warns about common scams.',
  },
  {
    title: 'Ben Felix – Common Sense Investing',
    provider: 'YouTube',
    url: 'https://www.youtube.com/@BenFelixCSI',
    type: 'youtube',
    language: 'en',
    is_free: true,
    level: 'intermediate',
    topic: 'personal_finance',
    description_vi:
      'Các video dựa trên nghiên cứu học thuật về đầu tư thụ động, phân bổ tài sản, các yếu tố lợi nhuận và những quyết định tài chính cá nhân như thuê hay mua nhà.',
    description_en:
      'Evidence-based videos on passive investing, asset allocation, factor investing and personal finance decisions such as renting versus buying a home.',
  },
  {
    title: 'Aswath Damodaran',
    provider: 'YouTube',
    url: 'https://www.youtube.com/@AswathDamodaranonValuation',
    type: 'youtube',
    language: 'en',
    is_free: true,
    level: 'advanced',
    topic: 'fundamental',
    description_vi:
      'Kênh của giáo sư NYU Stern được gọi là “thầy định giá”, đăng toàn bộ bài giảng về định giá doanh nghiệp, tài chính doanh nghiệp và các phân tích định giá công ty thực tế.',
    description_en:
      'The NYU Stern professor known as the “dean of valuation” posts full lectures on valuation and corporate finance plus real-world company valuations.',
  },
  {
    title: 'Patrick Boyle',
    provider: 'YouTube',
    url: 'https://www.youtube.com/@PBoyle',
    type: 'youtube',
    language: 'en',
    is_free: true,
    level: 'intermediate',
    topic: 'economics',
    description_vi:
      'Cựu quản lý quỹ phòng hộ và giảng viên tài chính phân tích các sự kiện thị trường, bong bóng, gian lận và kinh tế vĩ mô với giọng điệu hài hước, sắc sảo.',
    description_en:
      'A former hedge fund manager and finance lecturer breaks down market events, bubbles, frauds and macroeconomics with dry, sharp humor.',
  },
  {
    title: 'Tài chính & Kinh doanh',
    provider: 'YouTube',
    url: 'https://www.youtube.com/@taichinhkinhdoanhtv',
    type: 'youtube',
    language: 'vi',
    is_free: true,
    level: 'basic',
    topic: 'economics',
    description_vi:
      'Kênh tiếng Việt với các video giải thích tin tức kinh tế, câu chuyện doanh nghiệp và kiến thức tài chính phổ thông, giúp người mới làm quen với thế giới kinh doanh và đầu tư.',
    description_en:
      'A Vietnamese channel explaining economic news, company stories and general finance knowledge, helping newcomers get familiar with business and investing.',
  },
  // ── Website ────────────────────────────────────────────────
  {
    title: 'Investopedia',
    provider: 'Investopedia',
    url: 'https://www.investopedia.com/',
    type: 'website',
    language: 'en',
    is_free: true,
    level: 'basic',
    topic: 'investing',
    description_vi:
      'Từ điển và thư viện bài viết tài chính lớn nhất trên mạng: giải thích thuật ngữ, hướng dẫn đầu tư, tài chính cá nhân và có công cụ mô phỏng giao dịch bằng tiền ảo.',
    description_en:
      'One of the largest online finance dictionaries and article libraries: term definitions, investing guides, personal finance and a paper-trading simulator.',
  },
  {
    title: 'Damodaran Online',
    provider: 'NYU Stern – Aswath Damodaran',
    url: 'https://pages.stern.nyu.edu/~adamodar/',
    type: 'website',
    language: 'en',
    is_free: true,
    level: 'advanced',
    topic: 'fundamental',
    description_vi:
      'Trang cá nhân của giáo sư Damodaran với dữ liệu ngành cập nhật hằng năm (chi phí vốn, bội số định giá, phần bù rủi ro quốc gia), bảng tính định giá và tài liệu bài giảng miễn phí.',
    description_en:
      'Professor Damodaran’s site with annually updated industry data (cost of capital, multiples, country risk premiums), valuation spreadsheets and free course materials.',
  },
  {
    title: 'Investor.gov',
    provider: 'U.S. Securities and Exchange Commission',
    url: 'https://www.investor.gov/',
    type: 'website',
    language: 'en',
    is_free: true,
    level: 'basic',
    topic: 'personal_finance',
    description_vi:
      'Cổng giáo dục nhà đầu tư của Ủy ban Chứng khoán Mỹ: kiến thức cơ bản, công cụ tính lãi kép, cách kiểm tra lý lịch nhà môi giới và cảnh báo lừa đảo đầu tư.',
    description_en:
      'The SEC’s investor education portal: the basics, a compound interest calculator, how to check a broker’s background and alerts about investment fraud.',
  },
  {
    title: 'Trung tâm kiến thức SSI',
    provider: 'Chứng khoán SSI',
    url: 'https://www.ssi.com.vn/khach-hang-ca-nhan/trung-tam-kien-thuc',
    type: 'website',
    language: 'vi',
    is_free: true,
    level: 'basic',
    topic: 'investing',
    description_vi:
      'Chuyên mục kiến thức của Công ty Chứng khoán SSI dành cho nhà đầu tư cá nhân: tư duy đầu tư, quy định giao dịch, phân tích cơ bản và phân tích kỹ thuật.',
    description_en:
      'SSI Securities’ knowledge hub for retail investors in Vietnamese: investing mindset, trading rules, fundamental and technical analysis.',
  },
  {
    title: 'Học đầu tư chứng khoán DNSE',
    provider: 'Chứng khoán DNSE',
    url: 'https://www.dnse.com.vn/hoc',
    type: 'website',
    language: 'vi',
    is_free: true,
    level: 'basic',
    topic: 'investing',
    description_vi:
      'Thư viện bài học được chia theo ba lộ trình từ người mới đến chuyên nghiệp, giúp nhà đầu tư Việt Nam xây dựng nền tảng kiến thức chứng khoán từng bước.',
    description_en:
      'A Vietnamese lesson library organized into three tracks from beginner to professional, helping investors build stock market knowledge step by step.',
  },
  {
    title: 'Kiến thức đầu tư chứng khoán DSC',
    provider: 'Chứng khoán DSC',
    url: 'https://www.dsc.com.vn/kien-thuc',
    type: 'website',
    language: 'vi',
    is_free: true,
    level: 'basic',
    topic: 'trading',
    description_vi:
      'Chuyên mục bài viết từ cơ bản đến nâng cao về giao dịch chứng khoán và phái sinh, phân tích cơ bản, phân tích kỹ thuật, quản trị rủi ro và thuế khi bán cổ phiếu.',
    description_en:
      'Vietnamese articles from basic to advanced on stock and derivatives trading, fundamental and technical analysis, risk management and taxes on share sales.',
  },
  {
    title: 'VietstockPedia',
    provider: 'Vietstock',
    url: 'https://pedia.vietstock.vn',
    type: 'website',
    language: 'vi',
    is_free: true,
    level: 'basic',
    topic: 'fundamental',
    description_vi:
      'Từ điển thuật ngữ kinh tế, tài chính và chứng khoán tiếng Việt, tra cứu theo chữ cái hoặc chủ đề như vĩ mô, ngân hàng, tài chính doanh nghiệp, phân tích cơ bản và kỹ thuật.',
    description_en:
      'A Vietnamese glossary of economic, financial and stock market terms, searchable by letter or by topic such as macro, banking, corporate finance and analysis.',
  },
  {
    title: 'CafeF',
    provider: 'VCCorp',
    url: 'https://cafef.vn/',
    type: 'website',
    language: 'vi',
    is_free: true,
    level: 'intermediate',
    topic: 'economics',
    description_vi:
      'Trang tin kinh tế, tài chính lớn tại Việt Nam với tin chứng khoán, vĩ mô, ngân hàng, bất động sản cùng bảng giá và dữ liệu doanh nghiệp. Phù hợp để theo dõi thị trường hằng ngày.',
    description_en:
      'A major Vietnamese business and finance news site covering stocks, macro, banking and real estate, with price boards and company data for daily market tracking.',
  },
  // ── Podcast ────────────────────────────────────────────────
  {
    title: 'We Study Billionaires',
    provider: 'The Investor’s Podcast Network',
    url: 'https://www.theinvestorspodcast.com/we-study-billionaires/',
    type: 'podcast',
    language: 'en',
    is_free: true,
    level: 'intermediate',
    topic: 'investing',
    description_vi:
      'Podcast phân tích chiến lược của các nhà đầu tư lớn như Buffett, Munger, Howard Marks, kèm phỏng vấn quản lý quỹ và tóm tắt sách đầu tư, thiên về đầu tư giá trị.',
    description_en:
      'A podcast studying the strategies of great investors like Buffett, Munger and Howard Marks, with fund manager interviews and investing book breakdowns, leaning toward value investing.',
  },
  {
    title: 'Invest Like the Best',
    provider: 'Colossus',
    url: 'https://colossus.com/series/invest-like-the-best/',
    type: 'podcast',
    language: 'en',
    is_free: true,
    level: 'advanced',
    topic: 'investing',
    description_vi:
      'Patrick O’Shaughnessy trò chuyện sâu với các nhà đầu tư, nhà sáng lập và quản lý quỹ hàng đầu về cách họ ra quyết định, xây dựng doanh nghiệp và tư duy dài hạn.',
    description_en:
      'Patrick O’Shaughnessy holds in-depth conversations with top investors, founders and fund managers about decision-making, building businesses and long-term thinking.',
  },
  {
    title: 'Odd Lots',
    provider: 'Bloomberg',
    url: 'https://www.bloomberg.com/oddlots',
    type: 'podcast',
    language: 'en',
    is_free: true,
    level: 'intermediate',
    topic: 'economics',
    description_vi:
      'Joe Weisenthal và Tracy Alloway mời chuyên gia giải thích những chủ đề thú vị nhất về thị trường, tài chính và kinh tế, từ chuỗi cung ứng đến chính sách tiền tệ.',
    description_en:
      'Joe Weisenthal and Tracy Alloway bring in experts to unpack the most interesting topics in markets, finance and economics, from supply chains to monetary policy.',
  },
  {
    title: 'Animal Spirits',
    provider: 'The Compound',
    url: 'https://podcasts.apple.com/podcast/id1310192007',
    type: 'podcast',
    language: 'en',
    is_free: true,
    level: 'basic',
    topic: 'investing',
    description_vi:
      'Michael Batnick và Ben Carlson trò chuyện thoải mái hằng tuần về thị trường, đầu tư dài hạn và cuộc sống, giúp người nghe giữ góc nhìn bình tĩnh trước biến động.',
    description_en:
      'Michael Batnick and Ben Carlson chat weekly about markets, long-term investing and life, helping listeners keep a calm perspective through volatility.',
  },
  {
    title: 'The Money Date',
    provider: 'Vietcetera',
    url: 'https://vietcetera.com/vn/podcast/the-money-date',
    type: 'podcast',
    language: 'vi',
    is_free: true,
    level: 'basic',
    topic: 'personal_finance',
    description_vi:
      'Podcast tiếng Việt trò chuyện vui vẻ về tài chính cá nhân: khách mời kể cách kiếm tiền, tiêu tiền và đầu tư để tiền sinh lời, xen kẽ trò chơi giúp chủ đề bớt khô khan.',
    description_en:
      'A light-hearted Vietnamese podcast on personal finance: guests share how they earn, spend and invest money, with games that keep the topic lively.',
  },
]
