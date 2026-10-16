// Không import gì của server (middleware chạy ở edge runtime).

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const BODY_TYPES = ['application/json', 'multipart/form-data']

/**
 * Chặn request ghi dữ liệu không xuất phát từ chính app (CSRF) — bổ sung cho cookie SameSite=Lax,
 * vốn KHÔNG chặn được request từ subdomain cùng site. Trả lý do bị chặn, hoặc null nếu hợp lệ.
 *  - Sec-Fetch-Site (trình duyệt tự đặt, trang khác không giả được): chỉ nhận same-origin / none
 *  - Origin (nếu có) phải cùng host với app — so host chứ không so cả origin: sau reverse proxy kết thúc TLS,
 *    app thấy http:// trong khi trình duyệt gửi https://
 *  - Có body thì phải là JSON hoặc multipart: form HTML `text/plain` / urlencoded của trang lạ bị từ chối
 */
export function csrfViolation(method: string, headers: Headers, allowedHosts: string[] = appHosts()): string | null {
  if (SAFE_METHODS.has(method.toUpperCase())) return null
  const site = headers.get('sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return `sec-fetch-site ${site}`
  const origin = headers.get('origin')
  if (origin) {
    // APP_HOSTS (khuyên dùng khi chạy sau proxy đổi Host) — không có thì tin X-Forwarded-Host / Host
    const hosts = allowedHosts.length ? allowedHosts : [headers.get('x-forwarded-host')?.split(',')[0].trim() || headers.get('host') || '']
    const host = hostOf(origin)
    if (!host || !hosts.includes(host)) return 'origin mismatch'
  }
  const type = headers.get('content-type')?.split(';')[0].trim().toLowerCase()
  if (type && !BODY_TYPES.includes(type)) return `content-type ${type}`
  return null
}

function hostOf(origin: string): string | null {
  try {
    return new URL(origin).host
  } catch {
    return null
  }
}

/** APP_HOSTS="trade.example.com,www.trade.example.com" — host hợp lệ của app (kèm cổng nếu có) */
function appHosts(): string[] {
  return (process.env.APP_HOSTS ?? '').split(',').map((h) => h.trim().toLowerCase()).filter(Boolean)
}
