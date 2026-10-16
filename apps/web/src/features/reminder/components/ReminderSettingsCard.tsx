'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState, Spinner } from '@/components/ui/States'
import { useToast } from '@/components/ui/ToastProvider'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import type { MyReminderSettings, ReminderSchedule } from '@/types/api'
import { browserTimezone, disablePush, enablePush, isPushSupported, syncPush } from '../push'
import { reminderService } from '../reminder.service'
import { ReminderScheduleFields } from './ReminderScheduleFields'

/** Thẻ "Nhắc học" ở trang Hồ sơ: bật/tắt web push trên thiết bị này + chỉnh lịch nhắc (hoặc theo mặc định admin). */
export function ReminderSettingsCard() {
  const t = useTranslation()
  const toast = useToast()
  const { data, error, loading, reload } = useApi(reminderService.getMine, [])
  const [form, setForm] = useState<ReminderSchedule | null>(null)
  const [onDevice, setOnDevice] = useState<boolean | null>(null) // null = đang kiểm tra
  const [busy, setBusy] = useState<'device' | 'test' | 'save' | 'reset' | null>(null)
  const supported = isPushSupported()

  useEffect(() => {
    if (data) setForm(data.settings)
  }, [data])

  // Trình duyệt đã có subscription thì gửi lại lên backend: gắn đúng user đang đăng
  // nhập (máy dùng chung) và cập nhật múi giờ — upsert nên gọi lại không sao.
  useEffect(() => {
    syncPush()
      .then((on) => {
        setOnDevice(on)
        if (on) reload()
      })
      .catch(() => setOnDevice(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const run = async (kind: NonNullable<typeof busy>, action: () => Promise<void>) => {
    setBusy(kind)
    try {
      await action()
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setBusy(null)
    }
  }

  const apply = (next: MyReminderSettings) => {
    reload()
    setForm(next.settings)
  }

  const toggleDevice = () =>
    run('device', async () => {
      if (onDevice) {
        await disablePush()
        setOnDevice(false)
      } else {
        if (!(await enablePush())) {
          toast(t.reminders.permissionDenied, 'error')
          return
        }
        setOnDevice(true)
      }
      reload()
    })

  const sendTest = () =>
    run('test', async () => {
      const { sent } = await reminderService.sendTest()
      toast(t.reminders.testSent(sent))
    })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form) return
    // Múi giờ luôn theo trình duyệt đang dùng — học viên không phải tự chọn
    void run('save', async () => {
      apply(await reminderService.updateMine({ ...form, timezone: browserTimezone() }))
      toast(t.reminders.saved)
    })
  }

  const reset = () =>
    run('reset', async () => {
      apply(await reminderService.resetMine())
      toast(t.reminders.resetDone)
    })

  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-900">{t.reminders.title}</h3>
      <p className="mt-1 text-sm text-slate-500">{t.reminders.desc}</p>

      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data && form ? (
        <div className="mt-4 space-y-4">
          {!data.push_configured ? (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{t.reminders.notConfigured}</p>
          ) : !supported ? (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{t.reminders.notSupported}</p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3">
              <div className="text-sm">
                <p className="font-medium text-slate-800">{onDevice ? t.reminders.enabledOnDevice : t.reminders.disabledOnDevice}</p>
                {data.subscription_count > 0 && <p className="text-xs text-slate-500">{t.reminders.deviceCount(data.subscription_count)}</p>}
              </div>
              <div className="flex gap-2">
                {data.subscription_count > 0 && (
                  <Button type="button" variant="ghost" size="sm" onClick={sendTest} disabled={busy !== null}>
                    {t.reminders.testBtn}
                  </Button>
                )}
                <Button
                  type="button"
                  variant={onDevice ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={toggleDevice}
                  disabled={busy !== null || onDevice === null}
                >
                  {onDevice ? t.reminders.disableBtn : t.reminders.enableBtn}
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium text-slate-700">{data.custom ? t.reminders.customized : t.reminders.followingDefault}</span>
              {data.custom && (
                <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={busy !== null}>
                  {t.reminders.resetBtn}
                </Button>
              )}
            </div>
            <ReminderScheduleFields value={form} onChange={setForm} disabled={busy !== null} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-400">{t.reminders.timezoneLabel(browserTimezone())}</span>
              <Button type="submit" disabled={busy !== null}>
                {busy === 'save' ? t.reminders.saving : t.reminders.saveBtn}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </Card>
  )
}
