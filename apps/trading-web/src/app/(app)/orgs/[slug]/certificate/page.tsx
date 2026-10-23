'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { CertificateDto } from '@/server/orgs/org-service'

/** Chứng nhận hoàn thành chương trình — in hoặc lưu PDF từ trình duyệt */
export default function CertificatePage() {
  const { slug } = useParams<{ slug: string }>()
  const { t, locale } = useT()
  const [data, setData] = useState<CertificateDto | null>(null)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    api<CertificateDto>(`/api/orgs/${encodeURIComponent(slug)}/certificate`).then(setData, setError)
  }, [slug])

  if (error !== null) {
    return (
      <div className="space-y-3 py-10 text-center">
        <p className="text-slate-600">{errorMessage(error, t)}</p>
        <Link href={`/orgs/${slug}`} className="font-semibold text-emerald-700 hover:underline">
          {t('orgs.back')}
        </Link>
      </div>
    )
  }
  if (!data) return <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex justify-between print:hidden">
        <Link href={`/orgs/${slug}`} className="text-sm font-semibold text-emerald-700 hover:underline">
          {t('orgs.back')}
        </Link>
        <button onClick={() => window.print()} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          {t('orgs.print')}
        </button>
      </div>
      <section className="rounded-2xl border-4 border-double border-emerald-600 bg-white px-8 py-12 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">📈 TradeLab</p>
        <h1 className="mt-4 text-3xl font-bold">{t('orgs.certTitle')}</h1>
        <p className="mt-6 text-slate-600">{t('orgs.certPresented')}</p>
        <p className="mt-2 text-3xl font-semibold">{data.display_name}</p>
        <p className="mt-6 text-slate-700">{t('orgs.certBody', { org: data.org_name, n: data.lessons })}</p>
        {data.avg_score !== null && <p className="mt-2 text-sm text-slate-500">{t('orgs.certScore', { score: data.avg_score })}</p>}
        <p className="mt-8 text-sm text-slate-500">
          {t('orgs.certDate', { date: new Date(data.completed_at).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'long' }) })}
        </p>
        <p className="mt-6 text-xs text-slate-400">{t('orgs.certNote')}</p>
      </section>
    </div>
  )
}
