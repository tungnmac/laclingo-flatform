'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/** Nút phát phát âm; có audio_url thì phát file, không thì dùng Web Speech API */
export function AudioButton({ src, text, lang = 'en-US', className }: { src?: string; text: string; lang?: string; className?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

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
      utterance.lang = lang
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
