'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { activeHref, ADMIN_ITEMS, NAV_ITEMS, navItems, type NavItem } from '@/lib/app-nav'

const COLLAPSED_KEY = 'trading_sidebar_collapsed'
/** Khớp breakpoint `lg` mặc định của Tailwind — từ đây sidebar luôn hiện, không còn ngăn kéo */
const DESKTOP_QUERY = '(min-width: 1024px)'

/** Đang gõ chữ (input/textarea/contenteditable) → không bắt phím tắt (Ctrl+B = in đậm) */
const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))

/**
 * Menu chính bên trái, dưới header. Desktop: luôn hiện, thu gọn còn icon (‹/› hoặc Ctrl/⌘+B, nhớ trong
 * localStorage). Mobile: ngăn kéo trượt từ trái, mở bằng nút ☰ trên header.
 */
export function AppSidebar({ role, drawer, onClose }: { role: string; drawer: boolean; onClose: (returnFocus: boolean) => void }) {
  const { t } = useT()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const closer = useRef<HTMLButtonElement>(null)
  const loaded = useRef(false)
  const close = useRef(onClose)
  close.current = onClose

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
    const onWide = () => mq.matches && close.current(false)
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
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close.current(true)
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [drawer])

  useEffect(() => close.current(false), [pathname]) // điều hướng (kể cả back/forward) → đóng ngăn kéo

  const active = activeHref(pathname, navItems(role))
  const onNavigate = () => drawer && onClose(false) // bấm mục đang mở (không đổi đường dẫn) vẫn đóng ngăn kéo

  return (
    <>
      {drawer && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => onClose(true)} aria-hidden="true" />}

      {/* Đóng trên mobile: invisible → không còn trong thứ tự Tab / cây trợ năng (desktop luôn visible) */}
      <aside
        id="app-sidebar"
        role={drawer ? 'dialog' : undefined}
        aria-modal={drawer ? true : undefined}
        aria-label={t('nav.menu')}
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-[transform,width,visibility] duration-200 lg:visible lg:sticky lg:top-14 lg:z-10 lg:h-[calc(100vh-3.5rem)] lg:translate-x-0 ${
          drawer ? 'visible translate-x-0' : 'invisible -translate-x-full'
        } ${collapsed ? 'lg:w-[72px]' : 'lg:w-56'}`}
      >
        {/* Nút thu gọn nổi trên mép phải sidebar (desktop) — không chiếm chỗ của danh sách menu */}
        <button
          onClick={toggle}
          aria-label={t(collapsed ? 'nav.expand' : 'nav.collapse')}
          title={`${t(collapsed ? 'nav.expand' : 'nav.collapse')} (Ctrl+B)`}
          className="absolute -right-3 top-4 z-10 hidden h-6 w-6 items-center justify-center rounded-full bg-white text-xs leading-none text-slate-500 shadow-sm ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-700 lg:flex"
        >
          {collapsed ? '›' : '‹'}
        </button>
        <button
          ref={closer}
          onClick={() => onClose(true)}
          aria-label={t('nav.closeMenu')}
          className="absolute right-2 top-2 rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          ✕
        </button>

        <nav aria-label={t('nav.menu')} className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-3 pb-3 pt-12 lg:pt-3">
          <NavGroup items={NAV_ITEMS} active={active} collapsed={collapsed} onNavigate={onNavigate} />
          {role === 'admin' && <NavGroup title={t('nav.adminGroup')} items={ADMIN_ITEMS} active={active} collapsed={collapsed} onNavigate={onNavigate} />}
        </nav>
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
                onClick={onNavigate}
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
