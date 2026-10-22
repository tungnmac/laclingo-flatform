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

/** SSI FastConnect Data (nguồn chính thức: danh mục mã + nến ngày) — thiếu key → null (tắt đồng bộ SSI) */
export function ssiConfig() {
  const consumerId = process.env.SSI_CONSUMER_ID
  const consumerSecret = process.env.SSI_CONSUMER_SECRET
  if (!consumerId || !consumerSecret) return null
  return { consumerId, consumerSecret, baseUrl: process.env.SSI_FC_DATA_URL || 'https://fc-data.ssi.com.vn/api/v2' }
}

/**
 * Nguồn KHÔNG chính thức (API công khai của Vietcap: hồ sơ công ty, BCTC, chỉ số) — mặc định TẮT.
 * Chỉ bật cho môi trường nội bộ (VN_UNOFFICIAL_SOURCES=1); API có thể đổi bất kỳ lúc nào.
 */
export const vietcapConfig = () =>
  process.env.VN_UNOFFICIAL_SOURCES === '1' ? { baseUrl: process.env.VIETCAP_IQ_URL || 'https://iq.vietcap.com.vn/api/iq-insight-service/v1' } : null

