'use client'

import Link from 'next/link'
import { useEffect, useState, use } from 'react'
import { PracticeSummary } from '@/components/practice/PracticeSummary'
import { useT } from '@/i18n/I18nProvider'
import { api, ApiError } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { SessionDto } from '@/server/practice/dto'

export default function PracticeReviewPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const { t } = useT()
  const [session, setSession] = useState<SessionDto | null>(null)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    let cancelled = false
    api<SessionDto>(`/api/practice/sessions/${encodeURIComponent(params.id)}`).then(
      (s) => !cancelled && setSession(s),
      (err) => !cancelled && setError(err),
    )
    return () => {
      cancelled = true
    }
  }, [params.id])

  const back = (
    <Link href="/practice" className="text-sm font-semibold text-emerald-700 hover:underline">
      {t('practice.back')}
    </Link>
  )

  return (
    <div className="space-y-4">
      {back}
      {error instanceof ApiError && error.status === 404 && <p className="py-10 text-center text-slate-500">{t('practice.notFound')}</p>}
      {error !== null && !(error instanceof ApiError && error.status === 404) && <p className="text-sm text-rose-600">{errorMessage(error, t)}</p>}
      {!session && error === null && <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>}
      {/* Phiên đang chạy → chơi tiếp ở /practice (không lộ kết quả / ngày thật) */}
      {session?.status === 'active' && <p className="py-10 text-center text-slate-500">{back}</p>}
      {session && session.status !== 'active' && <PracticeSummary session={session} />}
    </div>
  )
}
