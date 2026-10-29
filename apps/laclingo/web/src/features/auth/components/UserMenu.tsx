'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { useTranslation } from '@/hooks/useTranslation'
import { cn, displayName } from '@/lib/utils'
import type { User } from '@/types/api'
import { AccountList } from './AccountList'

/**
 * Thông tin tài khoản trên header: bấm avatar/tên mở menu — tên + email, vào Hồ sơ, chuyển / thêm tài khoản.
 * Đăng xuất vẫn ở góc dưới sidebar (mobile: trong danh sách tài khoản có "Đăng xuất tất cả", Hồ sơ có nút đăng xuất).
 */
export function UserMenu({ user }: { user: User }) {
  const t = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const onProfile = usePathname() === '/profile'
  const name = displayName(user)

  // Đóng khi bấm ra ngoài / Escape (trả focus về nút) / Tab ra khỏi menu — trừ khi đang mở hộp xác nhận
  // ("Đăng xuất tất cả" render ngoài menu)
  useEffect(() => {
    if (!open) return
    const confirming = () => !!document.querySelector('[role="alertdialog"]')
    const onPointer = (e: PointerEvent) => !confirming() && !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || confirming()) return
      setOpen(false)
      triggerRef.current?.focus()
    }
    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Node | null
      if (next && !ref.current?.contains(next) && !confirming()) setOpen(false)
    }
    const root = ref.current
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    root?.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
      root?.removeEventListener('focusout', onFocusOut)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined}
        aria-label={t.accounts.menu(name)}
        className={cn('flex items-center gap-2 rounded-full p-0.5 transition md:pr-3', open || onProfile ? 'bg-indigo-50' : 'hover:bg-slate-100')}
      >
        <Avatar name={name} src={user.avatar_url || undefined} className="h-8 w-8 shrink-0 text-xs" />
        <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-slate-800 md:block">{name}</span>
        <span className="hidden text-xs text-slate-400 md:block" aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        // Giới hạn chiều cao + cuộn: 5 tài khoản trên màn hình thấp vẫn bấm được "Thêm tài khoản" / "Đăng xuất tất cả"
        <div
          id={panelId}
          role="dialog"
          aria-label={t.accounts.title}
          className="fixed inset-x-4 top-[calc(4rem+var(--safe-top))] z-40 max-h-[calc(100dvh-9rem-var(--safe-top)-var(--safe-bottom))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-[min(32rem,calc(100dvh-5rem))] sm:w-80"
        >
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            aria-current={onProfile ? 'page' : undefined}
            className={cn('flex items-center gap-3 rounded-xl px-2 py-2', onProfile ? 'bg-indigo-50' : 'hover:bg-slate-100')}
          >
            <Avatar name={name} src={user.avatar_url || undefined} className="h-10 w-10 shrink-0 text-sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-900">{name}</span>
              <span className="block truncate text-xs text-slate-500">{user.email}</span>
            </span>
            <span className="shrink-0 text-xs font-medium text-indigo-600">{t.nav.profile} ›</span>
          </Link>
          <div className="my-2 border-t border-slate-100" />
          <AccountList onDone={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}
