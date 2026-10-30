'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { useToast } from '@/components/ui/ToastProvider'
import { signOutCurrent } from '@/features/auth/components/AccountList'
import { userService } from '@/features/user/user.service'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'

/** Đăng xuất mọi thiết bị: thu hồi mọi phiên của tài khoản ở server rồi đăng xuất luôn máy này */
export function SecuritySettingsCard() {
  const t = useTranslation()
  const confirm = useConfirm()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const logoutAll = async () => {
    if (!(await confirm({ description: t.settings.logoutAllConfirm, danger: true }))) return
    setBusy(true)
    try {
      await userService.logoutAll()
      signOutCurrent()
    } catch (err) {
      toast(inlineError(err), 'error')
      setBusy(false)
    }
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-900">{t.settings.securityTitle}</h3>
      <p className="mt-1 text-sm text-slate-500">{t.settings.securityDesc}</p>
      <Button type="button" variant="danger" className="mt-4" onClick={logoutAll} disabled={busy}>
        {t.settings.logoutAllBtn}
      </Button>
    </Card>
  )
}
