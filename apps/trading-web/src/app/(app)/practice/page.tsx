'use client'

import { useCallback, useEffect, useState } from 'react'
import { PracticeBoard } from '@/components/practice/PracticeBoard'
import { PracticeHistory } from '@/components/practice/PracticeHistory'
import { PracticeSetup } from '@/components/practice/PracticeSetup'
import { PracticeSummary } from '@/components/practice/PracticeSummary'
import { useT } from '@/i18n/I18nProvider'
import { api, ApiError } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { SessionDto } from '@/server/practice/dto'

export default function PracticePage() {
  const { t } = useT()
  // undefined = đang tải; null = chưa có phiên đang chạy
  const [session, setSession] = useState<SessionDto | null | undefined>(undefined)
  const [error, setError] = useState<unknown>(null)
  const [historyKey, setHistoryKey] = useState(0)

  const load = useCallback(() => {
    setError(null)
    api<SessionDto>('/api/practice/sessions/current').then(setSession, (err) => {
      if (err instanceof ApiError && err.code === 'NO_ACTIVE_SESSION') setSession(null)
      else setError(err)
    })
  }, [])
  useEffect(load, [load])

  const onChange = useCallback((s: SessionDto) => {
    setSession(s)
    if (s.status !== 'active') setHistoryKey((k) => k + 1)
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('practice.title')}</h1>
        <p className="text-sm text-slate-500">{t('practice.subtitle')}</p>
      </div>
      {error !== null && (
        <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          <span>{errorMessage(error, t)}</span>
          <button onClick={load} className="font-semibold underline">
            {t('common.retry')}
          </button>
        </div>
      )}
      {session === undefined && error === null && <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>}
      {session && session.status === 'active' && <PracticeBoard session={session} onChange={onChange} />}
      {session && session.status !== 'active' && <PracticeSummary session={session} onNew={() => setSession(null)} />}
      {session === null && (
        <>
          <PracticeSetup onStarted={onChange} />
          <PracticeHistory refreshKey={historyKey} />
        </>
      )}
    </div>
  )
}
