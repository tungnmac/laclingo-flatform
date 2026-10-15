/**
 * Thứ tự mới của danh sách anh em sau khi chuyển `id` lên/xuống 1 bậc; ở đầu/cuối hoặc id lạ → null (không đổi).
 * Caller ghi lại position = chỉ số (0..n-1) — tự sửa luôn các position trùng/nhảy cóc.
 */
export function reorder(ids: string[], id: string, direction: 'up' | 'down'): string[] | null {
  const i = ids.indexOf(id)
  const j = direction === 'up' ? i - 1 : i + 1
  if (i < 0 || j < 0 || j >= ids.length) return null
  const next = [...ids]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}
