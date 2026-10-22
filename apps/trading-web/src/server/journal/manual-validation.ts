import { z } from 'zod'
import { decimalString } from '../trading/validation'
import { MANUAL_MARKETS } from './manual-markets'
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
  })
  .extend(noteSchema.shape)
export type ManualTradeInput = z.infer<typeof manualTradeSchema>

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
  page: z.coerce.number('INVALID_INPUT').int('INVALID_INPUT').min(1, 'INVALID_INPUT').default(1),
  page_size: z.coerce.number('INVALID_INPUT').int('INVALID_INPUT').min(1, 'INVALID_INPUT').max(100, 'INVALID_INPUT').default(20),
})
export type ManualFilter = z.infer<typeof manualFilterSchema>
