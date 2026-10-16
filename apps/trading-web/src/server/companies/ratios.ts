import type { FinancialYear, Fundamentals, Ratios } from './types'

/** Ngân hàng không có giá vốn / tài sản ngắn hạn, nợ là nguyên liệu kinh doanh → biên gộp, D/E, thanh toán hiện hành vô nghĩa */
export const isBank = (f: Pick<Fundamentals, 'industry' | 'sector'>) => /bank/i.test(`${f.industry ?? ''} ${f.sector ?? ''}`)

/** a / b, chỉ khi cả hai có và mẫu số > 0 (vốn chủ âm, doanh thu 0… → null thay vì số vô nghĩa) */
const div = (a: number | null, b: number | null) => (a === null || b === null || b <= 0 ? null : a / b)

/** Tăng trưởng so với năm trước — năm trước ≤ 0 thì % không có nghĩa → null */
const growth = (now: number | null, before: number | null) =>
  now === null || before === null || before <= 0 ? null : now / before - 1

/** Chỉ số từ năm gần nhất (`years[0]`) — cùng công thức chương "Các chỉ số tài chính cơ bản" */
export function computeRatios(years: FinancialYear[], bank = false): Ratios {
  const y = years[0]
  const prev = years[1]
  if (!y) {
    return { gross_margin: null, net_margin: null, roe: null, roa: null, debt_to_equity: null, current_ratio: null, revenue_growth: null, net_income_growth: null }
  }
  return {
    gross_margin: bank ? null : div(y.gross_profit, y.revenue),
    net_margin: div(y.net_income, y.revenue),
    roe: div(y.net_income, y.equity),
    roa: div(y.net_income, y.total_assets),
    debt_to_equity: bank ? null : div(y.total_debt, y.equity),
    current_ratio: bank ? null : div(y.current_assets, y.current_liabilities),
    revenue_growth: prev ? growth(y.revenue, prev.revenue) : null,
    net_income_growth: prev ? growth(y.net_income, prev.net_income) : null,
  }
}
