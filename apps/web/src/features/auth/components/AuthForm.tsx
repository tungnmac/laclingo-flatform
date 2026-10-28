'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { authService } from '@/features/auth/auth.service'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import { useSession } from '@/store/session'
import type { AuthResponse } from '@/types/api'

// Ghi nhớ tài khoản: chỉ lưu email / tên đăng nhập để điền sẵn lần sau — KHÔNG lưu mật khẩu (để trình quản lý mật
// khẩu của trình duyệt / hệ điều hành lo qua autocomplete). Chuỗi rỗng = người dùng đã bỏ tích (lần sau ô cũng bỏ tích);
// chưa có khoá = mặc định tích. localStorage có thể bị chặn (chế độ riêng tư) → bỏ qua.
const REMEMBERED_IDENTIFIER_KEY = 'laclingo:remembered-identifier'

function readRememberedIdentifier() {
  try {
    return localStorage.getItem(REMEMBERED_IDENTIFIER_KEY)
  } catch {
    return null
  }
}

function saveRememberedIdentifier(identifier: string) {
  try {
    localStorage.setItem(REMEMBERED_IDENTIFIER_KEY, identifier)
  } catch {
    // không lưu được thì thôi — lần sau nhập lại
  }
}

export const inputClass =
  'mt-1 block w-full rounded-lg border-0 px-3 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600'

/**
 * Form đăng nhập / đăng ký dùng chung: submit → lưu phiên (thêm vào danh sách tài khoản) → vào /learn.
 * defaultIdentifier: điền sẵn (đăng nhập lại tài khoản hết phiên) — ưu tiên hơn tài khoản đã ghi nhớ.
 * prefillRemembered=false: không điền tài khoản đã ghi nhớ (Thêm tài khoản — đó thường là tài khoản đang dùng).
 */
export function AuthForm({
  mode,
  defaultIdentifier,
  prefillRemembered = true,
}: {
  mode: 'login' | 'register'
  defaultIdentifier?: string
  prefillRemembered?: boolean
}) {
  const router = useRouter()
  const setSession = useSession((s) => s.setSession)
  const t = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const identifierRef = useRef<HTMLInputElement>(null)

  // Đọc sau khi mount (localStorage không có lúc render phía server): giữ lựa chọn bỏ tích lần trước, điền vào ô còn trống
  useEffect(() => {
    if (mode !== 'login') return
    const saved = readRememberedIdentifier()
    if (saved === '') setRemember(false)
    if (!saved || defaultIdentifier || !prefillRemembered) return
    if (identifierRef.current && !identifierRef.current.value) identifierRef.current.value = saved
  }, [mode, defaultIdentifier, prefillRemembered])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const password = String(form.get('password') ?? '')

    setSubmitting(true)
    setError(null)
    try {
      let auth: AuthResponse
      if (mode === 'register') {
        auth = await authService.register({
          email: String(form.get('email') ?? ''),
          username: String(form.get('username') ?? ''),
          password,
          full_name: String(form.get('full_name') ?? ''),
        })
      } else {
        const identifier = String(form.get('identifier') ?? '').trim()
        auth = await authService.login({ identifier, password })
        saveRememberedIdentifier(remember ? identifier : '')
      }
      const hadAccount = !!useSession.getState().token
      setSession(auth)
      // Đang dùng tài khoản khác (Thêm tài khoản) → tải lại trang để không lẫn dữ liệu của tài khoản trước
      if (hadAccount) window.location.assign('/learn')
      else router.push('/learn')
    } catch (err) {
      setError(inlineError(err))
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      {mode === 'register' && (
        <label className="block text-sm font-medium text-slate-700">
          {t.auth.fullNameLabel}
          <input name="full_name" type="text" autoComplete="name" maxLength={100} className={inputClass} placeholder={t.auth.fullNamePlaceholder} />
        </label>
      )}
      {mode === 'register' ? (
        <>
          <label className="block text-sm font-medium text-slate-700">
            {t.auth.usernameLabel}
            <input
              name="username"
              type="text"
              required
              minLength={3}
              maxLength={50}
              pattern="[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]"
              title={t.auth.usernameHint}
              autoComplete="username"
              className={inputClass}
              placeholder={t.auth.usernamePlaceholder}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            {t.auth.emailLabel}
            <input name="email" type="email" required autoComplete="email" className={inputClass} placeholder={t.auth.emailPlaceholder} />
          </label>
        </>
      ) : (
        <label className="block text-sm font-medium text-slate-700">
          {t.auth.identifierLabel}
          <input
            name="identifier"
            type="text"
            required
            autoComplete="username"
            ref={identifierRef}
            defaultValue={defaultIdentifier}
            className={inputClass}
            placeholder={t.auth.identifierPlaceholder}
          />
        </label>
      )}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          {t.auth.passwordLabel}
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={mode === 'register' ? 8 : undefined}
            maxLength={72}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            className={`${inputClass} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mode === 'login' && (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
          />
          {t.auth.rememberMe}
        </label>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? t.auth.submitting : mode === 'register' ? t.auth.submitRegister : t.auth.submitLogin}
      </Button>
    </form>
  )
}
