'use client'

import Link from 'next/link'
import { useT } from '@/i18n/I18nProvider'

/** Thông báo khi API trả PRO_REQUIRED */
export function ProUpsell({ text }: { text: string }) {
  const { t } = useT()
  return (
    <div className="space-y-2 rounded-2xl bg-white p-5 text-sm shadow-sm ring-1 ring-slate-200">
      <p className="text-slate-700">{text}</p>
      <Link href="/pro" className="font-semibold text-emerald-700 hover:underline">
        {t('vnPro.upgrade')}
      </Link>
    </div>
  )
}
