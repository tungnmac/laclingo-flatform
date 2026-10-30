'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { ReminderSettingsCard } from '@/features/reminder/components/ReminderSettingsCard'
import { SecuritySettingsCard } from '@/features/settings/components/SecuritySettingsCard'
import { ThemeSettingsCard } from '@/features/settings/components/ThemeSettingsCard'
import { VoiceSettingsCard } from '@/features/settings/components/VoiceSettingsCard'
import { useTranslation } from '@/hooks/useTranslation'

/** Cài đặt: tông màu chủ đạo (theo tài khoản), nhắc học, giọng đọc phát âm (theo máy), đăng xuất mọi thiết bị */
export default function SettingsPage() {
  const t = useTranslation()
  return (
    <>
      <PageHeader title={t.settings.title} />
      <div className="mx-auto max-w-3xl space-y-4">
        <ThemeSettingsCard />
        <ReminderSettingsCard />
        <VoiceSettingsCard />
        <SecuritySettingsCard />
      </div>
    </>
  )
}
