'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { signOutCurrent } from '@/features/auth/components/AccountList'
import { UserMenu } from '@/features/auth/components/UserMenu'
import { useRewardsCount } from '@/features/billing/rewardsStore'
import { NotificationBell } from '@/features/notification/components/NotificationBell'
import { StreakBadge } from '@/features/user/components/StreakBadge'
import { isTypingTarget } from '@/hooks/useKeypress'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import { useLayout } from '@/store/layout'
import { LOCALES, useLocale } from '@/store/locale'
import type { User } from '@/types/api'

// key tra vào t.nav (useTranslation) — label dịch theo ngôn ngữ giao diện,
// không hardcode chuỗi ở đây nữa.
// Dùng cho BottomNav (mobile, grid-cols-5 cố định) — Hồ sơ vẫn ở đây cho mobile dễ bấm.
const NAV_ITEMS = [
  { href: '/learn', key: 'learn' as const, icon: '📚' },
  { href: '/review', key: 'review' as const, icon: '🧠' },
  { href: '/challenges', key: 'challenges' as const, icon: '🎮' },
  { href: '/leaderboard', key: 'leaderboard' as const, icon: '🏆' },
  { href: '/profile', key: 'profile' as const, icon: '👤' },
]

// Nav chính của Sidebar (desktop) — KHÔNG gồm Hồ sơ, vì mục đó đã nằm trong menu tài khoản trên header (TopBar).
const SIDEBAR_NAV_ITEMS = NAV_ITEMS.filter((item) => item.href !== '/profile')
const MISSIONS_ITEM = { href: '/missions', key: 'missions' as const, icon: '🎯' }
const DAILY_ITEM = { href: '/daily', key: 'daily' as const, icon: '📓' }
const ANALYZE_ITEM = { href: '/analyze', key: 'analyze' as const, icon: '🔍' }
const PRO_ITEM = { href: '/pricing', key: 'pro' as const, icon: '⭐' }
const WALLET_ITEM = { href: '/wallet', key: 'wallet' as const, icon: '💎' }
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
  const collapsed = useLayout((s) => s.sidebarCollapsed)
  const toggleSidebar = useLayout((s) => s.toggleSidebar)
  const setSidebarCollapsed = useLayout((s) => s.setSidebarCollapsed)
  const locale = useLocale((s) => s.locale)
  const t = useTranslation()
  const rewardCount = useRewardsCount((s) => s.count) // quà gems chờ nhận
  const isAdmin = user.role === 'admin' || user.role === 'owner'
  const sidebarItems = [...SIDEBAR_NAV_ITEMS, LISTENING_ITEM, SPEAKING_ITEM, ANALYZE_ITEM, MISSIONS_ITEM, DAILY_ITEM, BLOG_ITEM, PRO_ITEM, WALLET_ITEM, ...(isAdmin ? [ADMIN_ITEM] : [])]
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
      <div className={cn('mb-8 flex items-center', collapsed && 'justify-center')}>
        <Link
          href="/learn"
          title={collapsed ? 'LacLingo' : undefined}
          className="flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap px-2 text-2xl font-bold text-indigo-600"
        >
          <img src="/logo.svg" alt={collapsed ? 'LacLingo' : ''} className="h-9 w-9 shrink-0 rounded-xl" />
          {!collapsed && 'LacLingo'}
        </Link>
      </div>
      {/* Nút thu gọn/mở rộng nằm đè lên mép phải sidebar (ngang logo) — không chiếm chỗ của logo / menu */}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={toggleLabel}
        aria-expanded={!collapsed}
        aria-controls="app-sidebar"
        title={`${toggleLabel} (Ctrl/⌘ + B)`}
        className="absolute -right-3 top-[1.875rem] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-sm leading-none text-slate-500 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600"
      >
        <span aria-hidden>{collapsed ? '›' : '‹'}</span>
      </button>

      {/* min-h-0 + cuộn dọc: màn hình thấp thì danh sách menu tự cuộn, khối dưới (ngôn ngữ,
          đăng xuất) luôn nằm trong màn hình. nowrap + ẩn tràn ngang: lúc đang giãn
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
            <span className="relative text-lg" aria-hidden>
              {item.icon}
              {/* Thu gọn: chấm vàng trên icon Ví khi có quà gems chờ nhận */}
              {collapsed && item.key === 'wallet' && rewardCount > 0 && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
              )}
            </span>
            {!collapsed && t.nav[item.key]}
            {!collapsed && item.key === 'wallet' && rewardCount > 0 && (
              <span className="ml-auto rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">{rewardCount}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Thông báo + thông tin tài khoản nằm trên header (TopBar); góc dưới chỉ còn ngôn ngữ + đăng xuất */}
      <div className="border-t border-slate-200 pt-4">
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
        <button
          type="button"
          onClick={signOutCurrent}
          aria-label={collapsed ? t.nav.logout : undefined}
          title={collapsed ? t.nav.logout : undefined}
          className={cn(
            'w-full rounded-lg py-2 text-sm text-slate-500 hover:bg-slate-100',
            collapsed ? 'px-0 text-center text-lg' : 'px-3 text-left',
          )}
        >
          {collapsed ? <span aria-hidden>🚪</span> : t.nav.logout}
        </button>
      </div>
    </aside>
  )
}

/**
 * Header trên cùng của vùng nội dung (mọi kích thước màn hình): bên phải là chuông thông báo + menu tài khoản (hồ sơ,
 * chuyển tài khoản). Mobile thêm logo + lối tắt vì không có sidebar.
 */
export function TopBar({ user }: { user: User }) {
  const t = useTranslation()
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur sm:px-6 lg:px-8">
      <Link href="/learn" className="flex items-center gap-1.5 text-lg font-bold text-indigo-600 md:hidden">
        <img src="/logo.svg" alt="" className="h-7 w-7 rounded-lg" /> LacLingo
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <StreakBadge count={user.streak_count} />
        <Link href={ANALYZE_ITEM.href} aria-label={t.nav.analyze} className="text-xl md:hidden">
          {ANALYZE_ITEM.icon}
        </Link>
        <Link href={DAILY_ITEM.href} aria-label={t.nav.daily} className="text-xl md:hidden">
          {DAILY_ITEM.icon}
        </Link>
        <NotificationBell />
        <UserMenu user={user} />
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
