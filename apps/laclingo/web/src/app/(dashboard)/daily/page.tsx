'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState, Spinner } from '@/components/ui/States'
import { AddTaskForm } from '@/features/daily-note/components/AddTaskForm'
import { JournalBox } from '@/features/daily-note/components/JournalBox'
import { MonthCalendar } from '@/features/daily-note/components/MonthCalendar'
import { TaskRow } from '@/features/daily-note/components/TaskRow'
import { dailyNoteService } from '@/features/daily-note/daily.service'
import { addDays, monthOf } from '@/features/daily-note/dates'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import type { DailyTask } from '@/types/api'

/** Nhật ký học — riêng tư của học viên: việc mỗi ngày, tiến độ, ghi chú, lịch */
export default function DailyNotePage() {
  const t = useTranslation()
  const [date, setDate] = useState<string | null>(null) // null = hôm nay
  const [month, setMonth] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [carryError, setCarryError] = useState<string | null>(null)
  const { data: note, error, loading, reload } = useApi(
    () => (date ? dailyNoteService.day(date) : dailyNoteService.today()),
    [date, reloadKey],
  )

  const refresh = () => setReloadKey((k) => k + 1)
  const carry = async (task: DailyTask) => {
    setCarryError(null)
    try {
      await dailyNoteService.carryOver(task.id)
      refresh()
    } catch (err) {
      setCarryError(inlineError(err))
    }
  }

  if (loading && !note) return <Spinner />
  if (error && !note) return <ErrorState error={error} onRetry={reload} />
  if (!note) return null

  const today = note.today
  const viewing = note.date
  const done = note.tasks.filter((x) => x.done || x.carried).length
  const total = note.tasks.length
  const pct = total ? Math.round((done / total) * 100) : 0
  const goTo = (d: string) => {
    setMonth(null) // lịch đi theo ngày đang xem
    setDate(d >= today ? null : d)
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t.daily.pageTitle} description={t.daily.pageDesc} />
      <p className="text-xs text-slate-500">{t.daily.privateNote}</p>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => goTo(addDays(viewing, -1))} aria-label={t.daily.prevDay}>
            ◀
          </Button>
          <div className="text-center">
            <p className="text-lg font-bold tabular-nums text-slate-900">{viewing}</p>
            {viewing === today && <p className="text-xs font-semibold text-indigo-600">{t.daily.today}</p>}
          </div>
          <Button size="sm" variant="secondary" disabled={viewing >= today} onClick={() => goTo(addDays(viewing, 1))} aria-label={t.daily.nextDay}>
            ▶
          </Button>
          {viewing !== today && (
            <Button size="sm" variant="ghost" onClick={() => setDate(null)}>
              {t.daily.backToToday}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-700">{t.daily.summary(done, total)}</p>
            {note.streak > 0 && <p className="text-xs text-amber-600">{t.daily.streak(note.streak)}</p>}
          </div>
          <div
            className="grid h-14 w-14 place-items-center rounded-full text-sm font-bold text-slate-800"
            style={{ background: `conic-gradient(#10b981 ${pct * 3.6}deg, #e2e8f0 0deg)` }}
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white">{pct}%</span>
          </div>
        </div>
      </Card>

      {note.editable && note.yesterday_unfinished.length > 0 && (
        <Card className="space-y-2 border-l-4 border-orange-400">
          <h2 className="text-sm font-semibold text-orange-800">{t.daily.unfinishedTitle(note.yesterday_unfinished.length)}</h2>
          <ul className="space-y-2">
            {note.yesterday_unfinished.map((task) => (
              <TaskRow key={task.id} task={task} editable={false} isFirst isLast canCarry onChanged={refresh} onCarry={carry} />
            ))}
          </ul>
        </Card>
      )}
      {carryError && <p className="text-sm text-rose-600">{carryError}</p>}

      <Card className="space-y-3">
        {!note.editable && <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{note.exists ? t.daily.readOnly : t.daily.noNote}</p>}
        {note.editable && total === 0 && <p className="text-sm text-slate-500">{t.daily.empty}</p>}
        <ul className="space-y-2">
          {note.tasks.map((task, i) => (
            <TaskRow
              key={task.id}
              task={task}
              editable={note.editable}
              isFirst={i === 0}
              isLast={i === note.tasks.length - 1}
              canCarry={!note.editable && !task.done && !task.carried && !task.repeat}
              onChanged={refresh}
              onCarry={carry}
            />
          ))}
        </ul>
      </Card>

      {note.editable && (
        <Card>
          <AddTaskForm disabled={total >= 20} onAdded={refresh} />
        </Card>
      )}

      {(note.editable || note.journal) && (
        <Card>
          <JournalBox key={viewing} initial={note.journal} editable={note.editable} />
        </Card>
      )}

      <Card>
        <MonthCalendar
          month={month ?? monthOf(viewing)}
          today={today}
          selected={viewing}
          reloadKey={reloadKey}
          onMonth={setMonth}
          onSelect={goTo}
        />
      </Card>
    </div>
  )
}
