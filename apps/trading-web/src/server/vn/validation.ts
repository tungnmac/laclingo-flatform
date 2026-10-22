import { z } from 'zod'
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
