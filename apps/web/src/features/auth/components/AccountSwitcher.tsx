'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import { useSession } from '@/store/session'
import { AccountList } from './AccountList'

/** Nút "Chuyển tài khoản" ở sidebar — mở danh sách tài khoản phía trên nút */
export function AccountSwitcher({ collapsed }: { collapsed: boolean }) {
  const t = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const count = useSession((s) => s.accounts.length)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={collapsed ? t.accounts.switchBtn : undefined}
        title={collapsed ? t.accounts.switchBtn : undefined}
        className={cn('w-full rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-100', collapsed ? 'px-0 text-center text-lg' : 'px-3 text-left')}
      >
        {collapsed ? <span aria-hidden>⇄</span> : `⇄ ${t.accounts.switchBtn}${count > 1 ? ` (${count})` : ''}`}
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-2 w-72 rounded-xl bg-white p-2 shadow-xl ring-1 ring-slate-200">
          <AccountList onDone={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}
