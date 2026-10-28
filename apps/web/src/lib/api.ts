import { apiErrorText } from '@/lib/apiErrorText'
import { emitMutationNotice, mutationNotice, type NotifyOption } from '@/lib/mutationNotice'
import { getCachedResponse, putCachedResponse } from '@/lib/offlineDb'
import { useLocale } from '@/store/locale'
import { isAccessValid, useSession } from '@/store/session'
import type { ErrorResponse, LimitErrorDetail } from '@/types/api'

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1'

/** Sự kiện window khi gói Free hết lượt (402 pro_required) — PaywallDialog (dashboard layout) mời nâng cấp Pro */
export const PAYWALL_EVENT = 'laclingo:paywall'

export class ApiError extends Error {
  /** Màn hình đã hiện lỗi này ngay trong form (xem inlineError) → thông báo chung không hiện toast trùng */
  shownInline = false

  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Lấy câu lỗi để hiện NGAY TRONG form và đánh dấu đã hiện — toast lỗi chung sẽ bỏ qua lỗi này */
export function inlineError(err: unknown): string {
  if (err instanceof ApiError) err.shownInline = true
  return err instanceof Error ? err.message : String(err)
}

/**
 * RequestInit + `notify`: false = tắt thông báo chung; 'error' = chỉ báo khi lỗi (màn hình tự báo thành công
 * cụ thể hơn, hoặc thao tác gồm nhiều request chỉ báo 1 lần ở cuối).
 * `paywall`: false = hết lượt gói Free (402) không mở màn nâng cấp Pro (request chạy ngầm, người dùng không bấm gì).
 * `offlineCache`: false = GET không lưu / không trả kết quả đã lưu khi mất mạng (nơi gọi tự xử lý offline — vd phiên
 * ôn tập cần biết đang offline để dùng bộ thẻ riêng).
 */
export type ApiInit = RequestInit & { notify?: NotifyOption; paywall?: false; offlineCache?: false }

/** Lỗi do mất mạng (fetch không tới được server) */
export function isNetworkError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 0
}

/** Lỗi "mất kết nối" như apiFetch báo khi không tới được server (câu chữ theo ngôn ngữ đang chọn) */
export function networkError(): ApiError {
  return new ApiError(apiErrorText(0, undefined, useLocale.getState().locale), 0)
}

/** GET dùng được khi offline: lưu kết quả mới nhất, mất mạng thì trả bản đã lưu. Trừ đăng nhập và trang quản trị */
function isOfflineCacheable(path: string, init?: ApiInit) {
  const method = (init?.method ?? 'GET').toUpperCase()
  return method === 'GET' && init?.offlineCache !== false && !path.startsWith('/auth/') && !path.startsWith('/admin')
}

/**
 * Gọi backend, tự gắn Bearer token của phiên hiện tại, parse JSON và chuẩn hoá lỗi về ApiError.
 * Token bị từ chối (401) thì đăng xuất để layout đưa người dùng về trang đăng nhập.
 * Request ghi dữ liệu (POST/PUT/PATCH/DELETE) tự hiện thông báo thành công/thất bại (xem mutationNotice).
 */
export async function apiFetch<T>(path: string, init?: ApiInit): Promise<T> {
  const cacheable = isOfflineCacheable(path, init)
  try {
    const data = await request<T>(path, init, false)
    if (cacheable) void putCachedResponse(path, data)
    return data
  } catch (err) {
    // Mất mạng → dữ liệu lần trước (giao diện vẫn dùng được); chưa từng tải → lỗi mạng như cũ (màn hình hiện ô trống)
    if (cacheable && isNetworkError(err)) {
      const cached = await getCachedResponse<T>(path)
      if (cached !== undefined) return cached
    }
    throw err
  }
}

/** retried = đã làm mới phiên + gửi lại 1 lần (không lặp nếu vẫn 401) */
async function request<T>(path: string, init: ApiInit | undefined, retried: boolean): Promise<T> {
  const { notify, paywall, offlineCache, ...requestInit } = init ?? {}
  // /auth/* (đăng nhập, đăng ký) không gửi token: 401 ở đó là sai mật khẩu, không phải phiên đang dùng hết hạn
  const authRoute = path.startsWith('/auth/')
  if (!authRoute) await ensureFreshToken() // access token sắp hết hạn → làm mới trước, khỏi nhận 401
  const token = useSession.getState().token
  const headers = new Headers(requestInit.headers)
  // Chỉ gắn Content-Type khi có body JSON — GET không cần, tránh preflight CORS
  // thừa; body là FormData (upload file) thì ĐỂ BROWSER tự set (kèm boundary),
  // tự set cứng application/json sẽ làm hỏng multipart request.
  if (requestInit.body && !(requestInit.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (token && !authRoute) headers.set('Authorization', `Bearer ${token}`)
  const fail = (err: ApiError) => {
    const notice = mutationNotice(requestInit.method, path, false, err.message, notify)
    emitMutationNotice(notice && { ...notice, source: err })
    return err
  }

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, { ...requestInit, headers })
  } catch {
    throw fail(new ApiError(apiErrorText(0, undefined, useLocale.getState().locale), 0))
  }

  if (!res.ok) {
    // Token bị từ chối → tài khoản này hết phiên (giữ trong danh sách); còn tài khoản khác thì chuyển sang, không thì
    // đăng nhập lại — luôn tải lại trang để không lẫn dữ liệu
    if (res.status === 401 && token && !authRoute) {
      // Access token bị từ chối (hết hạn sớm / máy lệch giờ) → làm mới phiên rồi gửi lại 1 lần
      const refreshed = retried ? 'invalid' : await refreshSession()
      if (refreshed === 'ok') return request<T>(path, init, true)
      if (refreshed === 'transient') {
        // Mất mạng / máy chủ lỗi khi làm mới — giữ phiên (refresh token vẫn còn), báo lỗi kết nối
        throw fail(new ApiError(apiErrorText(0, undefined, useLocale.getState().locale), 0))
      }
      const username = useSession.getState().user?.username
      const result = useSession.getState().expireToken(token)
      if (result === 'switched') window.location.assign('/learn')
      else if (result === 'expired') window.location.assign(`/login?relogin=${encodeURIComponent(username ?? '')}`)
    }
    const body = (await res.json().catch(() => null)) as (ErrorResponse & Partial<LimitErrorDetail>) | null
    const err = new ApiError(apiErrorText(res.status, body?.error, useLocale.getState().locale, !!token && !authRoute, body?.code), res.status)
    if (res.status === 402 && body?.code === 'pro_required' && paywall !== false) {
      // Màn nâng cấp Pro đã báo lý do — không hiện thêm toast lỗi chung
      err.shownInline = true
      window.dispatchEvent(new CustomEvent<LimitErrorDetail>(PAYWALL_EVENT, { detail: body as LimitErrorDetail }))
    }
    throw fail(err)
  }

  // Đọc xong body rồi mới báo thành công — body lỗi thì nơi gọi nhận lỗi, không có toast "thành công" sai
  const data = (res.status === 204 ? undefined : await res.json()) as T
  emitMutationNotice(mutationNotice(requestInit.method, path, true, undefined, notify))
  // Thao tác ghi xong (ôn từ, làm bài...) có thể vừa hoàn thành nhiệm vụ / lên cấp — useAchievementAlerts kiểm tra ngay.
  // Bỏ qua /notifications (đánh dấu đã đọc...) để không tự kích hoạt lại
  const method = (requestInit.method ?? 'GET').toUpperCase()
  if (method !== 'GET' && !authRoute && !path.startsWith('/notifications')) window.dispatchEvent(new Event(API_WRITE_EVENT))
  return data
}

// ===== Làm mới phiên (refresh token) =====

const REFRESH_EARLY_MS = 60_000 // làm mới khi access token còn dưới 1 phút
let refreshing: Promise<RefreshResult> | null = null

/** ok = có token mới; invalid = phiên hết hẳn (đăng nhập lại); transient = mất mạng / máy chủ lỗi (giữ phiên, thử lại sau) */
export type RefreshResult = 'ok' | 'invalid' | 'transient'

/**
 * Đổi refresh token của tài khoản đang dùng lấy access + refresh token mới. Nhiều request cùng lúc dùng chung 1 lần
 * làm mới. Chỉ 'invalid' mới xử lý như hết phiên.
 */
export function refreshSession(): Promise<RefreshResult> {
  if (!refreshing) refreshing = doRefresh().finally(() => (refreshing = null))
  return refreshing
}

async function doRefresh(): Promise<RefreshResult> {
  const s = useSession.getState()
  const userId = s.user?.id
  const refreshToken = s.refreshToken
  if (!userId || !refreshToken || !s.refreshExpiresAt || Date.parse(s.refreshExpiresAt) <= Date.now()) return 'invalid'
  let res: Response
  try {
    res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  } catch {
    return 'transient'
  }
  if (res.ok) {
    useSession.getState().updateTokens(userId, await res.json())
    return 'ok'
  }
  if (res.status !== 401 && res.status !== 403) return 'transient' // 429 / 5xx
  // Tab khác vừa làm mới (token cũ đã đổi) → nạp lại phiên từ localStorage rồi dùng token của tab đó
  await useSession.persist.rehydrate()
  const now = useSession.getState()
  if (now.user?.id === userId && now.refreshToken !== refreshToken && isAccessValid(now)) return 'ok'
  // Token bị từ chối mà không tab nào có token mới — có thể ai đó đã dùng trộm token này: thu hồi cả họ token
  revokeRefreshToken(refreshToken)
  return 'invalid'
}

/** Access token sắp / đã hết hạn mà còn refresh token → làm mới trước khi dùng (API, WebSocket) */
export async function ensureFreshToken(): Promise<void> {
  const s = useSession.getState()
  if (!s.user || !s.refreshToken) return
  if (s.token && s.expiresAt && Date.parse(s.expiresAt) - Date.now() > REFRESH_EARLY_MS) return
  await refreshSession()
}

/** Thu hồi refresh token ở server (đăng xuất) — không chờ kết quả, vẫn gửi khi trang đang chuyển đi */
export function revokeRefreshToken(refreshToken: string) {
  void fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
    keepalive: true,
  }).catch(() => {})
}

/** Phát sau mỗi request ghi dữ liệu thành công (xem apiFetch) */
export const API_WRITE_EVENT = 'laclingo:api-write'

/**
 * Media backend tự phục vụ (vd ảnh minh hoạ từ vựng "/vocab/images/...") được
 * lưu dạng path tương đối để không dính domain API của môi trường — ghép
 * API_URL khi render. URL tuyệt đối (ảnh ngoài) giữ nguyên.
 */
export function resolveMediaUrl(url: string): string {
  return url.startsWith('/') && !url.startsWith('//') ? `${API_URL}${url}` : url
}
