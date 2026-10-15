'use client'

import { useState } from 'react'
import { AudioButton } from '@/components/audio/AudioButton'
import { Card } from '@/components/ui/Card'
import { LevelBadge } from '@/features/grammar/components/LevelBadge'
import { srsService } from '@/features/srs-review/srs.service'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import type { VocabularyCard } from '@/types/api'
import { vocabularyService } from '../vocabulary.service'

type Action = 'like' | 'favorite' | 'review'

/**
 * Thẻ một từ vựng: ảnh/emoji minh họa, phát âm, nghĩa, câu mẫu và các nút
 * Like / Yêu thích / Thêm vào ôn tập. Gọi API xong thì báo phần thay đổi lên
 * cha qua onChange để danh sách giữ trạng thái khi chuyển từ.
 */
export function WordCard({
  word,
  onChange,
  compact = false,
}: {
  word: VocabularyCard
  onChange: (patch: Partial<VocabularyCard>) => void
  compact?: boolean
}) {
  const [pending, setPending] = useState<Action | null>(null)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslation()

  const run = async (action: Action, call: () => Promise<Partial<VocabularyCard>>) => {
    if (pending) return
    setPending(action)
    setError(null)
    try {
      onChange(await call())
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setPending(null)
    }
  }

  const toggleLike = () =>
    run('like', async () => {
      const res = await vocabularyService.setLike(word.vocabulary_id, !word.liked)
      return { liked: res.liked, like_count: res.like_count }
    })

  const toggleFavorite = () =>
    run('favorite', async () => {
      const res = await vocabularyService.setFavorite(word.vocabulary_id, !word.favorited)
      return { favorited: res.favorited }
    })

  const addToReview = () =>
    run('review', async () => {
      await srsService.learn(word.vocabulary_id)
      return { in_review: true }
    })

  return (
    <Card className={cn('flex w-full flex-col items-center gap-3 text-center', compact ? 'py-6' : 'py-8')}>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
          {word.topic}
        </span>
        <LevelBadge level={word.level} />
      </div>

      {word.image_url ? (
        <img
          src={word.image_url}
          alt={word.term}
          className={cn('rounded-2xl object-cover', compact ? 'h-20 w-20' : 'h-36 w-36')}
        />
      ) : (
        <span aria-hidden className={cn('leading-none', compact ? 'text-6xl' : 'text-8xl')}>
          {word.image_emoji || '📘'}
        </span>
      )}

      <h2 className={cn('break-words font-bold text-slate-900', compact ? 'text-2xl' : 'text-4xl sm:text-5xl')}>
        {word.term}
      </h2>
      {word.phonetic && <p className="text-slate-500">/{word.phonetic}/</p>}
      <AudioButton src={word.audio_url || undefined} text={word.term} languageId={word.language_id} />

      <p className={cn('font-semibold text-indigo-600', compact ? 'text-base' : 'text-xl')}>{word.meaning}</p>
      {word.example && (
        <div className="flex max-w-md items-center gap-2">
          <p className="text-sm italic text-slate-500">“{word.example}”</p>
          <AudioButton text={word.example} languageId={word.language_id} className="shrink-0" />
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={toggleLike}
          disabled={pending !== null}
          aria-pressed={word.liked}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset transition disabled:opacity-50',
            word.liked ? 'bg-rose-50 text-rose-600 ring-rose-200' : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50',
          )}
        >
          {word.liked ? '❤️' : '🤍'} {word.like_count}
        </button>
        <button
          type="button"
          onClick={toggleFavorite}
          disabled={pending !== null}
          aria-pressed={word.favorited}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset transition disabled:opacity-50',
            word.favorited
              ? 'bg-amber-50 text-amber-700 ring-amber-200'
              : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50',
          )}
        >
          {word.favorited ? t.vocabCard.favoritedLabel : t.vocabCard.favoriteLabel}
        </button>
        {word.in_review ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
            {t.vocabCard.inReviewLabel}
          </span>
        ) : (
          <button
            type="button"
            onClick={addToReview}
            disabled={pending !== null}
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {pending === 'review' ? t.vocabCard.addingToReview : t.vocabCard.addToReview}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}
    </Card>
  )
}
