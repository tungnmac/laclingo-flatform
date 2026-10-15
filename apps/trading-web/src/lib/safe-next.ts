/** Chỉ cho phép chuyển hướng sau đăng nhập tới path NỘI BỘ — chặn open redirect (//evil.com, https://…). */
export function safeNextPath(next?: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/markets'
  return next
}
