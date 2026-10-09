'use client'

import Link from 'next/link'
import { AuthForm } from '@/features/auth/components/AuthForm'
import { useTranslation } from '@/hooks/useTranslation'

export default function RegisterPage() {
  const t = useTranslation()
  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">{t.auth.registerTitle}</h1>
      <p className="mt-1 text-sm text-slate-500">{t.auth.registerSubtitle}</p>

      <AuthForm mode="register" />

      <p className="mt-6 text-center text-sm text-slate-500">
        {t.auth.hasAccount}{' '}
        <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
          {t.auth.loginLink}
        </Link>
      </p>
    </>
  )
}
