'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { isNativeApp } from '@/lib/native'
import { NativeSpeechRecognition, ensureSpeechPermission } from '@/lib/nativeSpeech'

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

// App native (plugin speech-recognition): Android báo 'stopped' TRƯỚC khi gửi kết quả cuối → chờ thêm chút rồi mới chốt;
// iOS không tự dừng khi ngưng nói → nhắc lại câu thì tự dừng sau khoảng lặng; lỗi giữa chừng (vd không nghe thấy gì)
// Android không báo về → giới hạn thời gian chờ lời nói đầu tiên.
const NATIVE_FINAL_GRACE_MS = 700
const NATIVE_SILENCE_STOP_MS = 2000
const NATIVE_NO_SPEECH_MS = 8000
// Lỗi = người dùng chưa nói / tự dừng — không coi là lỗi (Android: getErrorText, iOS: "No speech detected"…)
const NATIVE_IGNORED_ERRORS = /no match|no speech|speech timeout|didn.t understand|cancel/i

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
  // App native: mỗi lần bắt đầu nghe tăng run — sự kiện của lần nghe cũ bị bỏ qua; finish() chốt kết quả lần đang chạy
  const nativeRun = useRef(0)
  const nativeTimers = useRef<number[]>([])
  const nativeFinish = useRef<(() => void) | null>(null)

  const clearNativeTimers = () => {
    nativeTimers.current.forEach((id) => window.clearTimeout(id))
    nativeTimers.current = []
  }

  useEffect(() => {
    if (!isNativeApp()) return setSupported(recognitionCtor() !== null)
    NativeSpeechRecognition.available()
      .then((r) => setSupported(r.available))
      .catch(() => setSupported(false))
  }, [])
  useEffect(
    () => () => {
      recRef.current?.abort()
      if (!isNativeApp()) return
      nativeRun.current++
      clearNativeTimers()
      void NativeSpeechRecognition.stop().catch(() => {})
      void NativeSpeechRecognition.removeAllListeners().catch(() => {})
    },
    [],
  )

  // Chốt phần đang nghe dở thành kết quả (như onend của Web Speech)
  const commitPending = () => {
    setListening(false)
    const { first, last } = speechTimes.current
    setDurationMs(first ? last - first : 0)
    const { committed, pending } = textRef.current
    textRef.current = { committed: `${committed} ${pending}`.trim(), pending: '' }
    setFinalText(textRef.current.committed)
    setInterimText('')
  }

  const startNative = async (continuous: boolean) => {
    const run = ++nativeRun.current
    const stale = () => nativeRun.current !== run
    clearNativeTimers()
    textRef.current = { committed: '', pending: '' }
    speechTimes.current = { first: 0, last: 0 }
    setFinalText('')
    setInterimText('')
    setError(null)
    setDurationMs(0)
    setListening(true)

    let finished = false
    const finish = () => {
      if (finished || stale()) return
      finished = true
      clearNativeTimers()
      nativeFinish.current = null
      void NativeSpeechRecognition.removeAllListeners().catch(() => {})
      commitPending()
    }
    const later = (ms: number, fn: () => void) => nativeTimers.current.push(window.setTimeout(fn, ms))
    const stopAndFinish = () => {
      void NativeSpeechRecognition.stop().catch(() => {})
      later(NATIVE_FINAL_GRACE_MS, finish)
    }
    nativeFinish.current = stopAndFinish

    try {
      if (!(await ensureSpeechPermission())) {
        if (stale()) return
        nativeFinish.current = null
        setListening(false)
        setError('app-not-allowed')
        return
      }
      if (stale()) return
      await NativeSpeechRecognition.removeAllListeners()
      let silenceTimer: number | undefined
      await NativeSpeechRecognition.addListener('partialResults', ({ matches }) => {
        if (stale() || finished) return
        const now = Date.now()
        if (!speechTimes.current.first) speechTimes.current.first = now
        speechTimes.current.last = now
        // matches[0] = toàn bộ câu đang nghe (không cộng dồn như results của Web Speech)
        textRef.current = { committed: '', pending: (matches[0] ?? '').trim() }
        setInterimText(textRef.current.pending)
        if (!continuous) {
          window.clearTimeout(silenceTimer)
          silenceTimer = window.setTimeout(stopAndFinish, NATIVE_SILENCE_STOP_MS)
          nativeTimers.current.push(silenceTimer)
        }
      })
      await NativeSpeechRecognition.addListener('listeningState', ({ status }) => {
        if (status === 'stopped' && !stale()) later(NATIVE_FINAL_GRACE_MS, finish)
      })
      if (stale()) return
      later(NATIVE_NO_SPEECH_MS, () => !speechTimes.current.first && stopAndFinish())
      const res = await NativeSpeechRecognition.start({ language: lang, maxResults: 1, partialResults: true, popup: false })
      // Bản không có partialResults trả kết quả ngay trong start()
      if (!stale() && !finished && res?.matches?.[0]) textRef.current = { committed: '', pending: res.matches[0].trim() }
    } catch (e) {
      if (stale()) return
      const message = e instanceof Error ? e.message : String(e)
      if (!NATIVE_IGNORED_ERRORS.test(message)) setError(message || 'start-failed')
      finish()
    }
  }

  const start = useCallback(
    (continuous: boolean) => {
      if (isNativeApp()) return void startNative(continuous)
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
      // Phần đang nghe dở lúc dừng vẫn được tính
      rec.onend = commitPending
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- startNative / commitPending chỉ đọc ref + setState
    [lang],
  )

  const stop = useCallback(() => {
    if (isNativeApp()) return nativeFinish.current?.()
    recRef.current?.stop()
  }, [])

  const reset = useCallback(() => {
    recRef.current?.abort()
    if (isNativeApp()) {
      nativeRun.current++
      nativeFinish.current = null
      clearNativeTimers()
      setListening(false)
      void NativeSpeechRecognition.stop().catch(() => {})
      void NativeSpeechRecognition.removeAllListeners().catch(() => {})
    }
    textRef.current = { committed: '', pending: '' }
    setFinalText('')
    setInterimText('')
    setError(null)
    setDurationMs(0)
  }, [])

  const transcript = [finalText, interimText].filter(Boolean).join(' ')
  return { supported, listening, transcript, finalText, durationMs, error, start, stop, reset }
}
