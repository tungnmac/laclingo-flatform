// Header bảo mật cho mọi trang: không cho trang khác nhúng (clickjacking), không đoán kiểu file, giới hạn quyền trình
// duyệt — micro chỉ cho chính trang (luyện nói), không camera / vị trí
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(self)' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Docker (apps/laclingo/web/Dockerfile): gom server + đúng phần node_modules cần chạy vào .next/standalone
  output: 'standalone',
  // Không lộ "X-Powered-By: Next.js"
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

module.exports = nextConfig
