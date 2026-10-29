'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { courseService } from '@/features/course/course.service'
import { SpeakingPractice } from '@/features/speaking/components/SpeakingPractice'
import { speakingService } from '@/features/speaking/speaking.service'
import { useApi } from '@/hooks/useApi'
import { useLanguageName } from '@/hooks/useLanguageName'
import { useTranslation } from '@/hooks/useTranslation'
import type { SpeakingItem } from '@/types/api'

/** Luyện từng câu của 1 chủ đề — ?topic=...&id=... (câu đang luyện), có câu trước/sau */
export default function SpeakingPracticePage({
  params,
  searchParams,
}: {
  params: { languageId: string }
  searchParams: { topic?: string; id?: string }
}) {
  const topic = searchParams.topic ?? ''
  const t = useTranslation()
  const languageName = useLanguageName()
  const router = useRouter()
  const { data: language } = useApi(() => courseService.getById(params.languageId), [params.languageId])
  const { data, error, loading, reload } = useApi(() => speakingService.listItems(params.languageId, topic), [params.languageId, topic], !!topic)
  // Điểm vừa đạt được trong phiên (đè lên dữ liệu đã tải) — tính thẳng từ data,
  // không sao chép sang state để khỏi chớp "không có câu nào" lúc vừa tải xong
  const [scored, setScored] = useState<Record<string, number>>({})
  const items = useMemo<SpeakingItem[]>(
    () => (data ?? []).map((i) => (i.id in scored ? { ...i, best_score: scored[i.id] } : i)),
    [data, scored],
  )

  const topicHref = `/speaking/${params.languageId}/topic?name=${encodeURIComponent(topic)}`
  const index = Math.max(0, items.findIndex((i) => i.id === searchParams.id))
  const item = items[index] as SpeakingItem | undefined
  const goTo = (i: number) =>
    router.replace(`/speaking/${params.languageId}/practice?topic=${encodeURIComponent(topic)}&id=${encodeURIComponent(items[i].id)}`)

  const onScored = (best: number) => item && setScored((s) => ({ ...s, [item.id]: best }))

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: t.nav.speaking, href: '/speaking' },
          { label: languageName(params.languageId, language?.name), href: `/speaking/${params.languageId}` },
          { label: item?.topic_label || topic, href: topicHref },
          { label: item ? t.speaking.itemOf(index + 1, items.length) : '…' },
        ]}
      />

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && !item && <EmptyState icon="🎤" title={t.speaking.emptyItems} />}

      {item && (
        <>
          {/* key = id: chuyển câu thì reset toàn bộ trạng thái ghi âm/kết quả */}
          <SpeakingPractice
            key={item.id}
            item={item}
            languageId={params.languageId}
            position={t.speaking.itemOf(index + 1, items.length)}
            onScored={onScored}
            onNext={index < items.length - 1 ? () => goTo(index + 1) : undefined}
          />
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={() => goTo(index - 1)} disabled={index === 0}>
              {t.speaking.prev}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push(topicHref)}>
              {t.speaking.backToTopic}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => goTo(index + 1)} disabled={index >= items.length - 1}>
              {t.speaking.next}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
