'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { speechLang } from '@/features/course/components/LanguageCard'
import { useSpeechVoices } from '@/hooks/useSpeechVoices'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import { useSpeechSettings } from '@/store/speechSettings'
import { useVoiceSettings } from '@/store/voiceSettings'

const RATE_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2]

/** Tách script thành câu, giữ dấu câu lại với câu trước — hỗ trợ cả dấu câu
 * toàn chiều rộng (。！？) cho tiếng Trung, và xuống dòng như 1 ranh giới câu.
 * Dùng \s* (KHÔNG phải \s+) sau dấu câu — tiếng Trung không có dấu cách sau
 * dấu câu nên \s+ sẽ không bao giờ khớp, khiến cả đoạn bị coi là 1 câu duy nhất. */
function splitSentences(script: string): string[] {
  return script
    .split(/(?<=[.!?。！？])\s*|\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Phát + hiện văn bản bài luyện nghe, có setting tốc độ đọc (0.5x-2x, mặc
 * định 1x). Có audio thật (audioUrl) thì phát file đó + chỉnh tốc độ qua
 * playbackRate — KHÔNG highlight được vì không có dữ liệu đồng bộ theo câu
 * cho file ghi âm. Không có audio thì tự đọc từng câu bằng Web Speech (nối
 * tiếp utterance, không dùng onboundary vì hỗ trợ trình duyệt không đều),
 * tô sáng đúng câu đang đọc và cho bấm vào 1 câu để nhảy tới đọc từ đó.
 */
export function ScriptPlayer({ script, languageId, audioUrl }: { script: string; languageId: string; audioUrl?: string }) {
  const t = useTranslation()
  const sentences = useMemo(() => splitSentences(script), [script])
  const [showTranscript, setShowTranscript] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const voices = useSpeechVoices()
  const voiceURI = useVoiceSettings((s) => s.voiceByLang[languageId])
  const speechRate = useSpeechSettings((s) => s.speechRate)
  const setSpeechRate = useSpeechSettings((s) => s.setSpeechRate)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const stopRef = useRef(false)
  // Đọc rate mới nhất ngay khi đang đọc dở — đổi tốc độ giữa lúc đang phát thì
  // câu TIẾP THEO áp dụng ngay, không cần bấm Dừng/Nghe lại từ đầu.
  const speechRateRef = useRef(speechRate)
  speechRateRef.current = speechRate

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speechRate
  }, [speechRate])

  useEffect(
    () => () => {
      stopRef.current = true
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    },
    [],
  )

  const speakFrom = (startIndex: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    stopRef.current = false
    window.speechSynthesis.cancel()
    setPlaying(true)

    const speakOne = (i: number) => {
      if (stopRef.current || i >= sentences.length) {
        setPlaying(false)
        setCurrentIndex(null)
        return
      }
      setCurrentIndex(i)
      const utterance = new SpeechSynthesisUtterance(sentences[i])
      utterance.lang = speechLang(languageId)
      utterance.rate = speechRateRef.current
      const chosen =
        voices.find((v) => v.voiceURI === voiceURI) ?? voices.find((v) => v.lang.toLowerCase().startsWith(languageId.toLowerCase()))
      if (chosen) utterance.voice = chosen
      utterance.onend = () => speakOne(i + 1)
      utterance.onerror = () => speakOne(i + 1)
      window.speechSynthesis.speak(utterance)
    }
    // Trình duyệt (đặc biệt Chrome) có bug: speak() ngay sau cancel() đôi khi bị nuốt mất.
    setTimeout(() => speakOne(startIndex), 50)
  }

  const stop = () => {
    stopRef.current = true
    window.speechSynthesis.cancel()
    setPlaying(false)
    setCurrentIndex(null)
  }

  const onClickSentence = (i: number) => {
    if (audioUrl) return
    speakFrom(i)
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {audioUrl ? (
        <audio
          ref={audioRef}
          controls
          src={audioUrl}
          onLoadedMetadata={(e) => {
            e.currentTarget.playbackRate = speechRate
          }}
          className="w-full max-w-sm"
        />
      ) : (
        <Button size="lg" onClick={() => (playing ? stop() : speakFrom(0))} disabled={sentences.length === 0}>
          {playing ? `⏹ ${t.listening.stopBtn}` : `▶️ ${t.listening.playBtn}`}
        </Button>
      )}

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <span className="text-xs font-medium text-slate-500">{t.listening.speedLabel}:</span>
        {RATE_PRESETS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setSpeechRate(r)}
            aria-pressed={speechRate === r}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset transition',
              speechRate === r ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50',
            )}
          >
            {r}x
          </button>
        ))}
      </div>

      <p className="text-sm text-slate-500">{t.listening.audioHint}</p>
      <Button variant="ghost" size="sm" onClick={() => setShowTranscript((v) => !v)}>
        {showTranscript ? t.listening.hideTranscript : t.listening.showTranscript}
      </Button>

      {showTranscript && (
        <p className="rounded-xl bg-slate-50 p-3 text-left text-sm leading-relaxed text-slate-700">
          {sentences.map((sentence, i) => (
            <span
              key={i}
              onClick={() => onClickSentence(i)}
              className={cn(
                'rounded px-0.5 transition',
                !audioUrl && 'cursor-pointer hover:bg-indigo-50',
                currentIndex === i && 'bg-amber-200 text-slate-900',
              )}
            >
              {sentence}{' '}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
