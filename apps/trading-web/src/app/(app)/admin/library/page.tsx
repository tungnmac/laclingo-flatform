'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Checkbox, Field, inputClass } from '@/components/admin/fields'
import { useT } from '@/i18n/I18nProvider'
import { useFocusOnOpen } from '@/hooks/useFocusOnOpen'
import { LOCALES, type Locale } from '@/i18n/locales'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { AdminBookDto, AdminTermDto } from '@/server/library/library-service'
import { BOOK_TOPICS } from '@/server/library/validation'
import { LEVELS } from '@/server/learn/validation'

type Tab = 'books' | 'glossary'

export default function AdminLibraryPage() {
  const { t } = useT()
  const [tab, setTab] = useState<Tab>('books')
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('adminLibrary.title')}</h1>
      <div className="flex gap-2" role="tablist">
        {(['books', 'glossary'] as const).map((x) => (
          <button
            key={x}
            role="tab"
            aria-selected={x === tab}
            onClick={() => setTab(x)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${x === tab ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
          >
            {t(x === 'books' ? 'adminLibrary.tabBooks' : 'adminLibrary.tabGlossary')}
          </button>
        ))}
      </div>
      {tab === 'books' ? <BooksAdmin /> : <GlossaryAdmin />}
    </div>
  )
}

// ── Sách ──

type BookForm = Omit<AdminBookDto, 'id' | 'year' | 'url' | 'title_vi'> & { year: string; url: string; title_vi: string }
const emptyBook: BookForm = { title: '', title_vi: '', author: '', year: '', level: 'basic', topic: 'investing', url: '', summary_vi: '', summary_en: '', published: false, position: 0 }
const toBookForm = (b: AdminBookDto): BookForm => ({ ...b, year: b.year === null ? '' : String(b.year), url: b.url ?? '', title_vi: b.title_vi ?? '' })

function BooksAdmin() {
  const { t } = useT()
  const [list, setList] = useState<AdminBookDto[] | null>(null)
  const [editing, setEditing] = useState<{ id: string | null; form: BookForm } | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [saved, setSaved] = useState(false)
  // chọn Sửa 1 dòng / Tạo mới → cuộn tới form & focus (theo id, không theo từng lần gõ)
  const formRef = useFocusOnOpen<HTMLFormElement>(editing ? (editing.id ?? 'new') : null)

  const load = useCallback(() => {
    api<AdminBookDto[]>('/api/admin/books').then(setList, setError)
  }, [])
  useEffect(load, [load])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setError(null)
    const f = editing.form
    const body = { ...f, year: f.year.trim() === '' ? null : Number(f.year), position: Number(f.position) || 0 }
    try {
      const res = editing.id
        ? await api<AdminBookDto>(`/api/admin/books/${editing.id}`, { method: 'PATCH', body: JSON.stringify(body) })
        : await api<AdminBookDto>('/api/admin/books', { method: 'POST', body: JSON.stringify(body) })
      setEditing({ id: res.id, form: toBookForm(res) })
      setSaved(true)
      load()
    } catch (err) {
      setError(err)
    }
  }

  const remove = async (b: AdminBookDto) => {
    if (!window.confirm(t('adminLibrary.deleteConfirm', { name: b.title }))) return
    try {
      await api(`/api/admin/books/${b.id}`, { method: 'DELETE' })
      if (editing?.id === b.id) setEditing(null)
      load()
    } catch (err) {
      setError(err)
    }
  }

  const set = (patch: Partial<BookForm>) => {
    setEditing((x) => (x ? { ...x, form: { ...x.form, ...patch } } : x))
    setSaved(false)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="space-y-2">
        <button onClick={() => setEditing({ id: null, form: emptyBook })} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white">
          {t('adminLibrary.newBook')}
        </button>
        <ul className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          {!list && <li className="px-3 py-4 text-sm text-slate-400">{t('common.loading')}</li>}
          {list?.map((b) => (
            <li key={b.id} className={`flex items-center justify-between gap-2 px-3 py-2 ${editing?.id === b.id ? 'bg-emerald-50' : ''}`}>
              <button onClick={() => setEditing({ id: b.id, form: toBookForm(b) })} className="min-w-0 text-left">
                <span className="block truncate font-semibold">{b.title_vi ? `${b.title_vi} · ${b.title}` : b.title}</span>
                <span className="block truncate text-xs text-slate-500">
                  {b.author} · {t(`levels.${b.level}`)} · {b.published ? t('adminLibrary.published') : t('adminLibrary.draft')}
                </span>
              </button>
              <button onClick={() => remove(b)} className="shrink-0 text-xs font-semibold text-rose-600 hover:underline">
                {t('adminLibrary.delete')}
              </button>
            </li>
          ))}
        </ul>
      </section>
      {editing && (
        <form ref={formRef} onSubmit={submit} className="scroll-mt-20 space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <Field label={t('adminLibrary.bookTitle')}>
            <input value={editing.form.title} onChange={(e) => set({ title: e.target.value })} className={inputClass} />
          </Field>
          <Field label={t('adminLibrary.bookTitleVi')}>
            <input value={editing.form.title_vi} onChange={(e) => set({ title_vi: e.target.value })} className={inputClass} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('adminLibrary.author')}>
              <input value={editing.form.author} onChange={(e) => set({ author: e.target.value })} className={inputClass} />
            </Field>
            <Field label={t('adminLibrary.year')}>
              <input type="number" value={editing.form.year} onChange={(e) => set({ year: e.target.value })} className={inputClass} />
            </Field>
            <Field label={t('adminLibrary.level')}>
              <select value={editing.form.level} onChange={(e) => set({ level: e.target.value })} className={inputClass}>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {t(`levels.${l}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('adminLibrary.topic')}>
              <select value={editing.form.topic} onChange={(e) => set({ topic: e.target.value })} className={inputClass}>
                {BOOK_TOPICS.map((x) => (
                  <option key={x} value={x}>
                    {t(`books.topic_${x}`)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label={t('adminLibrary.url')}>
            <input value={editing.form.url} onChange={(e) => set({ url: e.target.value })} className={inputClass} />
          </Field>
          <Field label={t('adminLibrary.summaryVi')}>
            <textarea rows={3} value={editing.form.summary_vi} onChange={(e) => set({ summary_vi: e.target.value })} className={inputClass} />
          </Field>
          <Field label={t('adminLibrary.summaryEn')}>
            <textarea rows={3} value={editing.form.summary_en} onChange={(e) => set({ summary_en: e.target.value })} className={inputClass} />
          </Field>
          <div className="flex items-end gap-4">
            <Field label={t('adminLibrary.position')}>
              <input type="number" value={editing.form.position} onChange={(e) => set({ position: Number(e.target.value) })} className={`${inputClass} w-24`} />
            </Field>
            <div className="pb-2">
              <Checkbox label={t('adminLibrary.published')} checked={editing.form.published} onChange={(v) => set({ published: v })} />
            </div>
          </div>
          {error !== null && <p className="text-sm text-rose-600">{errorMessage(error, t)}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              {t('common.save')}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="text-sm text-slate-600 hover:underline">
              {t('adminLibrary.cancel')}
            </button>
            {saved && <span className="text-sm text-emerald-700">{t('adminLibrary.saved')}</span>}
          </div>
        </form>
      )}
    </div>
  )
}

// ── Thuật ngữ ──

type TermForm = { term: string; definition_md: string; lesson_slug: string; published: boolean }
const emptyTerm: TermForm = { term: '', definition_md: '', lesson_slug: '', published: false }

function GlossaryAdmin() {
  const { t, locale: uiLocale } = useT()
  const [locale, setLocale] = useState<Locale>(uiLocale)
  const [list, setList] = useState<AdminTermDto[] | null>(null)
  const [editing, setEditing] = useState<{ id: string | null; form: TermForm } | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [saved, setSaved] = useState(false)
  // chọn Sửa 1 dòng / Tạo mới → cuộn tới form & focus (theo id, không theo từng lần gõ)
  const formRef = useFocusOnOpen<HTMLFormElement>(editing ? (editing.id ?? 'new') : null)

  const [reload, setReload] = useState(0)
  const load = useCallback(() => setReload((n) => n + 1), [])
  useEffect(() => {
    let alive = true // đổi ngôn ngữ nhanh → bỏ danh sách của request cũ
    setError(null)
    api<AdminTermDto[]>(`/api/admin/glossary?locale=${locale}`).then(
      (l) => alive && setList(l),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [locale, reload])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setError(null)
    try {
      const res = editing.id
        ? await api<AdminTermDto>(`/api/admin/glossary/${editing.id}`, { method: 'PATCH', body: JSON.stringify(editing.form) })
        : await api<AdminTermDto>('/api/admin/glossary', { method: 'POST', body: JSON.stringify({ ...editing.form, locale }) })
      setEditing({ id: res.id, form: { term: res.term, definition_md: res.definition_md, lesson_slug: res.lesson_slug ?? '', published: res.published } })
      setSaved(true)
      load()
    } catch (err) {
      setError(err)
    }
  }

  const remove = async (x: AdminTermDto) => {
    if (!window.confirm(t('adminLibrary.deleteConfirm', { name: x.term }))) return
    try {
      await api(`/api/admin/glossary/${x.id}`, { method: 'DELETE' })
      if (editing?.id === x.id) setEditing(null)
      load()
    } catch (err) {
      setError(err)
    }
  }

  const set = (patch: Partial<TermForm>) => {
    setEditing((x) => (x ? { ...x, form: { ...x.form, ...patch } } : x))
    setSaved(false)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setEditing({ id: null, form: emptyTerm })} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white">
            {t('adminLibrary.newTerm')}
          </button>
          <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
            {t('adminLibrary.contentLanguage')}
            <select
              value={locale}
              onChange={(e) => {
                setLocale(e.target.value as Locale)
                setEditing(null)
                setList(null)
              }}
              className="rounded-lg border-0 py-1 text-sm ring-1 ring-slate-200"
            >
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ul className="max-h-[36rem] divide-y divide-slate-100 overflow-y-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          {!list && <li className="px-3 py-4 text-sm text-slate-400">{t('common.loading')}</li>}
          {list?.map((x) => (
            <li key={x.id} className={`flex items-center justify-between gap-2 px-3 py-2 ${editing?.id === x.id ? 'bg-emerald-50' : ''}`}>
              <button
                onClick={() => setEditing({ id: x.id, form: { term: x.term, definition_md: x.definition_md, lesson_slug: x.lesson_slug ?? '', published: x.published } })}
                className="min-w-0 text-left"
              >
                <span className="block truncate font-semibold">{x.term}</span>
                <span className="block text-xs text-slate-500">{x.published ? t('adminLibrary.published') : t('adminLibrary.draft')}</span>
              </button>
              <button onClick={() => remove(x)} className="shrink-0 text-xs font-semibold text-rose-600 hover:underline">
                {t('adminLibrary.delete')}
              </button>
            </li>
          ))}
        </ul>
      </section>
      {editing && (
        <form ref={formRef} onSubmit={submit} className="scroll-mt-20 space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <Field label={t('adminLibrary.term')}>
            <input value={editing.form.term} onChange={(e) => set({ term: e.target.value })} className={inputClass} />
          </Field>
          <Field label={t('adminLibrary.definition')}>
            <textarea rows={5} value={editing.form.definition_md} onChange={(e) => set({ definition_md: e.target.value })} className={inputClass} />
          </Field>
          <Field label={t('adminLibrary.lessonSlug')}>
            <input value={editing.form.lesson_slug} onChange={(e) => set({ lesson_slug: e.target.value })} className={inputClass} />
          </Field>
          <Checkbox label={t('adminLibrary.published')} checked={editing.form.published} onChange={(v) => set({ published: v })} />
          {error !== null && <p className="text-sm text-rose-600">{errorMessage(error, t)}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              {t('common.save')}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="text-sm text-slate-600 hover:underline">
              {t('adminLibrary.cancel')}
            </button>
            {saved && <span className="text-sm text-emerald-700">{t('adminLibrary.saved')}</span>}
          </div>
        </form>
      )}
    </div>
  )
}
