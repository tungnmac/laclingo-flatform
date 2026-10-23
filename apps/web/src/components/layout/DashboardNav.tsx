'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { NotificationBell } from '@/features/notification/components/NotificationBell'
import { StreakBadge } from '@/features/user/components/StreakBadge'
import { isTypingTarget } from '@/hooks/useKeypress'
import { useTranslation } from '@/hooks/useTranslation'
import { cn, displayName } from '@/lib/utils'
import { useLayout } from '@/store/layout'
import { LOCALES, useLocale } from '@/store/locale'
import { useSession } from '@/store/session'
import type { User } from '@/types/api'

// key tra vào t.nav (useTranslation) — label dịch theo ngôn ngữ giao diện,
// không hardcode chuỗi ở đây nữa.
// Dùng cho BottomNav (mobile, grid-cols-5 cố định) — Hồ sơ vẫn ở đây vì mobile
// không có khối "thông tin cá nhân" riêng ở sidebar như desktop.
const NAV_ITEMS = [
  { href: '/learn', key: 'learn' as const, icon: '📚' },
  { href: '/review', key: 'review' as const, icon: '🧠' },
  { href: '/challenges', key: 'challenges' as const, icon: '🎮' },
  { href: '/leaderboard', key: 'leaderboard' as const, icon: '🏆' },
  { href: '/profile', key: 'profile' as const, icon: '👤' },
]

// Nav chính của Sidebar (desktop) — KHÔNG gồm Hồ sơ, vì trên desktop mục đó
// đã nằm trong khối thông tin cá nhân ở góc dưới (bấm vào avatar/tên để vào).
const SIDEBAR_NAV_ITEMS = NAV_ITEMS.filter((item) => item.href !== '/profile')
const MISSIONS_ITEM = { href: '/missions', key: 'missions' as const, icon: '🎯' }
const DAILY_ITEM = { href: '/daily', key: 'daily' as const, icon: '📓' }
const ANALYZE_ITEM = { href: '/analyze', key: 'analyze' as const, icon: '🔍' }
const PRO_ITEM = { href: '/pricing', key: 'pro' as const, icon: '⭐' }
const LISTENING_ITEM = { href: '/listening', key: 'listening' as const, icon: '🎧' }
const SPEAKING_ITEM = { href: '/speaking', key: 'speaking' as const, icon: '🎤' }
const BLOG_ITEM = { href: '/blog', key: 'blog' as const, icon: '📝' }
const ADMIN_ITEM = { href: '/admin', key: 'admin' as const, icon: '🛠️' }

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Pathname dùng để tô mục nav đang active. Các trang từ vựng (học theo chủ đề,
 * ôn SRS, yêu thích) nằm dưới /review nhưng khi vào từ trang Học/{ngôn ngữ}
 * sẽ mang ?scope=learn (xem review/new/page.tsx) — lúc đó vẫn thuộc mục Học.
 */
function useNavPathname() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  if (searchParams.get('scope') === 'learn' && isActive(pathname, '/review')) return '/learn'
  return pathname
}

/**
 * Sidebar cho màn hình md+. Thu gọn được (nút ‹ › cạnh logo hoặc Ctrl/⌘+B) —
 * thu gọn chỉ còn icon, rê chuột xem tên mục; trạng thái nhớ ở localStorage.
 */
export function Sidebar({ user }: { user: User }) {
  const pathname = useNavPathname()
  const router = useRouter()
  const logout = useSession((s) => s.logout)
  const collapsed = useLayout((s) => s.sidebarCollapsed)
  const toggleSidebar = useLayout((s) => s.toggleSidebar)
  const setSidebarCollapsed = useLayout((s) => s.setSidebarCollapsed)
  const locale = useLocale((s) => s.locale)
  const t = useTranslation()
  const isAdmin = user.role === 'admin' || user.role === 'owner'
  const sidebarItems = [...SIDEBAR_NAV_ITEMS, LISTENING_ITEM, SPEAKING_ITEM, ANALYZE_ITEM, MISSIONS_ITEM, DAILY_ITEM, BLOG_ITEM, PRO_ITEM, ...(isAdmin ? [ADMIN_ITEM] : [])]
  const toggleLabel = collapsed ? t.nav.expandMenu : t.nav.collapseMenu

  // Ctrl/⌘+B: chỉ khi sidebar đang hiện (md+), không đang gõ chữ (Ctrl+B = in đậm),
  // không có hộp thoại mở; e.code để chạy cả với bàn phím không phải Latin
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || e.code !== 'KeyB') return
      if (e.repeat || e.defaultPrevented || isTypingTarget(e.target)) return
      if (!window.matchMedia('(min-width: 768px)').matches || document.querySelector('[aria-modal="true"]')) return
      e.preventDefault()
      toggleSidebar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleSidebar])

  return (
    <aside
      id="app-sidebar"
      className={cn(
        'sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-slate-200 bg-white py-6 transition-[width] duration-200 md:flex',
        collapsed ? 'w-[4.5rem] px-2' : 'w-60 px-4 lg:w-64',
      )}
    >
      <div className={cn('mb-8 flex items-center', collapsed ? 'flex-col gap-3' : 'justify-between gap-2')}>
        <Link
          href="/learn"
          title={collapsed ? 'LacLingo' : undefined}
          className="flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap px-2 text-2xl font-bold text-indigo-600"
        >
          <img src="/logo.svg" alt={collapsed ? 'LacLingo' : ''} className="h-9 w-9 shrink-0 rounded-xl" />
          {!collapsed && 'LacLingo'}
        </Link>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={toggleLabel}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar"
          title={`${toggleLabel} (Ctrl/⌘ + B)`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <span aria-hidden>{collapsed ? '›' : '‹'}</span>
        </button>
      </div>

      {/* min-h-0 + cuộn dọc: màn hình thấp thì danh sách menu tự cuộn, khối dưới (chuông,
          hồ sơ, đăng xuất) luôn nằm trong màn hình. nowrap + ẩn tràn ngang: lúc đang giãn
          rộng (200ms) chữ không xuống dòng / hiện thanh cuộn ngang */}
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden whitespace-nowrap">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(pathname, item.href) ? 'page' : undefined}
            aria-label={collapsed ? t.nav[item.key] : undefined}
            title={collapsed ? t.nav[item.key] : undefined}
            className={cn(
              'flex items-center gap-3 rounded-xl py-2.5 text-sm font-semibold transition',
              collapsed ? 'justify-center px-0' : 'px-3',
              isActive(pathname, item.href) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            <span className="text-lg" aria-hidden>
              {item.icon}
            </span>
            {!collapsed && t.nav[item.key]}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-200 pt-4">
        <div className="mb-2">
          <NotificationBell variant={collapsed ? 'rail' : 'sidebar'} />
        </div>
        {collapsed ? (
          // Thu gọn: hiện cờ ngôn ngữ hiện tại — bấm để mở rộng rồi đổi ở ô chọn
          <button
            type="button"
            onClick={() => setSidebarCollapsed(false)}
            aria-label={t.nav.expandMenu}
            title={LOCALES.find((l) => l.value === locale)?.label}
            className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg text-lg hover:bg-slate-100"
          >
            <span aria-hidden>{LOCALES.find((l) => l.value === locale)?.flag}</span>
          </button>
        ) : (
          <LanguageSwitcher className="mb-3" />
        )}
        <Link
          href="/profile"
          aria-current={isActive(pathname, '/profile') ? 'page' : undefined}
          aria-label={collapsed ? t.nav.profile : undefined}
          title={collapsed ? `${displayName(user)} · ${user.email}` : undefined}
          className={cn(
            'flex items-center gap-3 rounded-xl py-2 transition',
            collapsed ? 'justify-center px-0' : 'px-2',
            isActive(pathname, '/profile') ? 'bg-indigo-50' : 'hover:bg-slate-100',
          )}
        >
          <Avatar name={displayName(user)} src={user.avatar_url || undefined} className="h-9 w-9 shrink-0 text-sm" />
          {!collapsed && (
            <div className="min-w-0 flex-1 whitespace-nowrap">
              <p className="truncate text-sm font-semibold text-slate-900">{displayName(user)}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={() => {
            logout()
            router.replace('/login')
          }}
          aria-label={collapsed ? t.nav.logout : undefined}
          title={collapsed ? t.nav.logout : undefined}
          className={cn(
            'mt-3 w-full rounded-lg py-2 text-sm text-slate-500 hover:bg-slate-100',
            collapsed ? 'px-0 text-center text-lg' : 'px-3 text-left',
          )}
        >
          {collapsed ? <span aria-hidden>🚪</span> : t.nav.logout}
        </button>
      </div>
    </aside>
  )
}

/** Header gọn cho mobile */
export function MobileHeader({ user }: { user: User }) {
  const t = useTranslation()
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
      <Link href="/learn" className="flex items-center gap-1.5 text-lg font-bold text-indigo-600">
        <img src="/logo.svg" alt="" className="h-7 w-7 rounded-lg" /> LacLingo
      </Link>
      <div className="flex items-center gap-2">
        <StreakBadge count={user.streak_count} />
        <Link href={ANALYZE_ITEM.href} aria-label={t.nav.analyze} className="text-xl">
          {ANALYZE_ITEM.icon}
        </Link>
        <Link href={DAILY_ITEM.href} aria-label={t.nav.daily} className="text-xl">
          {DAILY_ITEM.icon}
        </Link>
        <NotificationBell variant="header" />
        <Link href="/profile" aria-label={t.nav.profile}>
          <Avatar name={displayName(user)} src={user.avatar_url || undefined} className="h-8 w-8 text-xs" />
        </Link>
      </div>
    </header>
  )
}

/** Thanh điều hướng cố định dưới cùng cho mobile */
export function BottomNav() {
  const pathname = useNavPathname()
  const t = useTranslation()
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
              {t.nav[item.key]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
