'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Field, inputClass } from '@/components/admin/fields'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { MobileAppSettings } from '@/server/admin/app-settings'

const SEED_NAMES = ['instruments', 'lessons', 'companies', 'library', 'references'] as const
const CACHE_GROUPS = ['market', 'companies', 'rate_limit'] as const

const card = 'space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200'
const button = 'rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50'
const secondary = 'rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-50'

/** Thay cho chạy script tay: nạp dữ liệu mẫu, xoá cache Redis, mốc phiên bản app mobile */
export default function AdminToolsPage() {
  const { t } = useT()
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [mobile, setMobile] = useState({ latest_version: '', min_version: '', update_url: '' })

  useEffect(() => {
    api<MobileAppSettings>('/api/admin/tools/mobile-app').then(
      (s) => setMobile({ latest_version: s.latest_version ?? '', min_version: s.min_version ?? '', update_url: s.update_url ?? '' }),
      setError,
    )
  }, [])

  const run = async (id: string, op: () => Promise<string>) => {
    setBusy(id)
    setError(null)
    setNotice(null)
    try {
      setNotice(await op())
    } catch (err) {
      setError(err)
    } finally {
      setBusy(null)
    }
  }

  const seed = (name: (typeof SEED_NAMES)[number]) =>
    run(`seed:${name}`, async () => (await api<{ message: string }>('/api/admin/tools/seed', { method: 'POST', body: JSON.stringify({ name }) })).message)

  const clear = (group: (typeof CACHE_GROUPS)[number]) => {
    if (!window.confirm(t('adminTools.cacheConfirm', { group: t(`adminTools.cache_${group}`) }))) return
    run(`cache:${group}`, async () => {
      const r = await api<{ deleted: number }>('/api/admin/tools/cache', { method: 'POST', body: JSON.stringify({ group }) })
      return t('adminTools.cacheCleared', { n: r.deleted })
    })
  }

  const saveMobile = (e: FormEvent) => {
    e.preventDefault()
    const orNull = (v: string) => v.trim() || null
    run('mobile', async () => {
      await api('/api/admin/tools/mobile-app', {
        method: 'PUT',
        body: JSON.stringify({ latest_version: orNull(mobile.latest_version), min_version: orNull(mobile.min_version), update_url: orNull(mobile.update_url) }),
      })
      return t('adminTools.mobileSaved')
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t('adminTools.title')}</h1>
        <p className="text-sm text-slate-500">{t('adminTools.subtitle')}</p>
      </div>

      {notice && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">{notice}</p>}
      {error !== null && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">{errorMessage(error, t)}</p>}

      <section className={card}>
        <h2 className="text-lg font-bold">{t('adminTools.seedTitle')}</h2>
        <p className="text-sm text-slate-500">{t('adminTools.seedHint')}</p>
        <ul className="divide-y divide-slate-100">
          {SEED_NAMES.map((name) => (
            <li key={name} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                <span className="font-semibold">{t(`adminTools.seed_${name}`)}</span>
                <span className="block text-xs text-slate-500">{t(`adminTools.seedDesc_${name}`)}</span>
              </span>
              <button onClick={() => seed(name)} disabled={busy !== null} className={secondary}>
                {busy === `seed:${name}` ? t('adminTools.running') : t('adminTools.run')}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h2 className="text-lg font-bold">{t('adminTools.cacheTitle')}</h2>
        <p className="text-sm text-slate-500">{t('adminTools.cacheHint')}</p>
        <ul className="divide-y divide-slate-100">
          {CACHE_GROUPS.map((group) => (
            <li key={group} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                <span className="font-semibold">{t(`adminTools.cache_${group}`)}</span>
                <span className="block text-xs text-slate-500">{t(`adminTools.cacheDesc_${group}`)}</span>
              </span>
              <button onClick={() => clear(group)} disabled={busy !== null} className={secondary}>
                {busy === `cache:${group}` ? t('adminTools.running') : t('adminTools.clear')}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={saveMobile} className={card}>
        <h2 className="text-lg font-bold">{t('adminTools.mobileTitle')}</h2>
        <p className="text-sm text-slate-500">{t('adminTools.mobileHint')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('adminTools.latestVersion')} hint={t('adminTools.latestHint')}>
            <input value={mobile.latest_version} onChange={(e) => setMobile({ ...mobile, latest_version: e.target.value })} placeholder="1.0.1" className={inputClass} />
          </Field>
          <Field label={t('adminTools.minVersion')} hint={t('adminTools.minHint')}>
            <input value={mobile.min_version} onChange={(e) => setMobile({ ...mobile, min_version: e.target.value })} placeholder="1.0.0" className={inputClass} />
          </Field>
        </div>
        <Field label={t('adminTools.updateUrl')} hint={t('adminTools.updateUrlHint')}>
          <input type="url" value={mobile.update_url} onChange={(e) => setMobile({ ...mobile, update_url: e.target.value })} placeholder="https://play.google.com/store/apps/details?id=lactrader.app" className={inputClass} />
        </Field>
        <button disabled={busy !== null} className={button}>
          {t('common.save')}
        </button>
      </form>
    </div>
  )
}
