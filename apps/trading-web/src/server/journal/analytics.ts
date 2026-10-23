import { Decimal } from '../trading/decimal'

// Phân tích nhật ký nâng cao (Pro) — HÀM THUẦN. Chỉ lệnh CHỐT (closing) mới có lãi/lỗ để đánh giá;
// lãi/lỗ ròng = realized − phí (cùng quy ước với stats.ts). Mọi kết luận cần đủ mẫu (MIN_SAMPLE) để tránh "đoán bừa".

export interface AnalyticsTrade {
  id: string
  symbol: string
  executedAt: number // ms
  net: Decimal // realized − phí
  closing: boolean
  liquidation: boolean
  emotion: string | null
  rating: number | null
  tags: string[]
  noted: boolean // có ghi lý do hoặc bài học
}

export interface GroupStat {
  key: string
  closing_trades: number
  wins: number
  win_rate: string | null
  net_pnl: string
  avg_pnl: string | null
}

export interface Comparison {
  closing_trades: number
  win_rate: string | null
  avg_pnl: string | null
}

export type InsightCode =
  | 'NOT_ENOUGH_DATA'
  | 'AFTER_LOSS_WORSE'
  | 'EMOTION_COSTLY'
  | 'OVERTRADING'
  | 'SMALL_WINS_BIG_LOSSES'
  | 'LOSS_STREAK'
  | 'LIQUIDATIONS'
  | 'LOW_NOTES'
  | 'NOTES_HELP'
  | 'BEST_TAG'

export interface Insight {
  code: InsightCode
  severity: 'warn' | 'info' | 'good'
  params: Record<string, string | number>
}

export interface Analytics {
  closing_trades: number
  noted_pct: string | null
  by_emotion: GroupStat[]
  by_tag: GroupStat[]
  by_rating: GroupStat[]
  by_weekday: GroupStat[] // key 1 = Thứ 2 … 7 = Chủ nhật (giờ Việt Nam)
  by_hour: GroupStat[] // key 0–23 (giờ Việt Nam)
  after_loss: { window_minutes: number; after: Comparison; others: Comparison }
  busy_days: { threshold: number; days: number; avg_day_pnl: string | null; other_days: number; other_avg_day_pnl: string | null }
  payoff: { avg_win: string | null; avg_loss: string | null; ratio: string | null }
  max_loss_streak: number
  liquidations: number
  worst: { id: string; symbol: string; executed_at: string; net_pnl: string }[]
  insights: Insight[]
}

export const MIN_SAMPLE = 5
export const AFTER_LOSS_MINUTES = 30
/** Lệnh lỗ cùng mã cách ≤ 60 giây coi là chốt từng phần của CÙNG vị thế, không phải "vào lại sau lỗ" */
const SAME_POSITION_MS = 60_000
const VN_OFFSET_MS = 7 * 3_600_000 // giờ Việt Nam, không có giờ mùa hè
const ZERO = new Decimal(0)
const money = (d: Decimal) => d.toDecimalPlaces(8).toString()
const pct = (part: number, whole: number) => (whole === 0 ? null : new Decimal(part).div(whole).times(100).toFixed(2))

function summarize(trades: AnalyticsTrade[]): { n: number; wins: number; net: Decimal } {
  let wins = 0
  let net = ZERO
  for (const t of trades) {
    net = net.plus(t.net)
    if (t.net.gt(0)) wins += 1
  }
  return { n: trades.length, wins, net }
}

function groupStat(key: string, trades: AnalyticsTrade[]): GroupStat {
  const s = summarize(trades)
  return { key, closing_trades: s.n, wins: s.wins, win_rate: pct(s.wins, s.n), net_pnl: money(s.net), avg_pnl: s.n ? money(s.net.div(s.n)) : null }
}

function compare(trades: AnalyticsTrade[]): Comparison {
  const s = summarize(trades)
  return { closing_trades: s.n, win_rate: pct(s.wins, s.n), avg_pnl: s.n ? money(s.net.div(s.n)) : null }
}

function groupBy(trades: AnalyticsTrade[], keysOf: (t: AnalyticsTrade) => string[]): Map<string, AnalyticsTrade[]> {
  const m = new Map<string, AnalyticsTrade[]>()
  for (const t of trades)
    for (const k of keysOf(t)) {
      const list = m.get(k)
      if (list) list.push(t)
      else m.set(k, [t])
    }
  return m
}

const vnDate = (ms: number) => new Date(ms + VN_OFFSET_MS)
const avg = (s: { n: number; net: Decimal }) => (s.n ? s.net.div(s.n) : null)

/** trades: mọi lệnh trong phạm vi lọc (cả mở và chốt), thứ tự bất kỳ */
export function analyze(trades: AnalyticsTrade[]): Analytics {
  const sorted = [...trades].sort((a, b) => a.executedAt - b.executedAt)
  const closing = sorted.filter((t) => t.closing)
  const n = closing.length

  // ── nhóm ──
  const toStats = (m: Map<string, AnalyticsTrade[]>, order?: (a: GroupStat, b: GroupStat) => number) => {
    const list = [...m.entries()].map(([k, v]) => groupStat(k, v))
    return order ? list.sort(order) : list
  }
  const byCount = (a: GroupStat, b: GroupStat) => b.closing_trades - a.closing_trades || a.key.localeCompare(b.key)
  const byKeyNum = (a: GroupStat, b: GroupStat) => Number(a.key) - Number(b.key)
  const by_emotion = toStats(groupBy(closing, (t) => [t.emotion ?? 'none']), byCount)
  const allTags = toStats(groupBy(closing, (t) => t.tags), byCount)
  const by_tag = allTags.slice(0, 10)
  const by_rating = toStats(groupBy(closing, (t) => (t.rating ? [String(t.rating)] : [])), byKeyNum)
  const by_weekday = toStats(groupBy(closing, (t) => [String(((vnDate(t.executedAt).getUTCDay() + 6) % 7) + 1)]), byKeyNum)
  const by_hour = toStats(groupBy(closing, (t) => [String(vnDate(t.executedAt).getUTCHours())]), byKeyNum)

  // ── lệnh CHỐT trong 30 phút sau một lệnh lỗ (dấu hiệu "gỡ gạc"); đo theo thời điểm chốt — một lượt O(n) ──
  const windowMs = AFTER_LOSS_MINUTES * 60_000
  const losses = closing.filter((t) => t.net.lt(0))
  const after: AnalyticsTrade[] = []
  const others: AnalyticsTrade[] = []
  let from = 0
  for (const t of closing) {
    while (from < losses.length && losses[from].executedAt < t.executedAt - windowMs) from++
    let hit = false
    for (let i = from; i < losses.length && losses[i].executedAt < t.executedAt; i++) {
      const l = losses[i]
      if (l.symbol === t.symbol && t.executedAt - l.executedAt <= SAME_POSITION_MS) continue // chốt từng phần cùng vị thế
      hit = true
      break
    }
    ;(hit ? after : others).push(t)
  }

  // ── ngày giao dịch dồn dập: đếm MỌI lệnh trong ngày; so lãi/lỗ chỉ giữa các ngày CÓ lệnh chốt ──
  const perDay = new Map<string, { count: number; closes: number; net: Decimal }>()
  for (const t of sorted) {
    const day = vnDate(t.executedAt).toISOString().slice(0, 10)
    const d = perDay.get(day) ?? { count: 0, closes: 0, net: ZERO }
    d.count += 1
    if (t.closing) {
      d.closes += 1
      d.net = d.net.plus(t.net)
    }
    perDay.set(day, d)
  }
  const counts = [...perDay.values()].map((d) => d.count).sort((a, b) => a - b)
  const mid = counts.length / 2
  const median = counts.length === 0 ? 0 : counts.length % 2 ? counts[Math.floor(mid)] : (counts[mid - 1] + counts[mid]) / 2
  const threshold = Math.max(Math.ceil(median * 2), Math.ceil(median + 3))
  const closeDays = [...perDay.values()].filter((d) => d.closes > 0)
  const busy = closeDays.filter((d) => d.count >= threshold)
  const calm = closeDays.filter((d) => d.count < threshold)
  const dayAvg = (ds: { net: Decimal }[]) => (ds.length ? ds.reduce((s, d) => s.plus(d.net), ZERO).div(ds.length) : null)
  const busyAvg = dayAvg(busy)
  const calmAvg = dayAvg(calm)

  // ── lãi/lỗ bình quân, chuỗi lỗ ──
  const winsList = closing.filter((t) => t.net.gt(0))
  const lossList = closing.filter((t) => t.net.lt(0))
  const avgWin = winsList.length ? summarize(winsList).net.div(winsList.length) : null
  const avgLoss = lossList.length ? summarize(lossList).net.div(lossList.length) : null
  const payoff = avgWin && avgLoss && !avgLoss.isZero() ? avgWin.div(avgLoss.abs()) : null
  let streak = 0
  let maxStreak = 0
  for (const t of closing) {
    streak = t.net.lt(0) ? streak + 1 : 0
    maxStreak = Math.max(maxStreak, streak)
  }
  const liquidations = sorted.filter((t) => t.liquidation).length
  const noted = closing.filter((t) => t.noted)
  const unnoted = closing.filter((t) => !t.noted)

  // ── nhận định (chỉ khi đủ mẫu) ──
  const insights: Insight[] = []
  const winRate = (ts: AnalyticsTrade[]) => (ts.length ? (ts.filter((t) => t.net.gt(0)).length / ts.length) * 100 : 0)
  if (n < 10) insights.push({ code: 'NOT_ENOUGH_DATA', severity: 'info', params: { n, need: 10 } })
  if (liquidations > 0) insights.push({ code: 'LIQUIDATIONS', severity: 'warn', params: { n: liquidations } })
  if (after.length >= MIN_SAMPLE && others.length >= MIN_SAMPLE) {
    const a = winRate(after)
    const o = winRate(others)
    if (o - a >= 10) insights.push({ code: 'AFTER_LOSS_WORSE', severity: 'warn', params: { n: after.length, minutes: AFTER_LOSS_MINUTES, win_rate: a.toFixed(0), base_win_rate: o.toFixed(0) } })
  }
  const overallAvg = avg(summarize(closing))
  for (const g of by_emotion) {
    if (!['fomo', 'revenge', 'greedy', 'fearful'].includes(g.key) || g.closing_trades < MIN_SAMPLE) continue
    const gAvg = new Decimal(g.avg_pnl!)
    if (gAvg.lt(0) && overallAvg && gAvg.lt(overallAvg)) insights.push({ code: 'EMOTION_COSTLY', severity: 'warn', params: { emotion: g.key, n: g.closing_trades, net_pnl: g.net_pnl } })
  }
  if (busy.length >= 2 && calm.length >= 2 && busyAvg && calmAvg && busyAvg.lt(calmAvg) && busyAvg.lt(0)) {
    insights.push({ code: 'OVERTRADING', severity: 'warn', params: { days: busy.length, threshold, avg_day_pnl: money(busyAvg) } })
  }
  if (n >= 10 && winRate(closing) >= 50 && payoff && payoff.lt(0.8)) {
    insights.push({ code: 'SMALL_WINS_BIG_LOSSES', severity: 'warn', params: { win_rate: winRate(closing).toFixed(0), ratio: payoff.toFixed(2) } })
  }
  if (maxStreak >= 5) insights.push({ code: 'LOSS_STREAK', severity: 'info', params: { n: maxStreak } })
  if (n >= 10 && noted.length / n < 0.3) insights.push({ code: 'LOW_NOTES', severity: 'info', params: { pct: Math.floor((noted.length / n) * 100) } })
  if (noted.length >= MIN_SAMPLE && unnoted.length >= MIN_SAMPLE) {
    const na = avg(summarize(noted))!
    const ua = avg(summarize(unnoted))!
    if (na.gt(ua)) insights.push({ code: 'NOTES_HELP', severity: 'good', params: { noted_avg: money(na), unnoted_avg: money(ua) } })
  }
  const bestTag = allTags.filter((g) => g.closing_trades >= MIN_SAMPLE && new Decimal(g.avg_pnl!).gt(0)).sort((a, b) => new Decimal(b.avg_pnl!).cmp(a.avg_pnl!))[0]
  if (bestTag) insights.push({ code: 'BEST_TAG', severity: 'good', params: { tag: bestTag.key, n: bestTag.closing_trades, avg_pnl: bestTag.avg_pnl! } })

  return {
    closing_trades: n,
    noted_pct: pct(noted.length, n),
    by_emotion,
    by_tag,
    by_rating,
    by_weekday,
    by_hour,
    after_loss: { window_minutes: AFTER_LOSS_MINUTES, after: compare(after), others: compare(others) },
    busy_days: { threshold, days: busy.length, avg_day_pnl: busyAvg ? money(busyAvg) : null, other_days: calm.length, other_avg_day_pnl: calmAvg ? money(calmAvg) : null },
    payoff: { avg_win: avgWin ? money(avgWin) : null, avg_loss: avgLoss ? money(avgLoss) : null, ratio: payoff ? payoff.toFixed(2) : null },
    max_loss_streak: maxStreak,
    liquidations,
    worst: [...lossList]
      .sort((a, b) => a.net.cmp(b.net))
      .slice(0, 5)
      .map((t) => ({ id: t.id, symbol: t.symbol, executed_at: new Date(t.executedAt).toISOString(), net_pnl: money(t.net) })),
    insights,
  }
}
