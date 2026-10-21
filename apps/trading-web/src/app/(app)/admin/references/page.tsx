'use client'

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Checkbox, Field, inputClass } from '@/components/admin/fields'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { AdminInvestorDto, AdminResourceDto } from '@/server/references/references-service'
import { HOLDING_KINDS, INVESTOR_STYLES, RESOURCE_LANGUAGES, RESOURCE_TOPICS, RESOURCE_TYPES } from '@/server/references/validation'
import { LEVELS } from '@/server/learn/validation'

type Tab = 'resources' | 'investors'

export default function AdminReferencesPage() {
  const { t } = useT()
  const [tab, setTab] = useState<Tab>('resources')
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('adminReferences.title')}</h1>
      <div className="flex gap-2" role="tablist">
        {(['resources', 'investors'] as const).map((x) => (
          <button
            key={x}
            role="tab"
            aria-selected={x === tab}
            onClick={() => setTab(x)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${x === tab ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
          >
            {t(x === 'resources' ? 'adminReferences.tabResources' : 'adminReferences.tabInvestors')}
          </button>
        ))}
      </div>
      {tab === 'resources' ? <ResourcesAdmin /> : <InvestorsAdmin />}
    </div>
  )
}

/** Danh sách + form sửa dùng chung cho 2 tab: tải, lưu (POST/PATCH), xoá */
function useCrud<Dto extends { id: string }, Form>(endpoint: string, toForm: (d: Dto) => Form, toBody: (f: Form) => unknown) {
  const [list, setList] = useState<Dto[] | null>(null)
  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [saved, setSaved] = useState(false)

  const load = useCallback(() => {
    api<Dto[]>(endpoint).then(setList, setError)
  }, [endpoint])
  useEffect(load, [load])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setError(null)
    try {
      const body = JSON.stringify(toBody(editing.form))
      const res = editing.id ? await api<Dto>(`${endpoint}/${editing.id}`, { method: 'PATCH', body }) : await api<Dto>(endpoint, { method: 'POST', body })
      setEditing({ id: res.id, form: toForm(res) })
      setSaved(true)
      load()
    } catch (err) {
      setError(err)
    }
  }

  const remove = async (d: Dto, name: string, confirmText: string) => {
    if (!window.confirm(confirmText.replace('{name}', name))) return
    try {
      await api(`${endpoint}/${d.id}`, { method: 'DELETE' })
      if (editing?.id === d.id) setEditing(null)
      load()
    } catch (err) {
      setError(err)
    }
  }

  const set = (patch: Partial<Form>) => {
    setEditing((x) => (x ? { ...x, form: { ...x.form, ...patch } } : x))
    setSaved(false)
  }
  const open = (id: string | null, form: Form) => {
    setEditing({ id, form })
    setSaved(false)
    setError(null)
  }

  return { list, editing, error, saved, submit, remove, set, open, close: () => setEditing(null) }
}

function Layout({ newLabel, onNew, items, form }: { newLabel: string; onNew: () => void; items: ReactNode; form: ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <section className="space-y-2">
        <button onClick={onNew} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white">
          {newLabel}
        </button>
        <ul className="max-h-[40rem] divide-y divide-slate-100 overflow-y-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">{items}</ul>
      </section>
      {form}
    </div>
  )
}

function Row({ active, title, sub, onOpen, onDelete }: { active: boolean; title: string; sub: string; onOpen: () => void; onDelete: () => void }) {
  const { t } = useT()
  return (
    <li className={`flex items-center justify-between gap-2 px-3 py-2 ${active ? 'bg-emerald-50' : ''}`}>
      <button onClick={onOpen} className="min-w-0 text-left">
        <span className="block truncate font-semibold">{title}</span>
        <span className="block truncate text-xs text-slate-500">{sub}</span>
      </button>
      <button onClick={onDelete} className="shrink-0 text-xs font-semibold text-rose-600 hover:underline">
        {t('adminReferences.delete')}
      </button>
    </li>
  )
}

function FormActions({ error, saved, onCancel }: { error: unknown; saved: boolean; onCancel: () => void }) {
  const { t } = useT()
  return (
    <>
      {error !== null && <p className="text-sm text-rose-600">{errorMessage(error, t)}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
          {t('common.save')}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-slate-600 hover:underline">
          {t('adminReferences.cancel')}
        </button>
        {saved && <span className="text-sm text-emerald-700">{t('adminReferences.saved')}</span>}
      </div>
    </>
  )
}

function Options({ values, label }: { values: readonly string[]; label: (v: string) => string }) {
  return (
    <>
      {values.map((v) => (
        <option key={v} value={v}>
          {label(v)}
        </option>
      ))}
    </>
  )
}

const num = (s: string) => (s.trim() === '' ? null : Number(s))
const str = (n: number | null) => (n === null ? '' : String(n))

// ── Nguồn học ──

type ResourceForm = Omit<AdminResourceDto, 'id'>
const emptyResource: ResourceForm = {
  title: '',
  provider: '',
  url: '',
  type: 'course',
  language: 'vi',
  is_free: true,
  level: 'basic',
  topic: 'investing',
  description_vi: '',
  description_en: '',
  published: false,
  position: 0,
}
const toResourceForm = ({ id: _id, ...rest }: AdminResourceDto): ResourceForm => rest

function ResourcesAdmin() {
  const { t } = useT()
  const c = useCrud<AdminResourceDto, ResourceForm>('/api/admin/references/resources', toResourceForm, (f) => ({ ...f, position: Number(f.position) || 0 }))
  const f = c.editing?.form
  return (
    <Layout
      newLabel={t('adminReferences.newResource')}
      onNew={() => c.open(null, emptyResource)}
      items={
        <>
          {!c.list && <li className="px-3 py-4 text-sm text-slate-400">{t('common.loading')}</li>}
          {c.list?.map((r) => (
            <Row
              key={r.id}
              active={c.editing?.id === r.id}
              title={r.title}
              sub={`${t(`references.type_${r.type}`)} · ${r.language.toUpperCase()} · ${r.published ? t('adminReferences.published') : t('adminReferences.draft')}`}
              onOpen={() => c.open(r.id, toResourceForm(r))}
              onDelete={() => c.remove(r, r.title, t('adminReferences.deleteConfirm'))}
            />
          ))}
        </>
      }
      form={
        f && (
          <form onSubmit={c.submit} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <Field label={t('adminReferences.resTitle')}>
              <input value={f.title} onChange={(e) => c.set({ title: e.target.value })} className={inputClass} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('adminReferences.provider')}>
                <input value={f.provider} onChange={(e) => c.set({ provider: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t('adminReferences.url')}>
                <input value={f.url} onChange={(e) => c.set({ url: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t('adminReferences.type')}>
                <select value={f.type} onChange={(e) => c.set({ type: e.target.value })} className={inputClass}>
                  <Options values={RESOURCE_TYPES} label={(v) => t(`references.type_${v}`)} />
                </select>
              </Field>
              <Field label={t('adminReferences.language')}>
                <select value={f.language} onChange={(e) => c.set({ language: e.target.value })} className={inputClass}>
                  <Options values={RESOURCE_LANGUAGES} label={(v) => t(`references.lang_${v}`)} />
                </select>
              </Field>
              <Field label={t('adminReferences.level')}>
                <select value={f.level} onChange={(e) => c.set({ level: e.target.value })} className={inputClass}>
                  <Options values={LEVELS} label={(v) => t(`levels.${v}`)} />
                </select>
              </Field>
              <Field label={t('adminReferences.topic')}>
                <select value={f.topic} onChange={(e) => c.set({ topic: e.target.value })} className={inputClass}>
                  <Options values={RESOURCE_TOPICS} label={(v) => t(`references.topic_${v}`)} />
                </select>
              </Field>
            </div>
            <Field label={t('adminReferences.descriptionVi')}>
              <textarea rows={3} value={f.description_vi} onChange={(e) => c.set({ description_vi: e.target.value })} className={inputClass} />
            </Field>
            <Field label={t('adminReferences.descriptionEn')}>
              <textarea rows={3} value={f.description_en} onChange={(e) => c.set({ description_en: e.target.value })} className={inputClass} />
            </Field>
            <div className="flex flex-wrap items-end gap-4">
              <Field label={t('adminReferences.position')}>
                <input type="number" value={f.position} onChange={(e) => c.set({ position: Number(e.target.value) })} className={`${inputClass} w-24`} />
              </Field>
              <div className="flex gap-4 pb-2">
                <Checkbox label={t('adminReferences.isFree')} checked={f.is_free} onChange={(v) => c.set({ is_free: v })} />
                <Checkbox label={t('adminReferences.published')} checked={f.published} onChange={(v) => c.set({ published: v })} />
              </div>
            </div>
            <FormActions error={c.error} saved={c.saved} onCancel={c.close} />
          </form>
        )
      }
    />
  )
}

// ── Nhà đầu tư ──

type HoldingForm = { name: string; kind: string; percent: string; note_vi: string; note_en: string }
type MilestoneForm = { year: string; text_vi: string; text_en: string }
type InvestorForm = {
  slug: string
  name: string
  country: string
  birth_year: string
  death_year: string
  photo_url: string
  role_vi: string
  role_en: string
  style: string
  net_worth_usd: string
  net_worth_as_of: string
  net_worth_source_url: string
  holdings: HoldingForm[]
  story_vi: string
  story_en: string
  milestones: MilestoneForm[]
  lessons_vi: string
  lessons_en: string
  published: boolean
  position: number
}
const emptyInvestor: InvestorForm = {
  slug: '',
  name: '',
  country: '',
  birth_year: '',
  death_year: '',
  photo_url: '',
  role_vi: '',
  role_en: '',
  style: 'value',
  net_worth_usd: '',
  net_worth_as_of: '',
  net_worth_source_url: '',
  holdings: [],
  story_vi: '',
  story_en: '',
  milestones: [],
  lessons_vi: '',
  lessons_en: '',
  published: false,
  position: 0,
}
const toInvestorForm = (x: AdminInvestorDto): InvestorForm => ({
  slug: x.slug,
  name: x.name,
  country: x.country,
  birth_year: str(x.birth_year),
  death_year: str(x.death_year),
  photo_url: x.photo_url ?? '',
  role_vi: x.role_vi,
  role_en: x.role_en,
  style: x.style,
  net_worth_usd: str(x.net_worth_usd),
  net_worth_as_of: x.net_worth_as_of ?? '',
  net_worth_source_url: x.net_worth_source_url ?? '',
  holdings: x.holdings.map((h) => ({ name: h.name, kind: h.kind, percent: str(h.percent), note_vi: h.note_vi ?? '', note_en: h.note_en ?? '' })),
  story_vi: x.story_vi,
  story_en: x.story_en,
  milestones: x.milestones.map((m) => ({ year: String(m.year), text_vi: m.text_vi, text_en: m.text_en })),
  lessons_vi: x.lessons_vi.join('\n'),
  lessons_en: x.lessons_en.join('\n'),
  published: x.published,
  position: x.position,
})
const lines = (s: string) =>
  s
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
const toInvestorBody = (f: InvestorForm) => ({
  ...f,
  country: f.country.trim().toUpperCase(),
  birth_year: num(f.birth_year),
  death_year: num(f.death_year),
  net_worth_usd: num(f.net_worth_usd),
  holdings: f.holdings.map((h) => ({ ...h, percent: num(h.percent) })),
  milestones: f.milestones.map((m) => ({ ...m, year: Number(m.year) })),
  lessons_vi: lines(f.lessons_vi),
  lessons_en: lines(f.lessons_en),
  position: Number(f.position) || 0,
})

function InvestorsAdmin() {
  const { t } = useT()
  const c = useCrud<AdminInvestorDto, InvestorForm>('/api/admin/references/investors', toInvestorForm, toInvestorBody)
  const f = c.editing?.form
  const setHolding = (i: number, patch: Partial<HoldingForm>) => f && c.set({ holdings: f.holdings.map((h, j) => (j === i ? { ...h, ...patch } : h)) })
  const setMilestone = (i: number, patch: Partial<MilestoneForm>) => f && c.set({ milestones: f.milestones.map((m, j) => (j === i ? { ...m, ...patch } : m)) })
  const removeBtn = (onClick: () => void) => (
    <button type="button" onClick={onClick} className="text-xs font-semibold text-rose-600 hover:underline">
      {t('adminReferences.remove')}
    </button>
  )

  return (
    <Layout
      newLabel={t('adminReferences.newInvestor')}
      onNew={() => c.open(null, emptyInvestor)}
      items={
        <>
          {!c.list && <li className="px-3 py-4 text-sm text-slate-400">{t('common.loading')}</li>}
          {c.list?.map((x) => (
            <Row
              key={x.id}
              active={c.editing?.id === x.id}
              title={x.name}
              sub={`${x.country} · ${t(`references.style_${x.style}`)} · ${x.published ? t('adminReferences.published') : t('adminReferences.draft')}`}
              onOpen={() => c.open(x.id, toInvestorForm(x))}
              onDelete={() => c.remove(x, x.name, t('adminReferences.deleteConfirm'))}
            />
          ))}
        </>
      }
      form={
        f && (
          <form onSubmit={c.submit} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('adminReferences.name')}>
                <input value={f.name} onChange={(e) => c.set({ name: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t('adminReferences.slug')}>
                <input value={f.slug} onChange={(e) => c.set({ slug: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t('adminReferences.country')}>
                <input value={f.country} maxLength={2} onChange={(e) => c.set({ country: e.target.value.toUpperCase() })} className={inputClass} />
              </Field>
              <Field label={t('adminReferences.style')}>
                <select value={f.style} onChange={(e) => c.set({ style: e.target.value })} className={inputClass}>
                  <Options values={INVESTOR_STYLES} label={(v) => t(`references.style_${v}`)} />
                </select>
              </Field>
              <Field label={t('adminReferences.birthYear')}>
                <input type="number" value={f.birth_year} onChange={(e) => c.set({ birth_year: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t('adminReferences.deathYear')}>
                <input type="number" value={f.death_year} onChange={(e) => c.set({ death_year: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t('adminReferences.roleVi')}>
                <input value={f.role_vi} onChange={(e) => c.set({ role_vi: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t('adminReferences.roleEn')}>
                <input value={f.role_en} onChange={(e) => c.set({ role_en: e.target.value })} className={inputClass} />
              </Field>
            </div>
            <Field label={t('adminReferences.photoUrl')}>
              <input value={f.photo_url} onChange={(e) => c.set({ photo_url: e.target.value })} className={inputClass} />
            </Field>
            <div className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-3">
              <Field label={t('adminReferences.netWorth')}>
                <input type="number" min={0} value={f.net_worth_usd} onChange={(e) => c.set({ net_worth_usd: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t('adminReferences.netWorthAsOf')}>
                <input type="date" value={f.net_worth_as_of} onChange={(e) => c.set({ net_worth_as_of: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t('adminReferences.netWorthSource')}>
                <input value={f.net_worth_source_url} onChange={(e) => c.set({ net_worth_source_url: e.target.value })} className={inputClass} />
              </Field>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-slate-600">{t('adminReferences.holdings')}</legend>
              {f.holdings.map((h, i) => (
                <div key={i} className="grid gap-2 rounded-xl bg-slate-50 p-2 sm:grid-cols-[2fr_1fr_5rem_auto]">
                  <input aria-label={t('adminReferences.holdingName')} placeholder={t('adminReferences.holdingName')} value={h.name} onChange={(e) => setHolding(i, { name: e.target.value })} className={inputClass} />
                  <select aria-label={t('adminReferences.holdingKind')} value={h.kind} onChange={(e) => setHolding(i, { kind: e.target.value })} className={inputClass}>
                    <Options values={HOLDING_KINDS} label={(v) => t(`references.kind_${v}`)} />
                  </select>
                  <input aria-label={t('adminReferences.holdingPercent')} placeholder="%" type="number" step="0.1" value={h.percent} onChange={(e) => setHolding(i, { percent: e.target.value })} className={inputClass} />
                  <div className="self-center">{removeBtn(() => c.set({ holdings: f.holdings.filter((_, j) => j !== i) }))}</div>
                  <input aria-label={t('adminReferences.noteVi')} placeholder={t('adminReferences.noteVi')} value={h.note_vi} onChange={(e) => setHolding(i, { note_vi: e.target.value })} className={`${inputClass} sm:col-span-2`} />
                  <input aria-label={t('adminReferences.noteEn')} placeholder={t('adminReferences.noteEn')} value={h.note_en} onChange={(e) => setHolding(i, { note_en: e.target.value })} className={`${inputClass} sm:col-span-2`} />
                </div>
              ))}
              <button type="button" onClick={() => c.set({ holdings: [...f.holdings, { name: '', kind: 'stock', percent: '', note_vi: '', note_en: '' }] })} className="text-sm font-semibold text-emerald-700 hover:underline">
                {t('adminReferences.addHolding')}
              </button>
            </fieldset>

            <Field label={t('adminReferences.storyVi')}>
              <textarea rows={6} value={f.story_vi} onChange={(e) => c.set({ story_vi: e.target.value })} className={inputClass} />
            </Field>
            <Field label={t('adminReferences.storyEn')}>
              <textarea rows={6} value={f.story_en} onChange={(e) => c.set({ story_en: e.target.value })} className={inputClass} />
            </Field>

            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-slate-600">{t('adminReferences.milestones')}</legend>
              {f.milestones.map((m, i) => (
                <div key={i} className="grid gap-2 rounded-xl bg-slate-50 p-2 sm:grid-cols-[5rem_1fr_1fr_auto]">
                  <input aria-label={t('adminReferences.year')} placeholder={t('adminReferences.year')} type="number" value={m.year} onChange={(e) => setMilestone(i, { year: e.target.value })} className={inputClass} />
                  <input aria-label={t('adminReferences.textVi')} placeholder={t('adminReferences.textVi')} value={m.text_vi} onChange={(e) => setMilestone(i, { text_vi: e.target.value })} className={inputClass} />
                  <input aria-label={t('adminReferences.textEn')} placeholder={t('adminReferences.textEn')} value={m.text_en} onChange={(e) => setMilestone(i, { text_en: e.target.value })} className={inputClass} />
                  <div className="self-center">{removeBtn(() => c.set({ milestones: f.milestones.filter((_, j) => j !== i) }))}</div>
                </div>
              ))}
              <button type="button" onClick={() => c.set({ milestones: [...f.milestones, { year: '', text_vi: '', text_en: '' }] })} className="text-sm font-semibold text-emerald-700 hover:underline">
                {t('adminReferences.addMilestone')}
              </button>
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('adminReferences.lessonsVi')}>
                <textarea rows={4} value={f.lessons_vi} onChange={(e) => c.set({ lessons_vi: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t('adminReferences.lessonsEn')}>
                <textarea rows={4} value={f.lessons_en} onChange={(e) => c.set({ lessons_en: e.target.value })} className={inputClass} />
              </Field>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <Field label={t('adminReferences.position')}>
                <input type="number" value={f.position} onChange={(e) => c.set({ position: Number(e.target.value) })} className={`${inputClass} w-24`} />
              </Field>
              <div className="pb-2">
                <Checkbox label={t('adminReferences.published')} checked={f.published} onChange={(v) => c.set({ published: v })} />
              </div>
            </div>
            <FormActions error={c.error} saved={c.saved} onCancel={c.close} />
          </form>
        )
      }
    />
  )
}
