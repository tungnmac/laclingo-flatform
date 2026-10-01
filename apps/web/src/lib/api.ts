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

/** Gọi backend, parse JSON và chuẩn hoá lỗi về ApiError */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      // Chỉ gắn Content-Type khi có body — GET không cần, tránh preflight CORS thừa
      headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
    })
  } catch {
    throw new ApiError('Không kết nối được tới máy chủ. Vui lòng thử lại.', 0)
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ErrorResponse | null
    throw new ApiError(body?.error ?? `Lỗi ${res.status}`, res.status)
  }

  return res.json() as Promise<T>
}
