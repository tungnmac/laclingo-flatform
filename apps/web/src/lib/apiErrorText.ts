import type { Locale } from '@/store/locale'

// Câu lỗi API theo ngôn ngữ giao diện. Backend trả lỗi bằng tiếng Việt → giữ nguyên khi đang dùng
// tiếng Việt; ngôn ngữ khác hiện câu tiếng Anh theo mã HTTP (status 0 = không kết nối được máy chủ).

const EN_BY_STATUS: Record<number, string> = {
  0: 'Cannot reach the server. Please try again.',
  400: 'The submitted data is invalid.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to do this.',
  404: 'The requested data was not found.',
  409: 'This conflicts with existing data.',
  413: 'The file or data is too large.',
  422: 'The submitted data is invalid.',
  429: 'Too many requests. Please wait a moment and try again.',
}

/** hasToken = request gửi kèm phiên đăng nhập — 401 khi CHƯA đăng nhập là sai tài khoản/mật khẩu, không phải hết phiên */
export function apiErrorText(status: number, serverMessage: string | undefined, locale: Locale, hasToken = true): string {
  if (locale === 'vi') {
    if (status === 0) return 'Không kết nối được tới máy chủ. Vui lòng thử lại.'
    return serverMessage || `Lỗi ${status}`
  }
  if (status === 401 && !hasToken) return 'Incorrect username or password.'
  return EN_BY_STATUS[status] ?? (status >= 500 ? 'Something went wrong on the server. Please try again.' : `Request failed (${status}).`)
}
