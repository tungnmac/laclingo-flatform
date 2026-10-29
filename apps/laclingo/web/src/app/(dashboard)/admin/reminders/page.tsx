'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState, Spinner } from '@/components/ui/States'
import { useToast } from '@/components/ui/ToastProvider'
import { inputClass } from '@/features/auth/components/AuthForm'
import { ReminderScheduleFields } from '@/features/reminder/components/ReminderScheduleFields'
import { reminderService } from '@/features/reminder/reminder.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import type { ReminderSchedule } from '@/types/api'

/** Admin: lịch nhắc học mặc định — áp dụng cho học viên chưa tự chỉnh lịch. */
export default function AdminRemindersPage() {
  const t = useTranslation()
  const toast = useToast()
  const { data, error, loading, reload } = useApi(reminderService.getDefaults, [])
  const [form, setForm] = useState<ReminderSchedule | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    try {
      setForm(await reminderService.updateDefaults({ ...form, timezone: form.timezone.trim() }))
      toast(t.reminders.saved)
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title={t.adminReminders.pageTitle} description={t.adminReminders.pageDesc} />
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : form ? (
        <Card className="max-w-2xl">
          <form onSubmit={onSubmit} className="space-y-4">
            <ReminderScheduleFields value={form} onChange={setForm} disabled={saving} />
            <label className="block text-sm font-medium text-slate-700">
              {t.adminReminders.timezoneFieldLabel}
              <input
                type="text"
                required
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                disabled={saving}
                placeholder="Asia/Ho_Chi_Minh"
                className={inputClass}
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">{t.adminReminders.timezoneFieldHint}</span>
            </label>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? t.reminders.saving : t.reminders.saveBtn}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
    </>
  )
}
