// Bảng giá Pro (thị trường Việt Nam) — dùng chung client/server, KHÔNG import module server.

export const PERIODS = ['month', 'year'] as const
export type Period = (typeof PERIODS)[number]

export const PRICES: Record<Period, { amountVnd: number; months: number }> = {
  month: { amountVnd: 99_000, months: 1 },
  year: { amountVnd: 899_000, months: 12 }, // ≈ 75.000 đ/tháng — rẻ hơn ~24% so với trả theo tháng
}

/** Đơn chờ thanh toán quá thời gian này thì hết hạn (QR/link của cổng cũng hết hạn theo) */
export const ORDER_TTL_MS = 15 * 60_000

/** Mã đơn dạng số nguyên dương ≤ 2^53 (cổng VN như PayOS yêu cầu số) — thời gian (giây) × 1000 + 3 chữ số ngẫu nhiên */
export function newOrderCode(now = Date.now(), random = Math.random()): number {
  return Math.floor(now / 1000) * 1000 + Math.floor(random * 1000)
}

/** Nội dung chuyển khoản / mô tả đơn — ngắn, không dấu (giới hạn của nhiều cổng ~25 ký tự) */
export const orderDescription = (orderCode: number) => `TLPRO ${orderCode}` // ≤ 19 ký tự, giữ nguyên mã đơn để đối soát
