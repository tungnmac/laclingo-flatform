'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { LanguageCard } from '@/features/course/components/LanguageCard'
import { courseService } from '@/features/course/course.service'
import { useApi } from '@/hooks/useApi'

export default function LearnPage() {
  const { data, error, loading, reload } = useApi(courseService.list, [])

  return (
    <>
      <PageHeader title="Chọn ngôn ngữ" description="Bắt đầu hành trình học cùng Chim Lạc." />

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title="Chưa có ngôn ngữ nào">Hãy chạy seeds.sql để thêm dữ liệu mẫu.</EmptyState>}
      {data && data.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {data.map((lang) => (
            <LanguageCard key={lang.id} language={lang} />
          ))}
        </div>
      )}
    </>
  )
}
