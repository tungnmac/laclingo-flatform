import { NextResponse } from 'next/server'
import { processNotice } from '@/server/billing/checkout-service'
import { providerByName } from '@/server/billing/providers'
import { describeError } from '@/server/http'

export const dynamic = 'force-dynamic'

/**
 * Webhook từ cổng thanh toán (máy chủ ↔ máy chủ, không có phiên người dùng) — tin cậy dựa trên chữ ký của cổng.
 * Luôn trả 200 khi đã xác thực được (kể cả trùng / không khớp) để cổng không gửi lại vô hạn; lỗi chữ ký → 400.
 */
export async function POST(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const provider = providerByName((await ctx.params).provider)
  if (!provider) return NextResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
  let notice
  try {
    notice = await provider.parseWebhook(req)
  } catch (err) {
    console.warn(`⚠️ webhook ${provider.name}: rejected (${(err as Error).name})`) // không in nội dung (có thể chứa dữ liệu người trả)
    return NextResponse.json({ code: 'INVALID_SIGNATURE' }, { status: 400 })
  }
  try {
    const result = await processNotice(provider, notice)
    if (result !== 'paid' && result !== 'cancelled' && result !== 'duplicate') console.warn(`⚠️ webhook ${provider.name} order ${notice.orderCode}: ${result}`)
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    // không log lỗi DB thô (chứa tham số SQL = payload của cổng); 500 → cổng gửi lại sau
    console.error(`❌ webhook ${provider.name} order ${notice.orderCode}:`, describeError(err))
    return NextResponse.json({ code: 'INTERNAL' }, { status: 500 })
  }
}
