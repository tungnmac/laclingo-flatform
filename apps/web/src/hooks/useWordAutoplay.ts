'use client'

import { useEffect, useRef } from 'react'
import { useSpeechVoices } from '@/hooks/useSpeechVoices'
import { canSpeak, speakText, stopSpeech } from '@/lib/speech'
import { useVoiceSettings } from '@/store/voiceSettings'

// Nghĩa từ vựng (vocabularies.meaning) chỉ có 1 bản tiếng Việt, KHÔNG dịch theo
// ngôn ngữ giao diện — phải đọc bằng giọng tiếng Việt (giọng "đọc nghĩa" chọn ở
// Hồ sơ, lưu ở voiceByLang.vi). Đọc theo locale giao diện thì giao diện tiếng Anh
// sẽ đọc "cô, dì, bác gái" bằng giọng Anh — nghe như bị bỏ qua.
const MEANING_LANGUAGE = 'vi'

interface QueueItem {
  text: string
  languageId: string
}

/**
 * Tự động đọc 1 từ theo chuỗi (lặp lại term `repeatCount` lần, cách nhau
 * `gapSeconds`; shadowMode: mỗi lần lặp đọc thêm nghĩa ngay sau term, tắt thì
 * đọc nghĩa 1 lần sau khi đọc xong các lần lặp) rồi gọi onAdvance() để sang từ
 * tiếp theo. Dừng/dọn sạch timer + hủy phát âm
 * đang chạy khi enabled=false, đổi từ, hoặc unmount — tránh đọc đè lên nhau.
 * pass: số vòng đọc cả danh sách — đổi pass thì đọc lại kể cả khi vẫn là từ cũ
 * (danh sách chỉ có 1 từ mà lặp lại). onAdvance luôn gọi bản mới nhất (ref) —
 * đổi cài đặt lặp / danh sách lọc giữa lúc đang đọc vẫn được áp dụng.
 */
export function useWordAutoplay({
  enabled,
  term,
  meaning,
  languageId,
  repeatCount,
  gapSeconds,
  shadowMode,
  pass = 0,
  onAdvance,
}: {
  enabled: boolean
  term: string
  meaning: string
  languageId: string
  repeatCount: number
  gapSeconds: number
  shadowMode: boolean
  pass?: number
  onAdvance: () => void
}) {
  const voices = useSpeechVoices()
  const voiceByLang = useVoiceSettings((s) => s.voiceByLang)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onAdvanceRef = useRef(onAdvance)
  onAdvanceRef.current = onAdvance

  useEffect(() => {
    if (!enabled || !term) return
    if (!canSpeak()) return

    const queue: QueueItem[] = []
    for (let i = 0; i < repeatCount; i++) {
      queue.push({ text: term, languageId })
      if (shadowMode && meaning) queue.push({ text: meaning, languageId: MEANING_LANGUAGE })
    }
    if (!shadowMode && meaning) queue.push({ text: meaning, languageId: MEANING_LANGUAGE })

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
      if (!cancelled) onAdvanceRef.current()
    }

    // speakText tự trễ 1 nhịp để né lỗi speak() ngay sau cancel() của Chrome
    void run()

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
      stopSpeech() // huỷ cả lời đang đọc lẫn lệnh đọc đang chờ phát của từ cũ
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, term, meaning, languageId, repeatCount, gapSeconds, shadowMode, pass])
}
