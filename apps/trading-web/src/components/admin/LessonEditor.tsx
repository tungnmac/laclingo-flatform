'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Markdown } from '@/components/learn/Markdown'
import { useT } from '@/i18n/I18nProvider'
import { useFocusOnOpen } from '@/hooks/useFocusOnOpen'
import { changedFields, insertAt } from '@/lib/admin-forms'
import { api, ApiError } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { AdminChapterDto, AdminLessonDto } from '@/server/learn/admin-service'
import { Checkbox, Field, inputClass } from './fields'
import { QuestionsEditor } from './QuestionsEditor'

/** Upload multipart — không dùng api() vì api() ép Content-Type JSON */
async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/admin/uploads', { method: 'POST', body: form }).catch(() => {
    throw new ApiError('network error', 0, 'NETWORK')
  })
  const body = (await res.json().catch(() => null)) as { url?: string; code?: string; params?: Record<string, string | number>; error?: string } | null
  if (!res.ok || !body?.url) throw new ApiError(body?.error ?? `HTTP ${res.status}`, res.status, body?.code ?? 'INTERNAL', body?.params)
  return body.url
}

interface Form {
  title: string
  slug: string
  translation_key: string
  summary: string
  chapter_id: string
  content_md: string
  published: boolean
}

const toForm = (l: AdminLessonDto): Form => ({
  title: l.title,
  slug: l.slug,
  translation_key: l.translation_key ?? '',
  summary: l.summary ?? '',
  chapter_id: l.chapter_id,
  content_md: l.content_md,
  published: l.published,
})

/** lessonId = null → tạo bài mới trong `chapterId` */
export function LessonEditor({
  lessonId,
  chapterId,
  chapters,
  onSaved,
  onDirtyChange,
}: {
  lessonId: string | null
  chapterId: string
  chapters: AdminChapterDto[]
  onSaved: (lessonId: string) => void
  onDirtyChange: (dirty: boolean) => void
}) {
  const { t } = useT()
  const [lesson, setLesson] = useState<AdminLessonDto | null>(null)
  const [form, setForm] = useState<Form>({ title: '', slug: '', translation_key: '', summary: '', chapter_id: chapterId, content_md: '', published: false })
  const [dirty, setDirty] = useState(false)
  const [questionsDirty, setQuestionsDirty] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const textarea = useRef<HTMLTextAreaElement>(null)
  // bài mới: ngay khi mở; sửa bài: khi nội dung tải xong
  const formRef = useFocusOnOpen<HTMLFormElement>(lessonId === null ? 'new' : lesson ? lessonId : null)

  useEffect(() => {
    if (!lessonId) return
    api<AdminLessonDto>(`/api/admin/learn/lessons/${lessonId}`).then((l) => {
      setLesson(l)
      setForm(toForm(l))
    }, setError)
  }, [lessonId])

  useEffect(() => onDirtyChange(dirty || questionsDirty), [dirty, questionsDirty, onDirtyChange])

  const set = (patch: Partial<Form>) => {
    setForm((f) => ({ ...f, ...patch }))
    setDirty(true)
    setSaved(false)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      // Sửa bài: chỉ gửi trường đã đổi — không ghi đè "Công bố/Ẩn" vừa bấm trên cây bằng giá trị cũ của form
      const res =
        lessonId && lesson
          ? await api<AdminLessonDto>(`/api/admin/learn/lessons/${lessonId}`, {
              method: 'PATCH',
              body: JSON.stringify(changedFields(toForm(lesson), form)),
            })
          : await api<AdminLessonDto>('/api/admin/learn/lessons', { method: 'POST', body: JSON.stringify(form) })
      setLesson(res)
      setForm(toForm(res))
      setDirty(false)
      setSaved(true)
      onSaved(res.id)
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  const onPickImage = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const url = await uploadImage(file)
      // Đọc con trỏ & nội dung SAU khi upload xong — giữ phần người dùng gõ thêm trong lúc chờ
      const at = textarea.current?.selectionStart ?? Number.MAX_SAFE_INTEGER
      setForm((f) => ({ ...f, content_md: insertAt(f.content_md, at, `![](${url})`) }))
      setDirty(true)
      setSaved(false)
    } catch (err) {
      setError(err)
    } finally {
      setUploading(false)
    }
  }

  if (lessonId && !lesson && error === null) return <p className="text-sm text-slate-400">{t('common.loading')}</p>

  return (
    <div className="space-y-6">
      <form ref={formRef} onSubmit={submit} className="scroll-mt-20 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{lessonId ? form.title || '…' : t('admin.newLesson')}</h2>
          {lesson?.published && (
            <Link href={`/learn/${lesson.slug}`} target="_blank" className="text-sm font-semibold text-emerald-700 hover:underline">
              {t('admin.view')} ↗
            </Link>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('admin.lessonTitle')}>
            <input value={form.title} onChange={(e) => set({ title: e.target.value })} className={inputClass} />
          </Field>
          <Field label={t('admin.slug')} hint={t('admin.slugHint')}>
            <input value={form.slug} onChange={(e) => set({ slug: e.target.value })} className={inputClass} />
          </Field>
          <Field label={t('admin.translationKey')} hint={t('admin.translationKeyHint')}>
            <input value={form.translation_key} onChange={(e) => set({ translation_key: e.target.value })} className={inputClass} />
          </Field>
          <Field label={t('admin.chapter')}>
            <select value={form.chapter_id} onChange={(e) => set({ chapter_id: e.target.value })} className={inputClass}>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end pb-2">
            <Checkbox label={t('admin.published')} checked={form.published} onChange={(v) => set({ published: v })} />
          </div>
        </div>
        <Field label={t('admin.summary')}>
          <textarea rows={2} value={form.summary} onChange={(e) => set({ summary: e.target.value })} className={inputClass} />
        </Field>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600">{t('admin.content')}</span>
          <label className="cursor-pointer text-xs font-semibold text-emerald-700 hover:underline">
            {uploading ? t('admin.uploading') : t('admin.uploadImage')}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                void onPickImage(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </label>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <textarea
            ref={textarea}
            rows={22}
            value={form.content_md}
            onChange={(e) => set({ content_md: e.target.value })}
            className={`${inputClass} mt-0 font-mono`}
          />
          <div className="max-h-[34rem] overflow-y-auto rounded-lg bg-white p-3 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase text-slate-400">{t('admin.preview')}</p>
            <Markdown source={form.content_md} />
          </div>
        </div>
        {error !== null && <p className="text-sm text-rose-600">{errorMessage(error, t)}</p>}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
            {t('common.save')}
          </button>
          {saved && <span className="text-sm text-emerald-700">{t('admin.saved')}</span>}
        </div>
      </form>
      {lesson && (
        <QuestionsEditor
          key={lesson.id}
          lesson={lesson}
          onDirtyChange={setQuestionsDirty}
          onSaved={(l) => {
            setLesson(l)
            onSaved(l.id)
          }}
        />
      )}
    </div>
  )
}
