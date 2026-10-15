'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChangeBadge } from '@/components/ChangeBadge'
import { usePolling } from '@/hooks/usePolling'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { formatCompact, formatPrice } from '@/lib/format'
import type { InstrumentDto } from '@/server/market/instruments'
import type { Quote } from '@/server/market/types'

export default function MarketsPage() {
  const router = useRouter()
  const { t } = useT()
  const [instruments, setInstruments] = useState<InstrumentDto[] | null>(null)
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [stale, setStale] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    api<InstrumentDto[]>('/api/market/instruments?market=crypto')
      .then(setInstruments)
      .catch(setError)
  }, [retry])

  usePolling(
    async () => {
      if (!instruments?.length) return
      try {
        const symbols = instruments.map((i) => i.symbol).join(',')
        const res = await api<{ quotes: Quote[]; stale: boolean }>(`/api/market/quotes?market=crypto&symbols=${symbols}`)
        setQuotes(Object.fromEntries(res.quotes.map((q) => [q.symbol, q])))
        setStale(res.stale)
        setError(null)
      } catch (err) {
        setError(err)
      }
    },
    3000,
    [instruments, retry],
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('markets.title')}</h1>
        <p className="text-sm text-slate-500">{t('markets.subtitle')}</p>
      </div>

      {stale && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
          {t('markets.staleWarning')}
        </p>
      )}
      {error !== null && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          <span>{errorMessage(error, t)}</span>
          <button onClick={() => setRetry((r) => r + 1)} className="font-semibold underline">
            {t('common.retry')}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">{t('markets.colSymbol')}</th>
              <th className="px-4 py-3 text-right">{t('markets.colPrice')}</th>
              <th className="px-4 py-3 text-right">{t('markets.col24h')}</th>
              <th className="hidden px-4 py-3 text-right sm:table-cell">{t('markets.colHighLow')}</th>
              <th className="hidden px-4 py-3 text-right md:table-cell">{t('markets.colVolume')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!instruments && error === null && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  {t('common.loading')}
                </td>
              </tr>
            )}
            {instruments?.map((ins) => {
              const q = quotes[ins.symbol]
              return (
                <tr key={ins.symbol} onClick={() => router.push(`/markets/${ins.symbol}`)} className="cursor-pointer hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold">
                      {ins.base}
                      <span className="text-slate-400">/{ins.quote}</span>
                    </p>
                    <p className="text-xs text-slate-500">{ins.name}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{q ? formatPrice(q.price) : '—'}</td>
                  <td className="px-4 py-3 text-right">{q ? <ChangeBadge pct={q.change24hPct} /> : '—'}</td>
                  <td className="hidden px-4 py-3 text-right tabular-nums text-slate-600 sm:table-cell">
                    {q ? `${formatPrice(q.high24h)} / ${formatPrice(q.low24h)}` : '—'}
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums text-slate-600 md:table-cell">
                    {q ? formatCompact(q.volume24h) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
