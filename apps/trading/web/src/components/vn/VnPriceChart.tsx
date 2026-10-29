'use client'

import { CandlestickSeries, ColorType, createChart, HistogramSeries, type IChartApi, type ISeriesApi, type UTCTimestamp } from 'lightweight-charts'
import { useEffect, useRef, useState } from 'react'
import { DOWN, UP } from '@/components/CandleChart'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { VnCandleDto } from '@/server/vn/repo'

const RANGES = ['3m', '1y', '5y'] as const

/** Nến ngày cổ phiếu VN từ DB (đồng bộ SSI) — không cập nhật realtime */
export function VnPriceChart({ symbol }: { symbol: string }) {
  const { t } = useT()
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<{ chart: IChartApi; candles: ISeriesApi<'Candlestick'>; volume: ISeriesApi<'Histogram'> } | null>(null)
  const [range, setRange] = useState<(typeof RANGES)[number]>('1y')
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading')
  const [error, setError] = useState<unknown>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const chart = createChart(containerRef.current!, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: '#ffffff' }, textColor: '#475569' },
      grid: { vertLines: { color: '#f1f5f9' }, horzLines: { color: '#f1f5f9' } },
    })
    const candles = chart.addSeries(CandlestickSeries, { upColor: UP, downColor: DOWN, borderVisible: false, wickUpColor: UP, wickDownColor: DOWN })
    const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: '' })
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
    chartRef.current = { chart, candles, volume }
    return () => {
      chart.remove()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    api<VnCandleDto[]>(`/api/vn/stocks/${encodeURIComponent(symbol)}/candles?range=${range}`).then(
      (rows) => {
        const c = chartRef.current
        if (cancelled || !c) return
        c.candles.setData(rows.map((r) => ({ time: r.time as UTCTimestamp, open: r.open, high: r.high, low: r.low, close: r.close })))
        c.volume.setData(rows.map((r) => ({ time: r.time as UTCTimestamp, value: r.volume, color: r.close >= r.open ? `${UP}66` : `${DOWN}66` })))
        c.chart.timeScale().fitContent()
        setStatus(rows.length ? 'ready' : 'empty')
      },
      (err) => {
        if (cancelled) return
        setError(err)
        setStatus('error')
      },
    )
    return () => {
      cancelled = true
    }
  }, [symbol, range, retry])

  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
      <div className="mb-2 flex gap-1" role="tablist">
        {RANGES.map((r) => (
          <button
            key={r}
            role="tab"
            aria-selected={r === range}
            onClick={() => setRange(r)}
            className={`rounded-lg px-3 py-1 text-sm font-semibold ${r === range ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {t(`vnStocks.range_${r}`)}
          </button>
        ))}
      </div>
      <div className="relative h-[360px] w-full">
        <div ref={containerRef} className="h-full w-full" />
        {status === 'loading' && <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-slate-500">{t('chart.loading')}</div>}
        {status === 'empty' && <div className="absolute inset-0 flex items-center justify-center bg-white/90 px-4 text-center text-sm text-slate-500">{t('vnStocks.noPrices')}</div>}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/90 text-sm text-rose-700">
            <p>{errorMessage(error, t)}</p>
            <button onClick={() => setRetry((n) => n + 1)} className="font-semibold underline">
              {t('common.retry')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
