'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { inputClass } from '@/features/auth/components/AuthForm'
import { courseService } from '@/features/course/course.service'
import { deckService } from '@/features/deck/deck.service'
import { AutoplaySettingsDropdown } from '@/features/vocabulary/components/AutoplaySettingsDropdown'
import { WordCard } from '@/features/vocabulary/components/WordCard'
import { vocabularyService } from '@/features/vocabulary/vocabulary.service'
import { useApi } from '@/hooks/useApi'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useKeypress } from '@/hooks/useKeypress'
import { useTranslation } from '@/hooks/useTranslation'
import { useWordAutoplay } from '@/hooks/useWordAutoplay'
import { cn } from '@/lib/utils'
import { useAutoplaySettings } from '@/store/autoplaySettings'
import type { DeckSummary, VocabularyCard } from '@/types/api'

/** Bộ lọc từ trong chủ đề — "deck:<id>" = chỉ các từ trong 1 list ôn tập cụ thể */
type WordFilter = 'all' | 'no_deck' | 'in_deck' | 'not_review' | 'in_review' | 'favorite' | `deck:${string}`

/** Bỏ dấu tiếng Việt + chữ thường để tìm "gia dinh" cũng khớp "Gia đình" */
function normalizeSearch(s: string) {
  return s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase()
}

function matchesFilter(w: VocabularyCard, filter: WordFilter, query: string) {
  if (query && ![w.term, w.meaning, w.example].some((s) => normalizeSearch(s ?? '').includes(query))) return false
  switch (filter) {
    case 'all':
      return true
    case 'no_deck':
      return w.deck_ids.length === 0
    case 'in_deck':
      return w.deck_ids.length > 0
    case 'not_review':
      return !w.in_review
    case 'in_review':
      return w.in_review
    case 'favorite':
      return w.favorited
    default:
      return w.deck_ids.includes(filter.slice('deck:'.length))
  }
}

/** Học từ theo một chủ đề: lướt từng từ, like / yêu thích / thêm vào ôn tập.
 * ?scope=learn giữ breadcrumb gốc Học/{ngôn ngữ} khi vào từ card "Từ vựng" ở
 * trang khoá học (xem review/new/page.tsx), thay vì gốc Ôn tập. */
export default function TopicWordsPage({ searchParams }: { searchParams: { name?: string; language?: string; scope?: string } }) {
  const topic = searchParams.name ?? ''
  const language = searchParams.language
  const fromLearn = searchParams.scope === 'learn'
  const t = useTranslation()
  const { data: course } = useApi(() => courseService.getById(language ?? ''), [language], fromLearn && !!language)
  const scopeQuery = fromLearn ? '&scope=learn' : ''
  const reviewHref = language ? `/review?language=${encodeURIComponent(language)}` : '/review'
  const topicsHref = (language ? `/review/new?language=${encodeURIComponent(language)}` : '/review/new') + scopeQuery

  const [words, setWords] = useState<VocabularyCard[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [loadVersion, setLoadVersion] = useState(0)

  // Tìm kiếm + lọc theo list ôn tập. Kết quả lọc được "chốt" (visibleIds) lúc
  // đổi bộ lọc — thêm/gỡ list cho từ đang xem KHÔNG làm nó biến mất giữa chừng.
  const [decks, setDecks] = useState<DeckSummary[]>([])
  const [search, setSearch] = useState('')
  const query = normalizeSearch(useDebouncedValue(search.trim(), 250))
  const [filter, setFilter] = useState<WordFilter>('all')
  const [visibleIds, setVisibleIds] = useState<string[] | null>(null) // null = không lọc, hiện tất cả
  const wordsRef = useRef(words)
  wordsRef.current = words

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    vocabularyService
      .listWords(topic, language)
      .then((res) => {
        setWords(res)
        // Bắt đầu ở từ đầu tiên chưa vào ôn tập — quay lại chủ đề thì học tiếp chỗ cũ
        setIndex(Math.max(0, res.findIndex((w) => !w.in_review)))
        setLoadVersion((v) => v + 1)
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [topic, language])

  useEffect(load, [load])

  useEffect(() => {
    deckService
      .list()
      .then(setDecks)
      .catch(() => {}) // không có list thì chỉ mất bộ lọc theo list, trang vẫn dùng được
  }, [])

  const byId = useMemo(() => new Map(words.map((w) => [w.vocabulary_id, w])), [words])
  const view = useMemo(
    () => (visibleIds ? visibleIds.map((id) => byId.get(id)).filter((w): w is VocabularyCard => !!w) : words),
    [visibleIds, byId, words],
  )
  const filtering = visibleIds !== null

  // Đổi bộ lọc/từ khoá → tính lại danh sách, giữ nguyên từ đang xem nếu nó vẫn khớp
  useEffect(() => {
    const all = wordsRef.current
    const nextIds = filter === 'all' && !query ? null : all.filter((w) => matchesFilter(w, filter, query)).map((w) => w.vocabulary_id)
    setVisibleIds(nextIds)
    setIndex((i) => {
      const currentId = (visibleIds ? visibleIds[i] : all[i]?.vocabulary_id) ?? ''
      const pos = (nextIds ?? all.map((w) => w.vocabulary_id)).indexOf(currentId)
      return pos >= 0 ? pos : 0
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, query, loadVersion])

  const clearFilters = () => {
    setSearch('')
    setFilter('all')
  }

  const current = view[index] as VocabularyCard | undefined
  const learned = words.filter((w) => w.in_review).length
  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const goNext = useCallback(() => setIndex((i) => Math.min(view.length - 1, i + 1)), [view.length])

  // Tự chạy slide: đọc từ (và xen nghĩa nếu shadowMode) rồi tự goNext — bấm
  // Trước/Tiếp hoặc phím mũi tên thủ công thì DỪNG tự động (tránh đọc đè lên
  // việc điều hướng tay), nên tách riêng bản "thủ công" khỏi goPrev/goNext thô.
  const [autoplay, setAutoplay] = useState(false)
  const repeatCount = useAutoplaySettings((s) => s.repeatCount)
  const gapSeconds = useAutoplaySettings((s) => s.gapSeconds)
  const shadowMode = useAutoplaySettings((s) => s.shadowMode)

  const isLastWord = index >= view.length - 1
  const onAutoAdvance = useCallback(() => {
    if (isLastWord) setAutoplay(false)
    else goNext()
  }, [isLastWord, goNext])

  useWordAutoplay({
    enabled: autoplay && !!current,
    term: current?.term ?? '',
    meaning: current?.meaning ?? '',
    languageId: current?.language_id ?? language ?? 'en',
    repeatCount,
    gapSeconds,
    shadowMode,
    onAdvance: onAutoAdvance,
  })

  const prev = () => {
    setAutoplay(false)
    goPrev()
  }
  const next = () => {
    setAutoplay(false)
    goNext()
  }

  const onKey = useCallback(
    (key: string) => {
      if (key === 'ArrowLeft') prev()
      else if (key === 'ArrowRight') next()
      else return false
      return true
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [goPrev, goNext],
  )
  useKeypress(onKey, view.length > 0)

  const updateCurrent = (patch: Partial<VocabularyCard>) => {
    if (!current) return
    setWords((ws) => ws.map((w) => (w.vocabulary_id === current.vocabulary_id ? { ...w, ...patch } : w)))
  }

  const onDeckChange = (vocabularyId: string, deck: DeckSummary, contained: boolean) => {
    setWords((ws) =>
      ws.map((w) =>
        w.vocabulary_id !== vocabularyId
          ? w
          : { ...w, deck_ids: contained ? [...new Set([...w.deck_ids, deck.id])] : w.deck_ids.filter((id) => id !== deck.id) },
      ),
    )
    // List vừa tạo trong hộp thoại → thêm vào bộ lọc ngay
    setDecks((ds) => (ds.some((d) => d.id === deck.id) ? ds : [deck, ...ds]))
  }

  if (!topic) return <EmptyState icon="🧭" title={t.review.emptyNoTopic} />
  if (loading) return <Spinner label={t.review.loadingWords} />
  if (error) return <ErrorState error={error} onRetry={load} />

  const breadcrumbItems =
    fromLearn && language
      ? [
          { label: t.nav.learn, href: '/learn' },
          { label: course?.name ?? language, href: `/learn/${language}` },
          { label: t.learn.vocabularyCardTitle, href: topicsHref },
          { label: topic },
        ]
      : [
          { label: t.nav.review, href: reviewHref },
          { label: t.review.newWordsTitle, href: topicsHref },
          { label: topic },
        ]

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Breadcrumbs items={breadcrumbItems} />

      {words.length === 0 ? (
        <EmptyState icon="📭" title={t.review.emptyTopicNamed(topic)} />
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-bold text-slate-900">{topic}</h1>
            {current && <span className="text-sm text-slate-500">{t.review.wordCounter(index + 1, view.length, learned)}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.review.searchWordsPlaceholder}
                aria-label={t.review.searchWordsPlaceholder}
                className={cn(inputClass, 'mt-0 flex-1')}
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as WordFilter)}
                aria-label={t.review.filterLabel}
                className={cn(inputClass, 'mt-0 sm:w-60')}
              >
                <option value="all">{t.review.filterAll}</option>
                <option value="no_deck">{t.review.filterNoDeck}</option>
                <option value="in_deck">{t.review.filterInDeck}</option>
                {decks.length > 0 && (
                  <optgroup label={t.review.filterByDeck}>
                    {decks.map((d) => (
                      <option key={d.id} value={`deck:${d.id}`}>
                        {d.icon} {d.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                <option value="not_review">{t.review.filterNotInReview}</option>
                <option value="in_review">{t.review.filterInReview}</option>
                <option value="favorite">{t.review.filterFavorite}</option>
              </select>
            </div>
            {filtering && (
              <p className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {t.review.filterMatchCount(view.length, words.length)}
                <button type="button" onClick={clearFilters} className="font-medium text-indigo-600 hover:underline">
                  {t.review.clearFilters}
                </button>
              </p>
            )}
          </div>

          {!current ? (
            <EmptyState icon="🔍" title={t.review.filterNoMatch}>
              <Button variant="secondary" onClick={clearFilters}>
                {t.review.clearFilters}
              </Button>
            </EmptyState>
          ) : (
            <>
              <WordCard key={current.vocabulary_id} word={current} onChange={updateCurrent} onDeckChange={onDeckChange} />

              <div className="flex items-center justify-between gap-2">
                <Button variant="secondary" onClick={prev} disabled={index === 0}>
                  {t.review.prevBtn}
                </Button>
                <span className="hidden text-xs text-slate-400 sm:inline">{t.review.arrowHint}</span>
                <Button onClick={next} disabled={index >= view.length - 1}>
                  {t.review.nextBtn}
                </Button>
              </div>

              <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <Button variant={autoplay ? 'danger' : 'secondary'} size="sm" onClick={() => setAutoplay((v) => !v)}>
                    {autoplay ? t.review.autoplayStopBtn : t.review.autoplayStartBtn}
                  </Button>
                  <AutoplaySettingsDropdown />
                </div>
                {autoplay && <p className="text-center text-xs font-medium text-indigo-600">{t.review.autoplayRunningHint}</p>}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
