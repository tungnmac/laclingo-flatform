import { mockProvider } from './mock'
import type { PaymentProvider } from './types'

/**
 * Cổng đang bật theo PAYMENTS_PROVIDER. Chưa cấu hình → null (tắt thanh toán, trang Pro hiện "sắp ra mắt").
 * 'mock' chỉ khi NODE_ENV là development/test. Cổng thật (payos, vnpay…) thêm vào đây khi có hợp đồng — khi đó bắt buộc APP_URL.
 */
export function activeProvider(): PaymentProvider | null {
  const name = process.env.PAYMENTS_PROVIDER?.trim().toLowerCase()
  if (!name) return null
  // chỉ cho phép (allow-list) môi trường phát triển / kiểm thử — NODE_ENV lạ (staging, rỗng…) cũng KHÔNG bật cổng giả lập
  if (name === 'mock') return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? mockProvider : null
  return null
}

export function providerByName(name: string): PaymentProvider | null {
  const p = activeProvider()
  return p && p.name === name ? p : null // chỉ nhận webhook của cổng đang bật
}
