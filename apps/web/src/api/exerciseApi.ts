import { apiFetch } from '@/lib/api'

export interface ExerciseType {
  id: string
  name: string
  description: string
  icon: string
}

export interface UserProgress {
  totalXp: number
  level: number
  streak: number
  completedLessons: number
  totalLessons: number
}

export interface ExerciseStats {
  totalExercises: number
  correctAnswers: number
  averageScore: number
  timeSpentMinutes: number
}

export interface Deck {
  id: string
  name: string
  description?: string
  color: string
  icon: string
  vocabularyCount: number
}

export interface CreateDeckData {
  name: string
  description?: string
  color?: string
  icon?: string
}

export interface UpdateDeckData {
  name?: string
  description?: string
  color?: string
  icon?: string
}

export const getExerciseTypes = async (): Promise<ExerciseType[]> => {
  return apiFetch<ExerciseType[]>('/exercise-types')
}

export const getUserDecks = async (): Promise<Deck[]> => {
  return apiFetch<Deck[]>('/decks')
}

export const createDeck = async (data: CreateDeckData): Promise<Deck> => {
  return apiFetch<Deck>('/decks', { method: 'POST', body: JSON.stringify(data) })
}

export const getDeck = async (id: string): Promise<Deck> => {
  return apiFetch<Deck>(`/decks/${id}`)
}

export const updateDeck = async (id: string, data: UpdateDeckData): Promise<Deck> => {
  return apiFetch<Deck>(`/decks/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export const deleteDeck = async (id: string): Promise<void> => {
  return apiFetch<void>(`/decks/${id}`, { method: 'DELETE' })
}

export const addVocabularyToDeck = async (deckId: string, vocabId: string): Promise<void> => {
  return apiFetch<void>(`/decks/${deckId}/vocabulary`, { method: 'POST', body: JSON.stringify({ vocabId }) })
}

export const removeVocabularyFromDeck = async (deckId: string, vocabId: string): Promise<void> => {
  return apiFetch<void>(`/decks/${deckId}/vocabulary/${vocabId}`, { method: 'DELETE' })
}

export const getUserProgress = async (): Promise<UserProgress> => {
  return apiFetch<UserProgress>('/progress')
}

export const getExerciseStats = async (): Promise<ExerciseStats> => {
  return apiFetch<ExerciseStats>('/progress/stats')
}
