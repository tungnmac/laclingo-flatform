'use client'

import { useCallback } from 'react'
import { useSpeechVoices } from '@/hooks/useSpeechVoices'
import { speakText } from '@/lib/speech'
import { useVoiceSettings } from '@/store/voiceSettings'

/** Trả về hàm đọc 1 câu bằng giọng người dùng đã chọn cho ngôn ngữ đó (Hồ sơ) */
export function useSpeak() {
  const voices = useSpeechVoices()
  const voiceByLang = useVoiceSettings((s) => s.voiceByLang)
  return useCallback(
    (text: string, languageId: string) => speakText(text, languageId, voices, voiceByLang, { interrupt: true }),
    [voices, voiceByLang],
  )
}
