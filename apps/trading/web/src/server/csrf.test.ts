import { describe, expect, it } from 'vitest'
import { csrfViolation } from './csrf'

const APP = 'https://trade.example.com'
const h = (init: Record<string, string>) => new Headers({ host: 'trade.example.com', ...init })

describe('csrfViolation', () => {
  it('allows safe methods and same-origin JSON / multipart / bodiless writes', () => {
    expect(csrfViolation('GET', h({ 'sec-fetch-site': 'cross-site' }))).toBeNull()
    expect(csrfViolation('POST', h({ 'sec-fetch-site': 'same-origin', origin: APP, 'content-type': 'application/json; charset=utf-8' }))).toBeNull()
    expect(csrfViolation('POST', h({ 'content-type': 'multipart/form-data; boundary=x' }))).toBeNull()
    expect(csrfViolation('DELETE', h({}))).toBeNull() // curl / không có body
    // sau reverse proxy: app chạy http nội bộ, trình duyệt gửi Origin https + X-Forwarded-Host
    expect(csrfViolation('POST', h({ host: 'localhost:3001', 'x-forwarded-host': 'trade.example.com', origin: APP }))).toBeNull()
  })
  it('blocks cross-site and same-site (subdomain) requests', () => {
    expect(csrfViolation('POST', h({ 'sec-fetch-site': 'cross-site' }))).toMatch(/cross-site/)
    expect(csrfViolation('POST', h({ 'sec-fetch-site': 'same-site' }))).toMatch(/same-site/)
    expect(csrfViolation('POST', h({ origin: 'https://evil.example.com' }))).toBe('origin mismatch')
    expect(csrfViolation('POST', h({ origin: 'null' }))).toBe('origin mismatch')
    // proxy đổi Host thành upstream → cấu hình APP_HOSTS
    expect(csrfViolation('POST', h({ host: 'app:3001', origin: APP }), ['trade.example.com'])).toBeNull()
    expect(csrfViolation('POST', h({ origin: 'https://evil.example.com' }), ['trade.example.com'])).toBe('origin mismatch')
  })
  it('blocks simple form content types', () => {
    expect(csrfViolation('POST', h({ 'content-type': 'text/plain' }))).toMatch(/text\/plain/)
    expect(csrfViolation('PUT', h({ 'content-type': 'application/x-www-form-urlencoded' }))).toMatch(/urlencoded/)
  })
})
