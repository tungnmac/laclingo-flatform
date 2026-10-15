'use client'

import { useState } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { AdminLessonDto } from '@/server/learn/admin-service'
import { Field, inputClass } from './fields'

interface Draft {
  key: number
  prompt: string
  options: string[]
  correct_index: number
  explanation: string
}

let nextKey = 1
const blank = (): Draft => ({ key: nextKey++, prompt: '', options: ['', ''], correct_index: 0, explanation: '' })

/** Soạn toàn bộ câu hỏi của 1 bài — Lưu = thay thế cả danh sách (PUT) */
export function QuestionsEditor({ lesson, onSaved }: { lesson: AdminLessonDto; onSaved: (l: AdminLessonDto) => void }) {
  const { t } = useT()
  const [items, setItems] = useState<Draft[]>(() =>
    lesson.questions.map((q) => ({ key: nextKey++, prompt: q.prompt, options: q.options, correct_index: q.correct_index, explanation: q.explanation ?? '' })),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [saved, setSaved] = useState(false)

  const update = (i: number, patch: Partial<Draft>) => {
    setSaved(false)
    setItems(items.map((q, j) => (j === i ? { ...q, ...patch } : q)))
  }
  const move = (i: number, d: -1 | 1) => {
    const j = i + d
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    setItems(next)
    setSaved(false)
  }
  const removeOption = (i: number, oi: number) => {
    const q = items[i]
    const options = q.options.filter((_, k) => k !== oi)
    const correct = q.correct_index === oi ? 0 : q.correct_index > oi ? q.correct_index - 1 : q.correct_index
    update(i, { options, correct_index: correct })
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const body = items.map((q) => ({ prompt: q.prompt, options: q.options, correct_index: q.correct_index, explanation: q.explanation || null }))
      const res = await api<AdminLessonDto>(`/api/admin/learn/lessons/${lesson.id}/questions`, { method: 'PUT', body: JSON.stringify(body) })
      setSaved(true)
      onSaved(res)
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  const smallBtn = 'rounded px-2 py-1 text-xs ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40'

  return (
    <section className="space-y-4">
      <h3 className="text-base font-bold">{t('admin.questions')}</h3>
      {items.length === 0 && <p className="text-sm text-slate-500">{t('admin.noQuestions')}</p>}
      {items.map((q, i) => (
        <div key={q.key} className="space-y-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-700">#{i + 1}</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={smallBtn} aria-label={t('admin.moveUp')}>
                ↑
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className={smallBtn} aria-label={t('admin.moveDown')}>
                ↓
              </button>
              <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className={`${smallBtn} text-rose-600`}>
                {t('admin.removeQuestion')}
              </button>
            </div>
          </div>
          <Field label={t('admin.prompt')}>
            <textarea rows={2} value={q.prompt} onChange={(e) => update(i, { prompt: e.target.value })} className={inputClass} />
          </Field>
          <div className="space-y-1.5">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${q.key}`}
                  checked={q.correct_index === oi}
                  onChange={() => update(i, { correct_index: oi })}
                  aria-label={t('admin.correct')}
                  className="text-emerald-600"
                />
                <input
                  value={opt}
                  placeholder={t('admin.option', { n: oi + 1 })}
                  onChange={(e) => update(i, { options: q.options.map((o, k) => (k === oi ? e.target.value : o)) })}
                  className={`${inputClass} mt-0`}
                />
                <button type="button" onClick={() => removeOption(i, oi)} disabled={q.options.length <= 2} className={smallBtn} aria-label={t('admin.removeOption')}>
                  ×
                </button>
              </div>
            ))}
            {q.options.length < 6 && (
              <button type="button" onClick={() => update(i, { options: [...q.options, ''] })} className="text-xs font-semibold text-emerald-700 hover:underline">
                {t('admin.addOption')}
              </button>
            )}
          </div>
          <Field label={t('admin.explanation')}>
            <textarea rows={2} value={q.explanation} onChange={(e) => update(i, { explanation: e.target.value })} className={inputClass} />
          </Field>
        </div>
      ))}
      {error !== null && <p className="text-sm text-rose-600">{errorMessage(error, t)}</p>}
      <div className="flex flex-wrap items-center gap-3">
        {items.length < 20 && (
          <button type="button" onClick={() => setItems([...items, blank()])} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
            {t('admin.addQuestion')}
          </button>
        )}
        <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
          {t('admin.saveQuestions')}
        </button>
        {saved && <span className="text-sm text-emerald-700">{t('admin.saved')}</span>}
      </div>
    </section>
  )
}
