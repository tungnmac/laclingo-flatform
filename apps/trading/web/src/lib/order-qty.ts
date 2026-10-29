import Decimal from 'decimal.js'

// Số lượng gửi lên API phải là chuỗi thập phân CHÍNH XÁC — không đi qua float (2.3 → 2.29999999)
// và không bao giờ ở dạng mũ (1e-7). Tối đa 8 chữ số thập phân, làm tròn XUỐNG.
const DECIMAL = /^\d+(\.\d+)?$/
const FEE = new Decimal('1.001')

/** "0,5" → "0.5"; chuỗi không phải số dương thập phân → null */
export function normalizeDecimalInput(raw: string): string | null {
  const s = raw.trim().replace(',', '.')
  return DECIMAL.test(s) ? s : null
}

const out = (d: Decimal) => {
  const q = d.toDecimalPlaces(8, Decimal.ROUND_DOWN)
  return q.gt(0) ? q.toFixed() : ''
}

/** Số lượng từ ô nhập: theo số lượng (giữ nguyên chuỗi người dùng gõ) hoặc theo USDT (÷ giá) */
export function qtyFromAmount(mode: 'qty' | 'usdt', raw: string, price: number): string {
  const amount = normalizeDecimalInput(raw)
  if (!amount) return ''
  if (mode === 'qty') return out(new Decimal(amount))
  return price > 0 ? out(new Decimal(amount).div(price)) : ''
}

/**
 * Nút 25/50/75/100%: bán khi đang Long → theo số đang giữ (100% = đúng số đang giữ, không để lại
 * "bụi"); còn lại (mua, hoặc bán khi chưa Long = mở Short) → theo tiền khả dụng đã tính phí 0,1%.
 */
export function percentQty(input: { side: 'buy' | 'sell'; pct: number; cash: string; longQty: string; price: number }): string {
  const long = new Decimal(input.longQty || '0')
  if (input.side === 'sell' && long.gt(0)) return input.pct === 1 ? out(long) : out(long.times(input.pct))
  if (!(input.price > 0)) return ''
  return out(new Decimal(input.cash || '0').div(new Decimal(input.price).times(FEE)).times(input.pct))
}
