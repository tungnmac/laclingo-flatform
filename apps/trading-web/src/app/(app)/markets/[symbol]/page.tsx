'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ChangeBadge } from '@/components/ChangeBadge'
import { usePolling } from '@/hooks/usePolling'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { formatCompact, formatPrice } from '@/lib/format'
import type { InstrumentDto } from '@/server/market/instruments'
import { INTERVALS, type Interval, type Quote } from '@/server/market/types'

// lightweight-charts cần DOM — chỉ render phía client
const CandleChart = dynamic(() => import('@/components/CandleChart').then((m) => m.CandleChart), { ssr: false })

export default function InstrumentPage({ params }: { params: { symbol: string } }) {
  const symbol = decodeURIComponent(params.symbol).toUpperCase()
  const { t } = useT()
  const [instrument, setInstrument] = useState<InstrumentDto | null | undefined>(undefined)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [stale, setStale] = useState(false)
  // setInterval_ (không phải setInterval) để không che hàm global setInterval
  const [interval, setInterval_] = useState<Interval>('1h')

  useEffect(() => {
    api<InstrumentDto[]>('/api/market/instruments?market=crypto')
      .then((list) => setInstrument(list.find((i) => i.symbol === symbol) ?? null))
      .catch(() => setInstrument(null))
  }, [symbol])

  usePolling(
    async () => {
      if (!instrument) return
      try {
        const res = await api<{ quotes: Quote[]; stale: boolean }>(`/api/market/quotes?market=crypto&symbols=${symbol}`)
        setQuote(res.quotes[0] ?? null)
        setStale(res.stale)
      } catch {
        setStale(true)
      }
    },
    3000,
    [instrument, symbol],
  )

  if (instrument === undefined) return <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>
  if (instrument === null)
    return (
      <div className="py-10 text-center">
        <p className="text-slate-600">{t('markets.notFound', { symbol })}</p>
        <Link href="/markets" className="mt-2 inline-block font-semibold text-emerald-700 hover:underline">
          {t('markets.backHome')}
        </Link>
      </div>
    )

  return (
    <div className="space-y-4">
      <Link href="/markets" className="text-sm text-slate-500 hover:text-emerald-700">
        {t('markets.back')}
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {instrument.base}
            <span className="text-slate-400">/{instrument.quote}</span>{' '}
            <span className="text-base font-normal text-slate-500">{instrument.name}</span>
          </h1>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-3xl font-bold tabular-nums">{quote ? formatPrice(quote.price) : '—'}</span>
            {quote && <ChangeBadge pct={quote.change24hPct} />}
          </div>
          {quote && (
            <p className="mt-1 text-xs text-slate-500">
              {t('markets.stats', {
                high: formatPrice(quote.high24h),
                low: formatPrice(quote.low24h),
                volume: formatCompact(quote.volume24h),
                quote: instrument.quote,
              })}
            </p>
          )}
          {stale && <p className="mt-1 text-xs text-amber-700">{t('markets.staleShort')}</p>}
        </div>
        <button
          disabled
          title="Sắp ra mắt"
          className="cursor-not-allowed rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white opacity-50"
        >
          Đặt lệnh · Sắp ra mắt
        </button>
      </div>

      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <div className="mb-2 flex gap-1">
          {INTERVALS.map((iv) => (
            <button
              key={iv}
              onClick={() => setInterval_(iv)}
              aria-pressed={interval === iv}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${interval === iv ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {iv}
            </button>
          ))}
        </div>
        <CandleChart symbol={symbol} interval={interval} livePrice={quote?.price ?? null} />
      </div>
    </div>
  )
}
