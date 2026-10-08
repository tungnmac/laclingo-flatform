'use client'

import Link from 'next/link'
import { ActiveBadge, ActiveToggleButton, ModulesEditor, RoleBadge, RoleToggleButton } from '@/components/admin/UserAdminControls'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { ErrorState, Spinner } from '@/components/ui/States'
import { userService } from '@/features/user/user.service'
import { useApi } from '@/hooks/useApi'
import { displayName, formatDate } from '@/lib/utils'

export default function AdminUserDetailPage({ params }: { params: { username: string } }) {
  const { data: user, error, loading, reload } = useApi(() => userService.getByUsernameAdmin(params.username), [params.username])

  return (
    <>
      <Link href="/admin/users" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600">
        ← Danh sách học viên
      </Link>
      <PageHeader title="Chi tiết học viên" description="Thông tin hồ sơ và quyền truy cập." />

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {user && (
        <Card className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={displayName(user)} src={user.avatar_url || undefined} className="h-16 w-16 text-lg" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-semibold text-slate-900">{displayName(user)}</h2>
              <p className="truncate text-sm text-slate-500">
                {user.username} · {user.email}
              </p>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <RoleBadge user={user} />
              <ActiveBadge user={user} />
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-slate-500">Level</dt>
              <dd className="text-lg font-semibold text-slate-900">⭐ {user.level}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">EXP</dt>
              <dd className="text-lg font-semibold text-slate-900">{user.exp}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Điểm</dt>
              <dd className="text-lg font-semibold text-slate-900">🏆 {user.points}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Streak</dt>
              <dd className="text-lg font-semibold text-slate-900">🔥 {user.streak_count}</dd>
            </div>
          </dl>

          <p className="mt-6 text-sm text-slate-500">Tham gia {formatDate(user.created_at)}</p>

          <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <RoleToggleButton user={user} onChanged={reload} />
            <ActiveToggleButton user={user} onChanged={reload} />
          </div>

          {user.role === 'owner' && (
            <p className="mt-4 text-sm text-slate-500">👑 Owner luôn có toàn quyền trên mọi mục quản trị — không thể thu hồi hoặc khoá.</p>
          )}

          {user.role === 'admin' && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <ModulesEditor user={user} onSaved={reload} />
            </div>
          )}
        </Card>
      )}
    </>
  )
}
