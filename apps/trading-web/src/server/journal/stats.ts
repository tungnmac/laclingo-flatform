import { Decimal } from '../trading/decimal'

// Thống kê hiệu suất — HÀM THUẦN (decimal.js), định nghĩa chỉ số xem spec phần 4 §2.

export interface StatTrade {
  symbol: string
  executedAt: number // ms
  realizedPnl: Decimal
  fee: Decimal
  closedQty: Decimal // > 0 = lệnh chốt (giảm vị thế)
}

export interface Metrics {
  total_trades: number
  closing_trades: number
  wins: number
  losses: number
  breakeven: number
  win_rate: string | null
  net_pnl: string
  gross_profit: string
  gross_loss: string
  total_fees: string
  avg_win: string | null
  avg_loss: string | null
  profit_factor: string | null
  expectancy: string | null
  largest_win: string | null
  largest_loss: string | null
  max_drawdown: string
  max_drawdown_pct: string
}

export interface SymbolStats {
  symbol: string
  trades: number
  closing_trades: number
  wins: number
  win_rate: string | null
  net_pnl: string
}

export interface Stats {
  metrics: Metrics
  curve: { time: number; pnl: string }[] // time = unix giây
  by_symbol: SymbolStats[]
}

const ZERO = new Decimal(0)
const money = (d: Decimal) => d.toDecimalPlaces(8).toString()
const pct = (d: Decimal) => d.toFixed(2)
const ratio = (part: number, whole: number) => (whole === 0 ? null : pct(new Decimal(part).div(whole).times(100)))

/** base = mốc vốn cho drawdown (vốn ban đầu + lãi/lỗ trước khoảng lọc, hoặc 10.000 cho "tất cả ví") */
export function computeStats(trades: StatTrade[], base: Decimal): Stats {
  const sorted = [...trades].sort((a, b) => a.executedAt - b.executedAt)

  let wins = 0
  let losses = 0
  let breakeven = 0
  let closing = 0
  let netPnl = ZERO
  let fees = ZERO
  let grossProfit = ZERO
  let grossLoss = ZERO
  let largestWin: Decimal | null = null
  let largestLoss: Decimal | null = null
  let cumulative = ZERO
  let peak = base
  let maxDd = ZERO
  let maxDdPct = ZERO
  const curve: Stats['curve'] = []
  const bySymbol = new Map<string, { trades: number; closing: number; wins: number; net: Decimal }>()

  for (const t of sorted) {
    const net = t.realizedPnl.minus(t.fee)
    netPnl = netPnl.plus(net)
    fees = fees.plus(t.fee)
    const sym = bySymbol.get(t.symbol) ?? { trades: 0, closing: 0, wins: 0, net: ZERO }
    sym.trades += 1
    sym.net = sym.net.plus(net)

    if (t.closedQty.gt(0)) {
      closing += 1
      sym.closing += 1
      if (net.gt(0)) {
        wins += 1
        sym.wins += 1
        grossProfit = grossProfit.plus(net)
      } else if (net.lt(0)) {
        losses += 1
        grossLoss = grossLoss.plus(net)
      } else breakeven += 1
      largestWin = largestWin === null || net.gt(largestWin) ? net : largestWin
      largestLoss = largestLoss === null || net.lt(largestLoss) ? net : largestLoss
    }
    bySymbol.set(t.symbol, sym)

    cumulative = cumulative.plus(net)
    curve.push({ time: Math.floor(t.executedAt / 1000), pnl: money(cumulative) })
    const equity = base.plus(cumulative)
    if (equity.gt(peak)) peak = equity
    const dd = peak.minus(equity)
    if (dd.gt(maxDd)) maxDd = dd
    if (peak.gt(0)) {
      const ddPct = dd.div(peak).times(100)
      if (ddPct.gt(maxDdPct)) maxDdPct = ddPct
    }
  }

  return {
    metrics: {
      total_trades: sorted.length,
      closing_trades: closing,
      wins,
      losses,
      breakeven,
      win_rate: ratio(wins, closing),
      net_pnl: money(netPnl),
      gross_profit: money(grossProfit),
      gross_loss: money(grossLoss),
      total_fees: money(fees),
      avg_win: wins ? money(grossProfit.div(wins)) : null,
      avg_loss: losses ? money(grossLoss.div(losses)) : null,
      profit_factor: grossLoss.isZero() ? null : pct(grossProfit.div(grossLoss.abs())),
      expectancy: closing ? money(netPnl.div(closing)) : null,
      largest_win: largestWin && largestWin.gt(0) ? money(largestWin) : null,
      largest_loss: largestLoss && largestLoss.lt(0) ? money(largestLoss) : null,
      max_drawdown: money(maxDd),
      max_drawdown_pct: pct(maxDdPct),
    },
    curve,
    by_symbol: [...bySymbol.entries()]
      .map(([symbol, s]) => ({ symbol, trades: s.trades, closing_trades: s.closing, wins: s.wins, win_rate: ratio(s.wins, s.closing), net_pnl: money(s.net) }))
      .sort((a, b) => new Decimal(b.net_pnl).cmp(a.net_pnl)),
  }
}
