'use client'

import Link from 'next/link'
import { AuthForm } from '@/features/auth/components/AuthForm'
import { useTranslation } from '@/hooks/useTranslation'

export default function LoginPage() {
  const t = useTranslation()
  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">{t.auth.loginTitle}</h1>
      <p className="mt-1 text-sm text-slate-500">{t.auth.loginSubtitle}</p>

      <AuthForm mode="login" />

      <p className="mt-6 text-center text-sm text-slate-500">
        {t.auth.noAccount}{' '}
        <Link href="/register" className="font-semibold text-indigo-600 hover:underline">
          {t.auth.registerLink}
        </Link>
      </p>
    </>
  )
}
