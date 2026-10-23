import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { AppNav } from '@/components/AppNav'
import { getCurrentUser } from '@/server/auth/require-user'
import { getPlan } from '@/server/billing/subscription-service'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser() // cookie hợp lệ nhưng user đã bị xoá → về đăng nhập
  if (!user) redirect('/login')
  return (
    <div className="min-h-screen">
      {/* lỗi đọc gói không làm hỏng cả trang — huy hiệu về Free (API Pro vẫn tự kiểm tra quyền) */}
      <AppNav user={user} plan={(await getPlan(user.id).catch(() => ({ plan: 'free' as const }))).plan} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}
