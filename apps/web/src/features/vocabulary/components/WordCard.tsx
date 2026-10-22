'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AudioButton } from '@/components/audio/AudioButton'
import { Card } from '@/components/ui/Card'
import { AddToDeckDialog } from '@/features/deck/components/AddToDeckDialog'
import { LevelBadge } from '@/features/grammar/components/LevelBadge'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError, resolveMediaUrl } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { DeckSummary, VocabularyCard } from '@/types/api'
import { vocabularyService } from '../vocabulary.service'
import { PartOfSpeechBadge } from './PartOfSpeechBadge'

type Action = 'like' | 'favorite'

/**
 * Thẻ một từ vựng: ảnh/emoji minh họa, phát âm, nghĩa, câu mẫu và các nút
 * Like / Yêu thích / Thêm vào ôn tập. Gọi API xong thì báo phần thay đổi lên
 * cha qua onChange để danh sách giữ trạng thái khi chuyển từ.
 */
export function WordCard({
  word,
  onChange,
  onDeckChange,
  compact = false,
}: {
  word: VocabularyCard
  onChange: (patch: Partial<VocabularyCard>) => void
  /** Từ vừa được thêm vào / gỡ khỏi 1 list ôn tập (trang chủ đề dùng để lọc theo list) */
  onDeckChange?: (vocabularyId: string, deck: DeckSummary, contained: boolean) => void
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
      setError(inlineError(err))
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

  // "Thêm vào ôn tập" mở hộp chọn danh sách ôn tập (thêm vào list = vào hàng đợi SRS)
  const [deckDialogOpen, setDeckDialogOpen] = useState(false)

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
          src={resolveMediaUrl(word.image_url)}
          alt={word.term}
          className={cn('rounded-2xl object-cover', compact ? 'h-20 w-20' : 'h-36 w-36')}
        />
      ) : (
        <span aria-hidden className={cn('leading-none', compact ? 'text-6xl' : 'text-8xl')}>
          {word.image_emoji || '📘'}
        </span>
      )}

      <h2 className={cn('break-words font-bold text-slate-900', // từ dài giữ cỡ nhỏ hơn trên mobile để không bị ngắt giữa từ
          compact ? 'text-2xl' : word.term.length > 10 ? 'text-4xl sm:text-6xl' : 'text-5xl sm:text-6xl')}>
        {word.term}
      </h2>
      {(word.phonetic || word.part_of_speech) && (
        <p className="flex items-center gap-2 text-slate-500">
          {word.phonetic && <span>/{word.phonetic}/</span>}
          <PartOfSpeechBadge value={word.part_of_speech} />
        </p>
      )}
      <AudioButton src={word.audio_url || undefined} text={word.term} languageId={word.language_id} />

      <p className={cn('font-semibold text-indigo-600', compact ? 'text-base' : 'text-xl')}>{word.meaning}</p>
      {word.example && (
        <div className="flex max-w-md items-center gap-2">
          <p className="text-sm italic text-slate-500">“{word.example}”</p>
          <AudioButton text={word.example} languageId={word.language_id} className="shrink-0" />
          {(word.language_id === 'en' || word.language_id === 'zh') && (
            <Link
              href={`/analyze?language=${word.language_id}&text=${encodeURIComponent(word.example)}`}
              title={t.analyze.analyzeExample}
              aria-label={t.analyze.analyzeExample}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-lg hover:bg-indigo-100"
            >
              🔍
            </Link>
          )}
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
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              {t.vocabCard.inReviewLabel}
            </span>
            <button
              type="button"
              onClick={() => setDeckDialogOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50"
            >
              {t.decks.inReviewManageBtn}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setDeckDialogOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            {t.vocabCard.addToReview}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {deckDialogOpen && (
        <AddToDeckDialog
          vocabularyId={word.vocabulary_id}
          term={word.term}
          onClose={() => setDeckDialogOpen(false)}
          onAdded={() => !word.in_review && onChange({ in_review: true })}
          onMembershipChange={(deck, contained) => onDeckChange?.(word.vocabulary_id, deck, contained)}
        />
      )}
    </Card>
  )
}
