import { vietcapConfig } from '../env'
import { fetchJson, SourceError, Throttle } from './http'
import { mapFieldLabels, mapProfile, mapRatios, mapStatement } from './mappers'
import type { VnFieldLabel, VnProfile, VnStatement, VnStatementPeriod } from './types'

type Raw = Record<string, unknown>

/**
 * Vietcap IQ — API công khai KHÔNG chính thức (hồ sơ công ty, BCTC, chỉ số). Chỉ chạy khi VN_UNOFFICIAL_SOURCES=1.
 * Gọi chậm (mặc định 20 request/phút) và tự giới thiệu bằng User-Agent.
 */
export function createVietcapClient(perMinute = Number(process.env.VIETCAP_RPM) || 20) {
  const cfg = vietcapConfig()
  if (!cfg) throw new SourceError('Nguồn không chính thức đang tắt (đặt VN_UNOFFICIAL_SOURCES=1 để bật)')
  const throttle = new Throttle(perMinute)

  async function get(path: string): Promise<Raw> {
    const json = (await fetchJson(
      throttle,
      `${cfg!.baseUrl}/company/${path}`,
      { headers: { 'User-Agent': 'TradeLab-learning-sync/1.0', Accept: 'application/json' } },
      `Vietcap ${path}`,
    )) as Raw
    if (json.successful === false) throw new SourceError(`Vietcap ${path}: ${String(json.msg ?? 'error')}`)
    return json
  }

  const sym = (s: string) => encodeURIComponent(s.toUpperCase())

  return {
    async profile(symbol: string): Promise<VnProfile> {
      const [company, holders] = await Promise.all([get(sym(symbol)), get(`${sym(symbol)}/shareholder`).catch((err: unknown) => {
          // 404 = không có dữ liệu cổ đông; lỗi khác → báo lỗi mã này (không ghi đè danh sách cũ bằng rỗng)
          if (err instanceof SourceError && err.status === 404) return { data: [] }
          throw err
        })])
      return mapProfile(symbol.toUpperCase(), company, holders)
    },
    async statement(symbol: string, section: VnStatement): Promise<VnStatementPeriod[]> {
      return mapStatement(await get(`${sym(symbol)}/financial-statement?section=${section}`))
    },
    async ratios(symbol: string): Promise<VnStatementPeriod[]> {
      return mapRatios(await get(`${sym(symbol)}/statistics-financial`))
    },
    async fieldLabels(symbol: string): Promise<VnFieldLabel[]> {
      return mapFieldLabels(await get(`${sym(symbol)}/financial-statement/metrics`))
    },
  }
}
