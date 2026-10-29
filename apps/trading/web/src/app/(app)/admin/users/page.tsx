'use client'

import { useCallback, useEffect, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { AdminUserDto } from '@/server/admin/user-admin'

type Action = { action: 'activate' | 'lock' | 'unlock' } | { action: 'set_role'; role: 'user' | 'admin' }

/** Kích hoạt thủ công (thay cho OTP), khoá / mở khoá, cấp / gỡ quyền admin */
export default function AdminUsersPage() {
  const { t, locale } = useT()
  const [list, setList] = useState<AdminUserDto[] | null>(null)
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [reload, setReload] = useState(0)
  const refresh = useCallback(() => setReload((n) => n + 1), [])

  useEffect(() => {
    let alive = true
    const id = setTimeout(() => {
      api<AdminUserDto[]>(`/api/admin/users${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`).then(
        (l) => {
          if (!alive) return
          setList(l)
          setError(null)
        },
        (e) => alive && setError(e),
      )
    }, 250)
    return () => {
      alive = false
      clearTimeout(id)
    }
  }, [q, reload])

  const run = async (u: AdminUserDto, body: Action, confirmKey?: string) => {
    if (confirmKey && !window.confirm(t(confirmKey, { email: u.email }))) return
    setBusy(u.id)
    setError(null)
    try {
      const updated = await api<AdminUserDto>(`/api/admin/users/${u.id}`, { method: 'PATCH', body: JSON.stringify(body) })
      setList((l) => l?.map((x) => (x.id === updated.id ? updated : x)) ?? l)
    } catch (err) {
      setError(err)
      refresh()
    } finally {
      setBusy(null)
    }
  }

  const date = (iso: string) => new Date(iso).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')
  const badge = (cls: string, text: string) => <span className={`mr-1 inline-block rounded px-2 py-0.5 text-xs font-semibold ${cls}`}>{text}</span>
  const actionClass = 'whitespace-nowrap text-sm font-semibold hover:underline disabled:opacity-50'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t('adminUsers.title')}</h1>
        <p className="text-sm text-slate-500">{t('adminUsers.subtitle')}</p>
      </div>

      {error !== null && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">{errorMessage(error, t)}</p>}

      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('adminUsers.search')}
        aria-label={t('adminUsers.search')}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:w-80"
      />

      {!list ? (
        <p className="py-6 text-center text-slate-400">{t('common.loading')}</p>
      ) : list.length === 0 ? (
        <p className="py-6 text-center text-slate-500">{t('adminUsers.empty')}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left">{t('adminUsers.user')}</th>
                <th className="hidden px-4 py-2 text-left md:table-cell">{t('adminUsers.contact')}</th>
                <th className="px-4 py-2 text-left">{t('adminUsers.state')}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((u) => (
                <tr key={u.id} className="align-top">
                  <td className="px-4 py-2">
                    <span className="font-semibold">{u.display_name}</span>
                    <span className="block text-xs text-slate-500">{u.email}</span>
                    <span className="block text-xs text-slate-400">{t('adminUsers.joined', { date: date(u.created_at) })}</span>
                  </td>
                  <td className="hidden px-4 py-2 text-slate-600 md:table-cell">
                    <span className="block">{u.username ? `@${u.username}` : '—'}</span>
                    <span className="block text-xs tabular-nums">{u.phone ?? '—'}</span>
                  </td>
                  <td className="px-4 py-2">
                    {u.role === 'admin' && badge('bg-violet-50 text-violet-700', t('adminUsers.admin'))}
                    {u.disabled
                      ? badge('bg-rose-50 text-rose-700', t('adminUsers.locked'))
                      : u.needs_verification
                        ? badge('bg-amber-50 text-amber-700', t('adminUsers.unverified'))
                        : badge('bg-emerald-50 text-emerald-700', t(u.verified_by ? `adminUsers.verified_${u.verified_by}` : 'adminUsers.active'))}
                  </td>
                  <td className="space-y-1 px-4 py-2 text-right">
                    {u.needs_verification && (
                      <button disabled={busy === u.id} onClick={() => run(u, { action: 'activate' }, 'adminUsers.activateConfirm')} className={`${actionClass} block w-full text-right text-emerald-700`}>
                        {t('adminUsers.activate')}
                      </button>
                    )}
                    <button
                      disabled={busy === u.id}
                      onClick={() => run(u, { action: 'set_role', role: u.role === 'admin' ? 'user' : 'admin' }, u.role === 'admin' ? 'adminUsers.demoteConfirm' : 'adminUsers.promoteConfirm')}
                      className={`${actionClass} block w-full text-right text-slate-700`}
                    >
                      {t(u.role === 'admin' ? 'adminUsers.demote' : 'adminUsers.promote')}
                    </button>
                    <button
                      disabled={busy === u.id}
                      onClick={() => run(u, { action: u.disabled ? 'unlock' : 'lock' }, u.disabled ? undefined : 'adminUsers.lockConfirm')}
                      className={`${actionClass} block w-full text-right ${u.disabled ? 'text-emerald-700' : 'text-rose-700'}`}
                    >
                      {t(u.disabled ? 'adminUsers.unlock' : 'adminUsers.lock')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
