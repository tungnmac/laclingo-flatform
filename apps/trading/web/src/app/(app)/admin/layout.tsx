import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { getCurrentUser } from '@/server/auth/require-user'

/** Chặn ở server: không phải admin → về /learn (API admin vẫn tự kiểm tra quyền độc lập) */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  if (user?.role !== 'admin') redirect('/learn')
  return <>{children}</>
}
