import { describe, expect, it } from 'vitest'
import { D } from '../trading/decimal'
import { toSessionDto } from './dto'
import { newState, type PracticeCandle } from './session'
import { FAKE_EPOCH } from './time'

const c = (i: number): PracticeCandle => ({ time: Date.UTC(2023, 4, 1) + i * 3_600_000, open: D(1), high: D(2), low: D(0.5), close: D(1.5), volume: D(3) })
const state = { ...newState('BTCUSDT', Array.from({ length: 10 }, (_, i) => c(i)), 6, 4), cursor: 1 }

describe('toSessionDto', () => {
  it('toSessionDto hides the future and real time', () => {
    const dto = toSessionDto({ id: 's', interval: '1h', status: 'active', result: null }, state, [])
    expect(dto.candles).toHaveLength(7)
    expect(dto.candles[0].time).toBe(FAKE_EPOCH)
    expect(dto.candles[6].time).toBe(FAKE_EPOCH + 6 * 3600)
    expect(JSON.stringify(dto)).not.toContain('2023')
    expect(dto.result).toBeNull()
  })
  it('exposes an AccountSnapshot-compatible account', () => {
    const dto = toSessionDto({ id: 's', interval: '1h', status: 'active', result: null }, state, [])
    expect(dto.account.account).toMatchObject({ cash: '10000', reserved: '0', equity: '10000', starting_balance: '10000', pnl: '0', pnl_pct: '0.00' })
    expect(dto.account.positions).toEqual([])
    expect(dto.account.open_orders).toEqual([])
  })
})
