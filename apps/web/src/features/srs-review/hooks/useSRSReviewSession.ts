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
export function useSRSReviewSession(language?: string) {
  const [cards, setCards] = useState<DueVocabulary[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState<ReviewResult[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    srsService
      .getDue(20, language)
      .then((data) => {
        setCards(data)
        setIndex(0)
        setFlipped(false)
        setResults([])
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [language])

  useEffect(load, [load])

  const current = cards[index] as DueVocabulary | undefined
  const finished = !loading && cards.length > 0 && index >= cards.length

  const flip = useCallback(() => setFlipped((f) => !f), [])

  // Bỏ qua chấm điểm, chuyển thẻ tiếp theo — dùng khi tự động đọc (nghe lại
  // không phải tự kiểm tra bản thân) nên KHÔNG gọi API lưu kết quả, thẻ vẫn
  // giữ nguyên lịch ôn tập SRS như chưa được ôn trong phiên này.
  const skip = useCallback(() => {
    setIndex((i) => i + 1)
    setFlipped(false)
  }, [])

  const grade = useCallback(
    async (quality: number) => {
      if (!current || submitting) return
      setSubmitting(true)
      setError(null)
      try {
        const response = await srsService.review({ vocabulary_id: current.vocabulary_id, quality })
        setResults((r) => [...r, { vocab: current, quality, response }])
        setIndex((i) => i + 1)
        setFlipped(false)
      } catch (err) {
        setError(err as Error)
      } finally {
        setSubmitting(false)
      }
    },
    [current, submitting],
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
    skip,
    grade,
    reload: load,
  }
}
