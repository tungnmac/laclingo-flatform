'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { authService } from '@/features/auth/auth.service'
import { useSession } from '@/store/session'
import type { AuthResponse } from '@/types/api'

export const inputClass =
  'mt-1 block w-full rounded-lg border-0 px-3 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600'

/** Form đăng nhập / đăng ký dùng chung: submit → lưu phiên → vào /learn */
export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter()
  const setSession = useSession((s) => s.setSession)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
        auth = await authService.login({ identifier: String(form.get('identifier') ?? ''), password })
      }
      setSession(auth)
      router.push('/learn')
    } catch (err) {
      setError((err as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      {mode === 'register' && (
        <label className="block text-sm font-medium text-slate-700">
          Họ tên
          <input name="full_name" type="text" autoComplete="name" maxLength={100} className={inputClass} placeholder="Nguyễn Văn A" />
        </label>
      )}
      {mode === 'register' ? (
        <>
          <label className="block text-sm font-medium text-slate-700">
            Tên đăng nhập
            <input
              name="username"
              type="text"
              required
              minLength={3}
              maxLength={50}
              pattern="[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]"
              title="3-50 ký tự: chữ, số, dấu chấm, gạch dưới, gạch ngang"
              autoComplete="username"
              className={inputClass}
              placeholder="nguyenvana"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input name="email" type="email" required autoComplete="email" className={inputClass} placeholder="ban@laclingo.vn" />
          </label>
        </>
      ) : (
        <label className="block text-sm font-medium text-slate-700">
          Email hoặc tên đăng nhập
          <input name="identifier" type="text" required autoComplete="username" className={inputClass} placeholder="ban@laclingo.vn hoặc nguyenvana" />
        </label>
      )}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Mật khẩu
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
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
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

      {error && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? 'Đang xử lý...' : mode === 'register' ? 'Đăng ký' : 'Đăng nhập'}
      </Button>
    </form>
  )
}
