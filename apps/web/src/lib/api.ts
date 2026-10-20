import { apiErrorText } from '@/lib/apiErrorText'
import { emitMutationNotice, mutationNotice, type NotifyOption } from '@/lib/mutationNotice'
import { useLocale } from '@/store/locale'
import { useSession } from '@/store/session'
import type { ErrorResponse } from '@/types/api'

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1'

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
 */
export type ApiInit = RequestInit & { notify?: NotifyOption }

/**
 * Gọi backend, tự gắn Bearer token của phiên hiện tại, parse JSON và chuẩn hoá lỗi về ApiError.
 * Token bị từ chối (401) thì đăng xuất để layout đưa người dùng về trang đăng nhập.
 * Request ghi dữ liệu (POST/PUT/PATCH/DELETE) tự hiện thông báo thành công/thất bại (xem mutationNotice).
 */
export async function apiFetch<T>(path: string, init?: ApiInit): Promise<T> {
  const { notify, ...requestInit } = init ?? {}
  const token = useSession.getState().token
  const headers = new Headers(requestInit.headers)
  // Chỉ gắn Content-Type khi có body JSON — GET không cần, tránh preflight CORS
  // thừa; body là FormData (upload file) thì ĐỂ BROWSER tự set (kèm boundary),
  // tự set cứng application/json sẽ làm hỏng multipart request.
  if (requestInit.body && !(requestInit.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
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
    if (res.status === 401 && token) useSession.getState().logout()
    const body = (await res.json().catch(() => null)) as ErrorResponse | null
    throw fail(new ApiError(apiErrorText(res.status, body?.error, useLocale.getState().locale, !!token), res.status))
  }

  // Đọc xong body rồi mới báo thành công — body lỗi thì nơi gọi nhận lỗi, không có toast "thành công" sai
  const data = (res.status === 204 ? undefined : await res.json()) as T
  emitMutationNotice(mutationNotice(requestInit.method, path, true, undefined, notify))
  return data
}

/**
 * Media backend tự phục vụ (vd ảnh minh hoạ từ vựng "/vocab/images/...") được
 * lưu dạng path tương đối để không dính domain API của môi trường — ghép
 * API_URL khi render. URL tuyệt đối (ảnh ngoài) giữ nguyên.
 */
export function resolveMediaUrl(url: string): string {
  return url.startsWith('/') && !url.startsWith('//') ? `${API_URL}${url}` : url
}
