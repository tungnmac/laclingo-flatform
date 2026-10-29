'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Field, inputClass } from '@/components/admin/fields'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import { addMonths } from '@/server/billing/plans'
import type { AdminOrgDto, CurriculumChapterDto } from '@/server/orgs/org-service'
import { ORG_ROLES, type OrgRole } from '@/server/orgs/rules'

const PRO_MONTHS = [0, 3, 6, 12] as const
/** Hạn Pro mới = cộng tháng (chặn cuối tháng) kể từ hạn hiện tại nếu còn, không thì từ hôm nay — không rút ngắn hạn đã cấp */
const proUntilAfter = (current: string | null, months: number) => {
  const now = new Date()
  const base = current && new Date(current) > now ? new Date(current) : now
  return addMonths(base, months).toISOString()
}

/** Quản trị tổ chức B2B: tạo, gán owner, số ghế, Pro cho thành viên, chương trình học */
export default function AdminOrgsPage() {
  const { t, locale } = useT()
  const [list, setList] = useState<AdminOrgDto[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const [open, setOpen] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', seat_limit: 30, pro_months: 12 })
  const refresh = useCallback(() => setReload((n) => n + 1), [])

  useEffect(() => {
    api<AdminOrgDto[]>('/api/admin/orgs').then(
      (l) => {
        setList(l)
        setError(null)
      },
      setError,
    )
  }, [reload])

  /** true = thành công (form chỉ xoá khi thành công) */
  const run = async (op: () => Promise<unknown>, ok?: string): Promise<boolean> => {
    setError(null)
    setNotice(null)
    try {
      await op()
      if (ok) setNotice(ok)
      refresh()
      return true
    } catch (err) {
      setError(err)
      return false
    }
  }

  const create = (e: FormEvent) => {
    e.preventDefault()
    run(
      () =>
        api('/api/admin/orgs', {
          method: 'POST',
          body: JSON.stringify({ name: form.name, slug: form.slug, seat_limit: form.seat_limit, pro_until: form.pro_months ? proUntilAfter(null, form.pro_months) : null }),
        }),
      t('adminOrgs.created'),
    ).then((ok) => ok && setForm({ name: '', slug: '', seat_limit: 30, pro_months: 12 }))
  }

  const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US') : '—')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{t('adminOrgs.title')}</h1>
        <p className="text-sm text-slate-500">{t('adminOrgs.subtitle')}</p>
      </div>

      <form onSubmit={create} className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-[2fr_1.5fr_1fr_1fr_auto] sm:items-end">
        <Field label={t('adminOrgs.name')}>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} />
        </Field>
        <Field label="Slug">
          <input required value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className={inputClass} placeholder="ctck-abc" />
        </Field>
        <Field label={t('adminOrgs.seats')}>
          <input type="number" min={1} required value={form.seat_limit} onChange={(e) => setForm((f) => ({ ...f, seat_limit: Number(e.target.value) }))} className={inputClass} />
        </Field>
        <Field label={t('adminOrgs.pro')}>
          <select value={form.pro_months} onChange={(e) => setForm((f) => ({ ...f, pro_months: Number(e.target.value) }))} className={inputClass}>
            {PRO_MONTHS.map((m) => (
              <option key={m} value={m}>
                {m ? t('adminSubs.monthsN', { n: m }) : t('adminOrgs.noPro')}
              </option>
            ))}
          </select>
        </Field>
        <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">{t('adminOrgs.create')}</button>
      </form>

      {notice && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">{notice}</p>}
      {error !== null && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">{errorMessage(error, t)}</p>}

      {!list ? (
        <p className="py-6 text-center text-slate-400">{t('common.loading')}</p>
      ) : list.length === 0 ? (
        <p className="py-6 text-center text-slate-500">{t('adminOrgs.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {list.map((o) => (
            <li key={o.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{o.name}</p>
                  <p className="text-xs text-slate-500">
                    /{o.slug} · {t('orgs.seats', { n: o.seats_used, max: o.seat_limit })} · {t('adminOrgs.proUntilShort', { date: date(o.pro_until) })} · {t('adminOrgs.lessons', { n: o.curriculum_size })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t('adminOrgs.owners')}: {o.owners.join(', ') || '—'} · {t('adminOrgs.invite')}: <code>{o.invite_code}</code>
                  </p>
                </div>
                <button onClick={() => setOpen(open === o.id ? null : o.id)} aria-expanded={open === o.id} className="text-sm font-semibold text-emerald-700 hover:underline">
                  {open === o.id ? t('common.close') : t('adminOrgs.manage')}
                </button>
              </div>
              {open === o.id && <OrgManage org={o} run={run} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function OrgManage({ org, run }: { org: AdminOrgDto; run: (op: () => Promise<unknown>, ok?: string) => Promise<boolean> }) {
  const { t } = useT()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<OrgRole>('owner')
  const [seats, setSeats] = useState(org.seat_limit)
  const [chapters, setChapters] = useState<CurriculumChapterDto[] | null>(null)

  useEffect(() => {
    api<CurriculumChapterDto[]>(`/api/admin/orgs/${org.id}/curriculum`).then(setChapters, () => setChapters([]))
  }, [org.id])

  const patch = (body: object, ok: string) => run(() => api(`/api/admin/orgs/${org.id}`, { method: 'PATCH', body: JSON.stringify(body) }), ok)

  return (
    <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 text-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          run(() => api(`/api/admin/orgs/${org.id}/members`, { method: 'POST', body: JSON.stringify({ email, role }) }), t('adminOrgs.memberAdded', { email })).then((ok) => ok && setEmail(''))
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <Field label={t('adminSubs.email')}>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </Field>
        <Field label={t('orgs.colRole')}>
          <select value={role} onChange={(e) => setRole(e.target.value as OrgRole)} className={inputClass}>
            {ORG_ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`orgs.role_${r}`)}
              </option>
            ))}
          </select>
        </Field>
        <button className="rounded-lg bg-slate-800 px-3 py-2 font-semibold text-white">{t('adminOrgs.addMember')}</button>
      </form>

      <div className="flex flex-wrap items-end gap-2">
        <Field label={t('adminOrgs.seats')}>
          <input type="number" min={1} value={seats} onChange={(e) => setSeats(Number(e.target.value))} className={inputClass} />
        </Field>
        <button onClick={() => patch({ seat_limit: seats }, t('adminOrgs.saved'))} className="rounded-lg px-3 py-2 font-semibold ring-1 ring-slate-300 hover:bg-slate-50">
          {t('common.save')}
        </button>
        {[3, 6, 12].map((m) => (
          <button key={m} onClick={() => patch({ pro_until: proUntilAfter(org.pro_until, m) }, t('adminOrgs.saved'))} className="rounded-lg px-3 py-2 font-semibold ring-1 ring-emerald-300 text-emerald-700 hover:bg-emerald-50">
            {t('adminOrgs.proFor', { n: m })}
          </button>
        ))}
        <button onClick={() => patch({ pro_until: null }, t('adminOrgs.saved'))} className="rounded-lg px-3 py-2 font-semibold text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50">
          {t('adminOrgs.noPro')}
        </button>
        <button onClick={() => patch({ regenerate_invite: true }, t('adminOrgs.inviteRegenerated'))} className="rounded-lg px-3 py-2 font-semibold text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50">
          {t('adminOrgs.regenerate')}
        </button>
      </div>

      <div>
        <p className="font-semibold">{t('adminOrgs.curriculum')}</p>
        {!chapters ? (
          <p className="text-slate-400">{t('common.loading')}</p>
        ) : (
          <>
            <ul className="mt-2 grid gap-1 sm:grid-cols-2">
              {chapters.map((c) => (
                <li key={c.id}>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={c.selected} onChange={(e) => setChapters((cs) => cs!.map((x) => (x.id === c.id ? { ...x, selected: e.target.checked } : x)))} />
                    <span>
                      {c.title} <span className="text-xs text-slate-500">({c.lessons})</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <button
              onClick={() => run(() => api(`/api/admin/orgs/${org.id}/curriculum`, { method: 'PUT', body: JSON.stringify({ chapter_ids: chapters.filter((c) => c.selected).map((c) => c.id) }) }), t('adminOrgs.saved'))}
              className="mt-2 rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white hover:bg-emerald-700"
            >
              {t('adminOrgs.saveCurriculum')}
            </button>
          </>
        )}
      </div>

      <button
        onClick={() => window.confirm(t('adminOrgs.deleteConfirm', { name: org.name })) && run(() => api(`/api/admin/orgs/${org.id}`, { method: 'DELETE' }))}
        className="font-semibold text-rose-700 hover:underline"
      >
        {t('adminOrgs.delete')}
      </button>
    </div>
  )
}
