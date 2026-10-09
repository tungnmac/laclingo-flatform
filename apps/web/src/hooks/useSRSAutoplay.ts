'use client'

import { useEffect, useRef } from 'react'
import { useSpeechVoices } from '@/hooks/useSpeechVoices'
import { MEANING_LANGUAGE_ID, speakText } from '@/lib/speech'
import { useVoiceSettings } from '@/store/voiceSettings'

/**
 * Tự động đọc 1 thẻ SRS: lặp đọc term `repeatCount` lần (cách nhau
 * gapSeconds) rồi TỰ LẬT thẻ — nếu shadowMode thì đọc thêm nghĩa 1 lần sau
 * khi lật. KHÔNG tự chấm điểm (grade) — việc tự đánh giá mức độ nhớ vẫn phải
 * do người học bấm, autoplay chỉ đọc + lật giúp.
 *
 * Effect khoá theo `cardId` (KHÔNG theo `flipped`) — nếu khoá theo flipped,
 * lúc chuỗi tự gọi onFlip() sẽ làm chính effect này bị re-run/cleanup NGAY
 * giữa lúc đang chờ đọc nghĩa (shadowMode), hủy luôn tiếng đọc nghĩa chưa kịp
 * phát. flippedRef đọc giá trị mới nhất tại thời điểm chạy, không qua dependency.
 */
export function useSRSAutoplay({
  enabled,
  cardId,
  term,
  meaning,
  languageId,
  flipped,
  onFlip,
  repeatCount,
  gapSeconds,
  shadowMode,
}: {
  enabled: boolean
  cardId: string
  term: string
  meaning: string
  languageId: string
  flipped: boolean
  onFlip: () => void
  repeatCount: number
  gapSeconds: number
  shadowMode: boolean
}) {
  const voices = useSpeechVoices()
  const voiceByLang = useVoiceSettings((s) => s.voiceByLang)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flippedRef = useRef(flipped)
  flippedRef.current = flipped

  useEffect(() => {
    if (!enabled || !cardId || flippedRef.current) return
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    let cancelled = false

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timerRef.current = setTimeout(resolve, ms)
      })

    const run = async () => {
      for (let i = 0; i < repeatCount; i++) {
        if (cancelled) return
        await speakText(term, languageId, voices, voiceByLang)
        if (cancelled) return
        await wait(gapSeconds * 1000)
      }
      if (cancelled) return
      // Có thể người học đã tự lật thẻ trong lúc đang lặp đọc — không lật lại
      // (flip là toggle, gọi lại sẽ lật NGƯỢC về mặt trước).
      if (!flippedRef.current) onFlip()
      if (shadowMode) {
        await wait(300)
        if (cancelled) return
        await speakText(meaning, MEANING_LANGUAGE_ID, voices, voiceByLang)
      }
    }

    const startTimer = setTimeout(run, 50)

    return () => {
      cancelled = true
      clearTimeout(startTimer)
      if (timerRef.current) clearTimeout(timerRef.current)
      window.speechSynthesis.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, cardId, repeatCount, gapSeconds, shadowMode])
}
