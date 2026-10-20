'use client'

import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import { dailyNoteService } from '../daily.service'
import { addMonths, monthCells } from '../dates'

/** Lịch tháng: mỗi ngày tô màu theo % việc hoàn thành; bấm để mở nhật ký ngày đó */
export function MonthCalendar({
  month,
  today,
  selected,
  reloadKey,
  onMonth,
  onSelect,
}: {
  month: string
  today: string
  selected: string
  reloadKey: number
  onMonth: (month: string) => void
  onSelect: (date: string) => void
}) {
  const t = useTranslation()
  const { data } = useApi(() => dailyNoteService.month(month), [month, reloadKey])
  const byDate = new Map((data ?? []).map((d) => [d.date, d]))

  const color = (date: string) => {
    const d = byDate.get(date)
    if (!d || d.total === 0) return 'bg-white text-slate-500'
    const r = d.completed / d.total
    return r >= 1 ? 'bg-emerald-500 text-white' : r >= 0.5 ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-100 text-amber-900'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">{t.daily.calendarTitle}</h2>
        <div className="flex items-center gap-2 text-sm">
          <button type="button" onClick={() => onMonth(addMonths(month, -1))} className="rounded px-2 py-1 hover:bg-slate-100" aria-label="prev month">
            ◀
          </button>
          <span className="font-medium tabular-nums">{month}</span>
          <button type="button" disabled={month >= today.slice(0, 7)} onClick={() => onMonth(addMonths(month, 1))} className="rounded px-2 py-1 hover:bg-slate-100 disabled:opacity-30" aria-label="next month">
            ▶
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {t.daily.weekdays.map((w) => (
          <span key={w} className="py-1 font-semibold text-slate-400">
            {w}
          </span>
        ))}
        {monthCells(month).map((date, i) =>
          date ? (
            <button
              key={date}
              type="button"
              disabled={date > today}
              onClick={() => onSelect(date)}
              className={cn(
                'aspect-square rounded-lg ring-1 ring-inset ring-slate-200 disabled:opacity-30',
                color(date),
                date === selected && 'ring-2 ring-indigo-600',
                date === today && 'font-bold',
              )}
            >
              {Number(date.slice(8))}
            </button>
          ) : (
            <span key={`blank-${i}`} />
          ),
        )}
      </div>
    </div>
  )
}
