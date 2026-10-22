import { foldText } from '../library/validation'
import type { VnSecurity } from './types'

/** Giữ cổ phiếu (mã 3 ký tự) và chứng chỉ quỹ ETF (E1…, FUE…); bỏ chứng quyền, trái phiếu, phái sinh */
export const isStockOrEtf = (symbol: string) => /^[A-Z0-9]{3}$/.test(symbol) || /^(E1|FUE)[A-Z0-9]{2,10}$/.test(symbol)

/** Chỉ cổ phiếu mới có hồ sơ & BCTC (ETF thì không) */
export const isStock = (symbol: string) => /^[A-Z0-9]{3}$/.test(symbol)

export const stockSearchText = (s: Pick<VnSecurity, 'symbol' | 'nameVi' | 'nameEn'>) => foldText(`${s.symbol} ${s.nameVi} ${s.nameEn}`)

const addDays = (d: string, n: number) => {
  const x = new Date(`${d}T00:00:00Z`)
  x.setUTCDate(x.getUTCDate() + n)
  return x.toISOString().slice(0, 10)
}

/** Ngày cuối cùng có nến đã chốt (giờ Việt Nam): trước 15:30 thì phiên hôm nay chưa xong → lấy tới hôm qua */
export function lastClosedSession(now: Date): string {
  const vn = new Date(now.getTime() + 7 * 3_600_000) // ICT = UTC+7, không có giờ mùa hè
  const day = vn.toISOString().slice(0, 10)
  return vn.getUTCHours() * 60 + vn.getUTCMinutes() >= 15 * 60 + 30 ? day : addDays(day, -1)
}

/** Tải lại vài ngày cuối để nhận bản sửa của nguồn */
export const PRICE_OVERLAP_DAYS = 5

/** Ngày bắt đầu cần tải nến: lùi vài ngày trước nến cuối đã có (upsert ghi đè), hoặc mốc mặc định; null = không cần tải */
export function priceRangeStart(lastDate: string | null, defaultFrom: string, to: string): string | null {
  if (!lastDate) return defaultFrom <= to ? defaultFrom : null
  const from = addDays(lastDate, -PRICE_OVERLAP_DAYS + 1)
  return from <= to ? from : null
}

/** Chia [from, to] thành các đoạn ≤ 1 năm (tránh giới hạn khoảng ngày / số trang của nguồn) */
export function dateWindows(from: string, to: string, days = 365): [string, string][] {
  const out: [string, string][] = []
  for (let start = from; start <= to; start = addDays(start, days)) {
    const end = addDays(start, days - 1)
    out.push([start, end < to ? end : to])
  }
  return out
}
