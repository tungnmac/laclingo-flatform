'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { inputClass } from '@/features/auth/components/AuthForm'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { DailyTask, DailyTaskUpdateRequest } from '@/types/api'
import { dailyNoteService } from '../daily.service'
import { KIND_LINKS } from '../kinds'

/** 1 việc: thanh tiến độ + nút ±/ô tích; mở rộng để sửa ghi chú, mục tiêu, lặp lại, thứ tự, xoá */
export function TaskRow({
  task,
  editable,
  isFirst,
  isLast,
  canCarry,
  onChanged,
  onCarry,
}: {
  task: DailyTask
  editable: boolean
  isFirst: boolean
  isLast: boolean
  canCarry: boolean
  onChanged: () => void
  onCarry: (task: DailyTask) => void
}) {
  const t = useTranslation()
  const confirm = useConfirm()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState(task.title)
  const [target, setTarget] = useState(task.target ? String(task.target) : '')
  const [memo, setMemo] = useState(task.memo)

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
      onChanged()
      return true
    } catch (err) {
      setError(inlineError(err))
      return false
    } finally {
      setBusy(false)
    }
  }
  // ± / tích / lặp lại: thao tác nhanh — chỉ báo toast khi lỗi
  const quick = (body: DailyTaskUpdateRequest) => run(() => dailyNoteService.updateTask(task.id, body, { notify: 'error' }))

  const save = async () => {
    const n = target.trim() ? Number(target) : undefined
    const ok = await run(() =>
      dailyNoteService.updateTask(task.id, { title, memo, ...(n === undefined ? { clear_target: true } : { target: n }) }),
    )
    if (ok) setOpen(false)
  }

  const remove = async () => {
    if (!(await confirm({ description: t.daily.deleteConfirm(task.title), danger: true }))) return
    await run(() => dailyNoteService.deleteTask(task.id))
  }

  const pct = task.target ? Math.min(100, Math.round((task.progress / task.target) * 100)) : task.done ? 100 : 0
  const link = KIND_LINKS[task.kind]

  return (
    <li className={cn('rounded-xl p-3 ring-1 ring-inset', task.done ? 'bg-emerald-50 ring-emerald-200' : task.carried ? 'bg-slate-50 ring-slate-200 opacity-70' : 'ring-slate-200')}>
      <div className="flex items-start gap-3">
        {!task.target && (
          <input
            type="checkbox"
            checked={task.done}
            disabled={!editable || busy}
            onChange={() => void quick({ done: !task.done })}
            className="mt-1 h-5 w-5 accent-emerald-600"
            aria-label={task.title}
          />
        )}
        <div className="min-w-0 flex-1">
          <button type="button" onClick={() => editable && setOpen((v) => !v)} className="w-full text-left">
            <p className={cn('font-medium text-slate-900', task.done && 'line-through decoration-emerald-500')}>{task.title}</p>
            <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-slate-500">
              <span>{t.daily.kinds[task.kind]}</span>
              {task.kind !== 'free' && <span className="text-indigo-600">· {t.daily.auto}</span>}
              {task.repeat && <span>· {t.daily.repeat}</span>}
              {task.carried_in && <span>· {t.daily.carriedIn}</span>}
              {task.carried && <span>· {t.daily.carried}</span>}
            </p>
          </button>
          {task.target !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-slate-100">
                <div className={cn('h-2 rounded-full', task.done ? 'bg-emerald-500' : 'bg-indigo-500')} style={{ width: `${pct}%` }} />
              </div>
              <span className="w-16 text-right text-xs font-semibold tabular-nums text-slate-600">
                {task.progress}/{task.target}
              </span>
              {editable && (
                <span className="flex gap-1">
                  <button type="button" disabled={busy || task.progress === 0} onClick={() => void quick({ progress: task.progress - 1 })} className="h-7 w-7 rounded-lg ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-40">
                    −
                  </button>
                  <button type="button" disabled={busy} onClick={() => void quick({ progress: task.progress + 1 })} className="h-7 w-7 rounded-lg ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-40">
                    +
                  </button>
                </span>
              )}
            </div>
          )}
          {task.memo && !open && <p className="mt-1 text-sm text-slate-500">{task.memo}</p>}
        </div>
        {editable && link && !task.done && (
          <Link href={link} className="shrink-0 text-xs font-semibold text-indigo-600 hover:underline">
            {t.daily.goStudy}
          </Link>
        )}
        {canCarry && (
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => onCarry(task)}>
            {t.daily.carryBtn}
          </Button>
        )}
      </div>

      {open && editable && (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_8rem]">
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className={inputClass} />
            <input type="number" min={1} max={1000} value={target} onChange={(e) => setTarget(e.target.value)} placeholder={t.daily.targetPlaceholder} className={inputClass} />
          </div>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={500} rows={2} placeholder={t.daily.memoPlaceholder} className={inputClass} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={task.repeat} disabled={busy} onChange={() => void quick({ repeat: !task.repeat })} className="h-4 w-4 accent-indigo-600" />
            {t.daily.repeatLabel}
          </label>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={busy || !title.trim()} onClick={() => void save()}>
              {t.daily.save}
            </Button>
            <Button size="sm" variant="secondary" disabled={busy || isFirst} onClick={() => void run(() => dailyNoteService.moveTask(task.id, 'up'))}>
              ↑ {t.daily.moveUp}
            </Button>
            <Button size="sm" variant="secondary" disabled={busy || isLast} onClick={() => void run(() => dailyNoteService.moveTask(task.id, 'down'))}>
              ↓ {t.daily.moveDown}
            </Button>
            <Button size="sm" variant="ghost" className="text-rose-600" disabled={busy} onClick={() => void remove()}>
              {t.daily.delete}
            </Button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </li>
  )
}
