'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav, MobileHeader, Sidebar } from '@/components/layout/DashboardNav'
import { Spinner } from '@/components/ui/States'
import { useHydrated } from '@/hooks/useHydrated'
import { useSession } from '@/store/session'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const hydrated = useHydrated()
  const user = useSession((s) => s.user)
  const router = useRouter()

  useEffect(() => {
    if (hydrated && !user) router.replace('/login')
  }, [hydrated, user, router])

  if (!hydrated || !user) return <Spinner />

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader user={user} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-10 lg:px-8 lg:pt-10">{children}</main>
      </div>
      <BottomNav />
    </div>
  )
}
