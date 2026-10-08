'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { WordCard } from '@/features/vocabulary/components/WordCard'
import { vocabularyService } from '@/features/vocabulary/vocabulary.service'
import { useApi } from '@/hooks/useApi'
import type { VocabularyCard } from '@/types/api'

/** Bộ sưu tập từ yêu thích của user — bỏ yêu thích thì từ vẫn ở lại đến khi tải lại trang */
export default function FavoriteWordsPage({ searchParams }: { searchParams: { language?: string } }) {
  const language = searchParams.language
  const newWordsHref = language ? `/review/new?language=${encodeURIComponent(language)}` : '/review/new'

  const { data, error, loading, reload } = useApi(() => vocabularyService.listFavorites(language), [language])
  const [words, setWords] = useState<VocabularyCard[]>([])
  useEffect(() => setWords(data ?? []), [data])

  const update = (id: string, patch: Partial<VocabularyCard>) =>
    setWords((ws) => ws.map((w) => (w.vocabulary_id === id ? { ...w, ...patch } : w)))

  if (loading) return <Spinner label="Đang lấy từ yêu thích..." />
  if (error) return <ErrorState error={error} onRetry={reload} />

  return (
    <div className="space-y-6">
      <Link href={newWordsHref} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600">
        ← Chủ đề
      </Link>
      <PageHeader title="Từ yêu thích" description="Những từ bạn đã đánh dấu ⭐ để xem lại." />

      {words.length === 0 ? (
        <>
          <EmptyState icon="⭐" title="Chưa có từ yêu thích nào">
            Bấm “Yêu thích” trên thẻ từ khi học theo chủ đề để lưu vào đây.
          </EmptyState>
          <div className="flex justify-center">
            <ButtonLink href={newWordsHref}>Học từ mới</ButtonLink>
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
