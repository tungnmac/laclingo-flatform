'use client'

import { useRef, useState } from 'react'
import { speechLang } from '@/features/course/components/LanguageCard'
import { useSpeechVoices } from '@/hooks/useSpeechVoices'
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
  const voiceURI = useVoiceSettings((s) => s.voiceByLang[languageId])

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
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = speechLang(languageId)
      const chosen = voiceURI ? voices.find((v) => v.voiceURI === voiceURI) : undefined
      if (chosen) utterance.voice = chosen
      utterance.onend = () => setPlaying(false)
      setPlaying(true)
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <button
      type="button"
      onClick={play}
      aria-label={`Phát âm "${text}"`}
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
