import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { MarketUnavailableError, UnsupportedMarketError } from './market/types'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export const jsonError = (status: number, message: string) => NextResponse.json({ error: message }, { status })

/** Bọc route handler: map lỗi đã biết sang HTTP status, lỗi lạ → 500 không lộ chi tiết. */
export function handleRoute<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args)
    } catch (err) {
      if (err instanceof HttpError) return jsonError(err.status, err.message)
      if (err instanceof ZodError) return jsonError(400, err.issues[0]?.message ?? 'Dữ liệu không hợp lệ')
      if (err instanceof UnsupportedMarketError) return jsonError(400, err.message)
      if (err instanceof MarketUnavailableError) return jsonError(503, err.message)
      console.error('❌ route error:', err)
      return jsonError(500, 'Lỗi hệ thống')
    }
  }
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    throw new HttpError(400, 'Body không hợp lệ')
  }
}

/** pg unique violation (drizzle bọc lỗi gốc trong `cause`) */
export function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } }
  return e?.code === '23505' || e?.cause?.code === '23505'
}
