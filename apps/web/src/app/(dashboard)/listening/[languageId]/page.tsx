'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { languageFlag } from '@/features/course/components/LanguageCard'
import { listeningService } from '@/features/listening/listening.service'
import { useApi } from '@/hooks/useApi'

/** Chọn chủ đề luyện nghe — mỗi thẻ hiện số bài trong chủ đề đó (giống trang
 * chọn chủ đề từ vựng, nhưng không có tiến độ "đã học" vì luyện nghe chưa có
 * theo dõi tiến độ riêng). */
export default function ListeningTopicsPage({ params }: { params: { languageId: string } }) {
  const { data, error, loading, reload } = useApi(() => listeningService.listTopics(params.languageId), [params.languageId])

  return (
    <div className="space-y-6">
      <Link href="/listening" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600">
        ← Tất cả ngôn ngữ
      </Link>

      <div className="flex items-center gap-2">
        <span className="text-3xl">{languageFlag(params.languageId)}</span>
        <h1 className="text-2xl font-bold text-slate-900">Luyện nghe</h1>
      </div>

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState icon="🎧" title="Chưa có chủ đề luyện nghe cho ngôn ngữ này" />}

      {data && data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((topic) => (
            <Link
              key={topic.name}
              href={`/listening/${params.languageId}/topic?name=${encodeURIComponent(topic.name)}`}
              className="group rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <Card className="flex h-full flex-col gap-2 transition group-hover:ring-indigo-300">
                <span className="text-4xl">{topic.icon}</span>
                <h2 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-700">{topic.name}</h2>
                <p className="text-sm text-slate-500">{topic.total} bài</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
