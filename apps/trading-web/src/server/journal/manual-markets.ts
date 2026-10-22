// Hằng số dùng chung client/server — KHÔNG import decimal.js hay module server khác ở đây
export const MANUAL_MARKETS = ['vn', 'us', 'crypto', 'other'] as const
export type ManualMarket = (typeof MANUAL_MARKETS)[number]
