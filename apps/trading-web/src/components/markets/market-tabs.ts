// Hằng số dùng chung server/client — KHÔNG đặt trong file 'use client' (server chỉ nhận được client reference, không phải mảng)
export const MARKET_TABS = ['crypto', 'vn', 'us', 'other'] as const
export type MarketTab = (typeof MARKET_TABS)[number]
