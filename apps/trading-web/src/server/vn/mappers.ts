import type { VnDailyBar, VnExchange, VnFieldLabel, VnProfile, VnSecurity, VnStatement, VnStatementPeriod } from './types'

type Raw = Record<string, unknown>
const obj = (v: unknown): Raw => (v && typeof v === 'object' ? (v as Raw) : {})
const str = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)
export function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}
const pct = (v: unknown) => {
  const n = num(v)
  return n !== null && n >= 0 && n <= 1 ? n : null
}

/** dd/mm/yyyy (SSI) → YYYY-MM-DD; sai định dạng → null */
export function ssiDate(v: unknown): string | null {
  const m = typeof v === 'string' ? /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v.trim()) : null
  if (!m) return null
  const [, d, mo, y] = m
  const date = new Date(`${y}-${mo}-${d}T00:00:00Z`)
  return Number.isNaN(date.getTime()) || date.getUTCDate() !== Number(d) ? null : `${y}-${mo}-${d}`
}

/** YYYY-MM-DD → dd/mm/yyyy (tham số SSI) */
export const toSsiDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`

const EXCHANGES: Record<string, VnExchange> = { HOSE: 'HOSE', HSX: 'HOSE', HNX: 'HNX', UPCOM: 'UPCOM' }

/** SSI Securities → mã niêm yết (bỏ sàn khác HOSE/HNX/UPCOM, mã rỗng) */
export function mapSecurities(json: unknown): VnSecurity[] {
  const out: VnSecurity[] = []
  for (const r of (obj(json).data as unknown[]) ?? []) {
    const x = obj(r)
    const symbol = str(x.Symbol)?.toUpperCase()
    const exchange = EXCHANGES[String(x.Market ?? '').toUpperCase()]
    if (!symbol || !exchange || !/^[A-Z0-9]{2,20}$/.test(symbol)) continue
    out.push({ symbol, exchange, nameVi: str(x.StockName) ?? symbol, nameEn: str(x.StockEnName) ?? str(x.StockName) ?? symbol })
  }
  return out
}

/** SSI DailyOhlc → nến ngày (bỏ dòng thiếu ngày/giá) */
export function mapDailyOhlc(json: unknown): VnDailyBar[] {
  const out: VnDailyBar[] = []
  for (const r of (obj(json).data as unknown[]) ?? []) {
    const x = obj(r)
    const date = ssiDate(x.TradingDate ?? x.Tradingdate)
    const [open, high, low, close] = [num(x.Open), num(x.High), num(x.Low), num(x.Close)]
    const symbol = str(x.Symbol)?.toUpperCase()
    if (!symbol || !date || open === null || high === null || low === null || close === null || close <= 0) continue
    out.push({ symbol, date, open, high, low, close, volume: num(x.Volume) ?? 0, value: num(x.Value) })
  }
  return out
}

/** Entity HTML có tên (Latin-1 + dấu câu thường gặp) → mã ký tự; tiếng Việt dùng nhiều &ocirc; &agrave;… */
const ENTITIES: Record<string, number> = { AElig: 198, Aacute: 193, Acirc: 194, Agrave: 192, Aring: 197, Atilde: 195, Auml: 196, Ccedil: 199, ETH: 208, Eacute: 201, Ecirc: 202, Egrave: 200, Euml: 203, Iacute: 205, Icirc: 206, Igrave: 204, Iuml: 207, Ntilde: 209, Oacute: 211, Ocirc: 212, Ograve: 210, Oslash: 216, Otilde: 213, Ouml: 214, THORN: 222, Uacute: 218, Ucirc: 219, Ugrave: 217, Uuml: 220, Yacute: 221, aacute: 225, acirc: 226, acute: 180, aelig: 230, agrave: 224, amp: 38, apos: 39, aring: 229, atilde: 227, auml: 228, brvbar: 166, bull: 8226, ccedil: 231, cedil: 184, cent: 162, copy: 169, curren: 164, deg: 176, divide: 247, eacute: 233, ecirc: 234, egrave: 232, eth: 240, euml: 235, euro: 8364, frac12: 189, frac14: 188, frac34: 190, gt: 62, hellip: 8230, iacute: 237, icirc: 238, iexcl: 161, igrave: 236, iquest: 191, iuml: 239, laquo: 171, ldquo: 8220, lsquo: 8216, lt: 60, macr: 175, mdash: 8212, micro: 181, middot: 183, nbsp: 160, ndash: 8211, not: 172, ntilde: 241, oacute: 243, ocirc: 244, ograve: 242, ordf: 170, ordm: 186, oslash: 248, otilde: 245, ouml: 246, para: 182, plusmn: 177, pound: 163, quot: 34, raquo: 187, rdquo: 8221, reg: 174, rsquo: 8217, sect: 167, shy: 173, sup1: 185, sup2: 178, sup3: 179, szlig: 223, thorn: 254, times: 215, uacute: 250, ucirc: 251, ugrave: 249, uml: 168, uuml: 252, yacute: 253, yen: 165, yuml: 255 }

/** Giải mã &name; / &#123; / &#x1F; — entity lạ giữ nguyên */
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (m, e: string) => {
    const code = e[0] === '#' ? (e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENTITIES[e] ?? ENTITIES[e.toLowerCase()]
    return code && code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : m
  })
}

/**
 * HTML giới thiệu công ty (Vietcap) → văn bản thuần: bỏ thẻ/script/style, giải mã entity cơ bản, gộp khoảng trắng.
 * Web chỉ hiển thị chữ thuần (React escape) — không render HTML của bên thứ ba.
 */
export function htmlToText(html: unknown): string | null {
  if (typeof html !== 'string' || !html.trim()) return null
  // Bỏ thẻ TRƯỚC rồi mới giải mã entity: "&lt;script&gt;" thành chữ "<script>" (React hiển thị dạng chữ, không chạy)
  const stripped = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h\d)>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
  const text = decodeEntities(stripped)
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t\r\f\v]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return text ? text.slice(0, 20_000) : null
}

const isoDate = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null)

/**
 * Vietcap company + shareholders → hồ sơ. CỐ Ý BỎ các trường khuyến nghị đầu tư của Vietcap
 * (rating, targetPrice, upside, analyst…) — sản phẩm nghiên cứu riêng, không phải dữ liệu sự kiện.
 */
export function mapProfile(symbol: string, company: unknown, shareholders: unknown): VnProfile {
  const c = obj(obj(company).data)
  const holders = ((obj(shareholders).data as unknown[]) ?? [])
    .map(obj)
    .filter((h) => str(h.ownerName))
    .sort((a, b) => (num(b.percentage) ?? 0) - (num(a.percentage) ?? 0))
    .slice(0, 10)
    .map((h) => ({
      name: str(h.ownerName)!,
      nameEn: str(h.ownerNameEn),
      position: str(h.positionName),
      quantity: num(h.quantity),
      pct: pct(h.percentage),
      asOf: isoDate(h.publicDate),
    }))
  const bank = String(c.isBank ?? c.bank ?? '').toLowerCase() === 'true'
  return {
    symbol,
    nameVi: str(c.viOrganName),
    nameEn: str(c.enOrganName),
    shortName: str(c.viOrganShortName) ?? str(c.enOrganShortName),
    sectorVi: str(c.sectorVn),
    sectorEn: str(c.sector),
    isBank: bank,
    listingDate: isoDate(c.listingDate),
    issueShares: num(c.issueShare),
    freeFloatPct: pct(c.freeFloatPercentage),
    foreignPct: pct(c.foreignerPercentage),
    foreignMaxPct: pct(c.maximumForeignPercentage),
    statePct: pct(c.statePercentage),
    marketCap: num(c.marketCap),
    profileVi: htmlToText(c.profile),
    profileEn: htmlToText(c.enProfile),
    shareholders: holders,
  }
}

/** lengthReport: 5 = cả năm, 1–4 = quý */
function periodOf(row: Raw): { period: string; year: number; quarter: number | null } | null {
  const year = num(row.yearReport)
  const len = num(row.lengthReport)
  if (year === null || len === null) return null
  if (len === 5) return { period: `Y${year}`, year, quarter: null }
  if (len >= 1 && len <= 4) return { period: `Q${year}-${len}`, year, quarter: len }
  return null
}

const FIELD = /^[a-z]{2,4}\d{1,4}$/ // isa1, bsb108, cfa12…

/** Vietcap financial-statement → các kỳ (năm + quý), chỉ giữ chỉ tiêu dạng mã (isa1…) có giá trị số */
export function mapStatement(json: unknown): VnStatementPeriod[] {
  const d = obj(obj(json).data)
  const rows = [...((d.years as unknown[]) ?? []), ...((d.quarters as unknown[]) ?? [])].map(obj)
  const out: VnStatementPeriod[] = []
  for (const r of rows) {
    const p = periodOf(r)
    if (!p) continue
    const values: Record<string, number> = {}
    for (const [k, v] of Object.entries(r)) {
      const n = num(v)
      if (FIELD.test(k) && n !== null) values[k] = n
    }
    out.push({ ...p, values })
  }
  return out
}

const RATIO_FIELDS = [
  'pe', 'pb', 'ps', 'evToEbitda', 'roe', 'roa', 'grossMargin', 'ebitMargin', 'afterTaxProfitMargin', 'currentRatio',
  'quickRatio', 'cashRatio', 'debtToEquity', 'assetTurnover', 'dividendYield', 'marketCap', 'netInterestMargin',
] as const

/** Vietcap statistics-financial (TTM theo quý) → kỳ Q{năm}-{quý} với các chỉ số chính */
export function mapRatios(json: unknown): VnStatementPeriod[] {
  const out: VnStatementPeriod[] = []
  for (const r of ((obj(json).data as unknown[]) ?? []).map(obj)) {
    const year = num(r.yearReport ?? r.year)
    const quarter = num(r.quarter)
    if (year === null || quarter === null || quarter < 1 || quarter > 4) continue
    const values: Record<string, number> = {}
    for (const k of RATIO_FIELDS) {
      const n = num(r[k])
      if (n !== null) values[k] = n
    }
    out.push({ period: `Q${year}-${quarter}`, year, quarter, values })
  }
  return out
}

/** Vietcap metrics → tên chỉ tiêu vi/en theo mã */
export function mapFieldLabels(json: unknown): VnFieldLabel[] {
  const d = obj(obj(json).data)
  const out: VnFieldLabel[] = []
  for (const statement of ['INCOME_STATEMENT', 'BALANCE_SHEET', 'CASH_FLOW'] as VnStatement[]) {
    for (const [position, r] of ((d[statement] as unknown[]) ?? []).map(obj).entries()) {
      const field = str(r.field)?.toLowerCase()
      if (!field || !FIELD.test(field)) continue
      out.push({
        statement,
        field,
        titleVi: str(r.titleVi) ?? str(r.fullTitleVi) ?? field,
        titleEn: str(r.titleEn) ?? str(r.fullTitleEn) ?? field,
        level: num(r.level) ?? 1,
        parent: str(r.parent)?.toLowerCase() ?? null,
        position,
      })
    }
  }
  return out
}
