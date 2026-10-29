'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { formatVnd } from '@/lib/vnd'
import type { OrderDto } from '@/server/billing/checkout-service'

const POLL_MS = 2000
const MAX_POLLS = 60 // ~2 phút; quá lâu thì hướng dẫn xem lại sau

export default function CheckoutResultPage() {
  return (
    <Suspense>
      <Result />
    </Suspense>
  )
}

/** Trang cổng chuyển người dùng về — chờ webhook xác nhận (không tin tham số trên URL) */
function Result() {
  const { t, locale } = useT()
  const id = useSearchParams().get('order') ?? ''
  const [order, setOrder] = useState<OrderDto | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [polls, setPolls] = useState(0)

  useEffect(() => {
    if (!id) return
    let alive = true
    let n = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const tick = async () => {
      n += 1
      try {
        const o = await api<OrderDto>(`/api/billing/orders/${encodeURIComponent(id)}`)
        if (!alive) return
        setOrder(o)
        setError(null)
        setPolls(n)
        if (o.status !== 'pending') return
      } catch (err) {
        if (!alive) return
        setError(err) // lỗi mạng tạm thời: vẫn thử lại
      }
      if (n < MAX_POLLS) timer = setTimeout(tick, POLL_MS)
    }
    void tick()
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [id])

  const date = (iso: string) => new Date(iso).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', { timeZone: 'Asia/Ho_Chi_Minh' })

  return (
    <div className="mx-auto max-w-md space-y-4 py-8 text-center">
      {error !== null && <p className="text-rose-700">{errorMessage(error, t)}</p>}
      {!order && error === null && <p className="text-slate-400">{t('common.loading')}</p>}
      {order && (
        <div className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200" aria-live="polite">
          <p className="text-sm text-slate-500">
            #{order.order_code} · {formatVnd(order.amount_vnd, locale)}
          </p>
          {order.status === 'paid' && order.issue === 'needs_refund' && <p className="text-slate-700">{t('pro.needsRefund')}</p>}
          {order.status === 'paid' && order.issue !== 'needs_refund' && (
            <>
              <p className="text-2xl">🎉</p>
              <p className="text-lg font-bold">{t('pro.paidTitle')}</p>
              {order.pro_until && <p className="text-sm text-slate-600">{t('pro.paidUntil', { date: date(order.pro_until) })}</p>}
            </>
          )}
          {order.status === 'pending' && <p className="text-slate-600">{t(polls >= MAX_POLLS ? 'pro.pendingLong' : 'pro.pending')}</p>}
          {order.status === 'cancelled' && <p className="text-slate-600">{t('pro.cancelledMsg')}</p>}
          {order.status === 'expired' && <p className="text-slate-600">{t('pro.expiredMsg')}</p>}
          {/* tải lại toàn trang để huy hiệu PRO trên menu cập nhật */}
          <Link href="/pro" onClick={(e) => (e.preventDefault(), window.location.assign('/pro'))} className="inline-block font-semibold text-emerald-700 hover:underline">
            {t('pro.backToPro')}
          </Link>
        </div>
      )}
    </div>
  )
}
