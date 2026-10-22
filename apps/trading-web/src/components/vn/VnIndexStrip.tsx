'use client'

import { AreaSeries, ColorType, createChart, type IChartApi, type ISeriesApi, type UTCTimestamp } from 'lightweight-charts'
import { useEffect, useRef, useState } from 'react'
import { DOWN, UP } from '@/components/CandleChart'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { DASH, formatNumber } from '@/lib/company-format'
import { errorMessage } from '@/lib/error-message'
import type { VnIndexDto, VnIndexPointDto } from '@/server/vn/repo'
import type { VnIndexCode } from '@/server/vn/types'

const RANGES = ['3m', '1y', '5y'] as const
const tone = (n: number | null) => (n === null ? 'text-slate-500' : n > 0 ? 'text-emerald-600' : n < 0 ? 'text-rose-600' : 'text-amber-600')

/** Dải chỉ số VN-Index · VN30 · HNX-Index · UPCOM-Index; bấm thẻ để xem biểu đồ (mặc định VN30) */
export function VnIndexStrip() {
  const { t, locale } = useT()
  const [items, setItems] = useState<VnIndexDto[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [retry, setRetry] = useState(0)
  const [selected, setSelected] = useState<VnIndexCode>('VN30')

  useEffect(() => {
    let alive = true
    setError(null)
    api<VnIndexDto[]>('/api/vn/indexes').then(
      (d) => alive && setItems(d),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [retry])

  if (error !== null) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
        <span>{errorMessage(error, t)}</span>
        <button onClick={() => setRetry((n) => n + 1)} className="font-semibold underline">
          {t('common.retry')}
        </button>
      </div>
    )
  }
  if (!items) return <p className="py-4 text-center text-sm text-slate-400">{t('common.loading')}</p>
  // chưa đồng bộ chỉ số nào → không chiếm chỗ, chỉ nhắc 1 dòng
  if (items.every((i) => i.value === null)) return <p className="text-xs text-slate-500">{t('vnStocks.indexesNotSynced')}</p>

  const sel = items.find((i) => i.code === selected)
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="tablist">
        {items.map((i) => (
          <button
            key={i.code}
            role="tab"
            aria-selected={i.code === selected}
            onClick={() => setSelected(i.code)}
            className={`rounded-xl bg-white p-3 text-left shadow-sm ring-1 ${i.code === selected ? 'ring-2 ring-emerald-500' : 'ring-slate-200 hover:ring-slate-300'}`}
          >
            <p className="text-xs font-semibold text-slate-500">{i.name}</p>
            <p className="mt-1 text-lg font-bold tabular-nums">{formatNumber(i.value, locale, 2)}</p>
            <p className={`text-xs font-semibold tabular-nums ${tone(i.change)}`} title={i.date ?? undefined}>
              {i.change === null ? DASH : `${i.change > 0 ? '+' : ''}${formatNumber(i.change, locale, 2)} (${i.change > 0 ? '+' : ''}${formatNumber(i.change_pct, locale, 2)}%)`}
            </p>
          </button>
        ))}
      </div>
      {sel && <IndexChart code={sel.code} name={sel.name} />}
    </div>
  )
}

function IndexChart({ code, name }: { code: VnIndexCode; name: string }) {
  const { t } = useT()
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<{ chart: IChartApi; area: ISeriesApi<'Area'> } | null>(null)
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
    const area = chart.addSeries(AreaSeries, { lineColor: UP, topColor: `${UP}44`, bottomColor: `${UP}05`, lineWidth: 2 })
    chartRef.current = { chart, area }
    return () => {
      chart.remove()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    api<VnIndexPointDto[]>(`/api/vn/indexes/${code}?range=${range}`).then(
      (rows) => {
        const c = chartRef.current
        if (cancelled || !c) return
        // màu theo xu hướng cả khoảng: đầu → cuối
        const color = rows.length > 1 && rows[rows.length - 1].value < rows[0].value ? DOWN : UP
        c.area.applyOptions({ lineColor: color, topColor: `${color}44`, bottomColor: `${color}05` })
        c.area.setData(rows.map((r) => ({ time: r.time as UTCTimestamp, value: r.value })))
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
  }, [code, range, retry])

  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700">{name}</p>
        <div className="flex gap-1" role="tablist">
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
      </div>
      <div className="relative h-[260px] w-full">
        <div ref={containerRef} className="h-full w-full" />
        {status === 'loading' && <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-slate-500">{t('chart.loading')}</div>}
        {status === 'empty' && <div className="absolute inset-0 flex items-center justify-center bg-white/90 text-sm text-slate-500">{t('vnStocks.noIndexHistory')}</div>}
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
