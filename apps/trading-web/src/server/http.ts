import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getLocale } from '@/i18n/server'
import { hasKey, translate, type TranslateParams } from '@/i18n/translate'
import { ERROR_PARAMS } from './journal/validation'
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
        const message = err.issues[0]?.message ?? ''
        return isErrorCode(message) ? jsonError(400, message, ERROR_PARAMS[message]) : jsonError(400, 'INVALID_INPUT')
      }
      if (err instanceof UnsupportedMarketError) return jsonError(400, 'MARKET_UNSUPPORTED', { market: err.market })
      if (err instanceof MarketUnavailableError) return jsonError(503, err.code)
      console.error('❌ route error:', err)
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
