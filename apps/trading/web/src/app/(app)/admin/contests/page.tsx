'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { fmtDateTime, StateBadge } from '@/components/contests/StateBadge'
import { Checkbox, Field, inputClass } from '@/components/admin/fields'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { AdminContestDto } from '@/server/contests/contest-service'

type Form = { slug: string; title_vi: string; title_en: string; description_vi: string; description_en: string; starts_at: string; ends_at: string; published: boolean }
const EMPTY: Form = { slug: '', title_vi: '', title_en: '', description_vi: '', description_en: '', starts_at: '', ends_at: '', published: false }

/** datetime-local nhập theo giờ Việt Nam (UTC+7) ↔ ISO */
const toLocalInput = (iso: string) => new Date(new Date(iso).getTime() + 7 * 3_600_000).toISOString().slice(0, 16)
const fromLocalInput = (v: string) => new Date(`${v}:00+07:00`).toISOString()

export default function AdminContestsPage() {
  const { t, locale } = useT()
  const [list, setList] = useState<AdminContestDto[] | null>(null)
  const [editing, setEditing] = useState<string | null>(null) // id hoặc 'new'
  const [form, setForm] = useState<Form>(EMPTY)
  const [original, setOriginal] = useState<Form>(EMPTY)
  const [error, setError] = useState<unknown>(null)
  const [reload, setReload] = useState(0)
  const refresh = useCallback(() => setReload((n) => n + 1), [])

  useEffect(() => {
    api<AdminContestDto[]>('/api/admin/contests').then(
      (l) => {
        setList(l)
        setError(null)
      },
      setError,
    )
  }, [reload])

  const edit = (c: AdminContestDto | null) => {
    setError(null)
    setEditing(c ? c.id : 'new')
    const f = c
      ? { slug: c.slug, title_vi: c.title_vi, title_en: c.title_en, description_vi: c.description_vi, description_en: c.description_en, starts_at: toLocalInput(c.starts_at), ends_at: toLocalInput(c.ends_at), published: c.published }
      : EMPTY
    setForm(f)
    setOriginal(f)
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    // Sửa: chỉ gửi ngày đã đổi (ô nhập làm tròn phút — gửi lại ngày cũ có giây sẽ bị coi là đổi khung giờ)
    const dates: Partial<Pick<Form, 'starts_at' | 'ends_at'>> = {}
    for (const k of ['starts_at', 'ends_at'] as const) if (editing === 'new' || form[k] !== original[k]) dates[k] = fromLocalInput(form[k])
    const { starts_at: _s, ends_at: _e, ...rest } = form
    const body = JSON.stringify({ ...rest, ...dates })
    try {
      if (editing === 'new') await api('/api/admin/contests', { method: 'POST', body })
      else await api(`/api/admin/contests/${editing}`, { method: 'PATCH', body })
      setEditing(null)
      refresh()
    } catch (err) {
      setError(err)
    }
  }

  const remove = async (c: AdminContestDto) => {
    if (!window.confirm(t('adminContests.deleteConfirm', { title: c.title_vi }))) return
    try {
      await api(`/api/admin/contests/${c.id}`, { method: 'DELETE' })
      refresh()
    } catch (err) {
      setError(err)
    }
  }

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('adminContests.title')}</h1>
          <p className="text-sm text-slate-500">{t('adminContests.subtitle')}</p>
        </div>
        <button onClick={() => edit(null)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          {t('adminContests.new')}
        </button>
      </div>

      {error !== null && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">{errorMessage(error, t)}</p>}

      {editing && (
        <form onSubmit={save} className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2">
          <Field label="Slug">
            <input required value={form.slug} onChange={set('slug')} className={inputClass} placeholder="mua-thu-2026" />
          </Field>
          <div />
          <Field label={t('adminContests.titleVi')}>
            <input required value={form.title_vi} onChange={set('title_vi')} className={inputClass} />
          </Field>
          <Field label={t('adminContests.titleEn')}>
            <input required value={form.title_en} onChange={set('title_en')} className={inputClass} />
          </Field>
          <Field label={t('adminContests.descVi')}>
            <textarea rows={3} value={form.description_vi} onChange={set('description_vi')} className={inputClass} />
          </Field>
          <Field label={t('adminContests.descEn')}>
            <textarea rows={3} value={form.description_en} onChange={set('description_en')} className={inputClass} />
          </Field>
          <Field label={t('adminContests.startsAt')} hint={t('adminContests.vnTime')}>
            <input type="datetime-local" required value={form.starts_at} onChange={set('starts_at')} className={inputClass} />
          </Field>
          <Field label={t('adminContests.endsAt')} hint={t('adminContests.vnTime')}>
            <input type="datetime-local" required value={form.ends_at} onChange={set('ends_at')} className={inputClass} />
          </Field>
          <Checkbox label={t('adminContests.published')} checked={form.published} onChange={(v) => setForm((f) => ({ ...f, published: v }))} />
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" onClick={() => setEditing(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              {t('common.cancel')}
            </button>
            <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">{t('common.save')}</button>
          </div>
        </form>
      )}

      {!list ? (
        <p className="py-6 text-center text-slate-400">{t('common.loading')}</p>
      ) : list.length === 0 ? (
        <p className="py-6 text-center text-slate-500">{t('adminContests.empty')}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="sr-only">
              <tr>
                <th scope="col">{t('adminContests.titleVi')}</th>
                <th scope="col">{t('adminContests.state')}</th>
                <th scope="col">{t('adminContests.entrants')}</th>
                <th scope="col">{t('adminContests.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2">
                    <span className="font-semibold">{c.title_vi}</span>
                    <span className="block text-xs text-slate-500">
                      /{c.slug} · {fmtDateTime(c.starts_at, locale)} → {fmtDateTime(c.ends_at, locale)}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <StateBadge state={c.state} />
                    {!c.published && <span className="ml-2 text-xs text-amber-700">{t('adminContests.draft')}</span>}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{t('contests.participants', { n: c.participants })}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-right">
                    <button onClick={() => edit(c)} className="mr-3 font-semibold text-emerald-700 hover:underline">
                      {t('adminContests.edit')}
                    </button>
                    {c.participants === 0 && (
                      <button onClick={() => remove(c)} className="font-semibold text-rose-700 hover:underline">
                        {t('adminContests.delete')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
