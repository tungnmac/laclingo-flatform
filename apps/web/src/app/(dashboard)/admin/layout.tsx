'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { AdminSubNav } from '@/components/admin/AdminSubNav'
import { Spinner } from '@/components/ui/States'
import { hasModule, moduleForAdminPath } from '@/lib/adminModules'
import { useSession } from '@/store/session'

/** Gate mọi route /admin/* — trang hub (/admin) chỉ cần role=admin, các trang
 * module con còn cần ĐƯỢC CẤP đúng module đó (backend cũng tự chặn 403 —
 * xem RequireModule). role=admin KHÔNG còn tự động full quyền mọi module. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useSession((s) => s.user)
  const isAdmin = user?.role === 'admin' || user?.role === 'owner'
  const requiredModule = moduleForAdminPath(pathname)
  const allowed = isAdmin && (requiredModule === null || hasModule(user, requiredModule))

  useEffect(() => {
    if (user && !allowed) router.replace('/missions')
  }, [user, allowed, router])

  if (!user || !allowed) return <Spinner />

  return (
    <>
      {pathname !== '/admin' && <AdminSubNav />}
      {children}
    </>
  )
}
