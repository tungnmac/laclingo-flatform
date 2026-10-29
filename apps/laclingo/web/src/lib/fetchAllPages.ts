import type { PageResult } from '@/types/api'

/**
 * Gọi fetchPage lần lượt cho tới khi lấy hết — dùng cho Export: cần TOÀN BỘ
 * dữ liệu khớp filter hiện tại (không chỉ trang đang xem trên UI).
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, pageSize: number) => Promise<PageResult<T>>,
  pageSize = 100,
): Promise<T[]> {
  const all: T[] = []
  let page = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await fetchPage(page, pageSize)
    all.push(...res.items)
    if (all.length >= res.total || res.items.length === 0) break
    page++
  }
  return all
}
