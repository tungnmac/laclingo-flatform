'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { inputClass } from '@/features/auth/components/AuthForm'
import { courseService } from '@/features/course/course.service'
import { languageFlag, previewPhrase } from '@/features/course/components/LanguageCard'
import { useApi } from '@/hooks/useApi'
import { useLanguageName } from '@/hooks/useLanguageName'
import { useSpeechVoices } from '@/hooks/useSpeechVoices'
import { useTranslation } from '@/hooks/useTranslation'
import { speakText } from '@/lib/speech'
import { useVoiceSettings } from '@/store/voiceSettings'

/** Chọn giọng đọc Web Speech cho từng ngôn ngữ — lưu local (phụ thuộc giọng có sẵn trên máy/trình duyệt). */
export function VoiceSettingsCard() {
  const { data: languages } = useApi(courseService.list, [])
  const voices = useSpeechVoices()
  const voiceByLang = useVoiceSettings((s) => s.voiceByLang)
  const setVoice = useVoiceSettings((s) => s.setVoice)
  const t = useTranslation()
  const languageName = useLanguageName()

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
                {languageFlag(lang.id)} {lang.id === 'vi' ? lang.name : languageName(lang.id, lang.name)}
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
