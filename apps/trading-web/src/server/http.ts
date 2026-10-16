import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getLocale } from '@/i18n/server'
import { hasKey, translate, type TranslateParams } from '@/i18n/translate'
import { ERROR_PARAMS } from './journal/validation'
import { LEARN_ERROR_PARAMS } from './learn/validation'
import { MarketUnavailableError, UnsupportedMarketError } from './market/types'

/** Lỗi nghiệp vụ trả cho client: `code` ổn định (client tự dịch) + `params` chèn vào câu. */
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    public params?: TranslateParams,
  ) {
    super(code)
  }
}

/** Body lỗi chuẩn: { code, params?, error } — error dịch theo cookie trading_locale của request. */
export function jsonError(status: number, code: string, params?: TranslateParams) {
  const error = translate(getLocale(), `errors.${code}`, params)
  return NextResponse.json(params ? { code, params, error } : { code, error }, { status })
}

const isErrorCode = (msg: string) => /^[A-Z_]+$/.test(msg) && hasKey(`errors.${msg}`)

/** Bọc route handler: map lỗi đã biết sang HTTP status + mã lỗi, lỗi lạ → 500 INTERNAL không lộ chi tiết. */
export function handleRoute<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args)
    } catch (err) {
      if (err instanceof HttpError) return jsonError(err.status, err.code, err.params)
      if (err instanceof ZodError) {
        const issue = err.issues[0]
        const message = issue?.message ?? ''
        if (!isErrorCode(message)) return jsonError(400, 'INVALID_INPUT')
        const fixed = ERROR_PARAMS[message] ?? LEARN_ERROR_PARAMS[message]
        const max = issue?.code === 'too_big' ? Number(issue.maximum) : undefined
        return jsonError(400, message, fixed ?? (max !== undefined ? { max } : undefined))
      }
      if (err instanceof UnsupportedMarketError) return jsonError(400, 'MARKET_UNSUPPORTED', { market: err.market })
      if (err instanceof MarketUnavailableError) return jsonError(503, err.code)
      if (isDbBusy(err)) {
        console.warn('⚠️ db busy:', describeError(err))
        return jsonError(503, 'BUSY')
      }
      console.error('❌ route error:', describeError(err))
      return jsonError(500, 'INTERNAL')
    }
  }
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    throw new HttpError(400, 'INVALID_BODY')
  }
}

/** pg unique violation (drizzle bọc lỗi gốc trong `cause`) */
export function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } }
  return e?.code === '23505' || e?.cause?.code === '23505'
}

/**
 * Mô tả lỗi để LOG — không in nguyên object: lỗi query của drizzle chứa câu SQL KÈM tham số
 * (email, hash mật khẩu…). Chỉ giữ tên, mã lỗi pg, ràng buộc và message của lỗi gốc + stack rút gọn.
 */
export function describeError(err: unknown): string {
  if (!(err instanceof Error)) return String(err)
  const cause = (err as { cause?: { code?: string; constraint?: string; message?: string } }).cause
  if (cause && typeof cause === 'object' && (cause.code || cause.constraint)) {
    const code = cause.code ? (PG_CODE.test(cause.code) ? `pg ${cause.code}` : cause.code) : 'pg ?'
    return `${err.name}: ${code}${cause.constraint ? ` (${cause.constraint})` : ''} — ${cause.message ?? ''}`
  }
  const stack = err.stack?.split('\n').slice(0, 4).join('\n')
  return /failed query/i.test(err.message) ? `${err.name}: query failed` : (stack ?? `${err.name}: ${err.message}`)
}

const PG_CODE = /^[0-9A-Z]{5}$/
// 55P03 lock_not_available (lock_timeout), 57014 query_canceled (statement_timeout), 40P01 deadlock
const BUSY_CODES = new Set(['55P03', '57014', '40P01'])

/** DB quá tải / chờ khoá quá lâu / pool cạn — lỗi tạm thời, client thử lại được (không phải 500) */
export function isDbBusy(err: unknown): boolean {
  const e = err as { code?: string; message?: string; cause?: { code?: string; message?: string } }
  const code = e?.cause?.code ?? e?.code
  if (code && BUSY_CODES.has(code)) return true
  return /timeout exceeded when trying to connect/i.test(`${e?.message ?? ''} ${e?.cause?.message ?? ''}`)
}
