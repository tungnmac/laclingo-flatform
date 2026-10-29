import { describe, expect, it } from 'vitest'
import { D } from '../trading/decimal'
import { decodeCandles, decodeOrders, decodeWallet, encodeCandles, encodeOrders, encodeWallet } from './codec'

describe('codec', () => {
  it('round-trips candles, wallet and orders with exact decimals', () => {
    const candles = [{ time: 1, open: D('1.1'), high: D('2.123456789012345678'), low: D('0.5'), close: D('1.5'), volume: D('10') }]
    expect(decodeCandles(encodeCandles(candles))).toEqual(candles)
    const wallet = { cash: D('9999.123'), positions: { BTCUSDT: { qty: D('-0.5'), avgPrice: D('100'), margin: D('50'), realizedPnl: D('0') } } }
    expect(decodeWallet(encodeWallet(wallet, 'BTCUSDT'), 'BTCUSDT')).toEqual(wallet)
    expect(decodeWallet(encodeWallet({ cash: D('1'), positions: {} }, 'BTCUSDT'), 'BTCUSDT')).toEqual({ cash: D('1'), positions: {} })
    const orders = [{ id: 'a', side: 'buy' as const, type: 'stop_loss' as const, qty: null, price: D('9'), reserved: D('0'), ocoGroup: 'g', activeFrom: 5, createdAt: 5 }]
    expect(decodeOrders(encodeOrders(orders))).toEqual(orders)
  })
})
