'use client'

import { useEffect, useState } from 'react'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { billingService } from '@/features/billing/billing.service'
import { useTranslation } from '@/hooks/useTranslation'
import type { PaymentOrder } from '@/types/api'

const POLL_MS = 2000
const POLL_MAX = 30 // ~1 phút — chưa xong thì báo đang xử lý (xem lại ở Ví)

/**
 * Trang kết quả sau khi cổng thanh toán chuyển về: ?order=<id> (+ cancelled=1 khi huỷ ở Stripe, error=invalid khi
 * VNPay trả sai chữ ký). Đơn còn PENDING thì hỏi lại server vài lần (Stripe: server tự tra phiên thanh toán).
 */
export default function PaymentResultPage({ searchParams }: { searchParams: { order?: string; cancelled?: string; error?: string } }) {
  const t = useTranslation()
  const b = t.billing
  const [order, setOrder] = useState<PaymentOrder | null>(null)
  const [gaveUp, setGaveUp] = useState(false)
  const orderId = searchParams.order

  useEffect(() => {
    if (!orderId || searchParams.cancelled) return
    let stop = false
    let tries = 0
    const poll = async () => {
      try {
        const o = await billingService.order(orderId, true)
        if (stop) return
        setOrder(o)
        if (o.status !== 'PENDING') return
      } catch {
        if (stop) return
      }
      if (++tries >= POLL_MAX) return setGaveUp(true)
      setTimeout(() => void poll(), POLL_MS)
    }
    void poll()
    return () => {
      stop = true
    }
  }, [orderId, searchParams.cancelled])

  let icon = '⏳'
  let text = b.resultChecking
  if (!orderId || searchParams.error) [icon, text] = ['⚠️', b.resultInvalid]
  else if (searchParams.cancelled) [icon, text] = ['↩️', b.resultCancelled]
  else if (order?.status === 'PAID') {
    icon = '🎉'
    text = order.item.startsWith('GEMS_') ? b.resultPaidGems(Number(order.item.slice(5))) : b.resultPaidPlan
  } else if (order?.status === 'FAILED') [icon, text] = ['❌', b.resultFailed]
  else if (order?.status === 'CANCELLED') [icon, text] = ['↩️', b.resultCancelled]
  else if (gaveUp) [icon, text] = ['⏳', b.resultPending]

  return (
    <div className="mx-auto max-w-md">
      <Card className="flex flex-col items-center gap-4 py-10 text-center">
        <p className="text-5xl" aria-hidden>
          {icon}
        </p>
        <h1 className="text-xl font-bold text-slate-900">{b.resultTitle}</h1>
        <p className="text-slate-600" role="status">
          {text}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <ButtonLink href="/wallet" variant="secondary">
            {b.toWallet}
          </ButtonLink>
          <ButtonLink href="/pricing">{b.toPricing}</ButtonLink>
        </div>
      </Card>
    </div>
  )
}
