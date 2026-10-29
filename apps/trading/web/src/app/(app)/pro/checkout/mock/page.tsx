'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { safeNextPath } from '@/lib/safe-next'

export default function MockGatewayPage() {
  return (
    <Suspense>
      <MockGateway />
    </Suspense>
  )
}

/** Màn hình cổng thanh toán GIẢ LẬP (chỉ môi trường thử nghiệm — API từ chối khi không bật cổng mock) */
function MockGateway() {
  const { t } = useT()
  const q = useSearchParams()
  const orderCode = Number(q.get('order_code'))
  const back = (key: 'return' | 'cancel') => {
    // chỉ chuyển về đường dẫn trong app (chống open redirect)
    const raw = q.get(key) ?? ''
    let path = '/pro'
    try {
      const u = new URL(raw, window.location.origin)
      if (u.origin === window.location.origin) path = u.pathname + u.search
    } catch {
      // giữ /pro
    }
    return safeNextPath(path)
  }
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  const act = async (result: 'paid' | 'cancelled') => {
    setBusy(true)
    setError(null)
    try {
      await api('/api/payments/mock/simulate', { method: 'POST', body: JSON.stringify({ order_code: orderCode, result }) })
      window.location.assign(back(result === 'paid' ? 'return' : 'cancel'))
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 py-6">
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 ring-1 ring-amber-200">{t('pro.mockBanner')}</p>
      <div className="space-y-4 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-500">{t('pro.mockOrder', { code: orderCode })}</p>
        <div className="mx-auto grid h-40 w-40 place-items-center rounded-xl bg-slate-100 text-xs text-slate-400">QR</div>
        {error !== null && <p className="text-sm text-rose-700">{errorMessage(error, t)}</p>}
        <div className="flex justify-center gap-2">
          <button onClick={() => act('paid')} disabled={busy} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            {t('pro.mockPay')}
          </button>
          <button onClick={() => act('cancelled')} disabled={busy} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-50">
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
