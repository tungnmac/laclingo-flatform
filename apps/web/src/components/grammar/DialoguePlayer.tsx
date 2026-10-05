'use client'

import { useState, useCallback } from 'react'
import type { Dialogue, DialogueLine } from '@/api/grammarApi'

interface Props {
  dialogue: Dialogue
  onClose?: () => void
}

const SPEAKER_STYLES: Record<string, { align: string; bg: string; text: string }> = {
  A: { align: 'justify-start', bg: 'bg-blue-100', text: 'text-blue-800' },
  B: { align: 'justify-end', bg: 'bg-green-100', text: 'text-green-800' },
}

export function DialoguePlayer({ dialogue, onClose }: Props) {
  const [currentLine, setCurrentLine] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAudioPlaying, setIsAudioPlaying] = useState<Record<number, boolean>>({})

  const lines = dialogue.lines ?? []
  const line = lines[currentLine]
  const isLastLine = currentLine === lines.length - 1
  const speakerStyle = SPEAKER_STYLES[line?.speaker ?? 'A'] ?? SPEAKER_STYLES['A']

  const handlePlayAudio = useCallback((lineIndex: number) => {
    const currentLineData = lines[lineIndex]
    if (!currentLineData?.audioUrl) return

    setIsAudioPlaying((prev) => ({ ...prev, [lineIndex]: true }))
    const audio = new Audio(currentLineData.audioUrl)
    audio.onended = () => {
      setIsAudioPlaying((prev) => ({ ...prev, [lineIndex]: false }))
    }
    audio.onerror = () => {
      setIsAudioPlaying((prev) => ({ ...prev, [lineIndex]: false }))
    }
    audio.play().catch(() => {
      setIsAudioPlaying((prev) => ({ ...prev, [lineIndex]: false }))
    })
  }, [lines])

  const handleNext = useCallback(() => {
    if (currentLine < lines.length - 1) {
      setCurrentLine((i) => i + 1)
    }
  }, [currentLine, lines.length])

  const handlePrev = useCallback(() => {
    if (currentLine > 0) {
      setCurrentLine((i) => i - 1)
    }
  }, [currentLine])

  const handlePlayAll = useCallback(() => {
    setIsPlaying(true)
    let idx = currentLine
    const playNext = () => {
      if (idx < lines.length) {
        setCurrentLine(idx)
        const currentLineData = lines[idx]
        if (currentLineData?.audioUrl) {
          setIsAudioPlaying((prev) => ({ ...prev, [idx]: true }))
          const audio = new Audio(currentLineData.audioUrl)
          audio.onended = () => {
            setIsAudioPlaying((prev) => ({ ...prev, [idx]: false }))
            idx++
            setTimeout(playNext, 500)
          }
          audio.onerror = () => {
            setIsAudioPlaying((prev) => ({ ...prev, [idx]: false }))
            idx++
            setTimeout(playNext, 500)
          }
          audio.play().catch(() => {
            setIsAudioPlaying((prev) => ({ ...prev, [idx]: false }))
            idx++
            setTimeout(playNext, 500)
          })
        } else {
          idx++
          setTimeout(playNext, 2000)
        }
      } else {
        setIsPlaying(false)
      }
    }
    playNext()
  }, [currentLine, lines])

  const handleStop = useCallback(() => {
    setIsPlaying(false)
    setIsAudioPlaying({})
  }, [])

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-white">{dialogue.title}</h4>
          {dialogue.description && (
            <p className="text-xs text-blue-100 mt-0.5">{dialogue.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayAll}
            disabled={isPlaying}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {isPlaying ? (
              <>
                <span className="w-4 h-4 flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-sm animate-pulse" />
                </span>
                Đang phát...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Phát tất cả
              </>
            )}
          </button>
          {isPlaying && (
            <button
              onClick={handleStop}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors"
            >
              Dừng
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Lines */}
      <div className="p-4 space-y-3 min-h-[200px]">
        {lines.map((l, i) => (
          <div
            key={l.id ?? i}
            className={`flex ${(SPEAKER_STYLES[l.speaker] ?? SPEAKER_STYLES['A']).align}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 transition-all ${
                i === currentLine
                  ? (SPEAKER_STYLES[l.speaker] ?? SPEAKER_STYLES['A']).bg
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold ${
                  (SPEAKER_STYLES[l.speaker] ?? SPEAKER_STYLES['A']).text
                }`}>
                  {l.speaker}
                </span>
                {l.audioUrl && (
                  <button
                    onClick={() => handlePlayAudio(i)}
                    disabled={isAudioPlaying[i]}
                    className="p-0.5 text-gray-400 hover:text-blue-500 disabled:text-blue-500 transition-colors"
                    title="Nghe phát âm"
                  >
                    {isAudioPlaying[i] ? (
                      <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 000 2h4a1 1 0 100-2H8zM8 11a1 1 0 011-1h4a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
              <p className="text-gray-900">{l.text}</p>
              {l.translation && (
                <p className="text-sm text-gray-500 mt-1">{l.translation}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentLine === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Trước
        </button>

        <div className="flex items-center gap-2">
          {lines.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentLine(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentLine ? 'bg-blue-500 w-4' : i < currentLine ? 'bg-blue-300' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {isLastLine ? (
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Hoàn thành
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Tiếp
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
