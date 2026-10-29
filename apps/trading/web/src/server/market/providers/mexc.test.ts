import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMexcProvider } from './mexc'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

// Dạng dữ liệu thật của api.mexc.com (rút gọn)
const ticker = {
  symbol: 'BTCUSDT',
  priceChangePercent: '-0.012',
  lastPrice: '79949.89',
  highPrice: '81805.94',
  lowPrice: '79725.33',
  quoteVolume: '347613821.23',
  closeTime: 1793258479295,
}
const kline = (openMs: number) => [openMs, '1', '2', '0.5', '1.5', '10', openMs + 59_999, '15']

afterEach(() => vi.useRealTimers())

describe('mexc provider', () => {
  it('fetches each symbol, converts the change ratio to percent and drops unknown symbols', async () => {
    const fetchFn = vi.fn(async (url: string | URL | Request) =>
      String(url).includes('TONUSDT') ? json({ msg: 'invalid symbol', code: -1121 }, 400) : json(ticker),
    )
    const quotes = await createMexcProvider({ baseUrl: 'http://m', fetchFn }).getQuotes(['BTCUSDT', 'TONUSDT'])
    expect(quotes).toHaveLength(1)
    expect(quotes[0]).toMatchObject({ symbol: 'BTCUSDT', price: 79949.89, change24hPct: -1.2, high24h: 81805.94, low24h: 79725.33 })
    expect(String(fetchFn.mock.calls[0][0])).toBe('http://m/api/v3/ticker/24hr?symbol=BTCUSDT')
  })

  it('throws when the source is down so the cache can serve stale data', async () => {
    const fetchFn = vi.fn(async () => json({}, 503))
    await expect(createMexcProvider({ baseUrl: 'http://m', fetchFn }).getQuotes(['BTCUSDT'])).rejects.toThrow('503')
    const none = vi.fn(async () => json({ code: -1121 }, 400))
    await expect(createMexcProvider({ baseUrl: 'http://m', fetchFn: none }).getQuotes(['TONUSDT'])).rejects.toThrow()
  })

  it('maps 1h to 60m and always sends endTime with startTime', async () => {
    const hour = 1_800_000_000_000 // đúng mốc giờ
    vi.useFakeTimers({ now: hour + 1_234 })
    const fetchFn = vi.fn(async (_url: string | URL | Request) => json([kline(hour - 3_600_000), kline(hour)]))
    const candles = await createMexcProvider({ baseUrl: 'http://m', fetchFn }).getCandles('BTCUSDT', '1h', 2)
    const url = new URL(String(fetchFn.mock.calls[0][0]))
    expect(url.searchParams.get('interval')).toBe('60m')
    expect(url.searchParams.get('startTime')).toBe(String(hour - 3_600_000)) // 2 nến gần nhất: giờ trước + giờ hiện tại
    expect(url.searchParams.get('endTime')).toBe(String(hour + 3_600_000 - 1))
    expect(candles.map((c) => c.time)).toEqual([(hour - 3_600_000) / 1000, hour / 1000])
  })

  it('pages past the 500-candle cap so settlement gets a full page', async () => {
    const start = 1_790_000_000_000 - (1_790_000_000_000 % 60_000)
    const fetchFn = vi.fn(async (url: string | URL | Request) => {
      const p = new URL(String(url)).searchParams
      const from = Number(p.get('startTime'))
      return json(Array.from({ length: Math.min(500, Number(p.get('limit'))) }, (_, i) => kline(from + i * 60_000)))
    })
    const candles = await createMexcProvider({ baseUrl: 'http://m', fetchFn }).getCandlesSince('BTCUSDT', '1m', start, 1000)
    expect(candles).toHaveLength(1000)
    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(new URL(String(fetchFn.mock.calls[1][0])).searchParams.get('startTime')).toBe(String(start + 500 * 60_000))
    expect(candles[999].time).toBe((start + 999 * 60_000) / 1000)
  })
})
