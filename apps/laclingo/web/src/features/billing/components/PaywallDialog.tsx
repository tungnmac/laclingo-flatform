'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'
import { PAYWALL_EVENT } from '@/lib/api'
import type { LimitErrorDetail } from '@/types/api'

/** Màn mời nâng cấp Pro — hiện khi API báo gói Free hết lượt hôm nay (402 pro_required, xem apiFetch) */
export function PaywallDialog() {
  const t = useTranslation()
  const router = useRouter()
  const [detail, setDetail] = useState<LimitErrorDetail | null>(null)

  useEffect(() => {
    const onPaywall = (e: Event) => setDetail((e as CustomEvent<LimitErrorDetail>).detail)
    window.addEventListener(PAYWALL_EVENT, onPaywall)
    return () => window.removeEventListener(PAYWALL_EVENT, onPaywall)
  }, [])
  useEffect(() => {
    if (!detail) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDetail(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detail])

  if (!detail) return null
  return (
    <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" onClick={() => setDetail(null)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
      >
        <p className="text-4xl" aria-hidden>
          ⭐
        </p>
        <h3 id="paywall-title" className="mt-2 text-lg font-bold text-slate-900">
          {t.billing.paywallTitle}
        </h3>
        <p className="mt-2 text-sm text-slate-600">{t.billing.paywallBody(detail.feature, detail.limit)}</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse sm:justify-center">
          <Button
            autoFocus
            onClick={() => {
              setDetail(null)
              router.push('/pricing')
            }}
          >
            {t.billing.viewPlans}
          </Button>
          <Button variant="secondary" onClick={() => setDetail(null)}>
            {t.billing.later}
          </Button>
        </div>
      </div>
    </div>
  )
}
