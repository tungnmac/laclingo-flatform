'use client'

import { useApi } from '@/hooks/useApi'
import {
  getUserDecks,
  createDeck,
  getDeck,
  updateDeck,
  deleteDeck,
  addVocabularyToDeck,
  removeVocabularyFromDeck,
} from '@/api/exerciseApi'
import type { Deck, CreateDeckData, UpdateDeckData } from '@/api/exerciseApi'

export function useDecks() {
  return useApi<Deck[]>(getUserDecks, [])
}

export function useDeck(id: string) {
  return useApi<Deck>(() => getDeck(id), [id])
}

export function useDeckMutations() {
  const handleCreate = async (data: CreateDeckData) => {
    return createDeck(data)
  }

  const handleUpdate = async (id: string, data: UpdateDeckData) => {
    return updateDeck(id, data)
  }

  const handleDelete = async (id: string) => {
    return deleteDeck(id)
  }

  const handleAddVocabulary = async (deckId: string, vocabId: string) => {
    return addVocabularyToDeck(deckId, vocabId)
  }

  const handleRemoveVocabulary = async (deckId: string, vocabId: string) => {
    return removeVocabularyFromDeck(deckId, vocabId)
  }

  return {
    createDeck: handleCreate,
    updateDeck: handleUpdate,
    deleteDeck: handleDelete,
    addVocabularyToDeck: handleAddVocabulary,
    removeVocabularyFromDeck: handleRemoveVocabulary,
  }
}
