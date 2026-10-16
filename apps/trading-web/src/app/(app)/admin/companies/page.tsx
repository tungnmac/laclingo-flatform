'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { CompanyAnalysisEditor } from '@/components/admin/CompanyAnalysisEditor'
import { inputClass } from '@/components/admin/fields'
import { useT } from '@/i18n/I18nProvider'
import { LOCALES, type Locale } from '@/i18n/locales'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { AdminCompanyDto } from '@/server/companies/admin-service'
import { COMPANY_MARKETS, type CompanyMarket } from '@/server/companies/types'

export default function AdminCompaniesPage() {
  const { t, locale: uiLocale } = useT()
  const [market, setMarket] = useState<CompanyMarket>('vn')
  const [locale, setLocale] = useState<Locale>(uiLocale)
  const [list, setList] = useState<AdminCompanyDto[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [symbol, setSymbol] = useState('')
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const [reload, setReload] = useState(0)
  const load = useCallback(() => setReload((n) => n + 1), [])
  useEffect(() => {
    let alive = true // đổi thị trường nhanh → bỏ danh sách của request cũ
    api<AdminCompanyDto[]>(`/api/admin/companies?market=${market}`).then(
      (l) => alive && setList(l),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [market, reload])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  /** Mọi thao tác bỏ phần đang sửa đều hỏi lại khi còn thay đổi chưa lưu */
  const guard = (fn: () => void) => {
    if (dirty && !window.confirm(t('adminCompanies.unsavedConfirm'))) return
    setDirty(false)
    fn()
  }

  const run = async (op: () => Promise<unknown>) => {
    setError(null)
    try {
      await op()
      load()
    } catch (err) {
      setError(err)
    }
  }

  const add = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      await api('/api/admin/companies', { method: 'POST', body: JSON.stringify({ market, symbol }) })
      setSymbol('')
    })
  }

  const selected = list?.find((c) => c.id === selectedId) ?? null
  const status = (c: AdminCompanyDto, l: Locale) => {
    const a = c.analyses[l]
    return !a.exists ? t('adminCompanies.statusNone') : a.published ? t('adminCompanies.statusPublished') : t('adminCompanies.statusDraft')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('adminCompanies.title')}</h1>
      <div className="flex flex-wrap items-center gap-2">
        {COMPANY_MARKETS.map((m) => (
          <button
            key={m}
            onClick={() =>
              guard(() => {
                setMarket(m)
                setList(null)
                setSelectedId(null)
              })
            }
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${m === market ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
          >
            {t(m === 'vn' ? 'companies.marketVn' : 'companies.marketUs')}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
          {t('adminCompanies.contentLanguage')}
          <select value={locale} onChange={(e) => guard(() => setLocale(e.target.value as Locale))} className="rounded-lg border-0 py-1 text-sm ring-1 ring-slate-200">
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error !== null && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">{errorMessage(error, t)}</p>}

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <aside className="space-y-3">
          <form onSubmit={add} className="flex gap-2">
            <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder={t('adminCompanies.symbolHint')} className={`${inputClass} mt-0`} />
            <button type="submit" className="whitespace-nowrap rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-500">
              {t('adminCompanies.add')}
            </button>
          </form>
          <ul className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            {!list && <li className="px-3 py-4 text-sm text-slate-400">{t('common.loading')}</li>}
            {list?.map((c) => (
              <li key={c.id} className={`px-3 py-2 ${c.id === selectedId ? 'bg-emerald-50' : ''}`}>
                <button onClick={() => guard(() => setSelectedId(c.id))} className="w-full text-left">
                  <span className="font-semibold">{c.symbol}</span>
                  {!c.active && <span className="ml-2 text-xs text-slate-400">{t('adminCompanies.hidden')}</span>}
                  <span className="block text-xs text-slate-500">{LOCALES.map((l) => `${l.toUpperCase()}: ${status(c, l)}`).join(' · ')}</span>
                </button>
                <div className="mt-1 flex gap-3 text-xs font-semibold">
                  <button onClick={() => run(() => api(`/api/admin/companies/${c.id}`, { method: 'PATCH', body: JSON.stringify({ active: !c.active }) }))} className="text-slate-600 hover:underline">
                    {c.active ? t('adminCompanies.hide') : t('adminCompanies.show')}
                  </button>
                  <button
                    onClick={() => {
                      if (!window.confirm(t('adminCompanies.deleteConfirm', { symbol: c.symbol }))) return
                      if (c.id === selectedId) {
                        setSelectedId(null)
                        setDirty(false) // editor bị gỡ trước khi kịp báo "hết thay đổi"
                      }
                      void run(() => api(`/api/admin/companies/${c.id}`, { method: 'DELETE' }))
                    }}
                    className="text-rose-600 hover:underline"
                  >
                    {t('adminCompanies.delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </aside>
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          {selected ? (
            <CompanyAnalysisEditor key={`${selected.id}:${locale}`} company={selected} locale={locale} onSaved={load} onDirtyChange={setDirty} />
          ) : (
            <p className="text-sm text-slate-500">{t('adminCompanies.selectCompany')}</p>
          )}
        </section>
      </div>
    </div>
  )
}
