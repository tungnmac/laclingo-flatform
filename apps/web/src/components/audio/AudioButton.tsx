'use client'

import { useRef, useState } from 'react'
import { useSpeechVoices } from '@/hooks/useSpeechVoices'
import { useTranslation } from '@/hooks/useTranslation'
import { speakText } from '@/lib/speech'
import { cn } from '@/lib/utils'
import { useVoiceSettings } from '@/store/voiceSettings'

/**
 * Nút phát phát âm. Có audio_url thì phát file; không thì dùng Web Speech API
 * theo ngôn ngữ của từ — và theo giọng người dùng đã chọn ở trang Hồ sơ nếu có
 * (mặc định hệ thống nếu chưa chọn hoặc giọng đó không còn tồn tại trên máy).
 */
export function AudioButton({
  src,
  text,
  languageId = 'en',
  className,
}: {
  src?: string
  text: string
  languageId?: string
  className?: string
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const voices = useSpeechVoices()
  const voiceByLang = useVoiceSettings((s) => s.voiceByLang)
  const t = useTranslation()

  const play = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (src) {
      audioRef.current ??= new Audio(src)
      const audio = audioRef.current
      audio.onended = () => setPlaying(false)
      audio.currentTime = 0
      setPlaying(true)
      audio.play().catch(() => setPlaying(false))
      return
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Giọng user tự chọn ở Hồ sơ > giọng đầu tiên khớp ngôn ngữ trên máy —
      // không để trình duyệt tự đoán theo `lang`, vì 1 số trình duyệt (đặc
      // biệt Firefox) không tự khớp giọng được và sẽ im lặng hoàn toàn.
      // speakText tự thử lại/báo lỗi nếu trình duyệt không đọc được.
      setPlaying(true)
      void speakText(text, languageId, voices, voiceByLang, { interrupt: true }).finally(() => setPlaying(false))
    }
  }

  return (
    <button
      type="button"
      onClick={play}
      aria-label={t.common.audioAriaLabel(text)}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-lg text-indigo-700 transition hover:bg-indigo-100',
        playing && 'animate-pulse',
        className,
      )}
    >
      🔊
    </button>
  )
}
