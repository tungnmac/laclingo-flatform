export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
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
    throw new ApiError('Không kết nối được máy chủ', 0)
  }
  if (res.status === 401 && !path.startsWith('/api/auth/') && typeof window !== 'undefined') {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new ApiError(body?.error ?? `Lỗi ${res.status}`, res.status)
  }
  return (res.status === 204 ? undefined : await res.json()) as T
}
