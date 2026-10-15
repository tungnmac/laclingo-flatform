import { z } from 'zod'
import { D } from './decimal'

// Message = MÃ LỖI (errors.* trong từ điển). Số gửi dạng CHUỖI để không mất chính xác.
const DECIMAL = /^\d+(\.\d{1,8})?$/

const decimalString = (code: string) =>
  z
    .string(code)
    .trim()
    .regex(DECIMAL, code)
    .refine((v) => D(v).gt(0), code)

export const placeOrderSchema = z
  .object({
    symbol: z.string('SYMBOL_REQUIRED').trim().toUpperCase().min(1, 'SYMBOL_REQUIRED'),
    side: z.enum(['buy', 'sell'], 'INVALID_SIDE'),
    type: z.enum(['market', 'limit'], 'INVALID_ORDER_TYPE'),
    qty: decimalString('INVALID_QTY'),
    price: decimalString('INVALID_PRICE').optional(),
    stop_loss: decimalString('INVALID_PRICE').nullish(),
    take_profit: decimalString('INVALID_PRICE').nullish(),
  })
  .refine((v) => v.type !== 'limit' || v.price !== undefined, { message: 'PRICE_REQUIRED', path: ['price'] })

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>

export const protectionSchema = z.object({
  stop_loss: decimalString('INVALID_PRICE').nullable(),
  take_profit: decimalString('INVALID_PRICE').nullable(),
})

export type ProtectionInput = z.infer<typeof protectionSchema>
