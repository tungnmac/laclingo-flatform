import { apiFetch } from '@/lib/api'
import type { DeckDetail, DeckRequest, DeckSummary } from '@/types/api'

const deckPath = (id: string) => `/decks/${encodeURIComponent(id)}`

export const deckService = {
  // vocabularyId: đánh dấu list nào đã chứa từ đó (contains_vocabulary)
  list: (vocabularyId?: string) =>
    apiFetch<DeckSummary[]>(`/decks${vocabularyId ? `?vocabulary_id=${encodeURIComponent(vocabularyId)}` : ''}`),
  get: (id: string) => apiFetch<DeckDetail>(deckPath(id)),
  create: (body: DeckRequest) => apiFetch<DeckSummary>('/decks', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: DeckRequest) => apiFetch<DeckSummary>(deckPath(id), { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => apiFetch<void>(deckPath(id), { method: 'DELETE' }),

  // Thêm từ vào list cũng đưa từ vào hàng đợi SRS (backend tự làm)
  addWord: (deckId: string, vocabularyId: string) =>
    apiFetch<void>(`${deckPath(deckId)}/vocabularies`, { method: 'POST', body: JSON.stringify({ vocabulary_id: vocabularyId }) }),
  // Chỉ gỡ khỏi list — tiến độ SRS của từ giữ nguyên
  removeWord: (deckId: string, vocabularyId: string) =>
    apiFetch<void>(`${deckPath(deckId)}/vocabularies/${encodeURIComponent(vocabularyId)}`, { method: 'DELETE' }),
}

/** Bảng màu cho list — khớp ràng buộc #rrggbb ở backend */
export const DECK_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#a855f7', '#64748b']
