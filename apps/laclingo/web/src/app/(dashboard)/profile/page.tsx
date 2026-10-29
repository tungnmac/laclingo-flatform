'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState, Spinner } from '@/components/ui/States'
import { inputClass } from '@/features/auth/components/AuthForm'
import { courseService } from '@/features/course/course.service'
import { languageFlag, previewPhrase } from '@/features/course/components/LanguageCard'
import { AccountList, signOutCurrent } from '@/features/auth/components/AccountList'
import { PlanSummary } from '@/features/billing/components/PlanSummary'
import { ReminderSettingsCard } from '@/features/reminder/components/ReminderSettingsCard'
import { BlockedUsersCard } from '@/features/moderation/components/BlockedUsersCard'
import { DeleteAccountCard } from '@/features/user/components/DeleteAccountCard'
import { userService } from '@/features/user/user.service'
import { useApi } from '@/hooks/useApi'
import { useSpeechVoices } from '@/hooks/useSpeechVoices'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import { expForLevel } from '@/lib/leveling'
import { speakText } from '@/lib/speech'
import { displayName, formatDate } from '@/lib/utils'
import { useSession } from '@/store/session'
import { useVoiceSettings } from '@/store/voiceSettings'

export default function ProfilePage() {
  const setUser = useSession((s) => s.setUser)
  const t = useTranslation()
  const { data: user, error, loading, reload } = useApi(userService.me, [])

  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null)

  if (loading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!user) return null

  const onSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setSaving(true)
    setSaveMsg(null)
    try {
      const updated = await userService.updateMe({
        full_name: String(form.get('full_name') ?? ''),
        avatar_url: String(form.get('avatar_url') ?? ''),
      })
      setUser(updated) // đồng bộ lại sidebar/header
      setSaveMsg({ ok: true, text: t.profile.saved })
      reload()
    } catch (err) {
      setSaveMsg({ ok: false, text: inlineError(err) })
    } finally {
      setSaving(false)
    }
  }

  const stats = [
    { label: t.profile.streak, value: `🔥 ${user.streak_count}` },
    { label: t.profile.challengePoints, value: `🏆 ${user.points}` },
    { label: t.profile.joinedAt, value: formatDate(user.created_at) },
  ]

  const currentLevelExp = expForLevel(user.level)
  const nextLevelExp = expForLevel(user.level + 1)
  const levelPercent =
    nextLevelExp === currentLevelExp
      ? 100
      : Math.min(100, Math.round(((user.exp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100))

  return (
    <>
      <PageHeader title={t.profile.title} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-3 self-start text-center">
          <Avatar name={displayName(user)} src={user.avatar_url || undefined} className="h-24 w-24 text-2xl" />
          <div className="min-w-0 max-w-full">
            <h2 className="truncate text-xl font-bold text-slate-900">{displayName(user)}</h2>
            <p className="truncate text-sm text-slate-500">{user.email}</p>
          </div>
          <Button
            variant="secondary"
            className="mt-2 w-full"
            onClick={signOutCurrent}
          >
            {t.profile.logout}
          </Button>
          <div className="mt-2 w-full border-t border-slate-100 pt-3 text-left lg:hidden">
            <AccountList />
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <PlanSummary />
          <Card className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-900">{t.onboarding.profileSetup}</h2>
              <p className="text-sm text-slate-500">{t.onboarding.profileSetupHint}</p>
            </div>
            <Link href="/onboarding" className="shrink-0 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">
              {t.onboarding.next} ›
            </Link>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{t.profile.level}</p>
              <p className="text-sm font-semibold text-slate-700">
                {user.exp}/{nextLevelExp} EXP
              </p>
            </div>
            <p className="mt-1 text-2xl font-bold text-indigo-600">⭐ Level {user.level}</p>
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${levelPercent}%` }}
              />
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.map((s) => (
              <Card key={s.label}>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{s.value}</p>
              </Card>
            ))}
          </div>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900">{t.profile.editProfile}</h3>
            <form onSubmit={onSave} className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                {t.profile.fullNameLabel}
                <input name="full_name" type="text" maxLength={100} defaultValue={user.full_name} className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                {t.profile.avatarUrlLabel}
                <input
                  name="avatar_url"
                  type="url"
                  defaultValue={user.avatar_url}
                  placeholder="https://..."
                  className={inputClass}
                />
              </label>

              {saveMsg && (
                <p
                  role="alert"
                  className={
                    saveMsg.ok
                      ? 'rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200'
                      : 'rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200'
                  }
                >
                  {saveMsg.text}
                </p>
              )}

              <Button type="submit" disabled={saving}>
                {saving ? t.profile.saving : t.profile.save}
              </Button>
            </form>
          </Card>

          <ReminderSettingsCard />

          <VoiceSettingsCard />

          <BlockedUsersCard />

          <DeleteAccountCard user={user} />

          <p className="text-center text-sm">
            <Link href="/privacy" className="text-slate-500 underline-offset-2 hover:text-indigo-600 hover:underline">
              {t.accounts.privacy}
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}

/** Chọn giọng đọc Web Speech cho từng ngôn ngữ — lưu local (phụ thuộc giọng có sẵn trên máy/trình duyệt). */
function VoiceSettingsCard() {
  const { data: languages } = useApi(courseService.list, [])
  const voices = useSpeechVoices()
  const voiceByLang = useVoiceSettings((s) => s.voiceByLang)
  const setVoice = useVoiceSettings((s) => s.setVoice)
  const t = useTranslation()

  const preview = (languageId: string) => {
    void speakText(previewPhrase(languageId), languageId, voices, voiceByLang, { interrupt: true })
  }

  // Giọng đọc nghĩa (tiếng Việt) LUÔN hiện sẵn, không phụ thuộc danh sách
  // ngôn ngữ khoá học — "vi" không phải 1 ngôn ngữ để học, chỉ dùng để đọc
  // nghĩa ở phần ôn tập (xem src/hooks/useWordAutoplay.ts), nên courseService
  // không trả về nó. Ghép thêm thủ công vào đầu danh sách.
  const rows = [{ id: 'vi', name: t.profile.meaningVoiceLabel }, ...(languages ?? []).filter((l) => l.id !== 'vi')]

  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-900">{t.profile.voiceSettingsTitle}</h3>
      <p className="mt-1 text-sm text-slate-500">{t.profile.voiceSettingsDesc}</p>
      <div className="mt-4 space-y-3">
        {rows.map((lang) => {
          const matching = voices.filter((v) => v.lang.toLowerCase().startsWith(lang.id.toLowerCase()))
          return (
            <div key={lang.id} className="flex flex-wrap items-center gap-2">
              <span className="w-28 shrink-0 text-sm font-medium text-slate-700">
                {languageFlag(lang.id)} {lang.name}
              </span>
              <select
                value={voiceByLang[lang.id] ?? ''}
                onChange={(e) => setVoice(lang.id, e.target.value)}
                className={`${inputClass} mt-0 min-w-0 flex-1`}
              >
                <option value="">{t.profile.systemDefault}</option>
                {matching.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
              <Button type="button" variant="secondary" size="sm" onClick={() => preview(lang.id)} disabled={matching.length === 0}>
                {t.profile.preview}
              </Button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
