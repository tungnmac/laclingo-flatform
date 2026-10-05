'use client'

import type { Deck } from '@/api/exerciseApi'
import { DeckCard } from './DeckCard'

interface Props {
  decks: Deck[]
  onDeckClick: (deck: Deck) => void
  onDeckDelete?: (id: string) => void
  emptyMessage?: string
}

export function DeckList({ decks, onDeckClick, onDeckDelete, emptyMessage = 'Chưa có bộ thẻ nào' }: Props) {
  if (decks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📚</div>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {decks.map((deck) => (
        <DeckCard
          key={deck.id}
          deck={deck}
          onClick={() => onDeckClick(deck)}
          onDelete={onDeckDelete}
        />
      ))}
    </div>
  )
}
