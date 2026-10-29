'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { safeNextPath } from '@/lib/safe-next'

// Chỉ nhớ EMAIL để điền sẵn — mật khẩu không bao giờ tự lưu (để trình quản lý mật khẩu của trình duyệt lo)
const REMEMBERED_EMAIL_KEY = 'trading.rememberedEmail'

const inputClass =
  'mt-1 block w-full rounded-lg border-0 px-3 py-2.5 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-emerald-600'

export function AuthForm({ mode, next, adding = false }: { mode: 'login' | 'register'; next?: string; adding?: boolean }) {
  const { t } = useT()
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const emailInput = useRef<HTMLInputElement>(null)
  const isLogin = mode === 'login'

  // Đọc sau khi mount để HTML server và client khớp nhau (không lỗi hydration)
  useEffect(() => {
    if (!isLogin || adding) return
    try {
      const saved = localStorage.getItem(REMEMBERED_EMAIL_KEY)
      if (saved && emailInput.current && !emailInput.current.value) emailInput.current.value = saved
    } catch {
      // không có localStorage (chế độ riêng tư…) → để trống
    }
  }, [isLogin, adding])

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
      await api(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify({ ...body, add: adding, ...(isLogin ? { remember } : {}) }),
      })
      if (isLogin && !adding) {
        try {
          if (remember) localStorage.setItem(REMEMBERED_EMAIL_KEY, String(body.email).trim())
          else localStorage.removeItem(REMEMBERED_EMAIL_KEY)
        } catch {
          // bỏ qua — chỉ là tiện ích điền sẵn email
        }
      }
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
        <input ref={emailInput} name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <div>
        <label htmlFor="auth-password" className="block text-sm font-medium text-slate-700">
          {t('auth.password')}
        </label>
        <div className="relative">
          <input
            id="auth-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={isLogin ? 1 : 8}
            maxLength={72}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            className={`${inputClass} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={t(showPassword ? 'auth.hidePassword' : 'auth.showPassword')}
            title={t(showPassword ? 'auth.hidePassword' : 'auth.showPassword')}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
          >
            <EyeIcon off={showPassword} />
          </button>
        </div>
      </div>
      {isLogin && !adding && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
          />
          {t('auth.remember')}
        </label>
      )}
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

/** Mắt mở = đang ẩn (bấm để hiện); mắt gạch = đang hiện (bấm để ẩn) */
function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path strokeLinecap="round" d="M3 3l18 18" />}
    </svg>
  )
}
