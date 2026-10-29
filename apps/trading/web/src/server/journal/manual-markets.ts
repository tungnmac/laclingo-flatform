// Hằng số dùng chung client/server — KHÔNG import decimal.js hay module server khác ở đây
export const MANUAL_MARKETS = ['vn', 'us', 'crypto', 'other'] as const
export type ManualMarket = (typeof MANUAL_MARKETS)[number]

/** Trạng thái lệnh ghi tay — chỉ filled / partial (phần đã khớp) được tính vào sổ */
export const ORDER_STATUSES = ['pending', 'filled', 'partial', 'unfilled', 'cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]
export const isExecuted = (s: string) => s === 'filled' || s === 'partial'

