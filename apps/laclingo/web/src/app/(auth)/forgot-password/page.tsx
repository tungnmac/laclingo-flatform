'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { authService } from '@/features/auth/auth.service'
import { inputClass } from '@/features/auth/components/AuthForm'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'

/** Quên mật khẩu: nhập email / tên đăng nhập → server gửi link đặt lại tới email của tài khoản */
export default function ForgotPasswordPage() {
  const t = useTranslation()
  const p = t.passwordReset
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const identifier = String(new FormData(e.currentTarget).get('identifier') ?? '').trim()
    setSending(true)
    setError(null)
    try {
      await authService.forgotPassword(identifier)
      setSent(true)
    } catch (err) {
      setError(inlineError(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">{p.forgotTitle}</h1>
      <p className="mt-1 text-sm text-slate-500">{p.forgotDesc}</p>
      {sent ? (
        <p role="status" className="mt-6 rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
          {p.sent}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            {p.identifierLabel}
            <input name="identifier" type="text" required autoComplete="username" maxLength={255} className={inputClass} />
          </label>
          {error && (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={sending}>
            {p.sendLink}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
          {p.backToLogin}
        </Link>
      </p>
    </>
  )
}
