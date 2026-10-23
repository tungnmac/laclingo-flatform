'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { PlanStatus } from '@/types/api'
import { billingService } from '../billing.service'

/** Dòng tên gói: "Free" / "Pro đến 23/11/2026" / "Pro trọn đời" */
export function planLabel(status: PlanStatus, t: ReturnType<typeof useTranslation>) {
  if (!status.is_pro) return t.billing.freePlan
  const exp = status.subscription?.expires_at
  if (status.subscription && !exp) return t.billing.proLifetime
  return exp ? t.billing.proUntil(formatDate(exp)) : t.billing.proName
}

/** Gói của học viên (hồ sơ): gói hiện tại, lượt dùng hôm nay, Streak Freeze, nút nâng cấp */
export function PlanSummary() {
  const t = useTranslation()
  const { data: status } = useApi(() => billingService.me(), [])
  if (!status) return null

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{t.billing.yourPlan}</p>
          <p className={cn('text-lg font-bold', status.is_pro ? 'text-amber-600' : 'text-slate-900')}>
            {status.is_pro && '⭐ '}
            {planLabel(status, t)}
          </p>
          {status.staff && !status.subscription && <p className="text-xs text-slate-500">{t.billing.staffNote}</p>}
        </div>
        {!status.is_pro && (
          <Link href="/pricing" className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-400">
            {t.billing.upgradeCta}
          </Link>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">{t.billing.usageTitle}</p>
        <ul className="mt-1 space-y-1.5">
          {status.usage.map((u) => (
            <li key={u.feature} className="text-sm">
              <div className="flex justify-between text-slate-600">
                <span>{t.billing.features[u.feature]}</span>
                <span className="tabular-nums">{t.billing.usageValue(u.used, u.limit)}</span>
              </div>
              {u.limit > 0 && (
                <div className="mt-0.5 h-1.5 rounded-full bg-slate-100">
                  <div
                    className={cn('h-1.5 rounded-full', u.used >= u.limit ? 'bg-rose-500' : 'bg-indigo-500')}
                    style={{ width: `${Math.min(100, Math.round((u.used / u.limit) * 100))}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-sm text-slate-600" title={t.billing.streakFreezeHint}>
        {t.billing.streakFreezes(status.streak_freezes)}
        <span className="mt-0.5 block text-xs text-slate-400">{t.billing.streakFreezeHint}</span>
      </p>
    </Card>
  )
}
