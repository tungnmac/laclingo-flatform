const TYPE_KEYS: Record<string, string> = {
  market: 'trading.typeMarket',
  limit: 'trading.typeLimit',
  stop_loss: 'trading.typeStopLoss',
  take_profit: 'trading.typeTakeProfit',
}

/** Key từ điển cho loại lệnh (market/limit/stop_loss/take_profit) */
export const orderTypeKey = (type: string) => TYPE_KEYS[type] ?? 'trading.typeMarket'

/** Màu lãi/lỗ theo dấu của chuỗi số */
export const pnlColor = (value: string) => (Number(value) > 0 ? 'text-emerald-600' : Number(value) < 0 ? 'text-rose-600' : 'text-slate-500')
