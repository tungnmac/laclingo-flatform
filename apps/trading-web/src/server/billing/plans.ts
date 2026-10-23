// Gói & quyền theo tính năng — dùng chung client/server (không import module server ở đây)

export const PLANS = ['free', 'pro'] as const
export type Plan = (typeof PLANS)[number]

/** Tính năng trả phí. Pro bán phân tích & dữ liệu — KHÔNG bán đòn bẩy hay tiền ảo (xem docs/business/trading-monetization-strategy.md) */
export const FEATURES = ['journal_analytics', 'vn_data_pro', 'backtest'] as const
export type Feature = (typeof FEATURES)[number]

const PLAN_FEATURES: Record<Plan, readonly Feature[]> = { free: [], pro: FEATURES }

export const featuresOf = (plan: Plan): Feature[] => [...PLAN_FEATURES[plan]]
export const hasFeature = (plan: Plan, feature: Feature) => PLAN_FEATURES[plan].includes(feature)

export const SUBSCRIPTION_STATUSES = ['active', 'canceled'] as const
export const SUBSCRIPTION_SOURCES = ['admin', 'payment', 'org'] as const
export const GRANT_MONTHS = [1, 3, 6, 12, 24] as const

interface PeriodRow {
  status: string
  startsAt: Date
  endsAt: Date | null
}

/** Thuê bao còn hiệu lực tại `now`: đang active, đã bắt đầu, chưa hết hạn (null = không thời hạn). Nhiều dòng → dòng hết hạn muộn nhất */
export function activeSubscription<T extends PeriodRow>(rows: T[], now: Date): T | null {
  const live = rows.filter((r) => r.status === 'active' && r.startsAt <= now && (r.endsAt === null || r.endsAt > now))
  if (live.length === 0) return null
  return live.reduce((a, b) => (a.endsAt === null ? a : b.endsAt === null || b.endsAt > a.endsAt ? b : a))
}

/** Ngày Pro thực sự hết: nối các kỳ active liền nhau sau kỳ đang hiệu lực (gia hạn tạo kỳ mới bắt đầu đúng lúc kỳ cũ hết). null = không thời hạn */
export function coverageEnd<T extends PeriodRow>(rows: T[], live: T): Date | null {
  let end = live.endsAt
  for (let changed = true; changed && end !== null; ) {
    changed = false
    for (const r of rows) {
      if (r.status !== 'active' || r.startsAt > end! || (r.endsAt !== null && r.endsAt <= end!)) continue
      end = r.endsAt
      changed = true
      if (end === null) break
    }
  }
  return end
}

/** Cộng tháng theo lịch (UTC); ngày 31 + 1 tháng → ngày cuối tháng sau */
export function addMonths(d: Date, months: number): Date {
  const x = new Date(d)
  const day = x.getUTCDate()
  x.setUTCDate(1)
  x.setUTCMonth(x.getUTCMonth() + months)
  const last = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0)).getUTCDate()
  x.setUTCDate(Math.min(day, last))
  return x
}

/**
 * Kỳ cấp mới (null nếu đang có Pro không thời hạn): đang có Pro → nối tiếp ngay sau ngày Pro thực sự hết (gia hạn); không có Pro lúc này → bắt đầu ngay.
 * Kỳ tương lai không liền với hiện tại (VD kỳ trước nó đã bị thu hồi) bị bỏ qua — cấp là phải có hiệu lực từ bây giờ.
 */
export function grantPeriod<T extends PeriodRow>(rows: T[], now: Date, months: number): { startsAt: Date; endsAt: Date } | null {
  const live = activeSubscription(rows, now)
  if (!live) return { startsAt: now, endsAt: addMonths(now, months) }
  const end = coverageEnd(rows, live)
  return end === null ? null : { startsAt: end, endsAt: addMonths(end, months) } // null = đang có Pro không thời hạn, cấp thêm vô nghĩa
}
