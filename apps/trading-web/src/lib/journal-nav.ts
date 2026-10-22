/** Đánh dấu "đi từ Nhật ký" → trang chi tiết dùng Back của trình duyệt để giữ nguyên bộ lọc / trang / dòng đang mở */
export const FROM_JOURNAL_KEY = 'tradelab:fromJournal'

export function markFromJournal() {
  try {
    sessionStorage.setItem(FROM_JOURNAL_KEY, '1')
  } catch {
    // trình duyệt chặn storage → trang chi tiết về tab của thị trường (vẫn đúng, chỉ mất bộ lọc)
  }
}

/** Đọc rồi xoá cờ — true nếu trang được mở từ Nhật ký */
export function takeFromJournal(): boolean {
  try {
    const v = sessionStorage.getItem(FROM_JOURNAL_KEY) === '1'
    sessionStorage.removeItem(FROM_JOURNAL_KEY)
    return v
  } catch {
    return false
  }
}
