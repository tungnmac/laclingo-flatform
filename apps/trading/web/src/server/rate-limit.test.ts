import { describe, expect, it } from 'vitest'
import { HttpError } from './http'
import { clientIp, rateLimit, resetRateLimit, type Counter } from './rate-limit'

function memoryCounter(): Counter {
  const counts = new Map<string, number>()
  return {
    incr: async (key, ttl) => ({ count: counts.set(key, (counts.get(key) ?? 0) + 1).get(key)!, ttl }),
    reset: async (key) => void counts.delete(key),
  }
}

describe('rateLimit', () => {
  it('allows up to the limit, then 429 with the wait time', async () => {
    const c = memoryCounter()
    for (let i = 0; i < 3; i++) await rateLimit(c, 'login:ip:1.2.3.4', 3, 60)
    const err = await rateLimit(c, 'login:ip:1.2.3.4', 3, 60).catch((e) => e)
    expect(err).toBeInstanceOf(HttpError)
    expect(err).toMatchObject({ status: 429, code: 'RATE_LIMITED', params: { seconds: 60 } })
    await rateLimit(c, 'login:ip:5.6.7.8', 3, 60) // khoá khác không bị ảnh hưởng
  })
  it('fails open when the counter is down', async () => {
    const down: Counter = { incr: async () => Promise.reject(new Error('redis down')), reset: async () => Promise.reject(new Error('redis down')) }
    await expect(rateLimit(down, 'k', 0, 60)).resolves.toBeUndefined()
  })
})

describe('clientIp', () => {
  it('trusts only the hops added by our proxies (from the right), then x-real-ip', () => {
    // client tự gửi "6.6.6.6", proxy nối IP thật 1.1.1.1 vào cuối
    const spoofed = new Request('http://x', { headers: { 'x-forwarded-for': '6.6.6.6, 1.1.1.1' } })
    expect(clientIp(spoofed, 1)).toBe('1.1.1.1')
    expect(clientIp(new Request('http://x', { headers: { 'x-forwarded-for': '6.6.6.6, 1.1.1.1, 10.0.0.2' } }), 2)).toBe('1.1.1.1')
    expect(clientIp(new Request('http://x', { headers: { 'x-forwarded-for': '1.1.1.1' } }), 3)).toBe('1.1.1.1')
    expect(clientIp(new Request('http://x', { headers: { 'x-real-ip': '2.2.2.2' } }))).toBe('2.2.2.2')
    expect(clientIp(new Request('http://x'))).toBe('unknown')
  })
  it('prefers CLIENT_IP_HEADER when configured, falling back to x-forwarded-for', () => {
    const req = new Request('http://x', { headers: { 'cf-connecting-ip': '3.3.3.3', 'x-forwarded-for': '6.6.6.6, 1.1.1.1' } })
    expect(clientIp(req, 1, 'CF-Connecting-IP')).toBe('3.3.3.3')
    expect(clientIp(req, 1, undefined)).toBe('1.1.1.1') // không cấu hình → bỏ qua header (client tự gửi được)
    expect(clientIp(new Request('http://x', { headers: { 'x-forwarded-for': '1.1.1.1' } }), 1, 'CF-Connecting-IP')).toBe('1.1.1.1')
  })
  it('resets a counter', async () => {
    const c = memoryCounter()
    for (let i = 0; i < 3; i++) await rateLimit(c, 'k', 3, 60)
    await resetRateLimit(c, 'k')
    await expect(rateLimit(c, 'k', 3, 60)).resolves.toBeUndefined()
  })
})
