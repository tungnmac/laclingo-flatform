'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { languageFlag } from '@/features/course/components/LanguageCard'
import { LevelBadge } from '@/features/grammar/components/LevelBadge'
import { listeningService } from '@/features/listening/listening.service'
import { useApi } from '@/hooks/useApi'

export default function ListeningPassageListPage({ params }: { params: { languageId: string } }) {
  const { data, error, loading, reload } = useApi(() => listeningService.listPassages(params.languageId), [params.languageId])

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
      {data && data.length === 0 && <EmptyState icon="🎧" title="Chưa có bài luyện nghe cho ngôn ngữ này" />}

      {data && data.length > 0 && (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {data.map((passage, index) => (
              <li key={passage.id}>
                <Link href={`/listening/${params.languageId}/${passage.id}`} className="group flex items-center gap-3 px-4 py-3.5 sm:px-6">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700 group-hover:text-indigo-600">{passage.title}</p>
                    {passage.topic && <p className="truncate text-xs text-slate-400">{passage.topic}</p>}
                  </div>
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
