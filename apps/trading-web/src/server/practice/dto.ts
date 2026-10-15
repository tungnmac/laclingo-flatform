import type { AccountSnapshot, OrderDto, PositionDto } from '../trading/account-service'
import { D, toApi } from '../trading/decimal'
import { computeEquity, emptyPos, liquidationPrice } from '../trading/engine'
import { currentIndex, currentPrice, equity, PRACTICE_BALANCE, reservedTotal, type PracticeResult, type PracticeState, type PracticeTrade } from './session'
import { fakeTime, type PracticeInterval } from './time'

export interface ChartCandleDto {
  time: number // giây, thời gian GIẢ
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface PracticeTradeDto {
  candle_index: number
  side: string
  qty: string
  price: string
  fee: string
  realized_pnl: string
  kind: string
}

export interface SessionDto {
  id: string
  symbol: string
  interval: string
  context: number
  length: number
  cursor: number
  status: string
  candles: ChartCandleDto[]
  account: AccountSnapshot
  trades: PracticeTradeDto[]
  liquidation_price: string | null
  result: PracticeResult | null
}

export interface OrderResponseDto {
  order: { price: string | null }
  trade?: { qty: string; price: string }
  session: SessionDto
}

/** CHỈ trả nến đã lộ (context + cursor) với thời gian giả — không lộ tương lai / ngày thật khi phiên đang chạy */
export function toSessionDto(
  row: { id: string; interval: string; status: string; result: unknown },
  s: PracticeState,
  trades: PracticeTrade[],
): SessionDto {
  const interval = row.interval as PracticeInterval
  const revealed = s.candles.slice(0, s.context + s.cursor)
  const mark = currentPrice(s)
  const pos = s.wallet.positions[s.symbol] ?? emptyPos()
  const eq = equity(s)
  const pnl = eq.minus(PRACTICE_BALANCE)
  const liq = liquidationPrice(pos)
  const protection = (type: string) => s.orders.find((o) => o.type === type)?.price ?? null

  const positions: PositionDto[] = pos.qty.isZero()
    ? []
    : [
        {
          market: 'crypto',
          symbol: s.symbol,
          side: pos.qty.gt(0) ? 'long' : 'short',
          qty: toApi(pos.qty.abs()),
          avg_price: toApi(pos.avgPrice),
          margin: toApi(pos.margin),
          mark_price: toApi(mark),
          unrealized_pnl: toApi(
            computeEquity({ cash: D(0), positions: { [s.symbol]: pos } }, D(0), { [s.symbol]: mark })
              .minus(computeEquity({ cash: D(0), positions: { [s.symbol]: pos } }, D(0), { [s.symbol]: pos.avgPrice }))
              .toDecimalPlaces(8),
          ),
          realized_pnl: toApi(pos.realizedPnl),
          liquidation_price: liq ? toApi(liq.toDecimalPlaces(8)) : null,
          stop_loss: protection('stop_loss') ? toApi(protection('stop_loss')!) : null,
          take_profit: protection('take_profit') ? toApi(protection('take_profit')!) : null,
        },
      ]

  const openOrders: OrderDto[] = s.orders.map((o) => ({
    id: o.id,
    market: 'crypto',
    symbol: s.symbol,
    side: o.side,
    type: o.type,
    qty: o.qty ? toApi(o.qty) : null,
    price: toApi(o.price),
    reserved: toApi(o.reserved),
    status: 'pending',
    oco_group: o.ocoGroup,
    created_at: new Date(fakeTime(currentIndex(s), interval) * 1000).toISOString(),
    filled_at: null,
    fill_price: null,
    fee: '0',
  }))

  return {
    id: row.id,
    symbol: s.symbol,
    interval,
    context: s.context,
    length: s.length,
    cursor: s.cursor,
    status: row.status,
    candles: revealed.map((c, i) => ({
      time: fakeTime(i, interval),
      open: c.open.toNumber(),
      high: c.high.toNumber(),
      low: c.low.toNumber(),
      close: c.close.toNumber(),
      volume: c.volume.toNumber(),
    })),
    account: {
      account: {
        id: row.id,
        cash: toApi(s.wallet.cash.toDecimalPlaces(8)),
        reserved: toApi(reservedTotal(s).toDecimalPlaces(8)),
        equity: toApi(eq.toDecimalPlaces(8)),
        starting_balance: toApi(PRACTICE_BALANCE),
        pnl: toApi(pnl.toDecimalPlaces(8)),
        pnl_pct: pnl.div(PRACTICE_BALANCE).times(100).toFixed(2),
      },
      positions,
      open_orders: openOrders,
      settlement_delayed: false,
    },
    trades: trades.map((t) => ({
      candle_index: t.candleIndex,
      side: t.side,
      qty: toApi(t.qty),
      price: toApi(t.price),
      fee: toApi(t.fee.toDecimalPlaces(8)),
      realized_pnl: toApi(t.realizedPnl.toDecimalPlaces(8)),
      kind: t.kind,
    })),
    liquidation_price: liq ? toApi(liq.toDecimalPlaces(8)) : null,
    result: row.status === 'finished' ? (row.result as PracticeResult) : null,
  }
}
