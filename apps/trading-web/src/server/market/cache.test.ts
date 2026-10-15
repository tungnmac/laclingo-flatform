import { describe, expect, it, vi } from 'vitest'
import { getCandlesCached, getQuotesCached, type CacheStore } from './cache'
import { MarketUnavailableError, type MarketDataProvider, type Quote } from './types'

function memoryStore(): CacheStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    get: async (k) => data.get(k) ?? null,
    mget: async (keys) => keys.map((k) => data.get(k) ?? null),
    set: async (k, v) => void data.set(k, v),
    setNX: async (k, v) => (data.has(k) ? false : (data.set(k, v), true)),
    del: async (k) => void data.delete(k),
  }
}
/** Store mà mỗi lệnh tốn `ms` — giả lập Redis chậm/treo tới commandTimeout */
function slowStore(ms: number): CacheStore {
  const inner = memoryStore()
  const slow =
    <A extends unknown[], R>(fn: (...a: A) => Promise<R>) =>
    async (...a: A) => {
      await new Promise((r) => setTimeout(r, ms))
      return fn(...a)
    }
  return { get: slow(inner.get), mget: slow(inner.mget), set: slow(inner.set), setNX: slow(inner.setNX), del: slow(inner.del) }
}
const down = async (): Promise<never> => {
  throw new Error('redis down')
}
const brokenStore: CacheStore = { get: down, mget: down, set: down, setNX: down, del: down }
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
    getCandlesSince: vi.fn(async () => []),
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

  it('keeps a bounded number of sequential cache ops when the store is slow', async () => {
    const started = Date.now()
    await getQuotesCached(slowStore(100), provider(), ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'TONUSDT', 'AVAXUSDT', 'LINKUSDT'])
    // mget fresh + setNX + (sets song song) + del = 4 vòng × 100ms — không tăng theo số mã
    expect(Date.now() - started).toBeLessThan(700)
  })

  it('releases the lock after fetching so the next poll does not wait', async () => {
    const store = memoryStore()
    await getQuotesCached(store, provider(), ['BTCUSDT'])
    expect([...store.data.keys()].some((k) => k.startsWith('trading:lock:'))).toBe(false)
  })

  it('serves stale copies for symbols the provider silently dropped', async () => {
    const store = memoryStore()
    store.data.set('trading:stale:quote:crypto:ETHUSDT', JSON.stringify(quote('ETHUSDT', 9)))
    const p = provider({ getQuotes: vi.fn(async () => [quote('BTCUSDT')]) })
    const res = await getQuotesCached(store, p, ['BTCUSDT', 'ETHUSDT'])
    expect(res.quotes.map((q) => [q.symbol, q.price])).toEqual([
      ['BTCUSDT', 1],
      ['ETHUSDT', 9],
    ])
    expect(res.stale).toBe(true)
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

    expect(store.data.has('trading:lock:candles:crypto:BTCUSDT:1h:300')).toBe(false)
    store.data.delete('trading:candles:crypto:BTCUSDT:1h:300')
    const res = await getCandlesCached(store, provider({ getCandles: vi.fn(failing) }), 'BTCUSDT', '1h', 300)
    expect(res.stale).toBe(true)
    expect(res.candles).toHaveLength(1)
  })
})
