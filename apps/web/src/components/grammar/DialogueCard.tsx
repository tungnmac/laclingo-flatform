'use client'

import { useState } from 'react'
import type { Dialogue } from '@/api/grammarApi'

interface Props {
  dialogue: Dialogue
  isSelected?: boolean
  onClick?: () => void
  onPlay?: () => void
}

const DIFFICULTY_CONFIG = {
  easy: { label: 'Dễ', color: 'bg-green-100 text-green-700', bgHover: 'hover:bg-green-50' },
  medium: { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-700', bgHover: 'hover:bg-yellow-50' },
  hard: { label: 'Khó', color: 'bg-red-100 text-red-700', bgHover: 'hover:bg-red-50' },
} as const

export function DialogueCard({ dialogue, isSelected, onClick, onPlay }: Props) {
  const [imageLoaded, setImageLoaded] = useState(true)
  const diff = DIFFICULTY_CONFIG[dialogue.difficulty] ?? DIFFICULTY_CONFIG.easy
  const lineCount = dialogue.lines?.length ?? 0

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left rounded-xl p-4 transition-all duration-200
        bg-white shadow-sm border-2
        ${isSelected
          ? 'border-blue-500 ring-2 ring-blue-200'
          : 'border-transparent hover:border-gray-200'
        }
        ${diff.bgHover}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate pr-2">
            {dialogue.title}
          </h3>
          {dialogue.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {dialogue.description}
            </p>
          )}
        </div>
        <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${diff.color}`}>
          {diff.label}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{lineCount} dòng thoại</span>
        </div>

        {onPlay && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPlay()
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Nghe
          </button>
        )}
      </div>
    </button>
  )
}
