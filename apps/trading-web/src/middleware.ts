import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/server/auth/session'

/** Chặn trang khi chưa đăng nhập (chỉ kiểm chữ ký/hạn JWT — tra DB để ở route handler). API tự trả 401. */
export async function middleware(req: NextRequest) {
  if (await verifySession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next()
  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  url.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|register).*)'],
}
