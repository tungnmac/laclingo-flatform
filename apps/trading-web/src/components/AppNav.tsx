'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { SessionUser } from '@/server/auth/types'

// Phần 3–6 thêm mục vào đây (Giao dịch, Nhật ký, Học, Thực hành)
const NAV_ITEMS = [{ href: '/markets', label: 'Thị trường' }]

export function AppNav({ user }: { user: SessionUser }) {
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/markets" className="text-lg font-bold text-emerald-600">
          📈 TradeLab
        </Link>
        <nav className="flex flex-1 gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <span className="hidden text-sm text-slate-600 sm:inline">{user.display_name}</span>
        <button onClick={logout} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Đăng xuất
        </button>
      </div>
    </header>
  )
}
