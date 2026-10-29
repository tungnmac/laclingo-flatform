/** Phiên bản app mobile trong User-Agent (capacitor.config.ts: appendUserAgent `TradeLabApp/x.y.z`); null = không phải app */
export function appVersionFromUserAgent(ua: string): string | null {
  return /\bTradeLabApp\/(\d{1,4}\.\d{1,4}\.\d{1,4})\b/.exec(ua)?.[1] ?? null
}

/** So sánh phiên bản dạng x.y.z: < 0 nếu a cũ hơn b */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return (pa[i] ?? 0) - (pb[i] ?? 0)
  return 0
}

/** none = bản mới nhất / không phải app · optional = có bản mới (bỏ qua được) · required = cũ hơn bản tối thiểu */
export function updateNeed(current: string | null, s: { latest_version: string | null; min_version: string | null }): 'none' | 'optional' | 'required' {
  if (!current) return 'none'
  if (s.min_version && compareVersions(current, s.min_version) < 0) return 'required'
  if (s.latest_version && compareVersions(current, s.latest_version) < 0) return 'optional'
  return 'none'
}
