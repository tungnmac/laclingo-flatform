'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { Mascot } from '@/components/mascot/Mascot'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { courseService } from '@/features/course/course.service'
import { srsService } from '@/features/srs-review/srs.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'

/** Hub ôn tập: liệt kê các dạng ôn tập để người học chọn */
export default function ReviewHubPage({ searchParams }: { searchParams: { language?: string } }) {
  const language = searchParams.language
  const t = useTranslation()
  // Chỉ để hiện số từ đến hạn — lỗi thì ẩn badge, không chặn trang. Có
  // language thì đếm riêng ngôn ngữ đó, khớp với nơi "Ôn ngay" sẽ dẫn tới.
  const { data: due } = useApi(() => srsService.getDue(100, language), [language])
  const dueCount = due?.length ?? null
  // Chỉ để hiện tên ngôn ngữ đang học trong description — lỗi thì bỏ qua, không chặn trang
  const { data: currentLanguage } = useApi(() => courseService.getById(language!), [language], !!language)

  const vocabularyHref = language ? `/review/vocabulary?language=${encodeURIComponent(language)}` : '/review/vocabulary'
  const newWordsHref = language ? `/review/new?language=${encodeURIComponent(language)}` : '/review/new'
  const grammarHref = language ? `/learn/${encodeURIComponent(language)}` : '/learn'
  const favoritesHref = language ? `/review/favorites?language=${encodeURIComponent(language)}` : '/review/favorites'

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.review.pageTitle}
        description={currentLanguage ? t.review.pageDescWithLang(currentLanguage.name) : t.review.pageDescNoLang}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <span className="text-4xl">🧠</span>
            {dueCount !== null && (
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                  dueCount > 0
                    ? 'bg-rose-50 text-rose-700 ring-rose-200'
                    : 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                )}
              >
                {dueCount > 0 ? t.review.dueBadge(dueCount >= 100 ? '99+' : dueCount) : t.review.allDoneBadge}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">{t.review.vocabReviewTitle}</h2>
            <p className="mt-1 text-sm text-slate-600">{t.review.vocabReviewDesc}</p>
          </div>
          <ButtonLink href={vocabularyHref} className="w-full">
            {t.review.reviewNowBtn}
          </ButtonLink>
        </Card>

        <Card className="flex flex-col gap-3">
          <span className="text-4xl">✨</span>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">{t.review.newWordsTitle}</h2>
            <p className="mt-1 text-sm text-slate-600">{t.review.newWordsDesc}</p>
          </div>
          <ButtonLink href={newWordsHref} variant="secondary" className="w-full">
            {t.review.newWordsBtn}
          </ButtonLink>
        </Card>

        <Card className="flex flex-col gap-3">
          <span className="text-4xl">📖</span>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">{t.review.grammarPracticeTitle}</h2>
            <p className="mt-1 text-sm text-slate-600">{t.review.grammarPracticeDesc}</p>
          </div>
          <ButtonLink href={grammarHref} variant="secondary" className="w-full">
            {t.review.chooseLessonBtn}
          </ButtonLink>
        </Card>

        <Card className="flex flex-col gap-3">
          <span className="text-4xl">⭐</span>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">{t.review.favoritesTitle}</h2>
            <p className="mt-1 text-sm text-slate-600">{t.review.favoritesDesc}</p>
          </div>
          <ButtonLink href={favoritesHref} variant="secondary" className="w-full">
            {t.review.viewFavoritesBtn}
          </ButtonLink>
        </Card>
      </div>

      <Mascot message={t.review.mascotHub} />
    </div>
  )
}
