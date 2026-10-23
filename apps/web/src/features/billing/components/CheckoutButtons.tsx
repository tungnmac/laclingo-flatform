'use client'

import { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { CatalogItem, CatalogResponse, PaymentProvider } from '@/types/api'
import { billingService } from '../billing.service'
import { formatProviderPrice } from '../pricing'

/** Nút thanh toán 1 món theo từng cổng đang bật — tạo đơn rồi chuyển trình duyệt sang trang của cổng */
export function CheckoutButtons({ item, providers, compact }: { item: CatalogItem; providers: CatalogResponse['providers']; compact?: boolean }) {
  const t = useTranslation()
  const [busy, setBusy] = useState<PaymentProvider | null>(null)
  const [error, setError] = useState<string | null>(null)
  const enabled: PaymentProvider[] = [...(providers.vnpay ? (['VNPAY'] as const) : []), ...(providers.stripe ? (['STRIPE'] as const) : [])]

  const pay = async (provider: PaymentProvider) => {
    setBusy(provider)
    setError(null)
    try {
      const { url } = await billingService.checkout(item.id, provider)
      window.location.href = url // giữ trạng thái "đang chuyển" tới khi trang cổng mở
    } catch (err) {
      setError(inlineError(err))
      setBusy(null)
    }
  }

  if (enabled.length === 0) return <p className="text-xs text-slate-500">{t.billing.noProvider}</p>
  return (
    <div className="flex flex-col gap-2">
      {enabled.map((p) => (
        <button
          key={p}
          type="button"
          disabled={busy !== null}
          onClick={() => void pay(p)}
          className={cn(
            'rounded-xl px-3 font-semibold transition disabled:opacity-60',
            compact ? 'py-1.5 text-xs' : 'py-2 text-sm',
            p === 'VNPAY' ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-slate-900 text-white hover:bg-slate-700',
          )}
        >
          {busy === p ? t.billing.redirecting : `${p === 'VNPAY' ? t.billing.payVNPay : t.billing.payStripe} · ${formatProviderPrice(item, p)}`}
        </button>
      ))}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  )
}

/** Nút mở trang Stripe quản lý gói tự gia hạn */
export function ManageSubscriptionButton() {
  const t = useTranslation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const open = async () => {
    setBusy(true)
    setError(null)
    try {
      window.location.href = (await billingService.portal()).url
    } catch (err) {
      setError(inlineError(err))
      setBusy(false)
    }
  }
  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => void open()}
        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-60"
      >
        {busy ? t.billing.redirecting : t.billing.manageSubscription}
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </span>
  )
}
