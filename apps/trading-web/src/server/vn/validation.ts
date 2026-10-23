import { z } from 'zod'
import { SORT_KEYS } from './screener'
import { VN_BASKETS, VN_EXCHANGES, VN_INDEXES, VN_STATEMENTS } from './types'

export const vnSymbolSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{1,20}$/)

export const VN_PAGE_SIZE = 50

export const vnListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  exchange: z.enum(VN_EXCHANGES).optional(),
  index: z.enum(VN_BASKETS).optional(), // chỉ mã thuộc rổ (VN30)
  page: z.coerce.number().int().min(1).max(1000).default(1),
})

export const vnStatementQuerySchema = z.object({
  statement: z.enum(VN_STATEMENTS).default('INCOME_STATEMENT'),
  period: z.enum(['year', 'quarter']).default('year'),
})

export const VN_CANDLE_RANGES = { '3m': 92, '1y': 366, '5y': 1830 } as const
export const vnIndexCodeSchema = z.enum(VN_INDEXES)
export const vnCandleQuerySchema = z.object({ range: z.enum(['3m', '1y', '5y']).default('1y') })

// ── Pro ──
const optNum = z.coerce.number().finite().optional()
/** Ô trống / chỉ khoảng trắng → bỏ qua; số gõ kiểu Việt "1,5" → 1.5 */
const blankToUndef = (v: unknown) => {
  if (v === null || v === undefined) return undefined
  if (typeof v !== 'string') return v
  const s = v.trim()
  return s === '' ? undefined : s.replace(',', '.')
}

/** Chuỗi chữ: chỉ bỏ ô trống */
const blankText = (v: unknown) => (typeof v === 'string' ? v.trim() || undefined : v === null ? undefined : v)

export const vnScreenerSchema = z.object({
  exchange: z.preprocess(blankText, z.enum(VN_EXCHANGES).optional()),
  vn30: z.preprocess((v) => v === '1' || v === 'true', z.boolean()).default(false),
  sector: z.preprocess(blankText, z.string().max(200).optional()), // tên ngành có thể chứa dấu phẩy — không đổi
  pe_max: z.preprocess(blankToUndef, optNum),
  pb_max: z.preprocess(blankToUndef, optNum),
  roe_min: z.preprocess(blankToUndef, optNum),
  net_margin_min: z.preprocess(blankToUndef, optNum),
  de_max: z.preprocess(blankToUndef, optNum),
  mcap_min: z.preprocess(blankToUndef, optNum),
  sort: z.enum(SORT_KEYS).default('market_cap'),
  dir: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).max(1000).default(1),
})

export const vnCompareSchema = z.object({
  symbols: z
    .string()
    .transform((s) => [...new Set(s.split(',').map((x) => x.trim().toUpperCase()).filter(Boolean))])
    .pipe(z.array(z.string().regex(/^[A-Z0-9]{1,20}$/)).min(1, 'INVALID_INPUT').max(5, 'TOO_MANY_SYMBOLS')),
})
