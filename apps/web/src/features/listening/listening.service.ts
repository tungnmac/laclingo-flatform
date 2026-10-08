import { apiFetch } from '@/lib/api'
import type { ListeningPassageDetail, ListeningPassageSummary, SubmitListeningAnswerResponse } from '@/types/api'

export const listeningService = {
  listPassages: (languageId: string) => apiFetch<ListeningPassageSummary[]>(`/languages/${encodeURIComponent(languageId)}/listening`),
  getPassage: (id: string) => apiFetch<ListeningPassageDetail>(`/listening/passages/${encodeURIComponent(id)}`),
  submitAnswer: (questionId: string, answer: string) =>
    apiFetch<SubmitListeningAnswerResponse>(`/listening/questions/${encodeURIComponent(questionId)}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    }),
}
