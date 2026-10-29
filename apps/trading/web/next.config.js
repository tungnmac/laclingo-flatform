const isDev = process.env.NODE_ENV !== 'production'

// Next chèn script inline để hydrate → cần 'unsafe-inline' (chưa dùng nonce); `next dev` cần thêm 'unsafe-eval'.
// Firebase Phone Auth (OTP đăng ký): reCAPTCHA + API Google Identity Toolkit.
// Ảnh: bài học (presigned R2) và logo doanh nghiệp (EODHD) là https bên ngoài.
// auth domain riêng (không phải *.firebaseapp.com) — đọc lúc build, Render có sẵn env khi build
const firebaseAuthDomain = process.env.FIREBASE_AUTH_DOMAIN ? ` https://${process.env.FIREBASE_AUTH_DOMAIN}` : ''

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://apis.google.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? ' ws:' : ''} https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.google.com`,
  // reCAPTCHA ẩn của Firebase Phone Auth (chống spam SMS) chạy trong iframe
  `frame-src https://www.google.com https://www.recaptcha.net https://*.firebaseapp.com${firebaseAuthDomain}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'", // chống clickjacking (nhúng trang vào iframe để lừa bấm Reset ví / đặt lệnh)
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Không includeSubDomains: domain gốc có thể dùng chung với hệ thống khác chưa chạy https
  ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }]),
]

module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}
