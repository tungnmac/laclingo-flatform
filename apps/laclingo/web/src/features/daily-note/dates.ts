// Ngày dạng YYYY-MM-DD (theo lịch, không múi giờ) — cộng/trừ bằng UTC để không lệch ngày
export const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export const monthOf = (date: string) => date.slice(0, 7)

export const addMonths = (month: string, n: number) => {
  const d = new Date(`${month}-01T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + n)
  return d.toISOString().slice(0, 7)
}

/** Các ô lịch của tháng (YYYY-MM): null = ô trống đầu tuần; tuần bắt đầu Thứ 2 */
export function monthCells(month: string): (string | null)[] {
  const first = new Date(`${month}-01T00:00:00Z`)
  const lead = (first.getUTCDay() + 6) % 7
  const days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate()
  return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)]
}
