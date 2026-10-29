import { describe, expect, it } from 'vitest'
import { translate } from '@/i18n/translate'
import { notificationText } from './notification-text'

const vi = (key: string, params?: Record<string, string | number>) => translate('vi', key, params)
const en = (key: string, params?: Record<string, string | number>) => translate('en', key, params)

describe('notificationText', () => {
  it('describes a filled take-profit with its realized P&L', () => {
    const d = { kind: 'order_filled' as const, symbol: 'BTCUSDT', side: 'sell' as const, type: 'take_profit', qty: '0.0100', price: '81000.5', realized_pnl: '12.3' }
    expect(notificationText(d, vi, 'vi')).toEqual({ text: 'Lệnh Take-profit Bán 0.01 BTC đã khớp giá 81,000.5 · Lãi/lỗ +12.30 USDT', href: '/portfolio' })
  })

  it('omits P&L for an order that only opened a position', () => {
    const d = { kind: 'order_filled' as const, symbol: 'ETHUSDT', side: 'buy' as const, type: 'limit', qty: '1', price: '3000', realized_pnl: '0' }
    expect(notificationText(d, en, 'en').text).toBe('Limit Buy order for 1 ETH filled at 3,000')
  })

  it('describes a liquidation', () => {
    const d = { kind: 'liquidation' as const, symbol: 'SOLUSDT', qty: '2', price: '250', realized_pnl: '-80' }
    expect(notificationText(d, vi, 'vi').text).toBe('Vị thế Short 2 SOL đã bị thanh lý giá 250 · Lãi/lỗ -80.00 USDT')
  })

  it('links contest results and falls back to the Vietnamese title', () => {
    const d = { kind: 'contest_result' as const, slug: 'thang-10', title_vi: 'Tháng 10', title_en: '', rank: 3, total: 20 }
    expect(notificationText(d, en, 'en')).toEqual({ text: 'Contest "Tháng 10" results are in: you placed 3/20', href: '/contests/thang-10' })
    expect(notificationText({ ...d, rank: null }, vi, 'vi').text).toBe('Giải "Tháng 10" đã có kết quả: bạn chưa đủ điều kiện xếp hạng')
  })
})
