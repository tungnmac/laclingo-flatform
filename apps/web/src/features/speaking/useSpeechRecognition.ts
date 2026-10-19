'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Web Speech API chưa có trong lib.dom của TypeScript — khai báo phần đang dùng
interface RecognitionAlternative {
  transcript: string
}
interface RecognitionResult {
  isFinal: boolean
  0: RecognitionAlternative
}
interface RecognitionEvent {
  resultIndex: number
  results: { length: number; [i: number]: RecognitionResult }
}
interface Recognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: RecognitionEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}
type RecognitionCtor = new () => Recognition

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/**
 * Nhận diện giọng nói bằng Web Speech API (Chrome/Edge/Safari; Firefox chưa
 * hỗ trợ → supported = false, trang cho gõ câu trả lời thay thế). transcript
 * gồm phần đã chốt + phần đang nghe dở; durationMs = từ lúc nhận được lời nói
 * đầu tiên tới lời nói cuối cùng (không tính lúc khởi động micro và khoảng lặng
 * chờ tự dừng) — dùng tính tốc độ nói.
 */
export function useSpeechRecognition(lang: string) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [finalText, setFinalText] = useState('')
  const [interimText, setInterimText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [durationMs, setDurationMs] = useState(0)
  const recRef = useRef<Recognition | null>(null)
  const speechTimes = useRef({ first: 0, last: 0 })
  // Bản sao để onend đọc được giá trị mới nhất mà không cần updater có side effect
  const textRef = useRef({ committed: '', pending: '' })

  useEffect(() => setSupported(recognitionCtor() !== null), [])
  useEffect(() => () => recRef.current?.abort(), [])

  const start = useCallback(
    (continuous: boolean) => {
      const Ctor = recognitionCtor()
      if (!Ctor) return
      recRef.current?.abort()
      const rec = new Ctor()
      rec.lang = lang
      rec.continuous = continuous // câu trả lời dài: nghe tới khi bấm dừng; nhắc lại câu: tự dừng khi ngưng nói
      rec.interimResults = true
      textRef.current = { committed: '', pending: '' }
      setFinalText('')
      setInterimText('')
      setError(null)
      setDurationMs(0)
      rec.onresult = (e) => {
        const now = Date.now()
        if (!speechTimes.current.first) speechTimes.current.first = now
        speechTimes.current.last = now
        let committed = ''
        let pending = ''
        for (let i = 0; i < e.results.length; i++) {
          const r = e.results[i]
          if (r.isFinal) committed += r[0].transcript + ' '
          else pending += r[0].transcript
        }
        textRef.current = { committed: committed.trim(), pending: pending.trim() }
        setFinalText(textRef.current.committed)
        setInterimText(textRef.current.pending)
      }
      rec.onerror = (e) => {
        // no-speech/aborted: người dùng chưa nói hoặc tự bấm dừng — không coi là lỗi
        if (e.error !== 'no-speech' && e.error !== 'aborted') setError(e.error)
      }
      rec.onend = () => {
        setListening(false)
        const { first, last } = speechTimes.current
        setDurationMs(first ? last - first : 0)
        // Phần đang nghe dở lúc dừng vẫn được tính
        const { committed, pending } = textRef.current
        textRef.current = { committed: `${committed} ${pending}`.trim(), pending: '' }
        setFinalText(textRef.current.committed)
        setInterimText('')
      }
      recRef.current = rec
      speechTimes.current = { first: 0, last: 0 }
      setListening(true)
      try {
        rec.start()
      } catch {
        setListening(false)
        setError('start-failed')
      }
    },
    [lang],
  )

  const stop = useCallback(() => recRef.current?.stop(), [])

  const reset = useCallback(() => {
    recRef.current?.abort()
    textRef.current = { committed: '', pending: '' }
    setFinalText('')
    setInterimText('')
    setError(null)
    setDurationMs(0)
  }, [])

  const transcript = [finalText, interimText].filter(Boolean).join(' ')
  return { supported, listening, transcript, finalText, durationMs, error, start, stop, reset }
}
