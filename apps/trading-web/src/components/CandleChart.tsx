'use client'

import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts'
import { useEffect, useRef, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { Candle, Interval } from '@/server/market/types'

const UP = '#10b981'
const DOWN = '#ef4444'
const toBar = (c: Candle) => ({ time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close })
const toVolume = (c: Candle) => ({ time: c.time as UTCTimestamp, value: c.volume, color: c.close >= c.open ? `${UP}66` : `${DOWN}66` })

/** Nến + khối lượng; tải lại nến mỗi 60 s, nến cuối cập nhật theo livePrice (poll giá 3 s ở trang cha). */
export function CandleChart({ symbol, interval, livePrice }: { symbol: string; interval: Interval; livePrice: number | null }) {
  const { t } = useT()
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<{ chart: IChartApi; candles: ISeriesApi<'Candlestick'>; volume: ISeriesApi<'Histogram'> } | null>(null)
  const lastCandle = useRef<Candle | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<unknown>(null)
  const [stale, setStale] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const chart = createChart(containerRef.current!, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: '#ffffff' }, textColor: '#475569' },
      grid: { vertLines: { color: '#f1f5f9' }, horzLines: { color: '#f1f5f9' } },
      timeScale: { timeVisible: true, secondsVisible: false },
    })
    const candles = chart.addSeries(CandlestickSeries, {
      upColor: UP,
      downColor: DOWN,
      borderVisible: false,
      wickUpColor: UP,
      wickDownColor: DOWN,
    })
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
    const load = async (first: boolean) => {
      if (first) setStatus('loading')
      try {
        const res = await api<{ candles: Candle[]; stale: boolean }>(
          `/api/market/candles?market=crypto&symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=300`,
        )
        const c = chartRef.current
        if (cancelled || !c) return
        c.candles.setData(res.candles.map(toBar))
        c.volume.setData(res.candles.map(toVolume))
        if (first) c.chart.timeScale().fitContent()
        lastCandle.current = res.candles[res.candles.length - 1] ?? null
        setStale(res.stale)
        setError(null)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setError(err)
        if (first) setStatus('error')
      }
    }
    void load(true)
    const timer = setInterval(() => void load(false), 60_000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [symbol, interval, retry])

  useEffect(() => {
    const last = lastCandle.current
    if (!last || livePrice == null || !chartRef.current) return
    const next = { ...last, close: livePrice, high: Math.max(last.high, livePrice), low: Math.min(last.low, livePrice) }
    lastCandle.current = next
    chartRef.current.candles.update(toBar(next))
  }, [livePrice])

  return (
    <div className="relative h-[420px] w-full">
      <div ref={containerRef} className="h-full w-full" />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-slate-500">{t('chart.loading')}</div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/90 text-sm text-rose-700">
          <p>{errorMessage(error, t)}</p>
          <button onClick={() => setRetry((r) => r + 1)} className="font-semibold underline">
            {t('common.retry')}
          </button>
        </div>
      )}
      {stale && status === 'ready' && (
        <p className="absolute left-2 top-2 rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-800 ring-1 ring-amber-200">
          {t('chart.stale')}
        </p>
      )}
    </div>
  )
}
