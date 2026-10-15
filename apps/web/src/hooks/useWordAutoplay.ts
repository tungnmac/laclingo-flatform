'use client'

import { useEffect, useRef } from 'react'
import { useSpeechVoices } from '@/hooks/useSpeechVoices'
import { speakText } from '@/lib/speech'
import { useLocale } from '@/store/locale'
import { useVoiceSettings } from '@/store/voiceSettings'

interface QueueItem {
  text: string
  languageId: string
}

/**
 * Tự động đọc 1 từ theo chuỗi (lặp lại term `repeatCount` lần, cách nhau
 * `gapSeconds`; nếu shadowMode thì mỗi lần lặp đọc thêm nghĩa ngay sau term)
 * rồi gọi onAdvance() để sang từ tiếp theo. Dừng/dọn sạch timer + hủy phát âm
 * đang chạy khi enabled=false, đổi từ, hoặc unmount — tránh đọc đè lên nhau.
 */
export function useWordAutoplay({
  enabled,
  term,
  meaning,
  languageId,
  repeatCount,
  gapSeconds,
  shadowMode,
  onAdvance,
}: {
  enabled: boolean
  term: string
  meaning: string
  languageId: string
  repeatCount: number
  gapSeconds: number
  shadowMode: boolean
  onAdvance: () => void
}) {
  const voices = useSpeechVoices()
  const voiceByLang = useVoiceSettings((s) => s.voiceByLang)
  // Nghĩa hiển thị theo ngôn ngữ giao diện hệ thống (vi/en/zh/ja/ko đang chọn
  // ở LanguageSwitcher), không cố định tiếng Việt — đọc nghĩa phải theo đúng
  // ngôn ngữ đó thì mới khớp giọng/phát âm.
  const locale = useLocale((s) => s.locale)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled || !term) return
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    const queue: QueueItem[] = []
    for (let i = 0; i < repeatCount; i++) {
      queue.push({ text: term, languageId })
      if (shadowMode && meaning) queue.push({ text: meaning, languageId: locale })
    }

    let cancelled = false

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timerRef.current = setTimeout(resolve, ms)
      })

    const run = async () => {
      for (const item of queue) {
        if (cancelled) return
        await speakText(item.text, item.languageId, voices, voiceByLang)
        if (cancelled) return
        await wait(gapSeconds * 1000)
      }
      if (!cancelled) onAdvance()
    }

    // Trình duyệt (đặc biệt Chrome) có bug: speak() ngay sau cancel() (từ lần
    // dọn dẹp trước, hoặc AudioButton vừa bấm) đôi khi bị nuốt mất — trễ 1 nhịp.
    const startTimer = setTimeout(run, 50)

    return () => {
      cancelled = true
      clearTimeout(startTimer)
      if (timerRef.current) clearTimeout(timerRef.current)
      window.speechSynthesis.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, term, meaning, languageId, repeatCount, gapSeconds, shadowMode, locale])
}
