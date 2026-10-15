import { z } from 'zod'
import { decimalString } from '../trading/validation'
import { PRACTICE_INTERVALS, PRACTICE_LENGTHS } from './time'

export const RANDOM_SYMBOL = 'RANDOM'

export const createSchema = z.object({
  symbol: z.string('SYMBOL_REQUIRED').trim().toUpperCase().min(1, 'SYMBOL_REQUIRED'), // 'RANDOM' = server chọn
  interval: z.enum(PRACTICE_INTERVALS, 'INVALID_INTERVAL'),
  length: z.number('INVALID_LENGTH').refine((n) => (PRACTICE_LENGTHS as readonly number[]).includes(n), 'INVALID_LENGTH'),
})

export const advanceSchema = z.object({
  steps: z.union([z.literal(1), z.literal(5), z.literal(10), z.literal('end')], 'INVALID_INPUT'),
})

/** Như lệnh paper trading (phần 3) nhưng không có symbol (lấy theo phiên) và không có ghi chú */
export const practiceOrderSchema = z
  .object({
    side: z.enum(['buy', 'sell'], 'INVALID_SIDE'),
    type: z.enum(['market', 'limit'], 'INVALID_ORDER_TYPE'),
    qty: decimalString('INVALID_QTY'),
    price: decimalString('INVALID_PRICE').optional(),
    stop_loss: decimalString('INVALID_PRICE').nullish(),
    take_profit: decimalString('INVALID_PRICE').nullish(),
  })
  .refine((v) => v.type !== 'limit' || v.price !== undefined, { message: 'PRICE_REQUIRED', path: ['price'] })

export type PracticeOrderInput = z.infer<typeof practiceOrderSchema>
