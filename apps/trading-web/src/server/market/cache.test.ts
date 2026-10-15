import { describe, expect, it, vi } from 'vitest'
import { getCandlesCached, getQuotesCached, type CacheStore } from './cache'
import { MarketUnavailableError, type MarketDataProvider, type Quote } from './types'

function memoryStore(): CacheStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    get: async (k) => data.get(k) ?? null,
    set: async (k, v) => void data.set(k, v),
    setNX: async (k, v) => (data.has(k) ? false : (data.set(k, v), true)),
  }
}
const down = async (): Promise<never> => {
  throw new Error('redis down')
}
const brokenStore: CacheStore = { get: down, set: down, setNX: down }
const quote = (symbol: string, price = 1): Quote => ({
  symbol,
  price,
  change24hPct: 0,
  high24h: price,
  low24h: price,
  volume24h: 1,
  updatedAt: '2026-10-15T00:00:00.000Z',
})
const failing = async (): Promise<never> => {
  throw new Error('timeout')
}
function provider(over: Partial<MarketDataProvider> = {}): MarketDataProvider {
  return {
    market: 'crypto',
    getQuotes: vi.fn(async (symbols: string[]) => symbols.map((s) => quote(s))),
    getCandles: vi.fn(async () => [{ time: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 }]),
    ...over,
  }
}

describe('getQuotesCached', () => {
  it('serves from cache on the second call', async () => {
    const store = memoryStore()
    const p = provider()
    await getQuotesCached(store, p, ['BTCUSDT'])
    const res = await getQuotesCached(store, p, ['BTCUSDT'])
    expect(res).toEqual({ quotes: [quote('BTCUSDT')], stale: false })
    expect(p.getQuotes).toHaveBeenCalledTimes(1)
  })

  it('fetches only missing symbols', async () => {
    const store = memoryStore()
    store.data.set('trading:quote:crypto:BTCUSDT', JSON.stringify(quote('BTCUSDT', 5)))
    const p = provider()
    const res = await getQuotesCached(store, p, ['BTCUSDT', 'ETHUSDT'])
    expect(p.getQuotes).toHaveBeenCalledWith(['ETHUSDT'])
    expect(res.quotes.map((q) => [q.symbol, q.price])).toEqual([
      ['BTCUSDT', 5],
      ['ETHUSDT', 1],
    ])
  })

  it('serves the stale copy when the provider fails', async () => {
    const store = memoryStore()
    store.data.set('trading:stale:quote:crypto:BTCUSDT', JSON.stringify(quote('BTCUSDT', 7)))
    const res = await getQuotesCached(store, provider({ getQuotes: vi.fn(failing) }), ['BTCUSDT'])
    expect(res).toEqual({ quotes: [quote('BTCUSDT', 7)], stale: true })
  })

  it('throws MarketUnavailableError when provider fails and nothing is cached', async () => {
    await expect(getQuotesCached(memoryStore(), provider({ getQuotes: vi.fn(failing) }), ['BTCUSDT'])).rejects.toBeInstanceOf(
      MarketUnavailableError,
    )
  })

  it('works when the cache store throws', async () => {
    const res = await getQuotesCached(brokenStore, provider(), ['BTCUSDT'])
    expect(res).toEqual({ quotes: [quote('BTCUSDT')], stale: false })
  })
})

describe('getCandlesCached', () => {
  it('caches per symbol+interval+limit and falls back to stale', async () => {
    const store = memoryStore()
    const p = provider()
    await getCandlesCached(store, p, 'BTCUSDT', '1h', 300)
    await getCandlesCached(store, p, 'BTCUSDT', '1h', 300)
    expect(p.getCandles).toHaveBeenCalledTimes(1)

    store.data.delete('trading:candles:crypto:BTCUSDT:1h:300')
    store.data.delete('trading:lock:candles:crypto:BTCUSDT:1h:300')
    const res = await getCandlesCached(store, provider({ getCandles: vi.fn(failing) }), 'BTCUSDT', '1h', 300)
    expect(res.stale).toBe(true)
    expect(res.candles).toHaveLength(1)
  })
})
