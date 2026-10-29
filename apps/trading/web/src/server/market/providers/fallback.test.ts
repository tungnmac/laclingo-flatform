import { describe, expect, it, vi } from 'vitest'
import type { MarketDataProvider, Quote } from '../types'
import { withFallback } from './fallback'

const quote = (symbol: string, price: number): Quote => ({
  symbol,
  price,
  change24hPct: 0,
  high24h: price,
  low24h: price,
  volume24h: 0,
  updatedAt: new Date(0).toISOString(),
})

function fake(getQuotes: MarketDataProvider['getQuotes']): MarketDataProvider {
  return { market: 'crypto', getQuotes: vi.fn(getQuotes), getCandles: vi.fn(async () => []), getCandlesSince: vi.fn(async () => []) }
}

describe('withFallback', () => {
  it('uses the primary while it works, including partial results', async () => {
    const primary = fake(async () => [quote('BTCUSDT', 1)])
    const backup = fake(async () => [quote('BTCUSDT', 2), quote('ETHUSDT', 2)])
    const quotes = await withFallback(primary, backup).getQuotes(['BTCUSDT', 'ETHUSDT'])
    expect(quotes.map((q) => q.price)).toEqual([1])
    expect(backup.getQuotes).not.toHaveBeenCalled()
  })

  it('switches to the backup when the primary fails, then skips the primary for a cooldown', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    let t = 0
    const primary = fake(async () => Promise.reject(new Error('Binance HTTP 451')))
    const backup = fake(async () => [quote('BTCUSDT', 2)])
    const p = withFallback(primary, backup, () => t)

    expect((await p.getQuotes(['BTCUSDT']))[0].price).toBe(2)
    await p.getCandles('BTCUSDT', '1h', 3) // trong thời gian chờ → gọi thẳng nguồn dự phòng
    expect(primary.getQuotes).toHaveBeenCalledTimes(1)
    expect(primary.getCandles).not.toHaveBeenCalled()
    expect(backup.getCandles).toHaveBeenCalledTimes(1)

    t = 60_000 // hết thời gian chờ → thử lại nguồn chính
    await p.getQuotes(['BTCUSDT'])
    expect(primary.getQuotes).toHaveBeenCalledTimes(2)
  })

  it('propagates the backup error when both fail', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const p = withFallback(fake(async () => Promise.reject(new Error('a'))), fake(async () => Promise.reject(new Error('b'))))
    await expect(p.getQuotes(['BTCUSDT'])).rejects.toThrow('b')
  })
})
