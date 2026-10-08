'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { AdminSubNav } from '@/components/admin/AdminSubNav'
import { Spinner } from '@/components/ui/States'
import { useSession } from '@/store/session'

/** Gate mọi route /admin/* — chỉ user role=admin mới vào được (backend cũng tự chặn 403). */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useSession((s) => s.user)
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (user && !isAdmin) router.replace('/missions')
  }, [user, isAdmin, router])

  if (!user || !isAdmin) return <Spinner />

  return (
    <>
      {pathname !== '/admin' && <AdminSubNav />}
      {children}
    </>
  )
}
