'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState, Spinner } from '@/components/ui/States'
import { inputClass } from '@/features/auth/components/AuthForm'
import { courseService } from '@/features/course/course.service'
import { languageFlag, previewPhrase, speechLang } from '@/features/course/components/LanguageCard'
import { userService } from '@/features/user/user.service'
import { useApi } from '@/hooks/useApi'
import { useSpeechVoices } from '@/hooks/useSpeechVoices'
import { displayName, formatDate } from '@/lib/utils'
import { useSession } from '@/store/session'
import { useVoiceSettings } from '@/store/voiceSettings'

export default function ProfilePage() {
  const router = useRouter()
  const logout = useSession((s) => s.logout)
  const setUser = useSession((s) => s.setUser)
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
      setSaveMsg({ ok: true, text: 'Đã lưu thay đổi.' })
      reload()
    } catch (err) {
      setSaveMsg({ ok: false, text: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  const stats = [
    { label: 'Chuỗi ngày học', value: `🔥 ${user.streak_count}` },
    { label: 'Tham gia từ', value: formatDate(user.created_at) },
  ]

  return (
    <>
      <PageHeader title="Hồ sơ" />

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
            onClick={() => {
              logout()
              router.replace('/login')
            }}
          >
            Đăng xuất
          </Button>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {stats.map((s) => (
              <Card key={s.label}>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{s.value}</p>
              </Card>
            ))}
          </div>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900">Chỉnh sửa hồ sơ</h3>
            <form onSubmit={onSave} className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Họ tên
                <input name="full_name" type="text" maxLength={100} defaultValue={user.full_name} className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Ảnh đại diện (URL)
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
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </form>
          </Card>

          <VoiceSettingsCard />
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

  const preview = (languageId: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(previewPhrase(languageId))
    utterance.lang = speechLang(languageId)
    const chosen = voices.find((v) => v.voiceURI === voiceByLang[languageId])
    if (chosen) utterance.voice = chosen
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  if (!languages || languages.length === 0) return null

  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-900">🔊 Giọng đọc phát âm</h3>
      <p className="mt-1 text-sm text-slate-500">
        Chọn giọng Web Speech cho từng ngôn ngữ — danh sách phụ thuộc giọng đã cài trên máy/trình duyệt của bạn.
      </p>
      <div className="mt-4 space-y-3">
        {languages.map((lang) => {
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
                <option value="">Mặc định hệ thống</option>
                {matching.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
              <Button type="button" variant="secondary" size="sm" onClick={() => preview(lang.id)} disabled={matching.length === 0}>
                Nghe thử
              </Button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
