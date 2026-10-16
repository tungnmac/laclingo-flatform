'use client'

import Link from 'next/link'
import { use, useEffect, useState } from 'react'
import { PlanEditor } from '@/components/plans/PlanEditor'
import { useT } from '@/i18n/I18nProvider'
import { api, ApiError } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { PlanDto } from '@/server/plans/plan-service'

export default function PlanPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params)
  const { t } = useT()
  const [plan, setPlan] = useState<PlanDto | null>(null)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    let alive = true
    setPlan(null)
    setError(null)
    api<PlanDto>(`/api/plans/${encodeURIComponent(id)}`).then(
      (p) => alive && setPlan(p),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [id])

  if (error !== null) {
    return (
      <div className="space-y-3 py-10 text-center">
        <p className="text-slate-500">{error instanceof ApiError && error.status === 404 ? t('learn.notFound') : errorMessage(error, t)}</p>
        <Link href="/learn/plans" className="text-sm font-semibold text-emerald-700 hover:underline">
          {t('plans.back')}
        </Link>
      </div>
    )
  }
  if (!plan) return <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>
  return <PlanEditor key={plan.id} plan={plan} />
}
