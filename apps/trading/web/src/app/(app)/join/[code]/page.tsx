'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'

/** Xác nhận tham gia tổ chức qua link mời — báo rõ tổ chức sẽ xem được tiến độ học (đồng ý xử lý dữ liệu) */
export default function JoinOrgPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const { t } = useT()
  const [info, setInfo] = useState<{ name: string; slug: string; member: boolean } | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api<{ name: string; slug: string; member: boolean }>(`/api/orgs/invite/${encodeURIComponent(code)}`).then(setInfo, setError)
  }, [code])

  const join = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await api<{ slug: string }>('/api/orgs/join', { method: 'POST', body: JSON.stringify({ code }) })
      router.push(`/orgs/${r.slug}`)
      router.refresh() // huy hiệu Pro trên menu có thể đổi
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 py-6">
      <h1 className="text-2xl font-bold">{t('orgs.joinTitle')}</h1>
      {error !== null && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">{errorMessage(error, t)}</p>}
      {info && (
        <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-lg font-semibold">{info.name}</p>
          {info.member ? (
            <Link href={`/orgs/${info.slug}`} className="font-semibold text-emerald-700 hover:underline">
              {t('orgs.alreadyMember')}
            </Link>
          ) : (
            <>
              <p className="text-sm text-slate-600">{t('orgs.consent')}</p>
              <button onClick={join} disabled={busy} aria-busy={busy} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {t('orgs.joinConfirm')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
