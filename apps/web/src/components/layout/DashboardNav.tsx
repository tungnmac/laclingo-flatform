'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { StreakBadge } from '@/features/user/components/StreakBadge'
import { cn, displayName } from '@/lib/utils'
import { useSession } from '@/store/session'
import type { User } from '@/types/api'

// Dùng cho BottomNav (mobile, grid-cols-5 cố định) — Hồ sơ vẫn ở đây vì mobile
// không có khối "thông tin cá nhân" riêng ở sidebar như desktop.
const NAV_ITEMS = [
  { href: '/learn', label: 'Học', icon: '📚' },
  { href: '/review', label: 'Ôn tập', icon: '🧠' },
  { href: '/challenges', label: 'Thách đấu', icon: '🎮' },
  { href: '/leaderboard', label: 'Xếp hạng', icon: '🏆' },
  { href: '/profile', label: 'Hồ sơ', icon: '👤' },
]

// Nav chính của Sidebar (desktop) — KHÔNG gồm Hồ sơ, vì trên desktop mục đó
// đã nằm trong khối thông tin cá nhân ở góc dưới (bấm vào avatar/tên để vào).
const SIDEBAR_NAV_ITEMS = NAV_ITEMS.filter((item) => item.href !== '/profile')
const MISSIONS_ITEM = { href: '/missions', label: 'Nhiệm vụ', icon: '🎯' }
const LISTENING_ITEM = { href: '/listening', label: 'Luyện nghe', icon: '🎧' }
const ADMIN_ITEM = { href: '/admin', label: 'Quản trị', icon: '🛠️' }

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Sidebar cho màn hình md+ */
export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useSession((s) => s.logout)
  const isAdmin = user.role === 'admin' || user.role === 'owner'
  const sidebarItems = [...SIDEBAR_NAV_ITEMS, LISTENING_ITEM, MISSIONS_ITEM, ...(isAdmin ? [ADMIN_ITEM] : [])]

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex lg:w-64">
      <Link href="/learn" className="mb-8 flex items-center gap-2 px-2 text-2xl font-bold text-indigo-600">
        <img src="/logo.svg" alt="" className="h-9 w-9 rounded-xl" /> LacLingo
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(pathname, item.href) ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
              isActive(pathname, item.href) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-200 pt-4">
        <Link
          href="/profile"
          aria-current={isActive(pathname, '/profile') ? 'page' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-xl px-2 py-2 transition',
            isActive(pathname, '/profile') ? 'bg-indigo-50' : 'hover:bg-slate-100',
          )}
        >
          <Avatar name={displayName(user)} src={user.avatar_url || undefined} className="h-9 w-9 text-sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{displayName(user)}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => {
            logout()
            router.replace('/login')
          }}
          className="mt-3 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-100"
        >
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}

/** Header gọn cho mobile */
export function MobileHeader({ user }: { user: User }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
      <Link href="/learn" className="flex items-center gap-1.5 text-lg font-bold text-indigo-600">
        <img src="/logo.svg" alt="" className="h-7 w-7 rounded-lg" /> LacLingo
      </Link>
      <div className="flex items-center gap-2">
        <StreakBadge count={user.streak_count} />
        <Link href="/profile" aria-label="Hồ sơ">
          <Avatar name={displayName(user)} src={user.avatar_url || undefined} className="h-8 w-8 text-xs" />
        </Link>
      </div>
    </header>
  )
}

/** Thanh điều hướng cố định dưới cùng cho mobile */
export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white md:hidden">
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive(pathname, item.href) ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 text-xs font-medium',
                isActive(pathname, item.href) ? 'text-indigo-600' : 'text-slate-500',
              )}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
