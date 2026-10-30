import { NextResponse, type NextRequest } from 'next/server'

// Content-Security-Policy cho mọi trang: chỉ chạy script của chính web (nonce mới mỗi request + 'strict-dynamic' cho các
// chunk Next tự nạp) — có lỗi XSS thì script chèn vào cũng không chạy, không đọc được token trong localStorage. Kết nối
// chỉ tới API (+ WebSocket thách đấu) nên script lạ có lọt cũng khó gửi dữ liệu ra ngoài. Next tự gắn nonce cho script
// của framework khi request mang header CSP; script riêng (theme ở app/layout.tsx) đọc nonce qua header x-nonce.
const api = new URL(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1')
const wsOrigin = `${api.protocol === 'https:' ? 'wss' : 'ws'}://${api.host}`
const dev = process.env.NODE_ENV === 'development'

function contentSecurityPolicy(nonce: string) {
  return [
    "default-src 'self'",
    // dev: React Refresh / Next dev dùng eval
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    // style={{...}} của React, thư viện chèn style — rủi ro thấp, giữ unsafe-inline
    "style-src 'self' 'unsafe-inline'",
    // Ảnh từ vựng / avatar / blog / audio bài nghe có thể ở domain ngoài (R2 presigned, link admin nhập)
    "img-src 'self' https: data: blob:",
    "media-src 'self' https: data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${api.origin} ${wsOrigin}`,
    // Video YouTube nhúng trong bài blog (bluemonday chỉ cho iframe YouTube)
    'frame-src https://www.youtube.com https://www.youtube-nocookie.com',
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
}

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID())
  const csp = contentSecurityPolicy(nonce)
  const headers = new Headers(request.headers)
  headers.set('x-nonce', nonce)
  headers.set('Content-Security-Policy', csp)
  const response = NextResponse.next({ request: { headers } })
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  // Chỉ trang HTML: bỏ file tĩnh (đã có header ở next.config.js) và request prefetch của router
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|sw.js|offline.html|.*\\.(?:png|svg|jpg|jpeg|webp|ico|webmanifest|txt|xml)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
