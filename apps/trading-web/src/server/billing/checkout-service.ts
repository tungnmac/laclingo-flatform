import { and, desc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { paymentEvents, proOrders, subscriptions, users } from '../db/schema'
import { HttpError, isUniqueViolation } from '../http'
import { orderDescription, ORDER_TTL_MS, newOrderCode, PRICES, type Period } from './pricing'
import { activeProvider } from './providers'
import type { PaymentNotice, PaymentProvider } from './providers/types'
import { grantInTx } from './subscription-service'
import { activeSubscription, coverageEnd } from './plans'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface OrderDto {
  id: string
  order_code: number
  period: Period
  amount_vnd: number
  status: 'pending' | 'paid' | 'cancelled' | 'expired'
  expires_at: string
  paid_at: string | null
  pro_until: string | null // hạn Pro sau khi thanh toán (đơn đã trả)
  issue: string | null // needs_refund | amount_mismatch — cần hỗ trợ xử lý tay
}

/** Đơn chờ quá hạn hiển thị là "hết hạn" (cột trạng thái chỉ đổi khi có webhook / lần xem sau) */
const effectiveStatus = (o: typeof proOrders.$inferSelect, now = new Date()): OrderDto['status'] =>
  o.status === 'pending' && o.expiresAt <= now ? 'expired' : (o.status as OrderDto['status'])

async function toDto(o: typeof proOrders.$inferSelect): Promise<OrderDto> {
  let proUntil: string | null = null
  if (o.subscriptionId) {
    const [s] = await db.select({ endsAt: subscriptions.endsAt }).from(subscriptions).where(eq(subscriptions.id, o.subscriptionId))
    proUntil = s?.endsAt?.toISOString() ?? null
  }
  return {
    id: o.id,
    order_code: o.orderCode,
    period: o.period as Period,
    amount_vnd: o.amountVnd,
    status: effectiveStatus(o),
    expires_at: o.expiresAt.toISOString(),
    paid_at: o.paidAt?.toISOString() ?? null,
    pro_until: proUntil,
    issue: o.issue,
  }
}

export interface BillingConfigDto {
  payments_enabled: boolean
  provider: string | null
  prices: typeof PRICES
}

export const billingConfig = (): BillingConfigDto => {
  const p = activeProvider()
  return { payments_enabled: p !== null, provider: p?.name ?? null, prices: PRICES }
}

/** Tạo đơn + link thanh toán của cổng. appOrigin: gốc URL của app (để cổng chuyển người dùng về trang kết quả) */
export async function createCheckout(userId: string, period: Period, appOrigin: string): Promise<{ order: OrderDto; checkout_url: string }> {
  const provider = activeProvider()
  if (!provider) throw new HttpError(503, 'PAYMENTS_DISABLED')
  if (provider.name !== 'mock' && !process.env.APP_URL) throw new HttpError(503, 'PAYMENTS_DISABLED') // cổng thật cần URL công khai cố định để chuyển người dùng về
  // đang có Pro không thời hạn → không bán thêm
  const subs = await db.select().from(subscriptions).where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
  const live = activeSubscription(subs, new Date())
  if (live && coverageEnd(subs, live) === null) throw new HttpError(409, 'ALREADY_PRO_LIFETIME')

  const price = PRICES[period]
  const expiresAt = new Date(Date.now() + ORDER_TTL_MS)
  let order: typeof proOrders.$inferSelect | undefined
  for (let attempt = 0; !order && attempt < 3; attempt++) {
    try {
      ;[order] = await db
        .insert(proOrders)
        .values({ orderCode: newOrderCode(), userId, period, months: price.months, amountVnd: price.amountVnd, provider: provider.name, expiresAt })
        .returning()
    } catch (err) {
      if (!isUniqueViolation(err) || attempt === 2) throw err // trùng mã đơn (hiếm) → sinh mã khác
    }
  }
  const result = `${appOrigin}/pro/checkout/result?order=${order!.id}`
  const { checkoutUrl, providerRef } = await provider.createCheckout({
    orderCode: order!.orderCode,
    amountVnd: order!.amountVnd,
    description: orderDescription(order!.orderCode),
    returnUrl: result,
    cancelUrl: result,
    expiresAt,
  })
  await db.update(proOrders).set({ checkoutUrl, providerRef }).where(eq(proOrders.id, order!.id))
  return { order: await toDto(order!), checkout_url: checkoutUrl }
}

export async function getOrder(userId: string, id: string): Promise<OrderDto> {
  if (!UUID.test(id)) throw new HttpError(404, 'NOT_FOUND')
  const [o] = await db.select().from(proOrders).where(and(eq(proOrders.id, id), eq(proOrders.userId, userId)))
  if (!o) throw new HttpError(404, 'NOT_FOUND')
  return toDto(o)
}

/** Đơn của chính người dùng (đơn chưa trả vẫn mở lại được link thanh toán khi còn hạn) */
export async function listMyOrders(userId: string): Promise<(OrderDto & { checkout_url: string | null })[]> {
  const rows = await db.select().from(proOrders).where(eq(proOrders.userId, userId)).orderBy(desc(proOrders.createdAt)).limit(20)
  return Promise.all(rows.map(async (o) => ({ ...(await toDto(o)), checkout_url: effectiveStatus(o) === 'pending' ? o.checkoutUrl : null })))
}

export type NoticeResult = 'paid' | 'cancelled' | 'duplicate' | 'unknown_order' | 'amount_mismatch' | 'already_final' | 'lifetime'

/**
 * Xử lý thông báo từ cổng — idempotent:
 *  - (provider, event_id) đã xử lý → bỏ qua
 *  - khoá đơn + dòng users trong 1 transaction; đơn chưa trả (kể cả đã huỷ / quá hạn mà cổng báo đã nhận tiền) → cấp Pro
 *  - số tiền phải khớp đơn, nếu không đánh dấu issue để đối soát và KHÔNG cấp Pro
 */
export async function processNotice(provider: PaymentProvider, n: PaymentNotice): Promise<NoticeResult> {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(proOrders).where(and(eq(proOrders.orderCode, n.orderCode), eq(proOrders.provider, provider.name))).for('update')
    const record = async (result: NoticeResult) => {
      try {
        await tx.insert(paymentEvents).values({ provider: provider.name, eventId: n.eventId, orderId: order?.id ?? null, result, payload: n.payload as object })
      } catch (err) {
        if (isUniqueViolation(err)) throw new DuplicateEvent()
        throw err
      }
      return result
    }
    if (!order) return record('unknown_order')
    if (order.status === 'paid') return record('already_final')
    if (n.result === 'cancelled') {
      if (order.status === 'pending') await tx.update(proOrders).set({ status: 'cancelled' }).where(eq(proOrders.id, order.id))
      return record(order.status === 'pending' ? 'cancelled' : 'already_final')
    }
    // đã huỷ / quá hạn mà cổng báo ĐÃ NHẬN TIỀN (VD người dùng vẫn chuyển khoản QR sau khi bấm huỷ) → vẫn cấp, tiền đã nhận
    if (n.amountVnd !== order.amountVnd) {
      await tx.update(proOrders).set({ issue: 'amount_mismatch' }).where(eq(proOrders.id, order.id))
      return record('amount_mismatch')
    }
    await tx.select({ id: users.id }).from(users).where(eq(users.id, order.userId)).for('update') // tuần tự với cấp tay / đơn khác
    let subId: string | null = null
    try {
      subId = (await grantInTx(tx, order.userId, order.months, { source: 'payment', note: `Đơn ${order.orderCode}` })).id
    } catch (err) {
      if (!(err instanceof HttpError && err.code === 'ALREADY_PRO_LIFETIME')) throw err
    }
    // đã trả nhưng không cấp được (đang có Pro không thời hạn) → đánh dấu cần hoàn tiền
    await tx
      .update(proOrders)
      .set({ status: 'paid', paidAt: new Date(), subscriptionId: subId, issue: subId ? null : 'needs_refund' })
      .where(eq(proOrders.id, order.id))
    return record(subId ? 'paid' : 'lifetime')
  }).catch((err) => {
    if (err instanceof DuplicateEvent) return 'duplicate' as const
    throw err
  })
}

class DuplicateEvent extends Error {}
