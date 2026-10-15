// Số từ API trading là CHUỖI thập phân — chỉ chuyển sang number để HIỂN THỊ (không tính toán tiền ở client).

/** Khối lượng: tối đa 8 chữ số thập phân, bỏ số 0 thừa, dấu chấm thập phân (chuẩn sàn) */
export function formatQty(value: string): string {
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: 8 })
}

/** Tiền USD 2 chữ số: $1,234.50 / -$0.00 */
export function formatUsd(value: string): string {
  const n = Number(value)
  const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${n < 0 || Object.is(n, -0) ? '-' : ''}$${abs}`
}

/** Lãi/lỗ có dấu: +3.00 / -12.35 / 0.00 */
export function formatPnl(value: string): string {
  const n = Number(value)
  const fixed = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${n > 0 ? '+' : n < 0 ? '-' : ''}${fixed}`
}
