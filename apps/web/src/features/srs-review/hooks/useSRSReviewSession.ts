'use client'

import { useCallback, useEffect, useState } from 'react'
import type { DueVocabulary, VocabularyPracticeResponse, VocabularyReviewResponse } from '@/types/api'
import {
  enqueueReview,
  isNetworkError,
  loadCards,
  markReviewed,
  newClientReviewId,
  pendingVocabularyIds,
  saveCards,
  syncOutbox,
  type QueuedReview,
} from '../offline'
import { srsService } from '../srs.service'

export interface ReviewResult {
  vocab: DueVocabulary
  quality: number
  /** Không có = ôn lúc mất mạng, đang chờ đồng bộ (chưa biết lịch ôn tiếp theo) */
  response?: VocabularyReviewResponse | VocabularyPracticeResponse
  mistakes?: number // chỉ có khi ôn bằng bộ bài luyện tập
}

/** Giống qualityFromMistakes ở backend (srs_service.go) — chỉ để hiện kết quả ôn offline trước khi đồng bộ */
function qualityFromMistakes(mistakes: number): number {
  return mistakes <= 0 ? 5 : mistakes === 1 ? 4 : mistakes === 2 ? 3 : 2
}

/** Quản lý một phiên ôn tập: tải thẻ đến hạn, lật thẻ, chấm điểm, chuyển thẻ */
/** deck: học lại cả 1 danh sách ôn tập (tối đa 100 từ) thay vì chỉ từ đến hạn */
/** Mất mạng: ôn bộ thẻ đã tải lần trước (offline = true), kết quả vào hàng đợi đồng bộ (xem ../offline) */
export function useSRSReviewSession(language?: string, deck?: string) {
  const [cards, setCards] = useState<DueVocabulary[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState<ReviewResult[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [offline, setOffline] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    // Từ đang chờ đồng bộ: server chưa biết nên vẫn trả là đến hạn → lọc khỏi bộ thẻ, không ôn lần 2. Đọc TRƯỚC khi
    // gửi hàng đợi (chạy ngầm, không chờ): từ nào gửi xong trước getDue thì server đã không trả, sau thì đã bị lọc
    const pendingIds = pendingVocabularyIds()
    void syncOutbox()
    srsService
      .getDue(deck ? 100 : 20, language, deck)
      .then(async (data) => {
        const pending = await pendingIds
        const due = data.filter((c) => !pending.has(c.vocabulary_id))
        void saveCards(due, language, deck)
        setOffline(false)
        return due
      })
      .catch(async (err) => {
        const cached = isNetworkError(err) ? await loadCards(language, deck) : null
        if (!cached) throw err
        setOffline(true)
        return cached
      })
      .then((data) => {
        setCards(data)
        setIndex(0)
        setFlipped(false)
        setResults([])
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [language, deck])

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

  // Tự động đọc lặp lại danh sách: quay về thẻ `from` (thẻ lúc bật tự động đọc —
  // không tải lại, không chấm điểm, không quay về các thẻ đã luyện trước đó)
  const restartPass = useCallback((from: number) => {
    setIndex(from)
    setFlipped(false)
  }, [])

  // Gửi 1 kết quả ôn kèm client_review_id (gửi lại không bị chấm 2 lần); online thì server tự lấy giờ của nó, mất mạng
  // → vào hàng đợi kèm lúc ôn thật (giờ máy), vẫn chuyển thẻ
  const submit = useCallback(
    async (item: QueuedReview, quality: number, mistakes?: number) => {
      if (!current || submitting) return
      setSubmitting(true)
      setError(null)
      try {
        let response: ReviewResult['response']
        try {
          const sent = { vocabulary_id: item.vocabulary_id, client_review_id: item.client_review_id }
          if (item.kind === 'practice') {
            response = await srsService.practice({ ...sent, mistakes: item.mistakes })
            quality = (response as VocabularyPracticeResponse).quality
          } else {
            response = await srsService.review({ ...sent, quality: item.quality })
          }
          void markReviewed(item.vocabulary_id, item.reviewed_at)
          setOffline(false)
        } catch (err) {
          if (!isNetworkError(err)) throw err
          await enqueueReview(item).catch(() => {
            throw err // không lưu được trên máy (trình duyệt chặn IndexedDB) → báo lỗi mạng như cũ
          })
          setOffline(true)
        }
        setResults((r) => [...r, { vocab: current, quality, response, mistakes }])
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

  const grade = useCallback(
    (quality: number) =>
      current &&
      submit(
        { kind: 'review', vocabulary_id: current.vocabulary_id, quality, reviewed_at: new Date().toISOString(), client_review_id: newClientReviewId() },
        quality,
      ),
    [current, submit],
  )

  // Hoàn thành bộ bài luyện tập của thẻ hiện tại — backend tự chấm SM-2 theo
  // số lỗi và +1 practice_count, rồi chuyển sang thẻ tiếp theo.
  const practice = useCallback(
    (mistakes: number) =>
      current &&
      submit(
        {
          kind: 'practice',
          vocabulary_id: current.vocabulary_id,
          mistakes,
          reviewed_at: new Date().toISOString(),
          client_review_id: newClientReviewId(),
        },
        qualityFromMistakes(mistakes),
        mistakes,
      ),
    [current, submit],
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
    offline,
    finished,
    flip,
    skip,
    restartPass,
    grade,
    practice,
    reload: load,
  }
}
