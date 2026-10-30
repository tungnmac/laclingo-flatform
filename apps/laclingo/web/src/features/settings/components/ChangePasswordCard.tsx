'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/ToastProvider'
import { inputClass } from '@/features/auth/components/AuthForm'
import { userService } from '@/features/user/user.service'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import { useSession } from '@/store/session'

const MIN_PASSWORD = 8

/** Đổi mật khẩu: server thu hồi mọi phiên (mọi thiết bị) và trả phiên mới cho máy này — không phải đăng nhập lại */
export function ChangePasswordCard() {
  const t = useTranslation()
  const s = t.settings
  const toast = useToast()
  const setSession = useSession((st) => st.setSession)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const current = String(data.get('current_password') ?? '')
    const next = String(data.get('new_password') ?? '')
    if (next.length < MIN_PASSWORD) return setError(s.passwordTooShort(MIN_PASSWORD))
    if (next !== String(data.get('confirm_password') ?? '')) return setError(s.passwordMismatch)
    setSaving(true)
    setError(null)
    try {
      setSession(await userService.changePassword({ current_password: current, new_password: next }))
      form.reset()
      toast(s.passwordChanged)
    } catch (err) {
      setError(inlineError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-900">{s.passwordTitle}</h3>
      <p className="mt-1 text-sm text-slate-500">{s.passwordDesc}</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          {s.currentPassword}
          <input name="current_password" type="password" required autoComplete="current-password" className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {s.newPassword}
          <input name="new_password" type="password" required minLength={MIN_PASSWORD} maxLength={72} autoComplete="new-password" className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {s.confirmPassword}
          <input name="confirm_password" type="password" required autoComplete="new-password" className={inputClass} />
        </label>
        {error && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
            {error}
          </p>
        )}
        <Button type="submit" disabled={saving}>
          {s.passwordSubmit}
        </Button>
      </form>
    </Card>
  )
}
