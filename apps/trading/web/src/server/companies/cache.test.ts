import { describe, expect, it, vi } from 'vitest'
import type { CacheStore } from '../market/cache'
import { getFundamentalsCached } from './cache'
import { FundamentalsUnavailableError } from './eodhd'
import type { Fundamentals } from './types'

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
const down = async (): Promise<never> => {
  throw new Error('redis down')
}
const brokenStore: CacheStore = { get: down, mget: down, set: down, setNX: down, del: down }
const fund = (name: string) => ({ name, years: [] }) as unknown as Fundamentals
const failing = vi.fn(async (): Promise<Fundamentals> => {
  throw new Error('EODHD HTTP 500')
})

describe('getFundamentalsCached', () => {
  it('fetches once, then serves from cache', async () => {
    const store = memoryStore()
    const fetcher = vi.fn(async () => fund('Apple'))
    expect(await getFundamentalsCached(store, fetcher, 'us', 'AAPL')).toEqual({ data: fund('Apple'), stale: false })
    expect(await getFundamentalsCached(store, fetcher, 'us', 'AAPL')).toEqual({ data: fund('Apple'), stale: false })
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(store.data.has('trading:lock:fund:us:AAPL')).toBe(false)
  })
  it('falls back to the stale copy when the provider fails', async () => {
    const store = memoryStore()
    store.data.set('trading:stale:fund:vn:FPT', JSON.stringify(fund('FPT')))
    expect(await getFundamentalsCached(store, failing, 'vn', 'FPT')).toEqual({ data: fund('FPT'), stale: true })
  })
  it('throws when there is nothing to fall back on, and remembers the failure', async () => {
    const store = memoryStore()
    const fetcher = vi.fn(failing)
    await expect(getFundamentalsCached(store, fetcher, 'vn', 'XYZ')).rejects.toBeInstanceOf(FundamentalsUnavailableError)
    await expect(getFundamentalsCached(store, fetcher, 'vn', 'XYZ')).rejects.toBeInstanceOf(FundamentalsUnavailableError)
    expect(fetcher).toHaveBeenCalledTimes(1) // lần 2 không gọi lại EODHD
  })
  it('waits for the request holding the lock instead of calling EODHD again', async () => {
    const store = memoryStore()
    store.data.set('trading:lock:fund:vn:FPT', 'someone-else')
    store.data.set('trading:stale:fund:vn:FPT', JSON.stringify(fund('FPT')))
    setTimeout(() => store.data.set('trading:fail:fund:vn:FPT', '1'), 100) // bên giữ khoá thất bại
    const fetcher = vi.fn(async () => fund('never'))
    expect(await getFundamentalsCached(store, fetcher, 'vn', 'FPT')).toEqual({ data: fund('FPT'), stale: true })
    expect(fetcher).not.toHaveBeenCalled()
    expect(store.data.get('trading:lock:fund:vn:FPT')).toBe('someone-else') // không xoá khoá của người khác
  })
  it('ignores a corrupted cache entry', async () => {
    const store = memoryStore()
    store.data.set('trading:fund:us:MSFT', '{not json')
    const fetcher = vi.fn(async () => fund('Microsoft'))
    expect(await getFundamentalsCached(store, fetcher, 'us', 'MSFT')).toEqual({ data: fund('Microsoft'), stale: false })
  })
  it('does not call EODHD for list pages while Redis is down', async () => {
    const fetcher = vi.fn(async () => fund('Tesla'))
    await expect(getFundamentalsCached(brokenStore, fetcher, 'us', 'TSLA', { fetchWhenStoreDown: false })).rejects.toBeInstanceOf(FundamentalsUnavailableError)
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('still works when Redis is down', async () => {
    const fetcher = vi.fn(async () => fund('Tesla'))
    expect(await getFundamentalsCached(brokenStore, fetcher, 'us', 'TSLA')).toEqual({ data: fund('Tesla'), stale: false })
  })
})
