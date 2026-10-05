'use client'

import type { Deck } from '@/api/exerciseApi'

interface Props {
  deck: Deck
  onClick: () => void
  onDelete?: (id: string) => void
}

export function DeckCard({ deck, onClick, onDelete }: Props) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div
        onClick={onClick}
        className="cursor-pointer"
      >
        <div className="flex items-start justify-between mb-2">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${deck.color}20` }}
          >
            {deck.icon}
          </div>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(deck.id)
              }}
              className="text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Delete deck"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
        <h3 className="font-semibold text-gray-900">{deck.name}</h3>
        {deck.description && (
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{deck.description}</p>
        )}
        <div className="mt-3 flex items-center gap-1 text-sm text-gray-500">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full" style={{ backgroundColor: `${deck.color}15` }}>
            {deck.vocabularyCount} từ
          </span>
        </div>
      </div>
    </div>
  )
}
