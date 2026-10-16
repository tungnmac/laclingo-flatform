'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { LEVELS } from '@/server/learn/validation'
import { changedFields } from '@/lib/admin-forms'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { AdminChapterDto } from '@/server/learn/admin-service'
import { Checkbox, Field, inputClass } from './fields'

/** chapter = null → tạo chương mới trong `locale` */
export function ChapterForm({
  chapter,
  locale,
  onSaved,
  onDirtyChange,
}: {
  chapter: AdminChapterDto | null
  locale: string
  onSaved: (c: AdminChapterDto) => void
  onDirtyChange: (dirty: boolean) => void
}) {
  const { t } = useT()
  const [title, setTitle] = useState(chapter?.title ?? '')
  const [slug, setSlug] = useState(chapter?.slug ?? '')
  const [description, setDescription] = useState(chapter?.description ?? '')
  const [level, setLevel] = useState(chapter?.level ?? 'basic')
  const [published, setPublished] = useState(chapter?.published ?? false)
  const [saving, setSaving] = useState(false)
  const loaded = {
    title: chapter?.title ?? '',
    slug: chapter?.slug ?? '',
    description: chapter?.description ?? '',
    level: chapter?.level ?? 'basic',
    published: chapter?.published ?? false,
  }
  const current = { title, slug, description, level, published }
  const changes = changedFields(loaded, current)
  const dirty = Object.keys(changes).length > 0
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange])
  const [error, setError] = useState<unknown>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      // Sửa: chỉ gửi trường đã đổi (không ghi đè trạng thái công bố vừa đổi trên cây)
      const saved = chapter
        ? await api<AdminChapterDto>(`/api/admin/learn/chapters/${chapter.id}`, { method: 'PATCH', body: JSON.stringify(changes) })
        : await api<AdminChapterDto>('/api/admin/learn/chapters', { method: 'POST', body: JSON.stringify({ ...current, locale }) })
      onDirtyChange(false)
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
      <Field label={t('admin.level')}>
        <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputClass}>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {t(`levels.${l}`)}
            </option>
          ))}
        </select>
      </Field>
      <Checkbox label={t('admin.published')} checked={published} onChange={setPublished} />
      {error !== null && <p className="text-sm text-rose-600">{errorMessage(error, t)}</p>}
      <button type="submit" disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
        {t('common.save')}
      </button>
    </form>
  )
}
