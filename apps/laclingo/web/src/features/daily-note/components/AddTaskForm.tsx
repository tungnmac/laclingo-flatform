'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/features/auth/components/AuthForm'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import type { DailyTaskCreateRequest, DailyTaskKind } from '@/types/api'
import { dailyNoteService } from '../daily.service'
import { DAILY_TASK_KINDS } from '../kinds'

/** Thêm việc vào hôm nay + chip gợi ý bấm 1 lần là thêm */
export function AddTaskForm({ disabled, onAdded }: { disabled: boolean; onAdded: () => void }) {
  const t = useTranslation()
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<DailyTaskKind>('free')
  const [target, setTarget] = useState('')
  const [repeat, setRepeat] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const add = async (body: DailyTaskCreateRequest) => {
    setBusy(true)
    setError(null)
    try {
      await dailyNoteService.createTask(body)
      setTitle('')
      setTarget('')
      setRepeat(false)
      onAdded()
    } catch (err) {
      setError(inlineError(err))
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    void add({ title: title.trim(), kind, target: target.trim() ? Number(target) : undefined, repeat })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <h2 className="text-base font-semibold text-slate-900">{t.daily.addTitle}</h2>
      <div className="grid gap-2 sm:grid-cols-[1fr_11rem_8rem]">
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required placeholder={t.daily.titlePlaceholder} className={inputClass} aria-label={t.daily.addTitle} />
        <select value={kind} onChange={(e) => setKind(e.target.value as DailyTaskKind)} className={inputClass} aria-label={t.daily.kindLabel}>
          {DAILY_TASK_KINDS.map((k) => (
            <option key={k} value={k}>
              {t.daily.kinds[k]}
            </option>
          ))}
        </select>
        <input type="number" min={1} max={1000} value={target} onChange={(e) => setTarget(e.target.value)} placeholder={t.daily.targetPlaceholder} className={inputClass} aria-label={t.daily.targetLabel} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
          {t.daily.repeatLabel}
        </label>
        <Button type="submit" size="sm" disabled={disabled || busy || !title.trim()}>
          {t.daily.addBtn}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-500">{t.daily.suggestions}</span>
        {t.daily.suggestionItems.map((s) => (
          <button
            key={s.title}
            type="button"
            disabled={disabled || busy}
            onClick={() => void add(s)}
            className="rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
          >
            {s.title}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </form>
  )
}
