import Decimal from 'decimal.js'

// Đủ chữ số cho numeric(36,18); không bao giờ in dạng mũ (1e-7) ra API / DB.
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP, toExpNeg: -40, toExpPos: 40 })

export { Decimal }
export const D = (v: Decimal.Value) => new Decimal(v)
/** Ghi DB numeric(36,18) */
export const toDb = (d: Decimal) => d.toFixed(18)
/** Trả API — chuỗi thập phân gọn (không số 0 thừa, không ký hiệu mũ) */
export const toApi = (d: Decimal) => d.toString()
