import { inputClass } from '@/features/auth/components/AuthForm'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import type { ReminderSchedule } from '@/types/api'

const ISO_DAYS = [1, 2, 3, 4, 5, 6, 7]
const checkboxClass = 'h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600'

/** Các ô chỉnh 1 lịch nhắc — dùng chung cho thẻ Nhắc học (học viên) và trang admin (lịch mặc định). */
export function ReminderScheduleFields({
  value,
  onChange,
  disabled = false,
}: {
  value: ReminderSchedule
  onChange: (next: ReminderSchedule) => void
  disabled?: boolean
}) {
  const t = useTranslation()
  const set = (patch: Partial<ReminderSchedule>) => onChange({ ...value, ...patch })
  const toggleDay = (day: number) =>
    set({ days_of_week: value.days_of_week.includes(day) ? value.days_of_week.filter((d) => d !== day) : [...value.days_of_week, day] })

  return (
    <fieldset disabled={disabled} className="space-y-4">
      <div className="space-y-3 rounded-xl border border-slate-200 p-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <input type="checkbox" checked={value.daily_enabled} onChange={(e) => set({ daily_enabled: e.target.checked })} className={checkboxClass} />
          {t.reminders.dailyLabel}
        </label>
        <p className="text-xs text-slate-500">{t.reminders.dailyHint}</p>
        <div className={cn('flex flex-wrap items-end gap-4', !value.daily_enabled && 'opacity-50')}>
          <label className="block text-sm font-medium text-slate-700">
            {t.reminders.timeLabel}
            <input
              type="time"
              required
              value={value.remind_time}
              onChange={(e) => set({ remind_time: e.target.value })}
              className={cn(inputClass, 'w-32')}
            />
          </label>
          <div>
            <span className="block text-sm font-medium text-slate-700">{t.reminders.daysLabel}</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {ISO_DAYS.map((day) => {
                const on = value.days_of_week.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleDay(day)}
                    disabled={!value.daily_enabled}
                    className={cn(
                      'min-w-10 rounded-lg px-2 py-1.5 text-sm font-semibold ring-1 ring-inset transition',
                      on ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-600 ring-slate-300 hover:bg-indigo-50',
                    )}
                  >
                    {t.reminders.dayNames[day - 1]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 p-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <input
            type="checkbox"
            checked={value.inactive_enabled}
            onChange={(e) => set({ inactive_enabled: e.target.checked })}
            className={checkboxClass}
          />
          {t.reminders.inactiveLabel}
        </label>
        <p className="text-xs text-slate-500">{t.reminders.inactiveHint}</p>
        <label className={cn('block text-sm font-medium text-slate-700', !value.inactive_enabled && 'opacity-50')}>
          {t.reminders.inactiveDaysLabel}
          <input
            type="number"
            min={1}
            max={30}
            required
            value={value.inactive_days}
            onChange={(e) => set({ inactive_days: Number(e.target.value) })}
            disabled={!value.inactive_enabled}
            className={cn(inputClass, 'w-24')}
          />
        </label>
      </div>
    </fieldset>
  )
}
