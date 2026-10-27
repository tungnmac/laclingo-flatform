'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { activeTrail, navItems, type NavItem } from '@/lib/app-nav'

const COLLAPSED_KEY = 'trading_sidebar_collapsed'
/** Bảng mục con nổi (sidebar thu gọn) — toạ độ theo viewport */
type Fly = { href: string; top: number; left: number; maxHeight: number }
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

  const items = navItems(role)
  const trail = activeTrail(pathname, items)
  const onNavigate = () => drawer && onClose(false) // bấm mục đang mở (không đổi đường dẫn) vẫn đóng ngăn kéo

  // Mục cha đang mở ra (▾). Đi tới trang con của mục nào thì mục đó tự mở.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(trail.top ? [trail.top] : []))
  useEffect(() => {
    if (trail.top) setExpanded((s) => (s.has(trail.top!) ? s : new Set(s).add(trail.top!)))
  }, [trail.top])
  const toggleGroup = (href: string) =>
    setExpanded((s) => {
      const next = new Set(s)
      if (!next.delete(href)) next.add(href)
      return next
    })

  // Sidebar thu gọn: di chuột / focus vào icon mục cha → bảng mục con nổi bên cạnh.
  // position: fixed theo viewport (aside bỏ transform ở lg) nên không bị nav cắt khi cuộn; bảng nằm ngay sau
  // mục cha trong DOM để Tab đi từ icon vào các mục con.
  const [fly, setFly] = useState<Fly | null>(null)
  const flyTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const showFly = (href: string, el: HTMLElement) => {
    clearTimeout(flyTimer.current)
    const r = el.getBoundingClientRect()
    const top = Math.max(64, Math.min(r.top, window.innerHeight - 220)) // màn hình thấp: kéo lên để còn thấy các mục
    setFly({ href, top, left: r.right + 8, maxHeight: window.innerHeight - top - 12 })
  }
  const keepFly = () => clearTimeout(flyTimer.current)
  const hideFly = () => {
    clearTimeout(flyTimer.current)
    flyTimer.current = setTimeout(() => setFly(null), 150) // đủ để rê chuột từ icon sang bảng
  }
  useEffect(() => {
    if (!collapsed) setFly(null)
  }, [collapsed])
  useEffect(() => setFly(null), [pathname])
  useEffect(() => {
    // vị trí lấy 1 lần lúc hover → cuộn menu / đổi cỡ cửa sổ thì đóng thay vì để lệch chỗ
    const close = () => setFly(null)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('resize', close)
      clearTimeout(flyTimer.current)
    }
  }, [])

  return (
    <>
      {drawer && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => onClose(true)} aria-hidden="true" />}

      {/* Đóng trên mobile: invisible → không còn trong thứ tự Tab / cây trợ năng (desktop luôn visible) */}
      <aside
        id="app-sidebar"
        role={drawer ? 'dialog' : undefined}
        aria-modal={drawer ? true : undefined}
        aria-label={t('nav.menu')}
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-[transform,width,visibility] duration-200 lg:visible lg:sticky lg:top-14 lg:z-10 lg:h-[calc(100vh-3.5rem)] lg:transform-none ${
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

        <nav aria-label={t('nav.menu')} onScroll={() => setFly(null)} className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-3 pb-3 pt-12 lg:pt-3">
          <ul className="space-y-0.5">
            {items.map((item) => (
              <NavEntry
                key={item.href}
                item={item}
                trail={trail}
                collapsed={collapsed}
                open={expanded.has(item.href)}
                onToggle={() => toggleGroup(item.href)}
                onNavigate={onNavigate}
                fly={collapsed && fly?.href === item.href ? fly : null}
                onHover={(el) => (collapsed && item.children ? showFly(item.href, el) : undefined)}
                onKeep={keepFly}
                onLeave={hideFly}
                onEscape={() => setFly(null)}
              />
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}

/** 1 mục cấp 1; mục có con: ▸/▾ để mở danh sách con thụt vào (sidebar rộng / ngăn kéo mobile) */
function NavEntry({
  item,
  trail,
  collapsed,
  open,
  onToggle,
  onNavigate,
  fly,
  onHover,
  onKeep,
  onLeave,
  onEscape,
}: {
  item: NavItem
  trail: { top: string | null; sub: string | null }
  collapsed: boolean
  open: boolean
  onToggle: () => void
  onNavigate: () => void
  fly: Fly | null
  onHover: (el: HTMLElement) => void
  onKeep: () => void
  onLeave: () => void
  onEscape: () => void
}) {
  const { t } = useT()
  const label = t(item.labelKey)
  const on = item.href === trail.top
  const groupId = `nav-sub-${item.href.replace(/\W+/g, '-')}`
  const flyId = `nav-fly-${item.href.replace(/\W+/g, '-')}`
  const trigger = useRef<HTMLAnchorElement>(null)
  return (
    <li onMouseEnter={(e) => onHover(e.currentTarget)} onMouseLeave={onLeave}>
      <div className="flex items-center">
        <Link
          ref={trigger}
          href={item.href}
          onClick={onNavigate}
          onFocus={(e) => onHover(e.currentTarget)}
          onBlur={onLeave}
          onKeyDown={(e) => e.key === 'Escape' && fly && onEscape()}
          // mục cha có con: trang đang mở là của mục con → mục cha là "vị trí", mục con mới là "page"
          aria-current={on ? (item.children ? 'true' : 'page') : undefined}
          aria-expanded={collapsed && item.children ? !!fly : undefined}
          aria-controls={fly ? flyId : undefined}
          aria-label={collapsed ? label : undefined}
          title={collapsed && !item.children ? label : undefined}
          className={`flex min-w-0 flex-1 items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${
            on ? (item.children ? 'text-emerald-700' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200') : 'text-slate-600 hover:bg-slate-100'
          } ${on && item.children && collapsed ? 'lg:bg-emerald-50 lg:ring-1 lg:ring-emerald-200' : ''}`}
        >
          <span aria-hidden className="w-5 shrink-0 text-center">
            {item.icon}
          </span>
          <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{label}</span>
        </Link>
        {item.children && (
          <button
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={open ? groupId : undefined}
            aria-label={t('nav.submenu', { name: label })}
            className={`shrink-0 rounded-lg px-2 py-2 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 ${collapsed ? 'lg:hidden' : ''}`}
          >
            {open ? '▾' : '▸'}
          </button>
        )}
      </div>
      {item.children && open && (
        <ul id={groupId} className={`ml-5 mt-0.5 space-y-0.5 border-l border-slate-200 pl-2 ${collapsed ? 'lg:hidden' : ''}`}>
          {item.children.map((c) => {
            const cur = c.href === trail.sub
            return (
              <li key={c.href}>
                <Link
                  href={c.href}
                  onClick={onNavigate}
                  aria-current={cur ? 'page' : undefined}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-2 py-1.5 text-sm font-medium ${cur ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <span aria-hidden className="w-5 shrink-0 text-center">
                    {c.icon}
                  </span>
                  <span className="truncate">{t(c.labelKey)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
      {fly && item.children && (
        <div
          id={flyId}
          onMouseEnter={onKeep}
          onKeyDown={(e) => {
            if (e.key !== 'Escape') return
            onEscape()
            trigger.current?.focus() // trả focus về icon mục cha
          }}
          style={{ top: fly.top, left: fly.left, maxHeight: fly.maxHeight }}
          className="fixed z-50 hidden w-56 overflow-y-auto rounded-xl bg-white p-2 shadow-lg ring-1 ring-slate-200 lg:block"
        >
          <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <ul>
            {item.children.map((c) => {
              const cur = c.href === trail.sub
              return (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    onFocus={onKeep}
                    onBlur={onLeave}
                    aria-current={cur ? 'page' : undefined}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium ${cur ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <span aria-hidden className="w-5 text-center">
                      {c.icon}
                    </span>
                    {t(c.labelKey)}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </li>
  )
}
