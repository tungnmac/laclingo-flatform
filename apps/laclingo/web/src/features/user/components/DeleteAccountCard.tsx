'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { inputClass } from '@/features/auth/components/AuthForm'
import { signOutCurrent } from '@/features/auth/components/AccountList'
import { billingService } from '@/features/billing/billing.service'
import { userService } from '@/features/user/user.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import type { User } from '@/types/api'

/** Học viên tự xoá tài khoản (App Store / Google Play bắt buộc) — nhập lại mật khẩu + xác nhận lần nữa */
export function DeleteAccountCard({ user }: { user: User }) {
  const a = useTranslation().accounts
  const confirm = useConfirm()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Gói App Store tự gia hạn: server không huỷ được (Apple không có API) — học viên phải tự huỷ trong App Store
  const { data: plan } = useApi(() => billingService.me(), [])
  const appleRenewing = plan?.subscription?.payment_provider === 'APPLE_IAP' && plan.subscription.auto_renew

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const password = String(new FormData(e.currentTarget).get('password') ?? '')
    if (!(await confirm({ title: a.deleteConfirmTitle, description: a.deleteConfirm, confirmLabel: a.deleteBtn, danger: true }))) return
    setDeleting(true)
    setError(null)
    try {
      await userService.deleteMe(password)
      signOutCurrent() // bỏ tài khoản khỏi máy này, chuyển sang tài khoản khác hoặc về trang đăng nhập
    } catch (err) {
      setError(inlineError(err))
      setDeleting(false)
    }
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-rose-700">{a.deleteTitle}</h3>
      <p className="mt-1 text-sm text-slate-500">{a.deleteDesc}</p>
      {appleRenewing && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{a.deleteAppleWarning}</p>}
      {user.role === 'owner' ? (
        <p className="mt-3 text-sm font-medium text-slate-600">{a.deleteOwner}</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            {a.deletePasswordLabel}
            <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
          </label>
          {error && (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
              {error}
            </p>
          )}
          <Button type="submit" variant="danger" disabled={deleting}>
            {deleting ? a.deleting : a.deleteBtn}
          </Button>
        </form>
      )}
    </Card>
  )
}
