'use client'

import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState, Spinner } from '@/components/ui/States'
import { userService } from '@/features/user/user.service'
import { useApi } from '@/hooks/useApi'
import { displayName, formatDate } from '@/lib/utils'
import { useSession } from '@/store/session'

export default function ProfilePage() {
  const router = useRouter()
  const sessionUser = useSession((s) => s.user)
  const logout = useSession((s) => s.logout)
  const { data: user, error, loading, reload } = useApi(
    () => userService.getById(sessionUser!.id),
    [sessionUser?.id],
    !!sessionUser,
  )

  if (loading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!user) return null

  const stats = [
    { label: 'Chuỗi ngày học', value: `🔥 ${user.streak_count}` },
    { label: 'Tham gia từ', value: formatDate(user.created_at) },
  ]

  return (
    <>
      <PageHeader title="Hồ sơ" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-3 text-center lg:col-span-1">
          <Avatar name={displayName(user)} src={user.avatar_url || undefined} className="h-24 w-24 text-2xl" />
          <div className="min-w-0 max-w-full">
            <h2 className="truncate text-xl font-bold text-slate-900">{displayName(user)}</h2>
            <p className="truncate text-sm text-slate-500">{user.email}</p>
          </div>
          <Button
            variant="secondary"
            className="mt-2 w-full"
            onClick={() => {
              logout()
              router.replace('/login')
            }}
          >
            Đăng xuất
          </Button>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2 lg:content-start">
          {stats.map((s) => (
            <Card key={s.label}>
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{s.value}</p>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
