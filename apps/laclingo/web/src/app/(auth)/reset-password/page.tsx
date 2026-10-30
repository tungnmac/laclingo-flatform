'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { authService } from '@/features/auth/auth.service'
import { inputClass } from '@/features/auth/components/AuthForm'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'

const MIN_PASSWORD = 8

/** Đặt mật khẩu mới từ link trong email (?token=…, dùng 1 lần) — xong thì đăng nhập lại */
export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  const t = useTranslation()
  const p = t.passwordReset
  const token = searchParams.token ?? ''
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const next = String(data.get('new_password') ?? '')
    if (next.length < MIN_PASSWORD) return setError(p.tooShort(MIN_PASSWORD))
    if (next !== String(data.get('confirm_password') ?? '')) return setError(p.mismatch)
    setSaving(true)
    setError(null)
    try {
      await authService.resetPassword(token, next)
      setDone(true)
    } catch (err) {
      setError(inlineError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">{p.resetTitle}</h1>
      <p className="mt-1 text-sm text-slate-500">{p.resetDesc}</p>
      {done ? (
        <p role="status" className="mt-6 rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
          {p.done}
        </p>
      ) : !token ? (
        <p role="alert" className="mt-6 rounded-lg bg-rose-50 px-3 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
          {p.missingToken}{' '}
          <Link href="/forgot-password" className="font-semibold underline">
            {p.requestNew}
          </Link>
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            {p.newPassword}
            <input name="new_password" type="password" required minLength={MIN_PASSWORD} maxLength={72} autoComplete="new-password" className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            {p.confirmPassword}
            <input name="confirm_password" type="password" required autoComplete="new-password" className={inputClass} />
          </label>
          {error && (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={saving}>
            {p.submit}
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
