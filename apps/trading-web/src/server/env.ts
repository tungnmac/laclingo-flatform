const DEV_JWT_SECRET = 'trading-dev-secret-do-not-use-in-production'

/** Đọc lúc gọi (không phải lúc import) để `next build` không cần đủ biến môi trường. */
export const env = {
  redisUrl: () => process.env.REDIS_URL || 'redis://localhost:6379',
  binanceBaseUrl: () => process.env.BINANCE_BASE_URL || 'https://data-api.binance.vision',
  /** Không đặt key: dev dùng token `demo` của EODHD (chỉ AAPL/AMZN/TSLA…), production → null (tắt số liệu) */
  eodhdApiKey: () => process.env.EODHD_API_KEY || (process.env.NODE_ENV === 'production' ? null : 'demo'),
  eodhdBaseUrl: () => process.env.EODHD_BASE_URL || 'https://eodhd.com',
}

/**
 * Secret ký session. Secret mặc định (công khai trong mã nguồn) CHỈ dùng khi `next dev` / test — mọi môi trường
 * khác (staging, preview, NODE_ENV trống…) bắt buộc JWT_SECRET; production còn bắt buộc ≥ 32 ký tự.
 */
export function jwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  const env = process.env.NODE_ENV
  if (!secret) {
    if (env !== 'development' && env !== 'test') throw new Error('JWT_SECRET bắt buộc (chỉ `next dev` / test mới dùng secret mặc định)')
    return new TextEncoder().encode(DEV_JWT_SECRET)
  }
  if (env === 'production' && secret.length < 32) throw new Error('JWT_SECRET phải dài tối thiểu 32 ký tự khi NODE_ENV=production')
  return new TextEncoder().encode(secret)
}

/** Cloudflare R2 (ảnh bài học) — cùng tên biến với backend LacLingo; thiếu biến nào → null (tắt upload) */
export function r2Config() {
  const accountId = process.env.R2_ACCOUNT_ID
  const bucket = process.env.R2_BUCKET
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  return accountId && bucket && accessKeyId && secretAccessKey ? { accountId, bucket, accessKeyId, secretAccessKey } : null
}
