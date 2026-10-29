import { createHmac, timingSafeEqual } from 'node:crypto'
import type { CheckoutRequest, PaymentNotice, PaymentProvider } from './types'

// Cổng GIẢ LẬP để kiểm thử end-to-end khi chưa có hợp đồng cổng thật — KHÔNG BAO GIỜ bật ở production (xem providers/index.ts).
// Trang /pro/checkout/mock mô phỏng màn hình của cổng; webhook ký HMAC-SHA256 như cổng thật.

export const MOCK_SIGNATURE_HEADER = 'x-mock-signature'

const secret = () => process.env.PAYMENT_MOCK_SECRET || 'tradelab-mock-payments-dev-only'

export const signMock = (body: string) => createHmac('sha256', secret()).update(body).digest('hex')

export function verifyMock(body: string, signature: string | null): boolean {
  if (!signature) return false
  const expected = Buffer.from(signMock(body), 'hex')
  const got = Buffer.from(signature, 'hex')
  return got.length === expected.length && timingSafeEqual(got, expected)
}

export interface MockWebhookBody {
  event_id: string
  order_code: number
  amount_vnd: number
  result: 'paid' | 'cancelled'
}

export const mockProvider: PaymentProvider = {
  name: 'mock',
  async createCheckout(req: CheckoutRequest) {
    const q = new URLSearchParams({ order_code: String(req.orderCode), return: req.returnUrl, cancel: req.cancelUrl })
    return { checkoutUrl: `/pro/checkout/mock?${q}`, providerRef: `mock-${req.orderCode}` }
  },
  async parseWebhook(req: Request): Promise<PaymentNotice> {
    const raw = await req.text()
    if (raw.length > 64_000) throw new Error('body too large')
    if (!verifyMock(raw, req.headers.get(MOCK_SIGNATURE_HEADER))) throw new Error('bad signature')
    const b = JSON.parse(raw) as MockWebhookBody
    if (typeof b.event_id !== 'string' || !b.event_id || b.event_id.length > 200 || !Number.isSafeInteger(b.order_code) || !Number.isSafeInteger(b.amount_vnd) || (b.result !== 'paid' && b.result !== 'cancelled')) throw new Error('bad payload')
    return { eventId: b.event_id, orderCode: b.order_code, amountVnd: b.amount_vnd, result: b.result, payload: b }
  },
}
