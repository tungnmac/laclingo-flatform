'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { pnlColor } from '@/components/trading/labels'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import type { SessionSummaryDto } from '@/server/practice/practice-service'

const PAGE_SIZE = 20
const pct = (v: string | null | undefined) => (v == null ? '—' : `${Number(v) > 0 ? '+' : ''}${v}%`)

export function PracticeHistory({ refreshKey }: { refreshKey: number }) {
  const { t, locale } = useT()
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ items: SessionSummaryDto[]; total: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    api<{ items: SessionSummaryDto[]; total: number }>(`/api/practice/sessions?page=${page}`).then(
      (d) => !cancelled && setData(d),
      () => {},
    )
    return () => {
      cancelled = true
    }
  }, [page, refreshKey])

  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' })
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">{t('practice.history')}</h2>
      {!data ? (
        <p className="px-4 py-6 text-center text-sm text-slate-400">{t('common.loading')}</p>
      ) : data.items.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-400">{t('practice.noHistory')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">{t('practice.colSymbol')}</th>
                <th className="px-4 py-2">{t('practice.colInterval')}</th>
                <th className="px-4 py-2 text-right">{t('practice.colReturn')}</th>
                <th className="px-4 py-2 text-right">{t('practice.colBuyHold')}</th>
                <th className="px-4 py-2 text-right">{t('practice.colWinRate')}</th>
                <th className="px-4 py-2">{t('practice.colDate')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((s) => (
                <tr key={s.id} onClick={() => router.push(`/practice/${s.id}`)} className="cursor-pointer hover:bg-slate-50">
                  <td className="px-4 py-2 font-semibold">{s.symbol}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {s.interval} · {s.candles_played}/{s.length}
                  </td>
                  <td className={`px-4 py-2 text-right font-semibold tabular-nums ${pnlColor(s.result?.return_pct ?? '0')}`}>{pct(s.result?.return_pct)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-600">{pct(s.result?.buy_hold_pct)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{s.result?.win_rate ? `${s.result.win_rate}%` : '—'}</td>
                  <td className="px-4 py-2 text-slate-500">{date.format(new Date(s.finished_at ?? s.created_at))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-2 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded px-2 py-1 ring-1 ring-slate-200 disabled:opacity-40">
            ← {t('common.prev')}
          </button>
          <span className="tabular-nums text-slate-500">
            {page}/{pages}
          </span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded px-2 py-1 ring-1 ring-slate-200 disabled:opacity-40">
            {t('common.next')} →
          </button>
        </div>
      )}
    </section>
  )
}
