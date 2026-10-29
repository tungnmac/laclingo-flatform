/**
 * Chuẩn hoá số điện thoại về E.164. Số bắt đầu bằng 0 coi là số Việt Nam (0912… → +84912…);
 * số nước khác nhập kèm mã quốc gia (+65…, 0065…). Không hợp lệ → null. Dùng chung client + server.
 */
export function normalizePhone(input: string): string | null {
  const s = input.trim().replace(/[\s.\-()]/g, '')
  const e164 = s.startsWith('+') ? s : s.startsWith('00') ? `+${s.slice(2)}` : s.startsWith('0') ? `+84${s.slice(1)}` : null
  return e164 && /^\+[1-9]\d{7,14}$/.test(e164) ? e164 : null
}
