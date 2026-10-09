'use client'

import { useEffect, useState } from 'react'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageHeader } from '@/components/layout/PageHeader'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { WordCard } from '@/features/vocabulary/components/WordCard'
import { vocabularyService } from '@/features/vocabulary/vocabulary.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import type { VocabularyCard } from '@/types/api'

/** Bộ sưu tập từ yêu thích của user — bỏ yêu thích thì từ vẫn ở lại đến khi tải lại trang */
export default function FavoriteWordsPage({ searchParams }: { searchParams: { language?: string } }) {
  const language = searchParams.language
  const t = useTranslation()
  const reviewHref = language ? `/review?language=${encodeURIComponent(language)}` : '/review'
  const newWordsHref = language ? `/review/new?language=${encodeURIComponent(language)}` : '/review/new'

  const { data, error, loading, reload } = useApi(() => vocabularyService.listFavorites(language), [language])
  const [words, setWords] = useState<VocabularyCard[]>([])
  useEffect(() => setWords(data ?? []), [data])

  const update = (id: string, patch: Partial<VocabularyCard>) =>
    setWords((ws) => ws.map((w) => (w.vocabulary_id === id ? { ...w, ...patch } : w)))

  if (loading) return <Spinner label={t.review.loadingFavorites} />
  if (error) return <ErrorState error={error} onRetry={reload} />

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: t.nav.review, href: reviewHref }, { label: t.review.favoritesTitle }]} />
      <PageHeader title={t.review.favoritesTitle} description={t.review.favoritesDesc} />

      {words.length === 0 ? (
        <>
          <EmptyState icon="⭐" title={t.review.emptyFavoritesTitle}>
            {t.review.emptyFavoritesBody}
          </EmptyState>
          <div className="flex justify-center">
            <ButtonLink href={newWordsHref}>{t.review.newWordsBtn}</ButtonLink>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {words.map((w) => (
            <WordCard key={w.vocabulary_id} word={w} compact onChange={(patch) => update(w.vocabulary_id, patch)} />
          ))}
        </div>
      )}
    </div>
  )
}
