'use client'

import { useCallback, useEffect, useState } from 'react'
import type { DueVocabulary, VocabularyReviewResponse } from '@/types/api'
import { srsService } from '../srs.service'

export interface ReviewResult {
  vocab: DueVocabulary
  quality: number
  response: VocabularyReviewResponse
}

/** Quản lý một phiên ôn tập: tải thẻ đến hạn, lật thẻ, chấm điểm, chuyển thẻ */
export function useSRSReviewSession(userId: string | undefined) {
  const [cards, setCards] = useState<DueVocabulary[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState<ReviewResult[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    srsService
      .getDue(userId)
      .then((data) => {
        setCards(data)
        setIndex(0)
        setFlipped(false)
        setResults([])
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [userId])

  useEffect(load, [load])

  const current = cards[index] as DueVocabulary | undefined
  const finished = !loading && cards.length > 0 && index >= cards.length

  const flip = useCallback(() => setFlipped((f) => !f), [])

  const grade = useCallback(
    async (quality: number) => {
      if (!userId || !current || submitting) return
      setSubmitting(true)
      setError(null)
      try {
        const response = await srsService.review({ user_id: userId, vocabulary_id: current.vocabulary_id, quality })
        setResults((r) => [...r, { vocab: current, quality, response }])
        setIndex((i) => i + 1)
        setFlipped(false)
      } catch (err) {
        setError(err as Error)
      } finally {
        setSubmitting(false)
      }
    },
    [userId, current, submitting],
  )

  return {
    cards,
    current,
    index,
    flipped,
    results,
    loading,
    submitting,
    error,
    finished,
    flip,
    grade,
    reload: load,
  }
}
