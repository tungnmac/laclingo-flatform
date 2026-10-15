'use client'

import { useState, type FormEvent } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { AdminChapterDto } from '@/server/learn/admin-service'
import { Checkbox, Field, inputClass } from './fields'

/** chapter = null → tạo chương mới trong `locale` */
export function ChapterForm({
  chapter,
  locale,
  onSaved,
}: {
  chapter: AdminChapterDto | null
  locale: string
  onSaved: (c: AdminChapterDto) => void
}) {
  const { t } = useT()
  const [title, setTitle] = useState(chapter?.title ?? '')
  const [slug, setSlug] = useState(chapter?.slug ?? '')
  const [description, setDescription] = useState(chapter?.description ?? '')
  const [published, setPublished] = useState(chapter?.published ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const body = { title, slug, description: description || null, published }
      const saved = chapter
        ? await api<AdminChapterDto>(`/api/admin/learn/chapters/${chapter.id}`, { method: 'PATCH', body: JSON.stringify(body) })
        : await api<AdminChapterDto>('/api/admin/learn/chapters', { method: 'POST', body: JSON.stringify({ ...body, locale }) })
      onSaved(saved)
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <h2 className="text-lg font-bold">{chapter ? t('admin.editChapter') : t('admin.newChapter')}</h2>
      <Field label={t('admin.chapterTitle')}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </Field>
      <Field label={t('admin.slug')} hint={t('admin.slugHint')}>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} />
      </Field>
      <Field label={t('admin.description')}>
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
      </Field>
      <Checkbox label={t('admin.published')} checked={published} onChange={setPublished} />
      {error !== null && <p className="text-sm text-rose-600">{errorMessage(error, t)}</p>}
      <button type="submit" disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
        {t('common.save')}
      </button>
    </form>
  )
}
