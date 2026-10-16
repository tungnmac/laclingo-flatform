import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/server/auth/session'
import { csrfViolation } from '@/server/csrf'

const PUBLIC_PAGES = ['/login', '/register']

/**
 * API: chặn request ghi dữ liệu từ trang khác (CSRF) — đăng nhập do route handler tự kiểm (401).
 * Trang: chặn khi chưa đăng nhập (chỉ kiểm chữ ký/hạn JWT — tra DB để ở route handler / layout).
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname === '/api' || pathname.startsWith('/api/')) {
    const violation = csrfViolation(req.method, req.headers)
    if (!violation) return NextResponse.next()
    console.warn(`⚠️ csrf: chặn ${req.method} ${pathname} (${violation})`)
    return NextResponse.json({ code: 'FORBIDDEN', error: 'Forbidden' }, { status: 403 })
  }
  if (PUBLIC_PAGES.includes(pathname)) return NextResponse.next()
  if (await verifySession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next()
  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  url.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
