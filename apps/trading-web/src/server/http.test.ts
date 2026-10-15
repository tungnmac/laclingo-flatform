import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

vi.mock('next/headers', () => ({
  cookies: () => ({ get: (n: string) => (n === 'trading_locale' ? { value: 'en' } : undefined) }),
  headers: () => ({ get: () => null }),
}))

const { handleRoute, HttpError } = await import('./http')

describe('handleRoute', () => {
  it('returns code, params and a message in the request locale', async () => {
    const res = await handleRoute(async () => {
      throw new HttpError(400, 'MIN_NOTIONAL', { min: 1 })
    })()
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ code: 'MIN_NOTIONAL', params: { min: 1 }, error: 'Order value must be at least 1 USDT' })
  })
  it('maps zod issues whose message is an error code', async () => {
    const res = await handleRoute(async () => {
      z.string().min(8, 'PASSWORD_TOO_SHORT').parse('x')
      return new Response()
    })()
    expect((await res.json()).code).toBe('PASSWORD_TOO_SHORT')
  })
  it('falls back to INVALID_INPUT for zod messages that are not codes', async () => {
    const res = await handleRoute(async () => {
      z.number().parse('x')
      return new Response()
    })()
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('INVALID_INPUT')
  })
  it('hides unknown errors behind INTERNAL', async () => {
    const res = await handleRoute(async () => {
      throw new Error('db exploded')
    })()
    expect(res.status).toBe(500)
    expect((await res.json()).code).toBe('INTERNAL')
  })
})
