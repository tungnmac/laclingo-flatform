import type { SeedDrafts } from './types'

// Bản nháp — CHƯA công bố; admin đối chiếu báo cáo thường niên (10-K) mới nhất trước khi công bố.
export const DRAFTS_US: SeedDrafts = {
  AAPL: {
    vi: {
      summary:
        'Apple thiết kế và bán thiết bị điện tử tiêu dùng cao cấp như iPhone, Mac, iPad, đồng hồ và tai nghe, đồng thời thu phí từ mảng dịch vụ xây dựng trên hệ sinh thái thiết bị đó.',
      business_md: `Apple kiếm tiền từ hai nguồn chính: **bán phần cứng** và **cung cấp dịch vụ**.

- **iPhone**: dòng sản phẩm chủ lực, đóng góp phần lớn doanh thu và là "cửa ngõ" dẫn người dùng vào hệ sinh thái.
- **Mac và iPad**: máy tính cá nhân và máy tính bảng, phục vụ cả người dùng phổ thông lẫn giới sáng tạo, giáo dục.
- **Thiết bị đeo, nhà thông minh và phụ kiện**: đồng hồ, tai nghe không dây và các thiết bị đi kèm.
- **Dịch vụ**: kho ứng dụng (thu phí hoa hồng trên giao dịch), lưu trữ đám mây, nhạc, video, thanh toán, bảo hành mở rộng, quảng cáo và các thỏa thuận cấp phép.

Phần cứng phần lớn được sản xuất qua đối tác gia công bên ngoài. Mảng dịch vụ thường có **biên lợi nhuận gộp** cao hơn nhiều so với phần cứng và mang tính **doanh thu định kỳ**, nên tỷ trọng dịch vụ tăng lên thường giúp cải thiện chất lượng lợi nhuận chung.`,
      strategy_md: `Theo định hướng công bố, Apple tập trung vào một số hướng chính:

- **Mở rộng mảng dịch vụ** trên nền tảng thiết bị đang hoạt động, tăng doanh thu trên mỗi người dùng thay vì chỉ phụ thuộc vào bán máy mới.
- **Tự thiết kế chip** cho nhiều dòng sản phẩm, giúp kiểm soát hiệu năng, mức tiêu thụ điện và trải nghiệm tích hợp phần cứng – phần mềm.
- **Quyền riêng tư** được định vị như một giá trị cốt lõi của thương hiệu.
- **Tích hợp trí tuệ nhân tạo** vào hệ điều hành và ứng dụng, ưu tiên xử lý trên thiết bị.
- **Đa dạng hóa chuỗi cung ứng** sang nhiều quốc gia hơn để giảm rủi ro tập trung.

Với nhà đầu tư mới, điểm đáng chú ý là chiến lược này nhằm biến khách hàng mua thiết bị thành người dùng trả phí lâu dài.`,
      strengths_md: `- **Hệ sinh thái khép kín**: thiết bị, phần mềm và dịch vụ kết nối liền mạch với nhau, tạo **chi phí chuyển đổi** cao — người dùng đã quen iPhone, iCloud, đồng hồ thường ngại chuyển sang nền tảng khác.
- **Thương hiệu mạnh và năng lực định giá cao**: Apple có thể bán sản phẩm ở phân khúc giá cao mà vẫn giữ được lòng trung thành của khách hàng.
- **Lượng thiết bị đang hoạt động rất lớn**: đây là nền tảng để bán thêm dịch vụ với chi phí biên thấp.
- **Tích hợp dọc phần cứng – phần mềm – chip**: khó sao chép, giúp tối ưu trải nghiệm.
- **Dòng tiền mạnh**: mô hình kinh doanh tạo ra nhiều tiền mặt, cho phép đầu tư nghiên cứu và trả lại vốn cho cổ đông.

Đây là ví dụ điển hình về "con hào kinh tế" dựa trên hệ sinh thái và thương hiệu.`,
      risks_md: `- **Phụ thuộc vào iPhone**: một dòng sản phẩm chiếm tỷ trọng lớn, nên chu kỳ thay máy chậm lại có thể ảnh hưởng mạnh đến doanh thu.
- **Rủi ro pháp lý và quy định**: cơ quan quản lý ở nhiều nơi xem xét mô hình kho ứng dụng, phí hoa hồng và các thỏa thuận cấp phép; thay đổi luật có thể tác động đến mảng dịch vụ có biên lợi nhuận cao.
- **Tập trung chuỗi cung ứng**: sản xuất phụ thuộc nhiều vào đối tác và khu vực địa lý nhất định, dễ bị ảnh hưởng bởi căng thẳng thương mại, thuế quan hoặc gián đoạn.
- **Cạnh tranh**: các hãng điện thoại khác và nền tảng phần mềm đối thủ liên tục cải tiến, đặc biệt trong cuộc đua trí tuệ nhân tạo.
- **Nhạy cảm với định giá**: là doanh nghiệp được kỳ vọng cao, giá cổ phiếu có thể biến động mạnh khi tăng trưởng không như dự kiến.`,
    },
    en: {
      summary:
        'Apple designs and sells premium consumer electronics such as the iPhone, Mac, iPad, watches and earbuds, and earns fees from a services business built on top of that device ecosystem.',
      business_md: `Apple makes money from two main sources: **selling hardware** and **providing services**.

- **iPhone**: the flagship product line, contributing the largest share of revenue and acting as the "gateway" into the ecosystem.
- **Mac and iPad**: personal computers and tablets serving mainstream users as well as creative and education customers.
- **Wearables, home and accessories**: watches, wireless earbuds and companion devices.
- **Services**: the app store (earning commissions on transactions), cloud storage, music, video, payments, extended warranties, advertising and licensing arrangements.

Most hardware is manufactured through outside contract partners. Services typically carry a much higher **gross margin** than hardware and are largely **recurring revenue**, so a rising services mix tends to improve overall earnings quality.`,
      strategy_md: `According to its published strategy, Apple focuses on several main directions:

- **Growing services** on top of its active device base, increasing revenue per user instead of relying only on new device sales.
- **Designing its own chips** across many product lines to control performance, power efficiency and the integrated hardware–software experience.
- **Privacy** positioned as a core brand value.
- **Integrating artificial intelligence** into its operating systems and apps, with an emphasis on on-device processing.
- **Diversifying its supply chain** across more countries to reduce concentration risk.

For beginner investors, the key point is that this strategy aims to turn device buyers into long-term paying users.`,
      strengths_md: `- **Closed ecosystem**: devices, software and services connect seamlessly, creating high **switching costs** — users accustomed to the iPhone, iCloud and a watch are often reluctant to move to another platform.
- **Strong brand and pricing power**: Apple can sell at premium price points while keeping customer loyalty.
- **Very large active device base**: a foundation for selling additional services at low marginal cost.
- **Vertical integration of hardware, software and chips**: hard to copy and helps optimize the experience.
- **Strong cash flow**: the business model generates a lot of cash, funding research and returns to shareholders.

This is a classic example of an "economic moat" built on ecosystem and brand.`,
      risks_md: `- **Dependence on the iPhone**: one product line makes up a large share of revenue, so slower upgrade cycles can hit revenue hard.
- **Legal and regulatory risk**: regulators in many regions are scrutinizing the app store model, commission fees and licensing arrangements; rule changes could affect the high-margin services business.
- **Supply chain concentration**: production relies heavily on certain partners and geographic regions, making it vulnerable to trade tensions, tariffs or disruptions.
- **Competition**: rival phone makers and competing software platforms keep improving, especially in the artificial intelligence race.
- **Valuation sensitivity**: as a company with high expectations, its share price can swing sharply when growth disappoints.`,
    },
  },

  MSFT: {
    vi: {
      summary:
        'Microsoft là tập đoàn phần mềm và điện toán đám mây, cung cấp hệ điều hành, bộ ứng dụng văn phòng, nền tảng đám mây Azure, mạng xã hội nghề nghiệp và mảng trò chơi điện tử.',
      business_md: `Microsoft báo cáo theo ba nhóm kinh doanh chính:

- **Năng suất và quy trình doanh nghiệp**: bộ ứng dụng văn phòng và công cụ cộng tác theo hình thức thuê bao, phần mềm quản lý doanh nghiệp, và mạng xã hội nghề nghiệp LinkedIn.
- **Đám mây thông minh**: nền tảng đám mây Azure (cho thuê hạ tầng tính toán, lưu trữ, cơ sở dữ liệu, dịch vụ trí tuệ nhân tạo), cùng phần mềm máy chủ.
- **Điện toán cá nhân**: giấy phép hệ điều hành Windows, thiết bị, trò chơi điện tử (máy chơi game, nội dung và dịch vụ game), tìm kiếm và quảng cáo.

Phần lớn doanh thu đến từ **thuê bao và hợp đồng dài hạn** với doanh nghiệp, tạo ra **doanh thu định kỳ** có tính ổn định cao. Mảng đám mây đòi hỏi **chi đầu tư (capex)** lớn cho trung tâm dữ liệu, khác với phần mềm truyền thống vốn có chi phí biên rất thấp.`,
      strategy_md: `Theo định hướng công bố, Microsoft ưu tiên:

- **Trí tuệ nhân tạo xuyên suốt sản phẩm**: tích hợp trợ lý AI vào ứng dụng văn phòng, công cụ lập trình, hệ điều hành và dịch vụ đám mây, thông qua cả mô hình tự phát triển lẫn hợp tác chiến lược với các công ty AI.
- **Mở rộng hạ tầng đám mây**: xây dựng thêm trung tâm dữ liệu trên toàn cầu để đáp ứng nhu cầu tính toán AI.
- **Chuyển khách hàng sang thuê bao đám mây**: thay vì bán giấy phép một lần, hướng tới doanh thu thuê bao lặp lại.
- **Bảo mật** như một ưu tiên hàng đầu trong toàn bộ danh mục sản phẩm.
- **Trò chơi điện tử** đa nền tảng, mở rộng nội dung và dịch vụ thuê bao game.

Chiến lược này đánh đổi chi đầu tư lớn hiện tại lấy kỳ vọng tăng trưởng doanh thu đám mây và AI trong tương lai.`,
      strengths_md: `- **Chi phí chuyển đổi rất cao**: doanh nghiệp đã xây dựng quy trình, dữ liệu và đào tạo nhân viên quanh các sản phẩm của Microsoft, nên rất khó thay thế.
- **Quan hệ khách hàng doanh nghiệp sâu rộng**: có thể bán kèm nhiều sản phẩm (văn phòng, bảo mật, đám mây, quản lý doanh nghiệp) cho cùng một khách hàng.
- **Quy mô đám mây lớn**: lợi thế quy mô giúp giảm chi phí đơn vị và đầu tư hạ tầng mà đối thủ nhỏ khó theo kịp.
- **Doanh thu định kỳ đa dạng**: nhiều mảng khác nhau giúp giảm phụ thuộc vào một sản phẩm duy nhất.
- **Bảng cân đối kế toán vững mạnh**: dòng tiền ổn định hỗ trợ đầu tư dài hạn.

Đây là ví dụ về con hào dựa trên chi phí chuyển đổi và lợi thế quy mô.`,
      risks_md: `- **Cạnh tranh đám mây gay gắt**: các nhà cung cấp đám mây lớn khác cạnh tranh trực tiếp về giá, tính năng và dịch vụ AI.
- **Cường độ chi đầu tư cao**: chi tiêu lớn cho trung tâm dữ liệu và chip AI có thể gây áp lực lên dòng tiền tự do và biên lợi nhuận nếu nhu cầu AI không tăng như kỳ vọng.
- **Rủi ro thực thi trong AI**: việc biến AI thành sản phẩm mà khách hàng sẵn sàng trả tiền vẫn còn nhiều bất định; phụ thuộc một phần vào đối tác bên ngoài.
- **Quy định và chống độc quyền**: quy mô lớn khiến công ty chịu giám sát về cạnh tranh, bảo vệ dữ liệu và an ninh mạng.
- **Sự cố bảo mật**: là nhà cung cấp hạ tầng quan trọng, các vụ tấn công mạng có thể ảnh hưởng đến uy tín.
- **Nhạy cảm với định giá** khi kỳ vọng tăng trưởng đã ở mức cao.`,
    },
    en: {
      summary:
        'Microsoft is a software and cloud computing company offering operating systems, an office productivity suite, the Azure cloud platform, a professional social network and a video gaming business.',
      business_md: `Microsoft reports in three main business groups:

- **Productivity and Business Processes**: subscription-based office apps and collaboration tools, business management software, and the LinkedIn professional network.
- **Intelligent Cloud**: the Azure cloud platform (renting compute, storage, databases and artificial intelligence services), along with server software.
- **More Personal Computing**: Windows operating system licenses, devices, gaming (consoles, content and gaming services), search and advertising.

Most revenue comes from **subscriptions and long-term contracts** with businesses, producing highly stable **recurring revenue**. The cloud business requires heavy **capital expenditure (capex)** on data centers, unlike traditional software, which has very low marginal costs.`,
      strategy_md: `According to its published strategy, Microsoft prioritizes:

- **Artificial intelligence across products**: embedding AI assistants into office apps, developer tools, the operating system and cloud services, through both in-house models and strategic partnerships with AI companies.
- **Expanding cloud infrastructure**: building more data centers worldwide to meet AI computing demand.
- **Moving customers to cloud subscriptions**: shifting from one-time licenses toward recurring subscription revenue.
- **Security** as a top priority across the whole product portfolio.
- **Cross-platform gaming**, expanding content and game subscription services.

This strategy trades heavy investment today for expected growth in cloud and AI revenue in the future.`,
      strengths_md: `- **Very high switching costs**: businesses have built processes, data and employee training around Microsoft products, making them hard to replace.
- **Deep enterprise relationships**: it can cross-sell many products (office, security, cloud, business management) to the same customer.
- **Large cloud scale**: scale advantages lower unit costs and support infrastructure investment that smaller rivals struggle to match.
- **Diversified recurring revenue**: many different segments reduce reliance on any single product.
- **Strong balance sheet**: steady cash flow supports long-term investment.

This is an example of a moat based on switching costs and economies of scale.`,
      risks_md: `- **Intense cloud competition**: other large cloud providers compete directly on price, features and AI services.
- **High capex intensity**: heavy spending on data centers and AI chips could pressure free cash flow and margins if AI demand does not grow as expected.
- **AI execution risk**: turning AI into products customers are willing to pay for remains uncertain, and it relies partly on outside partners.
- **Regulation and antitrust**: its size brings scrutiny over competition, data protection and cybersecurity.
- **Security incidents**: as a critical infrastructure provider, cyberattacks could damage its reputation.
- **Valuation sensitivity** when growth expectations are already high.`,
    },
  },

  NVDA: {
    vi: {
      summary:
        'Nvidia thiết kế bộ xử lý đồ họa (GPU) và nền tảng tính toán tăng tốc, được dùng rộng rãi trong trung tâm dữ liệu cho trí tuệ nhân tạo, cũng như trong chơi game, đồ họa chuyên nghiệp và ô tô.',
      business_md: `Nvidia là công ty **thiết kế chip không sở hữu nhà máy** (mô hình fabless): tự thiết kế, còn việc sản xuất thuê các xưởng đúc bán dẫn bên ngoài. Các mảng chính:

- **Trung tâm dữ liệu**: GPU và hệ thống tính toán dùng để huấn luyện và vận hành mô hình AI, kèm thiết bị mạng tốc độ cao kết nối các máy chủ. Khách hàng chủ yếu là các nhà cung cấp đám mây lớn và doanh nghiệp.
- **Chơi game**: card đồ họa cho máy tính cá nhân và máy tính xách tay.
- **Đồ họa chuyên nghiệp**: GPU cho thiết kế, kỹ xảo, mô phỏng.
- **Ô tô và robot**: nền tảng tính toán cho xe tự hành và hệ thống thông minh.

Ngoài phần cứng, Nvidia còn cung cấp **phần mềm và thư viện lập trình** giúp nhà phát triển khai thác GPU. Biên lợi nhuận gộp của công ty phản ánh sức mạnh định giá đến từ sự kết hợp phần cứng và phần mềm này.`,
      strategy_md: `Theo định hướng công bố, Nvidia hướng tới:

- **Trở thành nền tảng tính toán toàn diện** cho AI: không chỉ bán chip mà cung cấp cả hệ thống, thiết bị mạng và phần mềm như một "nhà máy AI" hoàn chỉnh.
- **Ra mắt kiến trúc chip mới theo nhịp độ nhanh**, liên tục nâng cao hiệu năng để giữ vị thế dẫn đầu.
- **Mở rộng hệ sinh thái phần mềm** và thư viện chuyên ngành để thu hút nhà phát triển.
- **Đa dạng hóa sang các thị trường mới** như robot, ô tô tự hành, mô phỏng công nghiệp và AI cho từng quốc gia.

Với nhà đầu tư mới, điều quan trọng là hiểu rằng chiến lược này phụ thuộc nhiều vào việc nhu cầu đầu tư hạ tầng AI tiếp tục duy trì.`,
      strengths_md: `- **Hệ sinh thái phần mềm**: nền tảng lập trình của Nvidia đã được nhà phát triển sử dụng rộng rãi trong nhiều năm, tạo ra **chi phí chuyển đổi** — mã nguồn, công cụ và kỹ năng đều gắn với nền tảng này.
- **Hiệu ứng mạng lưới**: càng nhiều nhà phát triển và nhà nghiên cứu dùng, càng nhiều thư viện và tài liệu được xây dựng, khiến nền tảng càng hấp dẫn hơn.
- **Giải pháp trọn gói**: kết hợp chip, mạng và phần mềm giúp tối ưu hiệu năng ở quy mô trung tâm dữ liệu.
- **Năng lực nghiên cứu phát triển mạnh** và tốc độ đổi mới nhanh.
- **Mô hình fabless** giúp nhẹ tài sản, không phải đầu tư xây nhà máy.

Đây là ví dụ về con hào dựa trên hệ sinh thái và hiệu ứng mạng lưới trong ngành công nghệ.`,
      risks_md: `- **Tính chu kỳ của ngành bán dẫn**: nhu cầu chip có thể tăng nóng rồi giảm mạnh khi khách hàng tạm dừng đầu tư; doanh thu và lợi nhuận vì thế dao động lớn.
- **Tập trung khách hàng**: một số ít nhà cung cấp đám mây lớn chiếm tỷ trọng đáng kể doanh thu; nhiều khách hàng này còn tự phát triển chip riêng.
- **Phụ thuộc nhà sản xuất bên ngoài**: phụ thuộc vào số ít xưởng đúc và nhà cung cấp linh kiện, tập trung ở một số khu vực địa lý nhạy cảm.
- **Quy định xuất khẩu**: hạn chế xuất khẩu chip tiên tiến sang một số thị trường có thể làm giảm doanh thu tiềm năng.
- **Cạnh tranh**: các hãng chip khác và chip tự thiết kế của khách hàng lớn đang nỗ lực thu hẹp khoảng cách.
- **Nhạy cảm với định giá**: kỳ vọng cao khiến giá cổ phiếu biến động mạnh trước mọi thay đổi trong triển vọng nhu cầu AI.`,
    },
    en: {
      summary:
        'Nvidia designs graphics processing units (GPUs) and accelerated computing platforms widely used in data centers for artificial intelligence, as well as in gaming, professional graphics and automotive.',
      business_md: `Nvidia is a **chip designer without its own factories** (a fabless model): it designs the chips and outsources manufacturing to external semiconductor foundries. Main segments:

- **Data center**: GPUs and computing systems used to train and run AI models, plus high-speed networking equipment that connects servers. Customers are mainly large cloud providers and enterprises.
- **Gaming**: graphics cards for personal computers and laptops.
- **Professional visualization**: GPUs for design, visual effects and simulation.
- **Automotive and robotics**: computing platforms for self-driving vehicles and intelligent systems.

Beyond hardware, Nvidia also provides **software and programming libraries** that help developers use its GPUs. The company's gross margin reflects pricing power coming from this combination of hardware and software.`,
      strategy_md: `According to its published strategy, Nvidia aims to:

- **Become a full-stack computing platform** for AI: selling not just chips but complete systems, networking and software as an end-to-end "AI factory".
- **Launch new chip architectures at a fast cadence**, continuously raising performance to stay in the lead.
- **Expand its software ecosystem** and domain-specific libraries to attract developers.
- **Diversify into new markets** such as robotics, autonomous vehicles, industrial simulation and national AI infrastructure.

For beginner investors, the key point is that this strategy depends heavily on continued demand for AI infrastructure investment.`,
      strengths_md: `- **Software ecosystem**: Nvidia's programming platform has been widely used by developers for many years, creating **switching costs** — code, tools and skills are all tied to the platform.
- **Network effects**: the more developers and researchers use it, the more libraries and documentation get built, making the platform even more attractive.
- **Complete solutions**: combining chips, networking and software optimizes performance at data center scale.
- **Strong research and development** and a fast pace of innovation.
- **Fabless model** keeps the business asset-light, with no need to build factories.

This is an example of a moat based on ecosystem and network effects in the technology sector.`,
      risks_md: `- **Semiconductor cyclicality**: chip demand can boom and then drop sharply when customers pause spending, so revenue and profit can swing widely.
- **Customer concentration**: a small number of large cloud providers account for a significant share of revenue, and many of them are developing their own chips.
- **Reliance on outside manufacturers**: it depends on a few foundries and component suppliers concentrated in certain geopolitically sensitive regions.
- **Export regulations**: restrictions on exporting advanced chips to some markets can reduce potential revenue.
- **Competition**: other chipmakers and large customers' in-house chips are working to close the gap.
- **Valuation sensitivity**: high expectations make the share price swing sharply on any change in the AI demand outlook.`,
    },
  },

  AMZN: {
    vi: {
      summary:
        'Amazon vận hành nền tảng thương mại điện tử lớn, dịch vụ thuê bao Prime, mảng quảng cáo và Amazon Web Services (AWS) — một trong những nhà cung cấp điện toán đám mây hàng đầu thế giới.',
      business_md: `Amazon báo cáo theo ba mảng địa lý/kinh doanh: **Bắc Mỹ**, **Quốc tế** và **AWS**. Các nguồn doanh thu chính gồm:

- **Bán lẻ trực tuyến**: Amazon tự bán hàng hóa cho người tiêu dùng.
- **Dịch vụ cho người bán bên thứ ba**: thu phí hoa hồng, phí kho vận và giao hàng từ các nhà bán hàng độc lập trên sàn.
- **Quảng cáo**: người bán và thương hiệu trả tiền để sản phẩm hiển thị nổi bật.
- **Thuê bao**: gói Prime (giao hàng nhanh, video, nhạc) và các dịch vụ thuê bao khác.
- **AWS**: cho doanh nghiệp thuê hạ tầng tính toán, lưu trữ, cơ sở dữ liệu và dịch vụ AI.

Một điểm quan trọng cho người mới: bán lẻ có **biên lợi nhuận mỏng**, trong khi AWS và quảng cáo có biên lợi nhuận cao hơn nhiều và đóng góp phần lớn lợi nhuận hoạt động. Vì vậy, doanh thu lớn nhất không nhất thiết là mảng tạo ra nhiều lợi nhuận nhất.`,
      strategy_md: `Theo định hướng công bố, Amazon tập trung vào:

- **Lấy khách hàng làm trung tâm**: lựa chọn rộng, giá cạnh tranh và giao hàng ngày càng nhanh.
- **Tối ưu mạng lưới kho vận**: tổ chức lại hệ thống hậu cần theo vùng để giảm chi phí phục vụ mỗi đơn hàng.
- **Đầu tư mạnh vào AWS và AI**: xây thêm trung tâm dữ liệu, tự thiết kế chip và cung cấp dịch vụ AI tạo sinh cho doanh nghiệp.
- **Mở rộng quảng cáo**, bao gồm quảng cáo trong nội dung video.
- **Các dự án dài hạn** như internet vệ tinh và y tế, mang tính đầu tư cho tương lai.

Chiến lược này thể hiện rõ triết lý chấp nhận lợi nhuận ngắn hạn thấp để đổi lấy quy mô và vị thế dài hạn.`,
      strengths_md: `- **Hiệu ứng "bánh đà"**: càng nhiều khách mua thì càng thu hút nhiều người bán, lựa chọn phong phú hơn lại kéo thêm khách — một dạng **hiệu ứng mạng lưới** hai chiều.
- **Lợi thế quy mô hậu cần**: mạng lưới kho bãi và giao hàng khổng lồ rất tốn kém để đối thủ sao chép.
- **Prime tạo lòng trung thành**: thành viên thuê bao có xu hướng mua sắm thường xuyên hơn trên nền tảng.
- **AWS có chi phí chuyển đổi cao**: doanh nghiệp đã xây hệ thống trên AWS rất khó chuyển sang nhà cung cấp khác.
- **Dữ liệu mua sắm** giúp mảng quảng cáo nhắm đúng người mua, mang lại giá trị cao cho nhà quảng cáo.

Amazon kết hợp nhiều loại con hào: quy mô, hiệu ứng mạng lưới và chi phí chuyển đổi.`,
      risks_md: `- **Biên lợi nhuận bán lẻ mỏng**: chi phí vận chuyển, nhân công và kho bãi tăng có thể nhanh chóng bào mòn lợi nhuận.
- **Cường độ chi đầu tư cao**: chi tiêu lớn cho kho vận, trung tâm dữ liệu và AI ảnh hưởng đến dòng tiền tự do; hiệu quả đầu tư phụ thuộc vào nhu cầu tương lai.
- **Cạnh tranh**: cạnh tranh với các nhà bán lẻ truyền thống, sàn thương mại điện tử giá rẻ, và các nhà cung cấp đám mây lớn khác.
- **Quy định và chống độc quyền**: cơ quan quản lý ở nhiều nơi xem xét cách Amazon đối xử với người bán bên thứ ba và vị thế thị trường của công ty.
- **Quan hệ lao động**: lực lượng lao động lớn khiến công ty dễ chịu áp lực về điều kiện làm việc và chi phí nhân sự.
- **Nhạy cảm với chu kỳ tiêu dùng**: khi kinh tế suy yếu, chi tiêu mua sắm và ngân sách quảng cáo có thể giảm.`,
    },
    en: {
      summary:
        'Amazon runs a large e-commerce platform, the Prime subscription service, an advertising business and Amazon Web Services (AWS), one of the leading cloud computing providers in the world.',
      business_md: `Amazon reports in three geographic/business segments: **North America**, **International** and **AWS**. Main revenue sources include:

- **Online stores**: Amazon selling goods directly to consumers.
- **Third-party seller services**: commissions, fulfillment and shipping fees from independent sellers on its marketplace.
- **Advertising**: sellers and brands pay for prominent product placement.
- **Subscriptions**: Prime (fast delivery, video, music) and other subscription services.
- **AWS**: renting computing, storage, database and AI services to businesses.

A key point for beginners: retail has **thin margins**, while AWS and advertising carry much higher margins and contribute the bulk of operating profit. So the biggest revenue line is not necessarily the one producing the most profit.`,
      strategy_md: `According to its published strategy, Amazon focuses on:

- **Customer obsession**: broad selection, competitive prices and ever-faster delivery.
- **Optimizing its fulfillment network**: reorganizing logistics regionally to lower the cost to serve each order.
- **Investing heavily in AWS and AI**: building more data centers, designing its own chips and offering generative AI services to businesses.
- **Expanding advertising**, including ads within video content.
- **Long-term bets** such as satellite internet and healthcare, treated as investments for the future.

This strategy clearly reflects a philosophy of accepting lower short-term profit in exchange for long-term scale and position.`,
      strengths_md: `- **The "flywheel" effect**: more shoppers attract more sellers, and wider selection draws even more shoppers — a two-sided **network effect**.
- **Logistics scale advantage**: its huge warehouse and delivery network is very costly for competitors to replicate.
- **Prime builds loyalty**: subscription members tend to shop more often on the platform.
- **AWS has high switching costs**: businesses that have built systems on AWS find it hard to move to another provider.
- **Shopping data** helps the advertising business target real buyers, giving advertisers high value.

Amazon combines several types of moat: scale, network effects and switching costs.`,
      risks_md: `- **Thin retail margins**: rising shipping, labor and warehousing costs can quickly erode profit.
- **High capex intensity**: heavy spending on logistics, data centers and AI weighs on free cash flow; the return on that investment depends on future demand.
- **Competition**: it competes with traditional retailers, low-price e-commerce marketplaces and other large cloud providers.
- **Regulation and antitrust**: regulators in many regions are examining how Amazon treats third-party sellers and its market position.
- **Labor relations**: a large workforce exposes the company to pressure on working conditions and labor costs.
- **Sensitivity to the consumer cycle**: when the economy weakens, shopping and advertising budgets may decline.`,
    },
  },

  TSLA: {
    vi: {
      summary:
        'Tesla sản xuất và bán xe điện, đồng thời kinh doanh hệ thống lưu trữ năng lượng và điện mặt trời, kèm theo dịch vụ, mạng lưới sạc và phần mềm hỗ trợ lái xe.',
      business_md: `Tesla báo cáo theo hai mảng chính:

- **Ô tô**: bán xe điện trực tiếp cho khách hàng (không qua đại lý truyền thống), cho thuê xe, bán phần mềm hỗ trợ lái nâng cao, và bán **tín chỉ quy định** (regulatory credits) cho các hãng xe khác cần đáp ứng tiêu chuẩn khí thải.
- **Sản xuất và lưu trữ năng lượng**: pin lưu trữ cho hộ gia đình và quy mô lưới điện, cùng hệ thống điện mặt trời.

Ngoài ra còn có **dịch vụ và các nguồn khác**: bảo dưỡng, sạc tính phí, bảo hiểm, bán xe đã qua sử dụng.

Với người mới học, cần lưu ý: sản xuất ô tô là ngành **thâm dụng vốn**, cần đầu tư nhà máy lớn; biên lợi nhuận gộp ô tô nhạy cảm với chính sách giá bán và chi phí pin. Tín chỉ quy định có biên lợi nhuận rất cao nhưng không phải nguồn thu bền vững lâu dài.`,
      strategy_md: `Theo định hướng công bố, Tesla theo đuổi:

- **Mở rộng sản xuất xe điện** với chi phí thấp hơn, bao gồm phát triển các mẫu xe giá dễ tiếp cận hơn.
- **Tự lái và robotaxi**: phát triển phần mềm lái tự động dựa trên AI và dữ liệu từ đội xe, hướng tới dịch vụ xe tự hành.
- **Robot hình người**: đầu tư vào robot đa năng như một mảng kinh doanh tiềm năng trong tương lai.
- **Tăng trưởng mảng năng lượng**: mở rộng sản xuất pin lưu trữ cho lưới điện.
- **Tích hợp dọc**: tự phát triển pin, phần mềm, chip và mạng lưới sạc.

Lưu ý: nhiều mục tiêu (tự lái hoàn toàn, robotaxi, robot) vẫn ở giai đoạn phát triển, kết quả và thời điểm thương mại hóa còn rất bất định.`,
      strengths_md: `- **Thương hiệu mạnh** gắn với xe điện và công nghệ, giúp giảm chi phí marketing.
- **Tích hợp dọc**: kiểm soát nhiều khâu từ pin, phần mềm đến bán hàng trực tiếp giúp linh hoạt về chi phí và cập nhật sản phẩm.
- **Cập nhật phần mềm qua mạng**: xe có thể được cải tiến tính năng sau khi bán, tạo cơ hội bán phần mềm và dịch vụ định kỳ.
- **Mạng lưới sạc rộng** và đã được nhiều hãng xe khác chấp nhận chuẩn kết nối, tạo lợi thế hạ tầng.
- **Dữ liệu từ đội xe lớn**: nguồn dữ liệu thực tế để huấn luyện hệ thống hỗ trợ lái.
- **Kinh nghiệm sản xuất quy mô lớn** xe điện, giúp giảm chi phí theo đường cong học hỏi.`,
      risks_md: `- **Cạnh tranh ngày càng gay gắt**: các hãng xe truyền thống và đặc biệt là các nhà sản xuất xe điện châu Á có chi phí thấp đang mở rộng mạnh.
- **Áp lực giá và biên lợi nhuận**: giảm giá bán để giữ doanh số có thể làm biên lợi nhuận gộp suy giảm.
- **Tính chu kỳ**: ô tô là hàng tiêu dùng đắt tiền, nhạy cảm với lãi suất và sức khỏe nền kinh tế.
- **Rủi ro thực thi và quy định với tự lái**: công nghệ tự lái chịu giám sát an toàn chặt chẽ; nếu kỳ vọng không thành hiện thực, định giá có thể bị ảnh hưởng mạnh.
- **Phụ thuộc vào lãnh đạo chủ chốt**: hình ảnh công ty gắn chặt với người đứng đầu, tạo rủi ro về uy tín và quản trị.
- **Nhạy cảm cao với định giá**: giá cổ phiếu phản ánh nhiều kỳ vọng về các mảng tương lai, nên biến động rất lớn.`,
    },
    en: {
      summary:
        'Tesla makes and sells electric vehicles and runs an energy storage and solar business, along with services, a charging network and driver-assistance software.',
      business_md: `Tesla reports in two main segments:

- **Automotive**: selling electric vehicles directly to customers (not through traditional dealers), leasing, selling advanced driver-assistance software, and selling **regulatory credits** to other automakers that need to meet emissions standards.
- **Energy generation and storage**: battery storage for homes and the power grid, plus solar systems.

There is also **services and other**: maintenance, paid charging, insurance and used vehicle sales.

For beginners, note that car manufacturing is **capital-intensive**, requiring large factory investment; automotive gross margin is sensitive to pricing decisions and battery costs. Regulatory credits carry very high margins but are not a durable long-term revenue source.`,
      strategy_md: `According to its published strategy, Tesla pursues:

- **Scaling EV production** at lower cost, including developing more affordable models.
- **Autonomy and robotaxi**: developing AI-based self-driving software using data from its fleet, aiming for an autonomous ride service.
- **Humanoid robots**: investing in general-purpose robots as a potential future business.
- **Growing the energy business**: expanding production of grid-scale battery storage.
- **Vertical integration**: developing its own batteries, software, chips and charging network.

Note: many goals (full autonomy, robotaxi, robots) are still in development, and their outcomes and commercialization timing remain highly uncertain.`,
      strengths_md: `- **Strong brand** associated with electric vehicles and technology, lowering marketing costs.
- **Vertical integration**: controlling many steps from batteries and software to direct sales gives flexibility on costs and product updates.
- **Over-the-air software updates**: cars can gain features after sale, creating opportunities for recurring software and service revenue.
- **Broad charging network**, whose connector standard has been adopted by many other automakers, providing an infrastructure advantage.
- **Data from a large fleet**: a real-world data source for training driver-assistance systems.
- **Experience in high-volume EV manufacturing**, helping lower costs along the learning curve.`,
      risks_md: `- **Intensifying competition**: traditional automakers and especially low-cost Asian EV makers are expanding aggressively.
- **Price and margin pressure**: cutting prices to protect sales volume can erode gross margin.
- **Cyclicality**: cars are expensive consumer purchases, sensitive to interest rates and the health of the economy.
- **Autonomy execution and regulatory risk**: self-driving technology faces strict safety scrutiny; if expectations are not met, the valuation could be hit hard.
- **Key leadership dependence**: the company's image is closely tied to its top leader, creating reputational and governance risk.
- **High valuation sensitivity**: the share price reflects many expectations about future businesses, so it is very volatile.`,
    },
  },
}
