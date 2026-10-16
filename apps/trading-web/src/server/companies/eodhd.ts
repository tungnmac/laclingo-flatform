import { env } from '../env'
import { EODHD_EXCHANGE, type CompanyMarket, type FinancialYear, type Fundamentals } from './types'

const MAX_YEARS = 5
const TIMEOUT_MS = 10_000

type Raw = Record<string, unknown>

/** Số từ EODHD (chuỗi "123.00", số, null, "", "NA") → number | null */
export function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

/** Như num nhưng 0 cũng là "không có" — EODHD trả 0 cho trường thiếu (vd vốn hoá của mã VN ít dữ liệu) */
const positive = (v: unknown) => {
  const n = num(v)
  return n !== null && n > 0 ? n : null
}

const str = (v: unknown) => (typeof v === 'string' && v.trim() !== '' && v !== 'NA' ? v.trim() : null)
const obj = (v: unknown): Raw => (v && typeof v === 'object' ? (v as Raw) : {})

/** Tổng nợ vay: EODHD có sẵn shortLongTermDebtTotal; không có → vay ngắn hạn + dài hạn (thiếu cả hai → null) */
function totalDebt(bs: Raw): number | null {
  const total = num(bs.shortLongTermDebtTotal)
  if (total !== null) return total
  const short = num(bs.shortTermDebt)
  const long = num(bs.longTermDebt)
  return short === null && long === null ? null : (short ?? 0) + (long ?? 0)
}

const abs = (n: number | null) => (n === null ? null : Math.abs(n))

/** Dữ liệu bên thứ ba đưa vào href/src — chỉ nhận http(s) (chặn `javascript:` …) */
const httpUrl = (v: string | null) => (v && /^https?:\/\//i.test(v) ? v : null)

/** JSON fundamentals của EODHD → Fundamentals (hàm thuần) */
export function mapFundamentals(json: unknown): Fundamentals {
  const root = obj(json)
  const g = obj(root.General)
  const h = obj(root.Highlights)
  const v = obj(root.Valuation)
  const fin = obj(root.Financials)
  const income = obj(obj(fin.Income_Statement).yearly)
  const balance = obj(obj(fin.Balance_Sheet).yearly)
  const cashflow = obj(obj(fin.Cash_Flow).yearly)

  const dates = Object.keys(income)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort()
    .reverse()
    .slice(0, MAX_YEARS)

  const years: FinancialYear[] = dates.map((date) => {
    const is = obj(income[date])
    const bs = obj(balance[date])
    const cf = obj(cashflow[date])
    const cfo = num(cf.totalCashFromOperatingActivities)
    const capex = abs(num(cf.capitalExpenditures))
    return {
      year: Number(date.slice(0, 4)),
      date,
      revenue: num(is.totalRevenue),
      gross_profit: num(is.grossProfit),
      operating_income: num(is.operatingIncome),
      net_income: num(is.netIncome),
      total_assets: num(bs.totalAssets),
      total_liabilities: num(bs.totalLiab),
      equity: num(bs.totalStockholderEquity),
      cash: num(bs.cash) ?? num(bs.cashAndEquivalents),
      current_assets: num(bs.totalCurrentAssets),
      current_liabilities: num(bs.totalCurrentLiabilities),
      total_debt: totalDebt(bs),
      cfo,
      capex,
      fcf: num(cf.freeCashFlow) ?? (cfo !== null && capex !== null ? cfo - capex : null),
      dividends_paid: abs(num(cf.dividendsPaid)),
    }
  })

  const logo = str(g.LogoURL)
  return {
    name: str(g.Name) ?? str(g.Code) ?? '',
    exchange: str(g.Exchange),
    currency: str(g.CurrencyCode),
    sector: str(g.Sector),
    industry: str(g.Industry),
    website: httpUrl(str(g.WebURL)),
    logo_url: logo ? httpUrl(logo.startsWith('http') ? logo : new URL(logo, env.eodhdBaseUrl()).toString()) : null,
    employees: positive(g.FullTimeEmployees),
    ipo_date: str(g.IPODate),
    description: str(g.Description),
    market_cap: positive(h.MarketCapitalization),
    pe: positive(h.PERatio) ?? positive(v.TrailingPE),
    pb: positive(v.PriceBookMRQ),
    eps: num(h.EarningsShare),
    dividend_yield: num(h.DividendYield),
    updated_at: str(g.UpdatedAt),
    years,
  }
}

export class FundamentalsUnavailableError extends Error {
  constructor(reason: string) {
    super(reason)
  }
}

/** Gọi EODHD — không có key → lỗi ngay (không gọi ra ngoài) */
export async function fetchFundamentals(market: CompanyMarket, symbol: string): Promise<Fundamentals> {
  const token = env.eodhdApiKey()
  if (!token) throw new FundamentalsUnavailableError('EODHD_API_KEY missing')
  const url = new URL(`/api/v1.1/fundamentals/${encodeURIComponent(symbol)}.${EODHD_EXCHANGE[market]}`, env.eodhdBaseUrl())
  url.searchParams.set('api_token', token)
  url.searchParams.set('fmt', 'json')
  url.searchParams.set('filter', 'General,Highlights,Valuation,Financials')
  const get = () => fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' })
  // Lỗi mạng chập chờn (connection reset) → thử lại 1 lần; timeout hay lỗi HTTP thì không
  const res = await get()
    .catch((err: Error) => {
      if (err.name === 'TimeoutError') throw err
      return new Promise((r) => setTimeout(r, 500)).then(get)
    })
    .catch((err: Error) => {
      throw new FundamentalsUnavailableError(err.message) // không log url — chứa token
    })
  if (!res.ok) throw new FundamentalsUnavailableError(`EODHD HTTP ${res.status} for ${symbol}.${EODHD_EXCHANGE[market]}`)
  const json: unknown = await res.json().catch(() => null)
  const general = obj(obj(json).General)
  if (!str(general.Name) && !str(general.Code)) throw new FundamentalsUnavailableError(`EODHD empty data for ${symbol}`)
  return mapFundamentals(json)
}
