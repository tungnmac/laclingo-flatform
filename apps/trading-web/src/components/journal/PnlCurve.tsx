'use client'

import { BaselineSeries, ColorType, createChart, type UTCTimestamp } from 'lightweight-charts'
import { useEffect, useRef } from 'react'

/** Đường lãi/lỗ luỹ kế: trên 0 xanh, dưới 0 đỏ. Nhiều trade cùng 1 giây → giữ điểm cuối (chart yêu cầu time tăng dần). */
export function PnlCurve({ points }: { points: { time: number; pnl: string }[] }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const chart = createChart(ref.current!, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: '#ffffff' }, textColor: '#475569' },
      grid: { vertLines: { visible: false }, horzLines: { color: '#f1f5f9' } },
      timeScale: { timeVisible: true, secondsVisible: false },
    })
    const series = chart.addSeries(BaselineSeries, {
      baseValue: { type: 'price', price: 0 },
      topLineColor: '#10b981',
      topFillColor1: 'rgba(16,185,129,0.25)',
      topFillColor2: 'rgba(16,185,129,0.02)',
      bottomLineColor: '#ef4444',
      bottomFillColor1: 'rgba(239,68,68,0.02)',
      bottomFillColor2: 'rgba(239,68,68,0.25)',
    })
    const byTime = new Map<number, number>()
    for (const p of points) byTime.set(p.time, Number(p.pnl))
    series.setData([...byTime.entries()].map(([time, value]) => ({ time: time as UTCTimestamp, value })))
    chart.timeScale().fitContent()
    return () => chart.remove()
  }, [points])

  return <div ref={ref} className="h-64 w-full" />
}
