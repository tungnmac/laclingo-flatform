'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { LevelBadge } from '@/features/grammar/components/LevelBadge'
import { listeningService } from '@/features/listening/listening.service'
import { useApi } from '@/hooks/useApi'

/** Danh sách bài luyện nghe của 1 chủ đề — trước đây hiện hết bài của cả ngôn
 * ngữ, giờ lọc theo chủ đề đã chọn ở trang trước (ListeningTopicsPage). */
export default function ListeningPassagesByTopicPage({
  params,
  searchParams,
}: {
  params: { languageId: string }
  searchParams: { name?: string }
}) {
  const topic = searchParams.name ?? ''
  const { data, error, loading, reload } = useApi(() => listeningService.listPassages(params.languageId, topic), [params.languageId, topic])

  if (!topic) return <EmptyState icon="🧭" title="Chưa chọn chủ đề" />

  return (
    <div className="space-y-6">
      <Link href={`/listening/${params.languageId}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600">
        ← Chủ đề
      </Link>

      <h1 className="text-2xl font-bold text-slate-900">{topic}</h1>

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState icon="🎧" title="Chủ đề này chưa có bài luyện nghe" />}

      {data && data.length > 0 && (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {data.map((passage, index) => (
              <li key={passage.id}>
                <Link href={`/listening/${params.languageId}/${passage.id}`} className="group flex items-center gap-3 px-4 py-3.5 sm:px-6">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                    {index + 1}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 group-hover:text-indigo-600">{passage.title}</p>
                  <LevelBadge level={passage.level} />
                  <span aria-hidden className="text-slate-300 group-hover:text-indigo-500">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
