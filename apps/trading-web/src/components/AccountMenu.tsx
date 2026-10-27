'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { AccountsDto } from '@/app/api/auth/accounts/route'
import type { SessionUser } from '@/server/auth/types'

/** Tải lại toàn trang sau khi đổi tài khoản — xoá mọi state client của tài khoản cũ */
const reloadTo = (path: string) => window.location.assign(path)

/** Menu tài khoản: chuyển qua lại các tài khoản đã đăng nhập, thêm tài khoản, đăng xuất */
export function AccountMenu({ user }: { user: SessionUser }) {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const [list, setList] = useState<AccountsDto['accounts'] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const ref = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    api<AccountsDto>('/api/auth/accounts').then((d) => setList(d.accounts), setError)
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key !== 'Escape') return
        setOpen(false)
        trigger.current?.focus() // Esc → trả focus về nút mở
      } else if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const run = async (op: () => Promise<string>) => {
    setBusy(true)
    setError(null)
    try {
      reloadTo(await op())
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }
  const switchTo = (id: string) => run(async () => (await api('/api/auth/switch', { method: 'POST', body: JSON.stringify({ user_id: id }) }), '/markets'))
  const logout = (all: boolean) =>
    run(async () => ((await api<{ next: SessionUser | null }>(`/api/auth/logout${all ? '?all=1' : ''}`, { method: 'POST' })).next ? '/markets' : '/login'))

  const others = (list ?? []).filter((a) => a.id !== user.id)

  return (
    <div ref={ref} className="relative">
      <button
        ref={trigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="account-menu"
        className="flex max-w-[12rem] items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
      >
        <span className="truncate">{user.display_name}</span>
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div id="account-menu" className="absolute right-0 z-20 mt-1 w-72 rounded-xl bg-white p-2 text-sm shadow-lg ring-1 ring-slate-200">
          <p className="px-2 pb-2 pt-1">
            <span className="block font-semibold">{user.display_name}</span>
            <span className="block truncate text-xs text-slate-500">{user.email}</span>
          </p>
          {others.length > 0 && (
            <div className="border-t border-slate-100 py-1">
              <p className="px-2 py-1 text-xs font-semibold uppercase text-slate-400">{t('accounts.switchTo')}</p>
              {others.map((a) => (
                <button key={a.id} disabled={busy} onClick={() => switchTo(a.id)} className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-slate-50 disabled:opacity-50">
                  <span className="block font-medium">{a.display_name}</span>
                  <span className="block truncate text-xs text-slate-500">{a.email}</span>
                </button>
              ))}
            </div>
          )}
          {list === null && error === null && <p className="px-2 py-1 text-xs text-slate-400">{t('common.loading')}</p>}
          {error !== null && <p className="px-2 py-1 text-xs text-rose-700">{errorMessage(error, t)}</p>}
          <div className="border-t border-slate-100 pt-1">
            <Link href="/login?add=1" className="block rounded-lg px-2 py-1.5 hover:bg-slate-50">
              {t('accounts.add')}
            </Link>
            <button disabled={busy} onClick={() => logout(false)} className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-slate-50 disabled:opacity-50">
              {t(list === null || others.length ? 'accounts.logoutThis' : 'nav.logout')}
            </button>
            {others.length > 0 && (
              <button disabled={busy} onClick={() => logout(true)} className="block w-full rounded-lg px-2 py-1.5 text-left text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                {t('accounts.logoutAll')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
