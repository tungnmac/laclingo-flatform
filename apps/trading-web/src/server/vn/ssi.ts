import { ssiConfig } from '../env'
import { fetchJson, SourceError, Throttle } from './http'
import { mapDailyOhlc, mapSecurities, toSsiDate } from './mappers'
import { dateWindows } from './symbols'
import type { VnDailyBar, VnExchange, VnSecurity } from './types'

const PAGE_SIZE = 1000 // lớn nhất SSI cho phép
const MAX_PAGES = 10 // pageIndex 1–10 theo tài liệu
const TOKEN_TTL_MS = 30 * 60_000

type Raw = Record<string, unknown>
const rawCount = (json: Raw) => (Array.isArray(json.data) ? json.data.length : 0)

/** SSI FastConnect Data — nguồn CHÍNH THỨC cho danh mục mã & nến ngày */
export function createSsiClient(perMinute = Number(process.env.SSI_RPM) || 30) {
  const cfg = ssiConfig()
  if (!cfg) throw new SourceError('SSI_CONSUMER_ID / SSI_CONSUMER_SECRET chưa cấu hình')
  const throttle = new Throttle(perMinute)
  let token: { value: string; at: number } | null = null

  async function accessToken(): Promise<string> {
    if (token && Date.now() - token.at < TOKEN_TTL_MS) return token.value
    const json = (await fetchJson(
      throttle,
      `${cfg!.baseUrl}/Market/AccessToken`,
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ consumerID: cfg!.consumerId, consumerSecret: cfg!.consumerSecret }) },
      'SSI AccessToken', // không đưa key vào thông báo lỗi
    )) as Raw
    const value = ((json.data as Raw | undefined)?.accessToken ?? json.accessToken) as string | undefined
    if (!value) throw new SourceError(`SSI AccessToken: ${String(json.message ?? 'no token')}`)
    token = { value, at: Date.now() }
    return value
  }

  async function get(path: string, params: Record<string, string>): Promise<Raw> {
    const url = new URL(`${cfg!.baseUrl}/Market/${path}`)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    const call = async () => (await fetchJson(throttle, url.toString(), { headers: { Authorization: `Bearer ${await accessToken()}` } }, `SSI ${path}`)) as Raw
    let json: Raw
    try {
      json = await call()
    } catch (err) {
      // token hết hạn sớm / bị thu hồi → lấy token mới, thử lại 1 lần
      if (!(err instanceof SourceError && err.status === 401)) throw err
      token = null
      json = await call()
    }
    const status = json.status
    if (!(status === 200 || status === '200' || String(status).toLowerCase() === 'success')) throw new SourceError(`SSI ${path}: ${String(json.message ?? status)}`)
    return json
  }

  /** Mọi mã của 1 sàn (lặp trang tới khi đủ totalRecord) */
  async function securities(market: VnExchange): Promise<VnSecurity[]> {
    const out: VnSecurity[] = []
    for (let page = 1; page <= MAX_PAGES; page++) {
      const json = await get('Securities', { market, pageIndex: String(page), pageSize: String(PAGE_SIZE) })
      out.push(...mapSecurities(json))
      if (rawCount(json) < PAGE_SIZE) break // dừng theo số dòng THÔ (dòng bị lọc không làm dừng sớm)
    }
    return out
  }

  /** Nến ngày của 1 mã trong khoảng [from, to] (YYYY-MM-DD), tải theo từng đoạn ≤ 1 năm, trả về tăng dần theo ngày */
  async function dailyBars(symbol: string, from: string, to: string): Promise<VnDailyBar[]> {
    const out: VnDailyBar[] = []
    for (const [start, end] of dateWindows(from, to)) out.push(...(await dailyBarsWindow(symbol, start, end)))
    return out.sort((a, b) => a.date.localeCompare(b.date))
  }

  async function dailyBarsWindow(symbol: string, from: string, to: string): Promise<VnDailyBar[]> {
    const out: VnDailyBar[] = []
    for (let page = 1; page <= MAX_PAGES; page++) {
      const json = await get('DailyOhlc', {
        symbol,
        fromDate: toSsiDate(from),
        toDate: toSsiDate(to),
        pageIndex: String(page),
        pageSize: String(PAGE_SIZE),
        ascending: 'true',
      })
      out.push(...mapDailyOhlc(json))
      if (rawCount(json) < PAGE_SIZE) break
    }
    return out
  }

  return { securities, dailyBars }
}
