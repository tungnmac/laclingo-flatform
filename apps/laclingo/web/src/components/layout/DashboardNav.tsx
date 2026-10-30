'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
import { useLocale, useLocales } from '@/store/locale'
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
  const currentLocale = useLocales((s) => s.locales.find((l) => l.value === locale))
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
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-white" />
              )}
            </span>
            {!collapsed && t.nav[item.key]}
            {!collapsed && item.key === 'wallet' && rewardCount > 0 && (
              <span className="ml-auto rounded-full bg-orange-500 px-1.5 text-xs font-bold text-white">{rewardCount}</span>
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
            title={currentLocale?.label}
            className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg text-lg hover:bg-slate-100"
          >
            <span aria-hidden>{currentLocale?.flag ?? '🌐'}</span>
          </button>
        ) : (
          <LanguageSwitcher className="mb-3 w-full" />
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
 * chuyển tài khoản). Mobile thêm logo + nút ☰ mở các mục của sidebar (không có sidebar trên mobile).
 * pt-safe: app iOS/Android vẽ web tràn dưới thanh trạng thái — chừa chỗ để giờ / pin không đè lên header.
 */
export function TopBar({ user }: { user: User }) {
  return (
    <header className="pt-safe sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link href="/learn" className="flex min-w-0 items-center gap-1.5 text-lg font-bold text-indigo-600 md:hidden">
          <img src="/logo.svg" alt="" className="h-7 w-7 shrink-0 rounded-lg" />
          <span className="hidden min-[360px]:inline">LacLingo</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <StreakBadge count={user.streak_count} />
          <NotificationBell />
          <UserMenu user={user} />
          <MobileMenu user={user} />
        </div>
      </div>
    </header>
  )
}

/**
 * Menu ☰ cho mobile: các mục của sidebar không có trên BottomNav (nghe, nói, nhiệm vụ, blog, Pro, ví, quản trị…)
 * + đổi ngôn ngữ + đăng xuất. Tự đóng khi chuyển trang / Escape / bấm nền tối / màn hình giãn ra md+.
 * Portal ra body: header có backdrop-blur → thành khung chứa của phần tử fixed (Chromium) + kẹt z-index của header,
 * ngăn kéo sẽ chỉ cao bằng header và bị BottomNav đè.
 */
function MobileMenu({ user }: { user: User }) {
  const t = useTranslation()
  const pathname = useNavPathname()
  const rewardCount = useRewardsCount((s) => s.count)
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const isAdmin = user.role === 'admin' || user.role === 'owner'
  const items = [LISTENING_ITEM, SPEAKING_ITEM, ANALYZE_ITEM, MISSIONS_ITEM, DAILY_ITEM, BLOG_ITEM, PRO_ITEM, WALLET_ITEM, ...(isAdmin ? [ADMIN_ITEM] : [])]

  // Đóng + trả focus về nút ☰ (Escape / nút ✕ / nền tối); chuyển trang thì chỉ đóng
  const close = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    // Xoay ngang / giãn ra md+: nút ☰ ẩn — đóng để aria-modal không chặn phím tắt Ctrl/⌘+B của Sidebar
    const desktop = window.matchMedia('(min-width: 768px)')
    const onResize = () => desktop.matches && setOpen(false)
    document.addEventListener('keydown', onKey)
    desktop.addEventListener('change', onResize)
    return () => {
      document.removeEventListener('keydown', onKey)
      desktop.removeEventListener('change', onResize)
    }
  }, [open])

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.nav.menu}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-600 hover:bg-slate-100"
      >
        <span aria-hidden>☰</span>
        {rewardCount > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-white" />}
      </button>
      {open && createPortal(
        <div role="presentation" className="fixed inset-0 z-50 bg-slate-900/40 md:hidden" onClick={close}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.nav.menu}
            onClick={(e) => e.stopPropagation()}
            className="pt-safe pb-safe absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
              <span className="text-base font-bold text-slate-800">{t.nav.menu}</span>
              <button
                type="button"
                autoFocus
                onClick={close}
                aria-label={t.nav.closeMenu}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-500 hover:bg-slate-100"
              >
                <span aria-hidden>✕</span>
              </button>
            </div>
            <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                    isActive(pathname, item.href) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  <span className="text-lg" aria-hidden>
                    {item.icon}
                  </span>
                  {t.nav[item.key]}
                  {item.key === 'wallet' && rewardCount > 0 && (
                    <span className="ml-auto rounded-full bg-orange-500 px-1.5 text-xs font-bold text-white">{rewardCount}</span>
                  )}
                </Link>
              ))}
            </nav>
            <div className="border-t border-slate-200 p-3">
              <LanguageSwitcher className="mb-3 w-full" />
              <button
                type="button"
                onClick={signOutCurrent}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-100"
              >
                {t.nav.logout}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
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
