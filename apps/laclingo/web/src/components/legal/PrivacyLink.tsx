'use client'

import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'

export function PrivacyLink() {
  const t = useTranslation()
  return (
    <Link href="/privacy" className="text-sm text-slate-500 underline-offset-2 hover:text-indigo-600 hover:underline">
      {t.accounts.privacy}
    </Link>
  )
}
