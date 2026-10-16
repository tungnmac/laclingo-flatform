import type { ReactNode } from 'react'
import { LearnSidebar } from '@/components/learn/LearnSidebar'

/** Mục Học: sidebar (desktop) / tab cuộn ngang (mobile) + nội dung */
export default function LearnLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lg:grid lg:grid-cols-[13rem_1fr] lg:gap-6">
      <LearnSidebar />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
