'use client'

import {
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  HistogramSeries,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts'
import { useEffect, useRef } from 'react'
import { DOWN, UP, type ChartLine } from '@/components/CandleChart'
import { useT } from '@/i18n/I18nProvider'
import type { ChartCandleDto } from '@/server/practice/dto'
import { FAKE_EPOCH, INTERVAL_MS, type PracticeInterval } from '@/server/practice/time'

export interface ReplayMarker {
  index: number
  side: 'buy' | 'sell'
  kind: string
}

/** Biểu đồ replay: dữ liệu qua props (thời gian GIẢ), trục ghi "Nến #n" thay cho ngày giờ */
export function ReplayChart({
  candles,
  context,
  interval,
  lines = [],
  markers = [],
}: {
  candles: ChartCandleDto[]
  context: number
  interval: PracticeInterval
  lines?: ChartLine[]
  markers?: ReplayMarker[]
}) {
  const { t } = useT()
  const containerRef = useRef<HTMLDivElement>(null)
  const ref = useRef<{
    chart: IChartApi
    candles: ISeriesApi<'Candlestick'>
    volume: ISeriesApi<'Histogram'>
    markers: ISeriesMarkersPluginApi<Time>
  } | null>(null)
  const shown = useRef(0)
  const step = INTERVAL_MS[interval] / 1000
  const label = (time: Time) => t('practice.candle', { n: Math.round(((time as number) - FAKE_EPOCH) / step) - context + 1 })
  const labelRef = useRef(label)
  labelRef.current = label

  useEffect(() => {
    const chart = createChart(containerRef.current!, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: '#ffffff' }, textColor: '#475569' },
      grid: { vertLines: { color: '#f1f5f9' }, horzLines: { color: '#f1f5f9' } },
      timeScale: { tickMarkFormatter: (time: Time) => labelRef.current(time) },
      localization: { timeFormatter: (time: Time) => labelRef.current(time) },
    })
    const series = chart.addSeries(CandlestickSeries, { upColor: UP, downColor: DOWN, borderVisible: false, wickUpColor: UP, wickDownColor: DOWN })
    const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: '' })
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
    ref.current = { chart, candles: series, volume, markers: createSeriesMarkers(series, []) }
    shown.current = 0
    return () => {
      chart.remove()
      ref.current = null
    }
  }, [])

  useEffect(() => {
    const r = ref.current
    if (!r) return
    r.candles.setData(candles.map((c) => ({ time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close })))
    r.volume.setData(candles.map((c) => ({ time: c.time as UTCTimestamp, value: c.volume, color: c.close >= c.open ? `${UP}66` : `${DOWN}66` })))
    // Lần đầu (hoặc phiên mới ít nến hơn) → vừa khung; khi tua → giữ mức zoom, cuộn tới nến mới nhất
    if (shown.current === 0 || candles.length < shown.current) r.chart.timeScale().fitContent()
    else r.chart.timeScale().scrollToRealTime()
    shown.current = candles.length
  }, [candles])

  const markersKey = JSON.stringify(markers)
  useEffect(() => {
    const r = ref.current
    if (!r) return
    r.markers.setMarkers(
      (JSON.parse(markersKey) as ReplayMarker[])
        .filter((m) => m.index < candles.length)
        .sort((a, b) => a.index - b.index)
        .map((m) => ({
          time: (FAKE_EPOCH + m.index * step) as UTCTimestamp,
          position: m.side === 'buy' ? ('belowBar' as const) : ('aboveBar' as const),
          shape: m.side === 'buy' ? ('arrowUp' as const) : ('arrowDown' as const),
          color: m.kind === 'liquidation' ? '#f59e0b' : m.side === 'buy' ? UP : DOWN,
          text: m.kind === 'liquidation' ? t('chart.liquidation') : '',
        })),
    )
  }, [markersKey, candles.length, step, t])

  const linesKey = JSON.stringify(lines)
  useEffect(() => {
    const series = ref.current?.candles
    if (!series) return
    const created: IPriceLine[] = (JSON.parse(linesKey) as ChartLine[]).map((l) =>
      series.createPriceLine({ price: l.price, color: l.color, title: l.title, lineWidth: 1, lineStyle: 2, axisLabelVisible: true }),
    )
    return () => created.forEach((line) => series.removePriceLine(line))
  }, [linesKey])

  return <div ref={containerRef} className="h-[420px] w-full" />
}
