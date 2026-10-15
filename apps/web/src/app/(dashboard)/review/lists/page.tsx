'use client'

import Link from 'next/link'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { PageHeader } from '@/components/layout/PageHeader'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { DeckForm } from '@/features/deck/components/DeckForm'
import { deckService } from '@/features/deck/deck.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'

/** Các danh sách ôn tập của user: tạo list mới, xem, học lại từng list */
export default function DeckListPage() {
  const t = useTranslation()
  const { data: decks, error, loading, reload } = useApi(() => deckService.list(), [])

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: t.nav.review, href: '/review' }, { label: t.decks.pageTitle }]} />
      <PageHeader title={t.decks.pageTitle} description={t.decks.pageDesc} />

      <Card>
        <h2 className="mb-4 text-base font-semibold text-slate-900">{t.decks.createTitle}</h2>
        <DeckForm
          submitLabel={t.decks.createBtn}
          onSubmit={async (body) => {
            await deckService.create(body)
            reload()
          }}
        />
      </Card>

      {loading && !decks && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {decks?.length === 0 && (
        <EmptyState icon="📋" title={t.decks.empty}>
          {t.decks.emptyHint}
        </EmptyState>
      )}

      {decks && decks.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <Card key={deck.id} className="flex flex-col gap-3 border-l-4" style={{ borderLeftColor: deck.color }}>
              <Link href={`/review/lists/${deck.id}`} className="group flex items-start gap-3">
                <span className="text-3xl">{deck.icon}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold text-slate-900 group-hover:text-indigo-700">{deck.name}</h2>
                  {deck.description && <p className="line-clamp-2 text-sm text-slate-500">{deck.description}</p>}
                </div>
              </Link>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">{t.decks.wordCount(deck.word_count)}</span>
                {deck.due_count > 0 && (
                  <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-rose-700 ring-1 ring-inset ring-rose-200">
                    {t.decks.dueCount(deck.due_count)}
                  </span>
                )}
              </div>
              <div className="mt-auto flex gap-2">
                {deck.word_count > 0 && (
                  <ButtonLink href={`/review/vocabulary?deck=${deck.id}`} size="sm" className="flex-1">
                    {t.decks.practiceBtn}
                  </ButtonLink>
                )}
                <ButtonLink href={`/review/lists/${deck.id}`} size="sm" variant="secondary" className="flex-1">
                  {t.decks.viewBtn}
                </ButtonLink>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
