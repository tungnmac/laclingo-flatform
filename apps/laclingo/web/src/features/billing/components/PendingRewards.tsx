'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/ToastProvider'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { GemReward, WalletResponse } from '@/types/api'
import { billingService } from '../billing.service'
import { useRewardsCount } from '../rewardsStore'

/** Quà gems chờ nhận (nhiệm vụ, thắng thử thách, lên level) + cách kiếm gems — bấm Nhận để cộng vào ví */
export function PendingRewards({ onClaimed }: { onClaimed: (wallet: WalletResponse) => void }) {
  const t = useTranslation()
  const b = t.billing
  const toast = useToast()
  const setCount = useRewardsCount((s) => s.set)
  const { data, reload } = useApi(() => billingService.rewards(), [])
  useEffect(() => {
    if (data) setCount(data.count) // badge menu theo đúng danh sách vừa tải
  }, [data, setCount])
  const [busy, setBusy] = useState<string | null>(null) // id quà đang nhận / 'all'
  const [error, setError] = useState<string | null>(null)

  const claim = async (key: string, action: () => Promise<WalletResponse>) => {
    setBusy(key)
    setError(null)
    try {
      const wallet = await action()
      onClaimed(wallet)
      toast(b.claimedToast(wallet.claimed ?? 0)) // số server thật sự cộng (có thể gồm quà mới phát sinh)
    } catch (err) {
      setError(inlineError(err))
    } finally {
      setBusy(null)
      reload()
    }
  }

  if (!data) return null
  return (
    <Card className="space-y-3 ring-1 ring-orange-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">{b.rewardsTitle}</h2>
        {data.count > 0 && (
          <Button size="sm" disabled={busy !== null} onClick={() => void claim('all', () => billingService.claimAllRewards())}>
            {b.claimAll(data.total)}
          </Button>
        )}
      </div>
      {data.items.length === 0 ? (
        <p className="text-sm text-slate-500">{b.rewardsEmpty}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {data.items.map((r: GemReward) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{b.rewardSources[r.source]}</p>
                <p className="truncate text-xs text-slate-500">
                  {r.note} · {formatDate(r.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-semibold tabular-nums text-sky-600">+{r.amount} 💎</span>
                <Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => void claim(r.id, () => billingService.claimReward(r.id))}>
                  {b.claim}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <p className="font-semibold text-slate-700">{b.howToEarnTitle}</p>
        <ul className="mt-1 space-y-0.5">
          {b.howToEarn(data.settings).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
