import { z } from 'zod'
import { D } from '../trading/decimal'
import { decimalString } from '../trading/validation'
import { MANUAL_MARKETS, ORDER_STATUSES } from './manual-markets'
import { noteSchema, RANGES } from './validation'

export const MANUAL_LIMITS = { tradesPerMarket: 10_000, maxPct: 5, maxCapital: 1e15 }

export const manualMarketSchema = z.enum(MANUAL_MARKETS, 'INVALID_MARKET')

/** Số ≥ 0 dạng chuỗi (phí, thuế, vốn) — phần nguyên ≤ 18 chữ số, ≤ 8 số lẻ; rỗng → "0" */
const nonNegative = (code: string) =>
  z
    .string(code)
    .trim()
    .transform((s) => s || '0')
    .refine((s) => /^\d{1,18}(\.\d{1,8})?$/.test(s), code)

/** Ngày giờ giao dịch: ISO 8601 CÓ múi giờ (client đổi giờ địa phương sang ISO) — chuỗi thiếu múi giờ bị từ chối
 *  để không bị hiểu theo múi giờ của server. Không ở tương lai (dung sai 5 phút lệch đồng hồ). */
const executedAt = z
  .string('INVALID_DATE')
  .trim()
  .refine((s) => /(Z|[+-]\d{2}:?\d{2})$/i.test(s), 'INVALID_DATE')
  .transform((s) => new Date(s))
  .refine((d) => !Number.isNaN(d.getTime()) && d.getTime() <= Date.now() + 5 * 60_000 && d.getFullYear() >= 1970, 'INVALID_DATE')

/** Khớp 1 phần: bắt buộc 0 < filled_qty < qty */
function checkFilled(v: { status: string; qty: string; filled_qty?: string | null }, ctx: z.RefinementCtx) {
  if (v.status !== 'partial') return
  if (!v.filled_qty || !D(v.filled_qty).lt(D(v.qty))) ctx.addIssue({ code: 'custom', message: 'INVALID_FILLED_QTY', path: ['filled_qty'] })
}
/** filled_qty chỉ có nghĩa khi partial — trạng thái khác bỏ đi */
function normalizeFilled<T extends { status: string; filled_qty?: string | null }>(v: T): T & { filled_qty: string | null } {
  return { ...v, filled_qty: v.status === 'partial' ? (v.filled_qty ?? null) : null }
}

export const manualTradeSchema = z
  .object({
    symbol: z
      .string('INVALID_TICKER')
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9][A-Z0-9._/-]{0,29}$/, 'INVALID_TICKER'),
    side: z.enum(['buy', 'sell'], 'INVALID_INPUT'),
    qty: decimalString('INVALID_QTY'),
    price: decimalString('INVALID_PRICE'),
    fee: nonNegative('INVALID_FEE').default('0'),
    tax: nonNegative('INVALID_FEE').default('0'),
    executed_at: executedAt,
    status: z.enum(ORDER_STATUSES, 'INVALID_INPUT').default('filled'),
    filled_qty: decimalString('INVALID_QTY').nullish(),
  })
  .extend(noteSchema.shape)
  .superRefine(checkFilled)
  .transform(normalizeFilled)
export type ManualTradeInput = z.infer<typeof manualTradeSchema>

/** Đổi trạng thái nhanh (khớp / khớp 1 phần / không khớp / huỷ) */
export const statusSchema = z
  .object({
    status: z.enum(ORDER_STATUSES, 'INVALID_INPUT'),
    filled_qty: decimalString('INVALID_QTY').nullish(),
  })
export type StatusInput = z.infer<typeof statusSchema>

const fourDecimals = (n: number) => Math.abs(Math.round(n * 1e4) - n * 1e4) < 1e-6

export const ledgerSchema = z.object({
  currency: z
    .string('INVALID_CURRENCY')
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3,5}$/, 'INVALID_CURRENCY'),
  // cột numeric(24,2) / numeric(6,4): chặn số lẻ vượt mức thay vì để DB làm tròn im lặng
  starting_capital: nonNegative('INVALID_INPUT').refine((s) => /^\d+(\.\d{1,2})?$/.test(s) && Number(s) <= MANUAL_LIMITS.maxCapital, 'INVALID_INPUT'),
  fee_rate_pct: z.number('INVALID_INPUT').min(0, 'INVALID_INPUT').max(MANUAL_LIMITS.maxPct, 'INVALID_INPUT').refine(fourDecimals, 'INVALID_INPUT'),
  sell_tax_pct: z.number('INVALID_INPUT').min(0, 'INVALID_INPUT').max(MANUAL_LIMITS.maxPct, 'INVALID_INPUT').refine(fourDecimals, 'INVALID_INPUT'),
})
export type LedgerInput = z.infer<typeof ledgerSchema>

export const manualFilterSchema = z.object({
  symbol: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .transform((s) => s || undefined),
  range: z.enum(RANGES, 'INVALID_INPUT').default('all'),
  status: z.enum(ORDER_STATUSES, 'INVALID_INPUT').optional(),
  page: z.coerce.number('INVALID_INPUT').int('INVALID_INPUT').min(1, 'INVALID_INPUT').default(1),
  page_size: z.coerce.number('INVALID_INPUT').int('INVALID_INPUT').min(1, 'INVALID_INPUT').max(100, 'INVALID_INPUT').default(20),
})
export type ManualFilter = z.infer<typeof manualFilterSchema>
