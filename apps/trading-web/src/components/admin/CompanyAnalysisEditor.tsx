'use client'

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import { Markdown } from '@/components/learn/Markdown'
import { useT } from '@/i18n/I18nProvider'
import type { Locale } from '@/i18n/locales'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { AdminAnalysisDto, AdminCompanyDto } from '@/server/companies/admin-service'
import type { AnalysisInput } from '@/server/companies/validation'
import { Checkbox, Field, inputClass } from './fields'

const SECTIONS = [
  ['business_md', 'companies.business'],
  ['strategy_md', 'companies.strategy'],
  ['strengths_md', 'companies.strengths'],
  ['risks_md', 'companies.risks'],
] as const

const toForm = (a: AdminAnalysisDto): AnalysisInput => ({
  summary: a.summary,
  business_md: a.business_md,
  strategy_md: a.strategy_md,
  strengths_md: a.strengths_md,
  risks_md: a.risks_md,
  published: a.published,
})

/** Sửa phân tích 1 doanh nghiệp ở 1 ngôn ngữ (PUT nguyên bản) */
export function CompanyAnalysisEditor({
  company,
  locale,
  onSaved,
  onDirtyChange,
}: {
  company: AdminCompanyDto
  locale: Locale
  onSaved: () => void
  onDirtyChange: (dirty: boolean) => void
}) {
  const { t } = useT()
  const [form, setForm] = useState<AnalysisInput | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    let alive = true
    setForm(null)
    setError(null)
    api<AdminAnalysisDto>(`/api/admin/companies/${company.id}/analysis/${locale}`).then(
      (a) => alive && setForm(toForm(a)),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [company.id, locale])

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange])

  const set = (patch: Partial<AnalysisInput>) => {
    setForm((f) => (f ? { ...f, ...patch } : f))
    setDirty(true)
    setSaved(false)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setError(null)
    try {
      const res = await api<AdminAnalysisDto>(`/api/admin/companies/${company.id}/analysis/${locale}`, { method: 'PUT', body: JSON.stringify(form) })
      setForm(toForm(res))
      setDirty(false)
      setSaved(true)
      onSaved()
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  if (!form) return error !== null ? <p className="text-sm text-rose-600">{errorMessage(error, t)}</p> : <p className="text-sm text-slate-400">{t('common.loading')}</p>

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">
          {company.symbol} · {locale.toUpperCase()}
        </h2>
        <Link href={`/companies/${company.market}/${company.symbol}`} target="_blank" className="text-sm font-semibold text-emerald-700 hover:underline">
          {t('adminCompanies.view')} ↗
        </Link>
      </div>
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">{t('adminCompanies.reviewNote')}</p>
      <Field label={t('adminCompanies.summary')}>
        <textarea rows={2} value={form.summary} onChange={(e) => set({ summary: e.target.value })} className={inputClass} />
      </Field>
      {SECTIONS.map(([key, label]) => (
        <div key={key} className="grid gap-3 lg:grid-cols-2">
          <Field label={t(label)}>
            <textarea rows={9} value={form[key]} onChange={(e) => set({ [key]: e.target.value })} className={`${inputClass} font-mono`} />
          </Field>
          <div className="max-h-64 overflow-y-auto rounded-lg bg-white p-3 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase text-slate-400">{t('admin.preview')}</p>
            <Markdown source={form[key]} />
          </div>
        </div>
      ))}
      <Checkbox label={t('adminCompanies.published')} checked={form.published} onChange={(v) => set({ published: v })} />
      {error !== null && <p className="text-sm text-rose-600">{errorMessage(error, t)}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
          {t('common.save')}
        </button>
        {saved && <span className="text-sm text-emerald-700">{t('adminCompanies.saved')}</span>}
      </div>
    </form>
  )
}
