'use client'

import { useState } from 'react'
import { Pagination } from '@/components/admin/Pagination'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { AddToDeckDialog } from '@/features/deck/components/AddToDeckDialog'
import { LevelBadge } from '@/features/grammar/components/LevelBadge'
import { PartOfSpeechBadge } from '@/features/vocabulary/components/PartOfSpeechBadge'
import { NextReviewBadge } from '@/features/srs-review/components/NextReviewBadge'
import { srsService } from '@/features/srs-review/srs.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { resolveMediaUrl } from '@/lib/api'
import type { ReviewWord } from '@/types/api'

const PAGE_SIZE = 20

/** Mọi từ đang ôn trong SRS kèm thời gian còn lại tới lúc ôn — sắp từ sắp đến hạn tới xa nhất */
export default function SrsWordsPage({ searchParams }: { searchParams: { language?: string } }) {
  const language = searchParams.language
  const t = useTranslation()
  const [page, setPage] = useState(1)
  const { data, error, loading, reload } = useApi(() => srsService.listWords(language, page, PAGE_SIZE), [language, page])
  const [deckWord, setDeckWord] = useState<ReviewWord | null>(null)

  const reviewHref = language ? `/review?language=${encodeURIComponent(language)}` : '/review'
  const vocabularyHref = language ? `/review/vocabulary?language=${encodeURIComponent(language)}` : '/review/vocabulary'
  const newWordsHref = language ? `/review/new?language=${encodeURIComponent(language)}` : '/review/new'

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: t.nav.review, href: reviewHref }, { label: t.review.srsWordsTitle }]} />
      <PageHeader
        title={t.review.srsWordsTitle}
        description={t.review.srsWordsDesc}
        action={<ButtonLink href={vocabularyHref}>{t.review.reviewNowBtn}</ButtonLink>}
      />

      {loading && !data && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data?.items.length === 0 && (
        <>
          <EmptyState icon="🧠" title={t.review.srsWordsEmpty}>
            {t.review.srsWordsEmptyHint}
          </EmptyState>
          <div className="flex justify-center">
            <ButtonLink href={newWordsHref}>{t.review.newWordsBtn}</ButtonLink>
          </div>
        </>
      )}

      {data && data.items.length > 0 && (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {data.items.map((word) => (
              <li key={word.vocabulary_id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
                {word.image_url ? (
                  <img src={resolveMediaUrl(word.image_url)} alt="" className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <span className="w-10 text-center text-2xl">{word.image_emoji || '📘'}</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {word.term} {word.phonetic && <span className="font-normal text-slate-400">/{word.phonetic}/</span>}{' '}
                    <PartOfSpeechBadge value={word.part_of_speech} />
                  </p>
                  <p className="truncate text-sm text-slate-500">{word.meaning}</p>
                  <p className="text-xs text-slate-400">
                    {t.decks.practiceCount(word.practice_count)}
                    {word.topic && ` · ${word.topic}`}
                  </p>
                </div>
                <LevelBadge level={word.level} />
                <NextReviewBadge nextReviewAt={word.next_review_at} />
                <Button variant="secondary" size="sm" onClick={() => setDeckWord(word)}>
                  {t.decks.inReviewManageBtn}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />}

      {deckWord && (
        <AddToDeckDialog
          vocabularyId={deckWord.vocabulary_id}
          term={deckWord.term}
          onClose={() => setDeckWord(null)}
          onAdded={() => {}}
        />
      )}
    </div>
  )
}
