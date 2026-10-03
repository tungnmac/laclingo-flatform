'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { Mascot } from '@/components/mascot/Mascot'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { courseService } from '@/features/course/course.service'
import { srsService } from '@/features/srs-review/srs.service'
import { useApi } from '@/hooks/useApi'
import { cn } from '@/lib/utils'

/** Hub ôn tập: liệt kê các dạng ôn tập để người học chọn */
export default function ReviewHubPage({ searchParams }: { searchParams: { language?: string } }) {
  const language = searchParams.language
  // Chỉ để hiện số từ đến hạn — lỗi thì ẩn badge, không chặn trang. Có
  // language thì đếm riêng ngôn ngữ đó, khớp với nơi "Ôn ngay" sẽ dẫn tới.
  const { data: due } = useApi(() => srsService.getDue(100, language), [language])
  const dueCount = due?.length ?? null
  // Chỉ để hiện tên ngôn ngữ đang học trong description — lỗi thì bỏ qua, không chặn trang
  const { data: currentLanguage } = useApi(() => courseService.getById(language!), [language], !!language)

  const vocabularyHref = language ? `/review/vocabulary?language=${encodeURIComponent(language)}` : '/review/vocabulary'
  const newWordsHref = language ? `/review/new?language=${encodeURIComponent(language)}` : '/review/new'
  const grammarHref = language ? `/learn/${encodeURIComponent(language)}` : '/learn'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ôn tập"
        description={currentLanguage ? `Đang học: ${currentLanguage.name} — chọn dạng ôn tập phù hợp với bạn hôm nay` : 'Chọn dạng ôn tập phù hợp với bạn hôm nay'}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
                {dueCount > 0 ? `${dueCount >= 100 ? '99+' : dueCount} từ đến hạn` : 'Đã ôn hết'}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">Ôn tập từ vựng (SRS)</h2>
            <p className="mt-1 text-sm text-slate-600">
              Flashcard theo thuật toán SM-2 — nhắc bạn ôn đúng lúc sắp quên.
            </p>
          </div>
          <ButtonLink href={vocabularyHref} className="w-full">
            Ôn ngay
          </ButtonLink>
        </Card>

        <Card className="flex flex-col gap-3">
          <span className="text-4xl">✨</span>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">Học từ mới</h2>
            <p className="mt-1 text-sm text-slate-600">
              Mỗi lượt 10 từ A1–A2 theo 12 chủ đề — từ vừa học vào ngay hàng đợi ôn tập.
            </p>
          </div>
          <ButtonLink href={newWordsHref} variant="secondary" className="w-full">
            Học từ mới
          </ButtonLink>
        </Card>

        <Card className="flex flex-col gap-3">
          <span className="text-4xl">📖</span>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">Luyện tập ngữ pháp</h2>
            <p className="mt-1 text-sm text-slate-600">
              Làm bài tập trắc nghiệm và điền từ trong từng bài học 12 thì.
            </p>
          </div>
          <ButtonLink href={grammarHref} variant="secondary" className="w-full">
            Chọn bài học
          </ButtonLink>
        </Card>
      </div>

      <Mascot message="Mỗi ngày một chút, chữ sẽ tự ở lại trong đầu! 🦩" />
    </div>
  )
}
