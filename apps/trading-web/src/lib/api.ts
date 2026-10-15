import type { TranslateParams } from '@/i18n/translate'

/** Lỗi API phía client — giữ `code`/`params` để hiển thị theo ngôn ngữ ĐANG chọn (errorMessage). */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public params?: TranslateParams,
  ) {
    super(message)
  }
}

/** fetch tới API cùng origin (cookie tự gửi kèm), chuẩn hoá lỗi; 401 ngoài /api/auth → về trang đăng nhập. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      ...init,
      cache: 'no-store',
      headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
    })
  } catch {
    throw new ApiError('network error', 0, 'NETWORK')
  }
  if (res.status === 401 && !path.startsWith('/api/auth/') && typeof window !== 'undefined') {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { code?: string; params?: TranslateParams; error?: string } | null
    throw new ApiError(body?.error ?? `HTTP ${res.status}`, res.status, body?.code ?? 'INTERNAL', body?.params)
  }
  return (res.status === 204 ? undefined : await res.json()) as T
}
