'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChapterForm } from '@/components/admin/ChapterForm'
import { LessonEditor } from '@/components/admin/LessonEditor'
import { useT } from '@/i18n/I18nProvider'
import { LOCALES, type Locale } from '@/i18n/locales'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { AdminChapterDto, AdminLessonSummaryDto } from '@/server/learn/admin-service'

type Selection =
  | { kind: 'chapter'; id: string | null } // null = chương mới
  | { kind: 'lesson'; id: string | null; chapterId: string } // id null = bài mới
  | null

export default function AdminLearnPage() {
  const { t, locale: uiLocale } = useT()
  const [locale, setLocale] = useState<Locale>(uiLocale)
  const [tree, setTree] = useState<AdminChapterDto[] | null>(null)
  const [selection, setSelection] = useState<Selection>(null)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const load = useCallback(() => {
    api<AdminChapterDto[]>(`/api/admin/learn?locale=${locale}`).then(setTree, setError)
  }, [locale])
  useEffect(load, [load])

  // Đóng/tải lại tab khi còn thay đổi chưa lưu → trình duyệt hỏi xác nhận
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  /** Đổi lựa chọn — hỏi lại nếu chương/bài/câu hỏi đang sửa chưa lưu */
  const select = (next: Selection) => {
    if (dirty && !window.confirm(t('admin.unsavedConfirm'))) return
    setDirty(false)
    setSelection(next)
  }

  const act = async (fn: () => Promise<unknown>) => {
    setError(null)
    try {
      await fn()
      load()
    } catch (err) {
      setError(err)
    }
  }
  const post = (path: string, body: unknown) => api(path, { method: 'POST', body: JSON.stringify(body) })
  const patch = (path: string, body: unknown) => api(path, { method: 'PATCH', body: JSON.stringify(body) })

  const deleteChapter = (c: AdminChapterDto) =>
    window.confirm(t('admin.deleteChapterConfirm', { title: c.title })) &&
    act(async () => {
      await api(`/api/admin/learn/chapters/${c.id}`, { method: 'DELETE' })
      if (selection && (selection.kind === 'chapter' ? selection.id === c.id : selection.chapterId === c.id)) {
        setSelection(null)
        setDirty(false)
      }
    })
  const deleteLesson = (l: AdminLessonSummaryDto) =>
    window.confirm(t('admin.deleteLessonConfirm', { title: l.title })) &&
    act(async () => {
      await api(`/api/admin/learn/lessons/${l.id}`, { method: 'DELETE' })
      if (selection?.kind === 'lesson' && selection.id === l.id) {
        setSelection(null)
        setDirty(false)
      }
    })

  const btn = 'rounded px-1.5 py-0.5 text-xs ring-1 ring-slate-200 hover:bg-slate-100 disabled:opacity-30'
  const selectedChapter = selection?.kind === 'chapter' && selection.id ? tree?.find((c) => c.id === selection.id) ?? null : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('admin.title')}</h1>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          {t('admin.locale')}
          <select
            value={locale}
            onChange={(e) => {
              if (dirty && !window.confirm(t('admin.unsavedConfirm'))) return
              setDirty(false)
              setSelection(null)
              setTree(null)
              setLocale(e.target.value as Locale)
            }}
            className="rounded-lg border-0 py-1.5 pl-3 pr-8 text-sm ring-1 ring-inset ring-slate-300"
          >
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error !== null && <p className="text-sm text-rose-600">{errorMessage(error, t)}</p>}

      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <aside className="space-y-3 self-start rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          {!tree && <p className="text-sm text-slate-400">{t('common.loading')}</p>}
          {tree?.length === 0 && <p className="text-sm text-slate-400">{t('admin.emptyTree')}</p>}
          {tree?.map((c, ci) => (
            <div key={c.id} className="space-y-1">
              <div className={`flex items-center gap-1 rounded-lg px-2 py-1 ${selection?.kind === 'chapter' && selection.id === c.id ? 'bg-emerald-50' : ''}`}>
                <button onClick={() => select({ kind: 'chapter', id: c.id })} className="min-w-0 flex-1 truncate text-left text-sm font-semibold">
                  {ci + 1}. {c.title}
                </button>
                {!c.published && <span className="rounded bg-amber-100 px-1 text-[10px] text-amber-800">{t('admin.draft')}</span>}
                <button className={btn} disabled={ci === 0} aria-label={t('admin.moveUp')} onClick={() => act(() => post(`/api/admin/learn/chapters/${c.id}/move`, { direction: 'up' }))}>
                  ↑
                </button>
                <button className={btn} disabled={ci === tree.length - 1} aria-label={t('admin.moveDown')} onClick={() => act(() => post(`/api/admin/learn/chapters/${c.id}/move`, { direction: 'down' }))}>
                  ↓
                </button>
                <button className={btn} onClick={() => act(() => patch(`/api/admin/learn/chapters/${c.id}`, { published: !c.published }))}>
                  {c.published ? t('admin.unpublish') : t('admin.publish')}
                </button>
                <button className={`${btn} text-rose-600`} aria-label={t('admin.delete')} onClick={() => void deleteChapter(c)}>
                  ✕
                </button>
              </div>
              <ul className="ml-3 space-y-0.5 border-l border-slate-100 pl-2">
                {c.lessons.map((l, li) => (
                  <li key={l.id} className={`flex items-center gap-1 rounded-lg px-2 py-0.5 ${selection?.kind === 'lesson' && selection.id === l.id ? 'bg-emerald-50' : ''}`}>
                    <button onClick={() => select({ kind: 'lesson', id: l.id, chapterId: c.id })} className="min-w-0 flex-1 truncate text-left text-sm">
                      {l.title}
                    </button>
                    {!l.published && <span className="rounded bg-amber-100 px-1 text-[10px] text-amber-800">{t('admin.draft')}</span>}
                    <span className="text-[10px] text-slate-400">{l.question_count}Q</span>
                    <button className={btn} disabled={li === 0} aria-label={t('admin.moveUp')} onClick={() => act(() => post(`/api/admin/learn/lessons/${l.id}/move`, { direction: 'up' }))}>
                      ↑
                    </button>
                    <button className={btn} disabled={li === c.lessons.length - 1} aria-label={t('admin.moveDown')} onClick={() => act(() => post(`/api/admin/learn/lessons/${l.id}/move`, { direction: 'down' }))}>
                      ↓
                    </button>
                    <button className={btn} onClick={() => act(() => patch(`/api/admin/learn/lessons/${l.id}`, { published: !l.published }))}>
                      {l.published ? t('admin.unpublish') : t('admin.publish')}
                    </button>
                    <button className={`${btn} text-rose-600`} aria-label={t('admin.delete')} onClick={() => void deleteLesson(l)}>
                      ✕
                    </button>
                  </li>
                ))}
                <li>
                  <button onClick={() => select({ kind: 'lesson', id: null, chapterId: c.id })} className="px-2 text-xs font-semibold text-emerald-700 hover:underline">
                    {t('admin.newLesson')}
                  </button>
                </li>
              </ul>
            </div>
          ))}
          <button onClick={() => select({ kind: 'chapter', id: null })} className="w-full rounded-lg px-3 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-50">
            {t('admin.newChapter')}
          </button>
        </aside>

        <section className="min-w-0 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
          {!selection && <p className="py-10 text-center text-sm text-slate-400">{t('admin.selectLesson')}</p>}
          {selection?.kind === 'chapter' && (selection.id === null || selectedChapter) && (
            <ChapterForm
              key={selection.id ?? `new-${locale}`}
              chapter={selectedChapter}
              locale={locale}
              onDirtyChange={setDirty}
              onSaved={(c) => {
                load()
                setSelection({ kind: 'chapter', id: c.id })
              }}
            />
          )}
          {selection?.kind === 'lesson' && tree && (
            <LessonEditor
              key={selection.id ?? `new-${selection.chapterId}`}
              lessonId={selection.id}
              chapterId={selection.chapterId}
              chapters={tree}
              onDirtyChange={setDirty}
              onSaved={(id) => {
                load()
                const chapterId = selection.chapterId
                if (selection.id !== id) setSelection({ kind: 'lesson', id, chapterId })
              }}
            />
          )}
        </section>
      </div>
    </div>
  )
}
