import { describe, expect, it } from 'vitest'
import type { ManualTradeRow } from '../db/schema'
import { D } from '../trading/decimal'
import { firstOversell, replay } from './manual-ledger'
import { canChangeStatus, executedQty, feesFor, ledgerOf } from './manual-rows'

let n = 0
const row = (side: 'buy' | 'sell', qty: string, status: string, filledQty: string | null = null, day = ++n): ManualTradeRow =>
  ({
    id: `r${String(n).padStart(3, '0')}`,
    userId: 'u',
    market: 'vn',
    symbol: 'FPT',
    side,
    qty,
    price: '100000',
    fee: '0',
    tax: '0',
    status,
    filledQty,
    amendedAt: null,
    executedAt: new Date(day * 86_400_000),
    reason: null,
    lesson: null,
    emotion: null,
    rating: null,
    tags: [],
    createdAt: new Date(day * 86_400_000),
    updatedAt: new Date(day * 86_400_000),
  }) as ManualTradeRow

describe('executed quantity by status', () => {
  it('counts filled fully, partial by filled_qty, others as zero', () => {
    expect(executedQty(row('buy', '1000', 'filled')).toNumber()).toBe(1000)
    expect(executedQty(row('buy', '1000', 'partial', '400')).toNumber()).toBe(400)
    for (const s of ['pending', 'unfilled', 'cancelled']) expect(executedQty(row('buy', '1000', s)).toNumber()).toBe(0)
  })
  it('keeps unexecuted orders out of the ledger, positions and oversell check', () => {
    const rows = [row('buy', '1000', 'partial', '400'), row('buy', '500', 'pending'), row('buy', '300', 'cancelled'), row('sell', '400', 'filled')]
    expect(ledgerOf(rows)).toHaveLength(2)
    expect(replay(ledgerOf(rows)).positions).toHaveLength(0) // 400 khớp − 400 bán
    expect(firstOversell(ledgerOf(rows))).toBeNull()
    // huỷ lệnh mua đã khớp 1 phần → lệnh bán sau thành bán vượt
    const cancelled = [row('buy', '1000', 'cancelled'), row('sell', '400', 'filled')]
    expect(firstOversell(ledgerOf(cancelled))).not.toBeNull()
  })
})

describe('status transitions', () => {
  it('allows quick changes only from pending, or more fills on a partial order', () => {
    expect(canChangeStatus('pending', 'filled')).toBe(true)
    expect(canChangeStatus('pending', 'cancelled')).toBe(true)
    expect(canChangeStatus('pending', 'pending')).toBe(false)
    expect(canChangeStatus('partial', 'filled')).toBe(true)
    expect(canChangeStatus('partial', 'partial')).toBe(true)
    expect(canChangeStatus('partial', 'cancelled')).toBe(false)
    expect(canChangeStatus('filled', 'pending')).toBe(false)
    expect(canChangeStatus('cancelled', 'filled')).toBe(false)
  })
})

describe('feesFor', () => {
  it('charges fee on the executed value and tax only on sells', () => {
    const vn = { currency: 'VND', fee_rate_pct: 0.15, sell_tax_pct: 0.1 }
    const buy = feesFor(D(400), D(100_000), 'buy', vn)
    expect([buy.fee.toNumber(), buy.tax.toNumber()]).toEqual([60_000, 0])
    const sell = feesFor(D(333), D(25_550), 'sell', vn) // 8.508.150 × 0,15% = 12.762,225 → 12.762 đ
    expect([sell.fee.toNumber(), sell.tax.toNumber()]).toEqual([12_762, 8_508])
    expect(feesFor(D('0.001'), D(60_000), 'buy', { currency: 'USDT', fee_rate_pct: 0.1, sell_tax_pct: 0 }).fee.toNumber()).toBe(0.06)
  })
})
