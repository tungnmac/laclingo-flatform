'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher'
import { activeHref, ADMIN_ITEMS, NAV_ITEMS, navItems, type NavItem } from '@/lib/app-nav'
import type { SessionUser } from '@/server/auth/types'
import type { Plan } from '@/server/billing/plans'
import { AccountMenu } from './AccountMenu'

const COLLAPSED_KEY = 'trading_sidebar_collapsed'
/** Khớp breakpoint `lg` mặc định của Tailwind — từ đây sidebar luôn hiện, không còn ngăn kéo */
const DESKTOP_QUERY = '(min-width: 1024px)'

/** Đang gõ chữ (input/textarea/contenteditable) → không bắt phím tắt (Ctrl+B = in đậm) */
const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))

/**
 * Menu chính: sidebar trái trên desktop (thu gọn còn icon, nhớ trong localStorage, Ctrl/⌘+B),
 * thanh trên + ngăn kéo trượt từ trái trên mobile.
 */
export function AppSidebar({ user, plan }: { user: SessionUser; plan: Plan }) {
  const { t } = useT()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const opener = useRef<HTMLButtonElement>(null)
  const closer = useRef<HTMLButtonElement>(null)
  const loaded = useRef(false)

  // Đọc sau khi mount để HTML server và client khớp nhau (không lỗi hydration)
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === '1')
    } catch {
      // không có localStorage (chế độ riêng tư…) → mặc định mở rộng
    }
  }, [])
  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true // lần chạy đầu là giá trị mặc định, chưa phải lựa chọn của người dùng
      return
    }
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0')
    } catch {
      // bỏ qua — chỉ là tiện ích nhớ lựa chọn
    }
  }, [collapsed])
  const toggle = () => setCollapsed((v) => !v)

  const closeDrawer = () => {
    setDrawer(false)
    opener.current?.focus() // trả focus về nút ☰
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // e.code: vẫn đúng khi bàn phím đang ở bố cục không phải Latin; chỉ desktop (sidebar đang hiện)
      if (e.code === 'KeyB' && (e.ctrlKey || e.metaKey) && !e.repeat && !isTyping(e.target) && window.matchMedia(DESKTOP_QUERY).matches) {
        e.preventDefault()
        toggle()
      }
    }
    document.addEventListener('keydown', onKey)
    // Màn hình rộng ra tới desktop → không còn ngăn kéo
    const mq = window.matchMedia(DESKTOP_QUERY)
    const onWide = () => mq.matches && setDrawer(false)
    mq.addEventListener('change', onWide)
    return () => {
      document.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onWide)
    }
  }, [])

  // Ngăn kéo mở: focus vào nút đóng, Esc để đóng, khoá cuộn trang phía sau
  useEffect(() => {
    if (!drawer) return
    closer.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeDrawer()
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [drawer])

  useEffect(() => setDrawer(false), [pathname]) // điều hướng (kể cả back/forward) → đóng ngăn kéo

  const active = activeHref(pathname, navItems(user.role))
  const proLabel = t(plan === 'pro' ? 'pro.badge' : 'pro.upgradeShort')
  const proClass = plan === 'pro' ? 'bg-emerald-600 text-white' : 'text-emerald-700 ring-1 ring-emerald-300 hover:bg-emerald-50'

  return (
    <>
      {/* Mobile: thanh trên */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <button
          ref={opener}
          onClick={() => setDrawer(true)}
          aria-label={t('nav.openMenu')}
          aria-expanded={drawer}
          aria-controls="app-sidebar"
          className="rounded-lg px-2 py-1 text-xl text-slate-600 hover:bg-slate-100"
        >
          ☰
        </button>
        <Link href="/markets" className="flex-1 text-lg font-bold text-emerald-600">
          📈 TradeLab
        </Link>
        <Link href="/pro" className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${proClass}`}>
          {proLabel}
        </Link>
        <AccountMenu user={user} />
      </header>

      {drawer && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={closeDrawer} aria-hidden="true" />}

      {/* Đóng trên mobile: invisible → không còn trong thứ tự Tab / cây trợ năng (desktop luôn visible) */}
      <aside
        id="app-sidebar"
        role={drawer ? 'dialog' : undefined}
        aria-modal={drawer ? true : undefined}
        aria-label={t('nav.menu')}
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-[transform,width,visibility] duration-200 lg:visible lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:translate-x-0 ${
          drawer ? 'visible translate-x-0' : 'invisible -translate-x-full'
        } ${collapsed ? 'lg:w-[72px]' : 'lg:w-60'}`}
      >
        <div className={`flex items-center gap-2 px-4 py-4 ${collapsed ? 'lg:flex-col lg:px-2' : ''}`}>
          <Link href="/markets" onClick={closeDrawer} className="flex-1 whitespace-nowrap text-lg font-bold text-emerald-600">
            📈 <span className={collapsed ? 'lg:hidden' : ''}>TradeLab</span>
          </Link>
          <button
            onClick={toggle}
            aria-label={t(collapsed ? 'nav.expand' : 'nav.collapse')}
            title={`${t(collapsed ? 'nav.expand' : 'nav.collapse')} (Ctrl+B)`}
            className="hidden rounded-lg px-2 py-1 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100 lg:block"
          >
            {collapsed ? '›' : '‹'}
          </button>
          <button ref={closer} onClick={closeDrawer} aria-label={t('nav.closeMenu')} className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 lg:hidden">
            ✕
          </button>
        </div>

        <nav aria-label={t('nav.menu')} className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-3 pb-4">
          <NavGroup items={NAV_ITEMS} active={active} collapsed={collapsed} onNavigate={closeDrawer} />
          {user.role === 'admin' && <NavGroup title={t('nav.adminGroup')} items={ADMIN_ITEMS} active={active} collapsed={collapsed} onNavigate={closeDrawer} />}
        </nav>

        <div className={`space-y-2 border-t border-slate-200 p-3 ${collapsed ? 'lg:hidden' : ''}`}>
          <Link href="/pro" onClick={closeDrawer} className={`block whitespace-nowrap rounded-full px-3 py-1 text-center text-xs font-bold ${proClass}`}>
            {proLabel}
          </Link>
          <LanguageSwitcher className="w-full" />
          <div className="hidden lg:block">
            <AccountMenu user={user} placement="up" />
          </div>
        </div>
        {/* Thu gọn: chỉ giữ nút Pro dạng icon + tài khoản; đổi ngôn ngữ → mở rộng sidebar */}
        {collapsed && (
          <div className="hidden flex-col items-center gap-2 border-t border-slate-200 py-3 lg:flex">
            <Link href="/pro" title={proLabel} aria-label={proLabel} className="rounded-lg px-2 py-1 hover:bg-slate-100">
              ⭐
            </Link>
            <button onClick={toggle} title={t('nav.expandForLanguage')} aria-label={t('nav.expandForLanguage')} className="rounded-lg px-2 py-1 hover:bg-slate-100">
              🌐
            </button>
            <AccountMenu user={user} placement="up" compact />
          </div>
        )}
      </aside>
    </>
  )
}

function NavGroup({
  title,
  items,
  active,
  collapsed,
  onNavigate,
}: {
  title?: string
  items: NavItem[]
  active: string | null
  collapsed: boolean
  onNavigate: () => void
}) {
  const { t } = useT()
  return (
    <div>
      {title && (
        <p className={`mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400 ${collapsed ? 'lg:hidden' : ''}`}>{title}</p>
      )}
      {title && collapsed && <hr className="mx-2 mb-2 hidden border-slate-200 lg:block" />}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const on = item.href === active
          const label = t(item.labelKey)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate} // bấm mục đang mở (không đổi đường dẫn) vẫn đóng ngăn kéo
                aria-current={on ? 'page' : undefined}
                aria-label={collapsed ? label : undefined}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${
                  on ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span aria-hidden className="w-5 shrink-0 text-center">
                  {item.icon}
                </span>
                <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
