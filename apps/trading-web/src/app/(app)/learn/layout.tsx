import type { ReactNode } from 'react'
import { LearnSidebar } from '@/components/learn/LearnSidebar'

/** Mục Học: sidebar từ xl (lg đã có sidebar chính chiếm chỗ) / tab cuộn ngang khi hẹp hơn + nội dung */
export default function LearnLayout({ children }: { children: ReactNode }) {
  return (
    <div className="xl:grid xl:grid-cols-[13rem_1fr] xl:gap-6">
      <LearnSidebar />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
