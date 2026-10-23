'use client'

import { useT } from '@/i18n/I18nProvider'
import type { ContestState } from '@/server/contests/rules'

const CLASS: Record<ContestState, string> = {
  live: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  upcoming: 'bg-sky-50 text-sky-700 ring-sky-200',
  ended: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export function StateBadge({ state }: { state: ContestState }) {
  const { t } = useT()
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${CLASS[state]}`}>{t(`contests.state_${state}`)}</span>
}

/** Ngày giờ theo giờ Việt Nam (giải diễn ra theo giờ VN) */
export const fmtDateTime = (iso: string, locale: string) =>
  new Date(iso).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'medium', timeStyle: 'short' })
