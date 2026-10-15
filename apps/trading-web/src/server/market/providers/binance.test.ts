import { describe, expect, it, vi } from 'vitest'
import klines from './__fixtures__/klines.json'
import tickers from './__fixtures__/ticker24hr.json'
import { createBinanceProvider } from './binance'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

describe('binance provider', () => {
  it('parses tickers and drops invalid ones', async () => {
    const fetchFn = vi.fn(async (_url: string | URL | Request) => json(tickers))
    const quotes = await createBinanceProvider({ baseUrl: 'http://b', fetchFn }).getQuotes(['BTCUSDT', 'TONUSDT', 'BADUSDT'])
    expect(quotes.map((q) => q.symbol)).toEqual(['BTCUSDT', 'TONUSDT'])
    expect(quotes[0]).toMatchObject({ price: 81265.73, change24hPct: -3.047, high24h: 83933, low24h: 80226.35 })
    expect(quotes[0].volume24h).toBeCloseTo(1949543610.85, 1)
    expect(String(fetchFn.mock.calls[0][0])).toContain('/api/v3/ticker/24hr?symbols=')
  })

  it('falls back to per-symbol requests on 400', async () => {
    const fetchFn = vi.fn(async (url: string | URL | Request) => {
      const u = decodeURIComponent(String(url))
      if (u.includes('DELISTED') || u.includes(',')) return json({ code: -1121, msg: 'Invalid symbol.' }, 400)
      return json([tickers[0]])
    })
    const quotes = await createBinanceProvider({ baseUrl: 'http://b', fetchFn }).getQuotes(['BTCUSDT', 'DELISTED'])
    expect(quotes.map((q) => q.symbol)).toEqual(['BTCUSDT'])
  })

  it('throws on server errors so the cache can serve stale data', async () => {
    const fetchFn = vi.fn(async () => json({}, 503))
    await expect(createBinanceProvider({ baseUrl: 'http://b', fetchFn }).getQuotes(['BTCUSDT'])).rejects.toThrow()
  })

  it('fetches candles from a start time for settlement', async () => {
    const fetchFn = vi.fn(async (_url: string | URL | Request) => json(klines))
    const candles = await createBinanceProvider({ baseUrl: 'http://b', fetchFn }).getCandlesSince('BTCUSDT', '1m', 1792047600000, 1000)
    expect(candles).toHaveLength(2)
    expect(String(fetchFn.mock.calls[0][0])).toContain('/api/v3/klines?symbol=BTCUSDT&interval=1m&startTime=1792047600000&limit=1000')
  })

  it('parses klines into candles (seconds) and drops invalid rows', async () => {
    const fetchFn = vi.fn(async (_url: string | URL | Request) => json(klines))
    const candles = await createBinanceProvider({ baseUrl: 'http://b', fetchFn }).getCandles('BTCUSDT', '1h', 3)
    expect(candles).toHaveLength(2)
    expect(candles[0]).toEqual({ time: 1792047600, open: 80892.93, high: 81580, low: 80832, close: 81541.34, volume: 856.98672 })
    expect(String(fetchFn.mock.calls[0][0])).toContain('/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=3')
  })
})
