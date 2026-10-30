'use client'

import Link from 'next/link'
import { withLacBird } from '@/components/mascot/LacBird'
import { AuthForm } from '@/features/auth/components/AuthForm'
import { useTranslation } from '@/hooks/useTranslation'
import { isSessionValid, useSession } from '@/store/session'

/**
 * Đăng nhập. ?add=1: thêm 1 tài khoản (tài khoản đang có vẫn giữ để chuyển qua lại);
 * ?relogin=<tên đăng nhập>: tài khoản hết phiên — điền sẵn tên.
 */
export default function LoginPage({ searchParams }: { searchParams: { add?: string; relogin?: string } }) {
  const t = useTranslation()
  // "Quay lại" chỉ khi đang có phiên dùng được (thêm tài khoản) — hết phiên thì quay lại cũng về đây
  const canGoBack = useSession((s) => isSessionValid(s))
  const adding = !!searchParams.add || !!searchParams.relogin
  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">{adding ? t.accounts.addTitle : t.auth.loginTitle}</h1>
      <p className="mt-1 text-sm text-slate-500">{adding ? t.accounts.addSubtitle : withLacBird(t.auth.loginSubtitle)}</p>

      <AuthForm mode="login" defaultIdentifier={searchParams.relogin} prefillRemembered={!searchParams.add} />

      <p className="mt-4 text-center text-sm">
        <Link href="/forgot-password" className="text-slate-500 hover:text-indigo-600 hover:underline">
          {t.passwordReset.forgotLink}
        </Link>
      </p>

      <p className="mt-6 text-center text-sm text-slate-500">
        {t.auth.noAccount}{' '}
        <Link href="/register" className="font-semibold text-indigo-600 hover:underline">
          {t.auth.registerLink}
        </Link>
      </p>
      {adding && canGoBack && (
        <p className="mt-3 text-center text-sm">
          <Link href="/learn" className="text-slate-500 hover:underline">
            {t.accounts.backToApp}
          </Link>
        </p>
      )}
    </>
  )
}
