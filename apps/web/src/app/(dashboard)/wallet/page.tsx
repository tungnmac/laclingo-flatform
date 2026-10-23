'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState, Spinner } from '@/components/ui/States'
import { useToast } from '@/components/ui/ToastProvider'
import { billingService } from '@/features/billing/billing.service'
import { CheckoutButtons } from '@/features/billing/components/CheckoutButtons'
import { formatAmount } from '@/features/billing/pricing'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'
import type { WalletResponse } from '@/types/api'

/** Ví gems: số dư, Streak Freeze (mua bằng gems), nạp gems, lịch sử gems + thanh toán */
export default function WalletPage() {
  const t = useTranslation()
  const b = t.billing
  const toast = useToast()
  const walletApi = useApi(() => billingService.wallet(), [])
  const { data: catalog } = useApi(() => billingService.catalog(), [])
  const { data: orders } = useApi(() => billingService.orders(), [])
  const [wallet, setWallet] = useState<WalletResponse | null>(null)
  const w = wallet ?? walletApi.data
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buyFreeze = async () => {
    setBusy(true)
    setError(null)
    try {
      setWallet(await billingService.buyStreakFreeze())
      toast(b.freezeBought)
    } catch (err) {
      setError(inlineError(err))
    } finally {
      setBusy(false)
    }
  }

  if (walletApi.error) return <ErrorState error={walletApi.error} onRetry={walletApi.reload} />
  if (!w) return <Spinner />
  const canBuy = w.gems >= w.streak_freeze_gem_cost && w.streak_freezes < w.max_streak_freezes

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <PageHeader title={b.walletTitle} description={b.walletSubtitle} />

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{b.gemsBalance}</p>
          <p className="text-4xl font-extrabold text-sky-600">💎 {w.gems.toLocaleString()}</p>
          <p className="mt-1 text-sm text-slate-600">{b.freezesHave(w.streak_freezes, w.max_streak_freezes)}</p>
          <p className="text-xs text-slate-400">{b.streakFreezeHint}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button disabled={busy || !canBuy} onClick={() => void buyFreeze()}>
            {b.buyFreeze(w.streak_freeze_gem_cost)}
          </Button>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
      </Card>

      {catalog && (
        <Card className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{b.gemPacksTitle}</h2>
            <p className="text-xs text-slate-500">{b.gemsHint}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {catalog.items
              .filter((i) => i.kind === 'gems')
              .map((item) => (
                <div key={item.id} className="flex flex-col gap-2 rounded-xl bg-sky-50 p-3 text-center ring-1 ring-inset ring-sky-100">
                  <p className="text-2xl font-bold text-sky-700">💎 {b.items[item.id]}</p>
                  <CheckoutButtons item={item} providers={catalog.providers} compact />
                </div>
              ))}
          </div>
        </Card>
      )}

      <Card className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900">{b.historyTitle}</h2>
        {w.transactions.length === 0 ? (
          <p className="text-sm text-slate-500">{b.noHistory}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {w.transactions.map((tx, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800">{b.reasons[tx.reason]}</p>
                  <p className="truncate text-xs text-slate-500">
                    {tx.note} · {formatDate(tx.created_at)}
                  </p>
                </div>
                <span className={cn('shrink-0 font-semibold tabular-nums', tx.delta > 0 ? 'text-emerald-600' : 'text-rose-600')}>
                  {tx.delta > 0 ? '+' : ''}
                  {tx.delta} 💎
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900">{b.paymentsTitle}</h2>
        {!orders || orders.length === 0 ? (
          <p className="text-sm text-slate-500">{b.noHistory}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800">
                    {b.items[o.item]} · {o.provider === 'VNPAY' ? 'VNPay' : 'Stripe'}
                  </p>
                  <p className="text-xs text-slate-500">{formatDate(o.created_at)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold tabular-nums text-slate-800">{formatAmount(o.amount, o.currency)}</p>
                  <p className={cn('text-xs', o.status === 'PAID' ? 'text-emerald-600' : 'text-rose-600')}>{b.orderStatus[o.status]}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
