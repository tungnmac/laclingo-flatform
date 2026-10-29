import { desc, sql } from 'drizzle-orm'
import { emailOtpProvider } from '../auth/email-otp'
import { phoneOtpConfig } from '../auth/phone-otp'
import { activeProvider } from '../billing/providers'
import { redisPing } from '../cache/redis'
import { db } from '../db/client'
import { vnSyncRuns } from '../db/schema'
import { env, r2Config, ssiConfig, vietcapConfig } from '../env'
import { createBinanceProvider } from '../market/providers/binance'
import { createMexcProvider } from '../market/providers/mexc'
import { cryptoSourceInUse } from '../market/registry'

/** ok = gọi thử thành công · error = gọi thử lỗi · on = đã cấu hình (không gọi thử: tốn hạn mức / không có API kiểm tra) · off = chưa cấu hình */
export type SourceState = 'ok' | 'error' | 'on' | 'off'

export interface SourceCheckDto {
  key: string
  state: SourceState
  latency_ms: number | null
  /** Ghi chú ngắn: lỗi gọi thử, chế độ (mock / demo), lần đồng bộ gần nhất… — không bao giờ chứa giá trị bí mật */
  detail: string | null
}

export interface SourcesDto {
  checked_at: string
  crypto_source: 'binance' | 'mexc'
  checks: SourceCheckDto[]
  /** Chỉ TÊN biến + đã đặt hay chưa — không trả giá trị */
  env: { name: string; set: boolean }[]
}

const TIMEOUT_MS = 6000

/** Tên các biến môi trường app đọc (theo .env.example) — để admin biết còn thiếu biến nào */
const ENV_NAMES = [
  'DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'APP_URL', 'APP_HOSTS', 'CLIENT_IP_HEADER', 'TRUSTED_PROXY_HOPS', 'DB_POOL_MAX',
  'BINANCE_BASE_URL', 'MEXC_BASE_URL', 'EODHD_API_KEY', 'EODHD_BASE_URL',
  'SSI_CONSUMER_ID', 'SSI_CONSUMER_SECRET', 'SSI_FC_DATA_URL', 'SSI_RPM', 'VN_UNOFFICIAL_SOURCES', 'VIETCAP_IQ_URL', 'VIETCAP_RPM',
  'FIREBASE_API_KEY', 'FIREBASE_AUTH_DOMAIN', 'FIREBASE_PROJECT_ID', 'BREVO_API_KEY', 'EMAIL_FROM', 'EMAIL_FROM_NAME', 'EMAIL_OTP_DAILY_CAP',
  'OTP_RESEND_SECONDS', 'OTP_TTL_SECONDS', 'PAYMENTS_PROVIDER', 'PAYMENT_MOCK_SECRET',
  'R2_ACCOUNT_ID', 'R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY',
]

/** Gọi thử có giới hạn thời gian; lỗi → state 'error' + thông báo lỗi (đã cắt ngắn) */
async function probe(key: string, fn: () => Promise<string | null>): Promise<SourceCheckDto> {
  const started = Date.now()
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`timeout ${TIMEOUT_MS / 1000}s`)), TIMEOUT_MS)
    })
    const detail = await Promise.race([fn(), timeout])
    return { key, state: 'ok', latency_ms: Date.now() - started, detail }
  } catch (err) {
    return { key, state: 'error', latency_ms: Date.now() - started, detail: (err as Error).message.slice(0, 200) }
  } finally {
    clearTimeout(timer)
  }
}

const configured = (key: string, on: boolean, detail: string | null = null): SourceCheckDto => ({ key, state: on ? 'on' : 'off', latency_ms: null, detail })

const btcPrice = async (p: ReturnType<typeof createBinanceProvider>) => {
  const [q] = await p.getQuotes(['BTCUSDT'])
  if (!q) throw new Error('BTCUSDT: không có dữ liệu')
  return `BTC ${q.price}`
}

export async function checkSources(): Promise<SourcesDto> {
  const lastVnSync = async () => {
    const [run] = await db.select().from(vnSyncRuns).orderBy(desc(vnSyncRuns.startedAt)).limit(1)
    return run ? `${run.job} · ${run.status} · ${run.startedAt.toISOString()}` : null
  }
  const eodhd = env.eodhdApiKey()
  const phone = phoneOtpConfig()
  const email = emailOtpProvider()
  const payments = activeProvider()

  const checks = await Promise.all([
    probe('database', async () => (await db.execute(sql`select 1`), null)),
    probe('redis', async () => (await redisPing(), null)),
    probe('binance', () => btcPrice(createBinanceProvider())),
    probe('mexc', () => btcPrice(createMexcProvider())),
    Promise.resolve(configured('eodhd', eodhd !== null, eodhd === 'demo' ? 'demo' : null)),
    lastVnSync().then(
      (last) => configured('ssi', ssiConfig() !== null, last),
      () => configured('ssi', ssiConfig() !== null),
    ),
    Promise.resolve(configured('vietcap', vietcapConfig() !== null)),
    Promise.resolve(configured('phone_otp', phone !== null, phone?.provider ?? null)),
    Promise.resolve(configured('email_otp', email !== null, email)),
    Promise.resolve(configured('payments', payments !== null, payments?.name ?? null)),
    Promise.resolve(configured('r2', r2Config() !== null)),
  ])

  return {
    checked_at: new Date().toISOString(),
    crypto_source: cryptoSourceInUse(),
    checks,
    env: ENV_NAMES.map((name) => ({ name, set: Boolean(process.env[name]) })),
  }
}
