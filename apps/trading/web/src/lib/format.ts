/** Số chữ số thập phân theo độ lớn: ≥1000 → 2; ≥1 → 2–4; <1 → tối đa 6. */
export function formatPrice(n: number): string {
  const abs = Math.abs(n)
  const max = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: max })
}

export const formatPct = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(2)}%`

export function formatCompact(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`
  return n.toFixed(2)
}
