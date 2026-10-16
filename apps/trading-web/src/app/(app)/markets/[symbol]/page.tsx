'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useState, use } from 'react'
import type { ChartLine } from '@/components/CandleChart'
import { ChangeBadge } from '@/components/ChangeBadge'
import { OrderPanel } from '@/components/trading/OrderPanel'
import { SymbolPositionCard } from '@/components/trading/SymbolPositionCard'
import { useAccount } from '@/hooks/useAccount'
import { usePolling } from '@/hooks/usePolling'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { formatCompact, formatPrice } from '@/lib/format'
import type { InstrumentDto } from '@/server/market/instruments'
import { INTERVALS, type Interval, type Quote } from '@/server/market/types'

// lightweight-charts cần DOM — chỉ render phía client
const CandleChart = dynamic(() => import('@/components/CandleChart').then((m) => m.CandleChart), { ssr: false })

export default function InstrumentPage(props: { params: Promise<{ symbol: string }> }) {
  const params = use(props.params)
  const symbol = decodeURIComponent(params.symbol).toUpperCase()
  const { t } = useT()
  const [instrument, setInstrument] = useState<InstrumentDto | null | undefined>(undefined)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [stale, setStale] = useState(false)
  // setInterval_ (không phải setInterval) để không che hàm global setInterval
  const [interval, setInterval_] = useState<Interval>('1h')
  const account = useAccount()

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

  const position = account.data?.positions.find((p) => p.symbol === symbol)
  const chartLines: ChartLine[] = position
    ? [
        { price: Number(position.avg_price), color: '#64748b', title: t('chart.entry') },
        ...(position.stop_loss ? [{ price: Number(position.stop_loss), color: '#ef4444', title: t('chart.stopLoss') }] : []),
        ...(position.take_profit ? [{ price: Number(position.take_profit), color: '#10b981', title: t('chart.takeProfit') }] : []),
        ...(position.liquidation_price ? [{ price: Number(position.liquidation_price), color: '#f59e0b', title: t('chart.liquidation') }] : []),
      ]
    : []

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
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
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
        <CandleChart symbol={symbol} interval={interval} livePrice={quote?.price ?? null} lines={chartLines} />
      </div>
          <SymbolPositionCard symbol={symbol} base={instrument.base} account={account.data} onChanged={account.reload} />
        </div>
        <div className="lg:sticky lg:top-20 lg:self-start">
          <OrderPanel
            symbol={symbol}
            base={instrument.base}
            markPrice={quote?.price ?? null}
            account={account.data}
            onPlaced={account.reload}
          />
        </div>
      </div>
    </div>
  )
}
