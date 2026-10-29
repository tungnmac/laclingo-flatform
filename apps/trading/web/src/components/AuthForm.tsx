'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { safeNextPath } from '@/lib/safe-next'

const inputClass =
  'mt-1 block w-full rounded-lg border-0 px-3 py-2.5 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-emerald-600'

export function AuthForm({ mode, next, adding = false }: { mode: 'login' | 'register'; next?: string; adding?: boolean }) {
  const { t } = useT()
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const isLogin = mode === 'login'

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = {
      email: form.get('email'),
      password: form.get('password'),
      ...(isLogin ? {} : { display_name: form.get('display_name') }),
    }
    setLoading(true)
    setError(null)
    try {
      await api(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify({ ...body, add: adding }) })
      // tải lại toàn trang: không còn state client của tài khoản trước (nếu trình duyệt đang đăng nhập tài khoản khác)
      window.location.assign(safeNextPath(next))
    } catch (err) {
      setError(err)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-bold">{t(adding ? 'accounts.addTitle' : isLogin ? 'auth.loginTitle' : 'auth.registerTitle')}</h1>
      {adding && <p className="text-sm text-slate-500">{t('accounts.addHint')}</p>}
      {!isLogin && (
        <label className="block text-sm font-medium text-slate-700">
          {t('auth.displayName')}
          <input name="display_name" required maxLength={100} className={inputClass} />
        </label>
      )}
      <label className="block text-sm font-medium text-slate-700">
        {t('auth.email')}
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        {t('auth.password')}
        <input
          name="password"
          type="password"
          required
          minLength={isLogin ? 1 : 8}
          maxLength={72}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          className={inputClass}
        />
      </label>
      {error !== null && (
        <p role="alert" className="text-sm text-rose-600">
          {errorMessage(error, t)}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? t('auth.submitting') : t(isLogin ? 'auth.submitLogin' : 'auth.submitRegister')}
      </button>
      <p className="text-center text-sm text-slate-500">
        {t(isLogin ? 'auth.noAccount' : 'auth.haveAccount')}
        <Link
          href={`${isLogin ? '/register' : '/login'}${next ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="font-semibold text-emerald-700 hover:underline"
        >
          {t(isLogin ? 'auth.goRegister' : 'auth.goLogin')}
        </Link>
      </p>
    </form>
  )
}
