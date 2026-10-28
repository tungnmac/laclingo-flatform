'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { isNativeApp } from '@/lib/native'
import { NativeSpeechRecognition, ensureSpeechPermission, nativeSpeechError } from '@/lib/nativeSpeech'

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

// App native (plugin @capgo/capacitor-speech-recognition): kết quả cuối tới qua 'partialResults' TRƯỚC 'stopped' → chốt
// khi nhận 'stopped'. iOS không tự dừng khi ngưng nói → nhắc lại câu thì tự dừng sau khoảng lặng. Android luôn dừng ở
// khoảng lặng đầu tiên → trả lời dài (continuous) thì chốt đoạn vừa nghe rồi nghe tiếp. Phòng plugin không báo
// 'stopped' sau stop() → tự chốt sau NATIVE_STOP_FALLBACK_MS; chưa nghe thấy gì sau NATIVE_NO_SPEECH_MS thì dừng.
const NATIVE_SILENCE_STOP_MS = 2000
const NATIVE_STOP_FALLBACK_MS = 2500
const NATIVE_NO_SPEECH_MS = 8000
const NATIVE_MAX_RESTARTS = 30

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
    let stopping = false // người dùng bấm dừng / hết khoảng lặng — không nghe tiếp nữa
    let restarts = 0
    const done = () => stale() || finished
    const finish = () => {
      if (done()) return
      finished = true
      clearNativeTimers()
      nativeFinish.current = null
      void NativeSpeechRecognition.removeAllListeners().catch(() => {})
      commitPending()
    }
    const later = (ms: number, fn: () => void) => nativeTimers.current.push(window.setTimeout(fn, ms))
    const stopAndFinish = () => {
      if (done() || stopping) return
      stopping = true
      void NativeSpeechRecognition.stop().catch(() => {}) // Android có bản stop() không resolve — không await
      later(NATIVE_STOP_FALLBACK_MS, finish)
    }
    nativeFinish.current = stopAndFinish
    // Lỗi sau khi người dùng đã bấm dừng (vd Android ERROR_CLIENT sau stopListening) không hiện cho người dùng
    const fail = (code: string, message: string) => {
      if (done()) return
      const mapped = stopping ? null : nativeSpeechError(code, message)
      if (mapped) setError(mapped)
      finish()
    }
    // Không dùng muteRecognizerBeep: plugin tắt tiếng thông báo / hệ thống của máy trong lúc khởi động lại
    const listen = () =>
      NativeSpeechRecognition.start({ language: lang, maxResults: 1, partialResults: true, popup: false }).catch(
        (e: unknown) => fail('', e instanceof Error ? e.message : String(e)),
      )

    try {
      const allowed = await ensureSpeechPermission()
      if (done()) return
      if (!allowed) return fail('PERMISSION', '')
      await NativeSpeechRecognition.removeAllListeners()
      if (done()) return
      let silenceTimer: number | undefined
      await NativeSpeechRecognition.addListener('partialResults', ({ matches }) => {
        if (done()) return
        const now = Date.now()
        if (!speechTimes.current.first) speechTimes.current.first = now
        speechTimes.current.last = now
        // matches[0] = cả câu của đoạn đang nghe (không cộng dồn như results của Web Speech)
        textRef.current = { ...textRef.current, pending: (matches?.[0] ?? '').trim() }
        setInterimText(textRef.current.pending)
        if (!continuous) {
          window.clearTimeout(silenceTimer)
          silenceTimer = window.setTimeout(stopAndFinish, NATIVE_SILENCE_STOP_MS)
          nativeTimers.current.push(silenceTimer)
        }
      })
      await NativeSpeechRecognition.addListener('error', ({ code, message }) => {
        if (done() || stopping) return
        const mapped = nativeSpeechError(code, message)
        if (mapped) setError(mapped) // plugin báo 'stopped' (reason error) ngay sau → chốt ở đó
      })
      await NativeSpeechRecognition.addListener('listeningState', ({ state, status, reason }) => {
        if (done() || (status ?? state) !== 'stopped') return
        if (continuous && !stopping && (reason === 'results' || reason === 'silence') && restarts < NATIVE_MAX_RESTARTS) {
          restarts++
          const { committed, pending } = textRef.current
          textRef.current = { committed: `${committed} ${pending}`.trim(), pending: '' }
          setFinalText(textRef.current.committed)
          setInterimText('')
          void listen()
          return
        }
        finish()
      })
      if (done()) return
      later(NATIVE_NO_SPEECH_MS, () => !speechTimes.current.first && stopAndFinish())
      await listen()
    } catch (e) {
      fail('', e instanceof Error ? e.message : String(e))
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
