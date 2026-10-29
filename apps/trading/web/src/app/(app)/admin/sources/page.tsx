'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { SourceState, SourcesDto } from '@/server/admin/sources'

const STATE_CLASS: Record<SourceState, string> = {
  ok: 'bg-emerald-50 text-emerald-700',
  error: 'bg-rose-50 text-rose-700',
  on: 'bg-sky-50 text-sky-700',
  off: 'bg-slate-100 text-slate-500',
}

/** Gọi thử từng nguồn dữ liệu + dịch vụ đã cấu hình; biến môi trường chỉ hiện TÊN (không bao giờ hiện giá trị) */
export default function AdminSourcesPage() {
  const { t, locale } = useT()
  const [data, setData] = useState<SourcesDto | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const load = useCallback(() => {
    setBusy(true)
    setError(null)
    api<SourcesDto>('/api/admin/sources')
      .then(setData, setError)
      .finally(() => setBusy(false))
  }, [])
  useEffect(load, [load])

  const missing = data?.env.filter((e) => !e.set) ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('adminSources.title')}</h1>
          <p className="text-sm text-slate-500">{t('adminSources.subtitle')}</p>
        </div>
        <button onClick={load} disabled={busy} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
          {busy ? t('adminSources.checking') : t('adminSources.recheck')}
        </button>
      </div>

      {error !== null && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">{errorMessage(error, t)}</p>}

      {!data ? (
        <p className="py-6 text-center text-slate-400">{t('common.loading')}</p>
      ) : (
        <>
          <p className="rounded-lg bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-slate-200">
            {t(data.crypto_source === 'binance' ? 'adminSources.cryptoBinance' : 'adminSources.cryptoMexc')}
            <span className="block text-xs text-slate-400">
              {t('adminSources.checkedAt', { time: new Date(data.checked_at).toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US') })}
            </span>
          </p>

          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <thead className="text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left">{t('adminSources.source')}</th>
                  <th className="px-4 py-2 text-left">{t('adminSources.state')}</th>
                  <th className="px-4 py-2 text-right">{t('adminSources.latency')}</th>
                  <th className="px-4 py-2 text-left">{t('adminSources.detail')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.checks.map((c) => (
                  <tr key={c.key} className="align-top">
                    <td className="px-4 py-2">
                      <span className="font-semibold">{t(`adminSources.name_${c.key}`)}</span>
                      <span className="block text-xs text-slate-500">{t(`adminSources.desc_${c.key}`)}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATE_CLASS[c.state]}`}>{t(`adminSources.state_${c.state}`)}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums text-slate-600">{c.latency_ms === null ? '—' : `${c.latency_ms} ms`}</td>
                    <td className="max-w-xs break-words px-4 py-2 text-xs text-slate-500">
                      {c.detail}
                      {c.key === 'ssi' && (
                        <Link href="/admin/vn-data" className="ml-1 font-semibold text-emerald-700 hover:underline">
                          {t('adminSources.vnData')}
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <section className="space-y-2">
            <h2 className="text-lg font-bold">{t('adminSources.envTitle')}</h2>
            <p className="text-sm text-slate-500">{missing.length ? t('adminSources.envMissing', { n: missing.length }) : t('adminSources.envAllSet')}</p>
            <ul className="flex flex-wrap gap-1.5">
              {data.env.map((e) => (
                <li
                  key={e.name}
                  className={`rounded px-2 py-0.5 font-mono text-xs ${e.set ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}
                  title={t(e.set ? 'adminSources.envSet' : 'adminSources.envUnset')}
                >
                  {e.set ? '✓' : '○'} {e.name}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
