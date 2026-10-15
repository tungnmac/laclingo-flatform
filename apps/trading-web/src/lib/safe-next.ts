const BASE = 'http://internal.invalid'

/**
 * Chỉ cho phép chuyển hướng sau đăng nhập tới path NỘI BỘ — chặn open redirect.
 * Phân giải bằng chính URL parser (như router của Next) rồi so origin: bắt được cả các mẹo
 * như "/\t/evil.com" mà parser tự bỏ tab/xuống dòng thành "//evil.com".
 */
export function safeNextPath(next?: string | null): string {
  if (!next || !next.startsWith('/')) return '/markets'
  try {
    const url = new URL(next, BASE)
    if (url.origin !== BASE) return '/markets'
    return url.pathname + url.search + url.hash
  } catch {
    return '/markets'
  }
}
