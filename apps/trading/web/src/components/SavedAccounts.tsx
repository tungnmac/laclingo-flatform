'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { safeNextPath } from '@/lib/safe-next'
import type { AccountsDto } from '@/app/api/auth/accounts/route'

/** Trang đăng nhập: chọn nhanh tài khoản đã đăng nhập trên trình duyệt này (phiên còn hiệu lực) */
export function SavedAccounts({ next }: { next?: string }) {
  const { t } = useT()
  const [list, setList] = useState<AccountsDto['accounts']>([])
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api<AccountsDto>('/api/auth/accounts').then((d) => setList(d.accounts.filter((a) => !a.active)), () => setList([]))
  }, [])

  if (list.length === 0) return null
  return (
    <div className="mb-6 space-y-2">
      <p className="text-sm font-semibold text-slate-700">{t('accounts.continueAs')}</p>
      {list.map((a) => (
        <button
          key={a.id}
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              await api('/api/auth/switch', { method: 'POST', body: JSON.stringify({ user_id: a.id }) })
              window.location.assign(safeNextPath(next))
            } catch (err) {
              setError(err)
              setBusy(false)
            }
          }}
          className="block w-full rounded-lg px-3 py-2 text-left ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
        >
          <span className="block font-medium">{a.display_name}</span>
          <span className="block text-xs text-slate-500">{a.email}</span>
        </button>
      ))}
      {error !== null && <p className="text-sm text-rose-700">{errorMessage(error, t)}</p>}
      <p className="pt-2 text-xs text-slate-500">{t('accounts.orSignIn')}</p>
    </div>
  )
}
