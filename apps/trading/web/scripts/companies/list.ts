import type { CompanyMarket } from '../../src/server/companies/types'

/** Danh mục khởi đầu — "top" theo vốn hoá tại thời điểm soạn; admin thêm/bớt ở /admin/companies */
export const COMPANIES: Record<CompanyMarket, string[]> = {
  vn: ['VCB', 'BID', 'CTG', 'TCB', 'VHM', 'VIC', 'HPG', 'FPT', 'VNM', 'MWG'],
  us: ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'BRK-B', 'JPM', 'V', 'TSLA'],
}
