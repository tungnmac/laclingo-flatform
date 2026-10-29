'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { safeNextPath } from '@/lib/safe-next'

// Chỉ nhớ email / tên đăng nhập để điền sẵn — mật khẩu không bao giờ tự lưu (để trình quản lý mật khẩu của trình duyệt lo).
// Giữ tên key cũ để người đã lưu email trước đây vẫn được điền sẵn.
const REMEMBERED_LOGIN_KEY = 'trading.rememberedEmail'

export const inputClass =
  'mt-1 block w-full rounded-lg border-0 px-3 py-2.5 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-emerald-600'

/** Đăng nhập bằng email hoặc tên đăng nhập. Đăng ký: RegisterForm (cần OTP số điện thoại) */
export function AuthForm({ next, adding = false }: { next?: string; adding?: boolean }) {
  const { t } = useT()
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(true)
  const identifierInput = useRef<HTMLInputElement>(null)

  // Đọc sau khi mount để HTML server và client khớp nhau (không lỗi hydration)
  useEffect(() => {
    if (adding) return
    try {
      const saved = localStorage.getItem(REMEMBERED_LOGIN_KEY)
      if (saved && identifierInput.current && !identifierInput.current.value) identifierInput.current.value = saved
    } catch {
      // không có localStorage (chế độ riêng tư…) → để trống
    }
  }, [adding])

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = { identifier: String(form.get('identifier') ?? '').trim(), password: form.get('password') }
    setLoading(true)
    setError(null)
    try {
      await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ ...body, add: adding, remember }) })
      if (!adding) {
        try {
          if (remember) localStorage.setItem(REMEMBERED_LOGIN_KEY, body.identifier)
          else localStorage.removeItem(REMEMBERED_LOGIN_KEY)
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
      <h1 className="text-2xl font-bold">{t(adding ? 'accounts.addTitle' : 'auth.loginTitle')}</h1>
      {adding && <p className="text-sm text-slate-500">{t('accounts.addHint')}</p>}
      <label className="block text-sm font-medium text-slate-700">
        {t('auth.identifier')}
        <input
          ref={identifierInput}
          name="identifier"
          required
          maxLength={255}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          className={inputClass}
        />
      </label>
      <PasswordField autoComplete="current-password" />
      {!adding && (
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
      <FormError error={error} />
      <SubmitButton loading={loading}>{t('auth.submitLogin')}</SubmitButton>
      <p className="text-center text-sm text-slate-500">
        {t('auth.noAccount')}
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-semibold text-emerald-700 hover:underline">
          {t('auth.goRegister')}
        </Link>
      </p>
    </form>
  )
}

/** Ô mật khẩu có nút hiện / ẩn — dùng chung đăng nhập + đăng ký */
export function PasswordField({ autoComplete }: { autoComplete: 'current-password' | 'new-password' }) {
  const { t } = useT()
  const [show, setShow] = useState(false)
  const isNew = autoComplete === 'new-password'
  return (
    <div>
      <label htmlFor="auth-password" className="block text-sm font-medium text-slate-700">
        {t('auth.password')}
      </label>
      <div className="relative">
        <input
          id="auth-password"
          name="password"
          type={show ? 'text' : 'password'}
          required
          minLength={isNew ? 8 : 1}
          maxLength={72}
          autoComplete={autoComplete}
          className={`${inputClass} pr-10`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={t(show ? 'auth.hidePassword' : 'auth.showPassword')}
          title={t(show ? 'auth.hidePassword' : 'auth.showPassword')}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
        >
          <EyeIcon off={show} />
        </button>
      </div>
    </div>
  )
}

export function FormError({ error }: { error: unknown }) {
  const { t } = useT()
  if (error === null) return null
  return (
    <p role="alert" className="text-sm text-rose-600">
      {errorMessage(error, t)}
    </p>
  )
}

export function SubmitButton({ loading, children }: { loading: boolean; children: ReactNode }) {
  const { t } = useT()
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
    >
      {loading ? t('auth.submitting') : children}
    </button>
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
