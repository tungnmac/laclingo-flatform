/**
 * Cổng thanh toán — mỗi cổng (PayOS, VNPay…) cài interface này; phần cấp Pro dùng chung.
 * Lưu ý khi viết adapter thật:
 *  - VNPay: vnp_Amount = số tiền × 100 → chia lại trước khi trả amountVnd; IPN là GET (không vướng CSRF)
 *  - PayOS: mô tả tối đa 25 ký tự (9 ký tự với tài khoản ngân hàng chưa liên kết) — rút gọn orderDescription nếu cần
 *  - Cổng gửi webhook dạng form-urlencoded/text: miễn route webhook khỏi kiểm tra content-type CSRF trong middleware
 *  - Giới hạn kích thước body (≤ 64KB), eventId ≤ 200 ký tự; payload chỉ lưu trường cần đối soát (có thể chứa tên/số TK người trả)
 *  - Staging và production không dùng chung 1 tài khoản merchant (mã đơn chỉ duy nhất trong 1 DB)
 */
export interface CheckoutRequest {
  orderCode: number
  amountVnd: number
  description: string
  returnUrl: string // trang kết quả của app (cổng chuyển người dùng về đây)
  cancelUrl: string
  expiresAt: Date
}

export interface PaymentNotice {
  eventId: string // mã sự kiện/giao dịch của cổng — chống xử lý lặp
  orderCode: number
  amountVnd: number
  result: 'paid' | 'cancelled'
  payload: unknown // bản ghi gốc để đối soát
}

export interface PaymentProvider {
  name: string
  createCheckout(req: CheckoutRequest): Promise<{ checkoutUrl: string; providerRef: string | null }>
  /** Xác thực chữ ký webhook; sai → ném lỗi (route trả 400) */
  parseWebhook(req: Request): Promise<PaymentNotice>
}
