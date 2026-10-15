import dynamic from 'next/dynamic'
import type { ChartLine } from '@/components/CandleChart'
import type { TFunction } from '@/i18n/I18nProvider'
import type { SessionDto } from '@/server/practice/dto'
import type { ReplayMarker } from './ReplayChart'

/** lightweight-charts cần DOM → chỉ tải ở client */
export const ReplayChart = dynamic(() => import('./ReplayChart').then((m) => m.ReplayChart), { ssr: false })

export function chartLines(session: SessionDto, t: TFunction): ChartLine[] {
  const p = session.account.positions[0]
  if (!p) return []
  return [
    { price: Number(p.avg_price), color: '#64748b', title: t('chart.entry') },
    ...(p.stop_loss ? [{ price: Number(p.stop_loss), color: '#ef4444', title: t('chart.stopLoss') }] : []),
    ...(p.take_profit ? [{ price: Number(p.take_profit), color: '#10b981', title: t('chart.takeProfit') }] : []),
    ...(p.liquidation_price ? [{ price: Number(p.liquidation_price), color: '#f59e0b', title: t('chart.liquidation') }] : []),
  ]
}

export const chartMarkers = (session: SessionDto): ReplayMarker[] =>
  session.trades.map((tr) => ({ index: tr.candle_index, side: tr.side as 'buy' | 'sell', kind: tr.kind }))
