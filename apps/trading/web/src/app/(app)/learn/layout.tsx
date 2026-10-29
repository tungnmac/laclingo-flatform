import type { ReactNode } from 'react'

/** Mục Học: các trang con nằm trong sidebar chính (mục con của "Học") — không còn sidebar riêng */
export default function LearnLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
