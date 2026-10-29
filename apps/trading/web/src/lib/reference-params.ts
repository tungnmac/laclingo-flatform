/** Tham số lọc của từng tab trang Tài liệu tham khảo — giữ trên URL để gửi link vẫn đúng bộ lọc */
export const REFERENCE_PARAMS = {
  resources: ['q', 'type', 'language', 'free', 'level', 'topic'],
  investors: ['q', 'country', 'style', 'status', 'sort'],
} as const

/** URL mới sau khi đổi tham số (giá trị rỗng = bỏ). Đổi tab (kể cả về tab mặc định `tab: ''`) thì bỏ bộ lọc của tab cũ. */
export function nextReferenceParams(current: URLSearchParams, patch: Record<string, string>): URLSearchParams {
  const tab = current.get('tab') === 'investors' ? 'investors' : 'resources'
  const next = new URLSearchParams(current)
  if ('tab' in patch && (patch.tab || 'resources') !== tab) for (const k of REFERENCE_PARAMS[tab]) next.delete(k)
  for (const [k, v] of Object.entries(patch)) {
    if (v) next.set(k, v)
    else next.delete(k)
  }
  return next
}
