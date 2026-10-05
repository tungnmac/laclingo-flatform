import { useSession } from '@/store/session'
import type { ErrorResponse } from '@/types/api'

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Gọi backend, tự gắn Bearer token của phiên hiện tại, parse JSON và chuẩn hoá lỗi về ApiError.
 * Token bị từ chối (401) thì đăng xuất để layout đưa người dùng về trang đăng nhập.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useSession.getState().token
  const headers = new Headers(init?.headers)
  // Chỉ gắn Content-Type khi có body — GET không cần, tránh preflight CORS thừa
  if (init?.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError('Không kết nối được tới máy chủ. Vui lòng thử lại.', 0)
  }

  if (!res.ok) {
    if (res.status === 401 && token) useSession.getState().logout()
    const body = (await res.json().catch(() => null)) as ErrorResponse | null
    throw new ApiError(body?.error ?? `Lỗi ${res.status}`, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
