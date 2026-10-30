// Thông báo chung cho mọi thao tác ghi dữ liệu (POST/PUT/PATCH/DELETE) đi qua apiFetch.
// apiFetch phát sự kiện, MutationToaster (trong ToastProvider) dịch theo ngôn ngữ đang chọn rồi hiện toast.

export const MUTATION_EVENT = 'laclingo:mutation'

export type MutationKind = 'create' | 'update' | 'delete'

export interface MutationNotice {
  kind: MutationKind
  ok: boolean
  error?: string // nội dung lỗi từ server khi ok = false
  source?: { shownInline: boolean } // ApiError gốc — đã hiện trong form thì không toast lại
}

/** Mức thông báo: 'all' = thành công & thất bại; 'error' = chỉ khi thất bại; 'none' = không bao giờ */
type NotifyMode = 'all' | 'error' | 'none'

/** Tuỳ chọn ở nơi gọi: false = không báo; 'error' = chỉ báo khi thất bại; bỏ trống = theo RULES */
export type NotifyOption = false | 'error'

/**
 * API chạy ngầm / lặp liên tục / đã có phản hồi riêng trên màn hình → không hiện thông báo chung,
 * tránh toast dồn dập (vd mỗi từ khi luyện SRS).
 */
const RULES: [RegExp, NotifyMode][] = [
  [/^\/auth\//, 'none'], // form đăng nhập/đăng ký tự báo lỗi
  [/^\/users\/me\/(password|logout-all)$/, 'none'], // thẻ Đổi mật khẩu / Đăng xuất mọi thiết bị tự báo
  [/^\/srs\/(practice|reviews|learn)$/, 'none'], // nộp từng từ khi luyện / học từ mới
  [/^\/decks\/[^/]+\/practice-complete$/, 'none'], // hiện ngay trên màn kết thúc lượt ôn
  [/^\/notifications\/(read-all|[^/]+\/read)$/, 'none'], // đánh dấu đã đọc
  [/^\/notifications\/push\/subscriptions$/, 'none'], // đăng ký push tự động
  [/^\/reminder-settings\/timezone$/, 'none'], // tự đồng bộ múi giờ
  [/^\/listening\/questions\/[^/]+\/submit$/, 'none'], // trả lời bài nghe (có chấm ngay)
  [/^\/speaking\/items\/[^/]+\/attempts$/, 'none'], // lượt nói (có chấm ngay)
  [/\/(images|audio)$/, 'error'], // tải file lên trong form — chỉ báo khi lỗi
  [/\/(like|dislike|favorite|star|marker)$/, 'none'], // bấm ♥/★ — không thông báo (kể cả lỗi; nút tự trả về trạng thái cũ)
  [/\/bulk$/, 'error'], // nhập hàng loạt — màn hình có bảng kết quả từng dòng
  // Màn hình đã tự hiện thông báo thành công cụ thể hơn → chỉ báo chung khi lỗi
  [/^\/notifications\/push\/test$/, 'error'],
  [/^\/reminder-settings$/, 'error'],
  [/^\/admin\/reminder-defaults$/, 'error'],
  [/^\/admin\/announcements$/, 'error'],
  [/^\/admin\/users\/[^/]+\/(role|modules|active)$/, 'error'],
  [/^\/admin\/classes\/[^/]+\/lessons$/, 'error'],
]

const KIND: Record<string, MutationKind> = { POST: 'create', PUT: 'update', PATCH: 'update', DELETE: 'delete' }

/**
 * Thông báo cần hiện cho 1 request, hoặc null. `notify: false` ở nơi gọi tắt hẳn
 * (dùng khi màn hình đã tự hiện thông báo cụ thể hơn).
 */
export function mutationNotice(method: string | undefined, path: string, ok: boolean, error?: string, notify?: NotifyOption): MutationNotice | null {
  const kind = KIND[(method ?? 'GET').toUpperCase()]
  if (!kind || notify === false) return null
  const pathname = path.split('?')[0]
  const rule = RULES.find(([re]) => re.test(pathname))?.[1] ?? 'all'
  const mode = notify === 'error' && rule === 'all' ? 'error' : rule
  if (mode === 'none' || (mode === 'error' && ok)) return null
  return ok ? { kind, ok } : { kind, ok, error }
}

export function emitMutationNotice(notice: MutationNotice | null) {
  if (notice && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent<MutationNotice>(MUTATION_EVENT, { detail: notice }))
}
