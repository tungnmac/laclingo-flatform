'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { ErrorState, Spinner } from '@/components/ui/States'
import { userService } from '@/features/user/user.service'
import { useApi } from '@/hooks/useApi'
import { ADMIN_MODULES } from '@/lib/adminModules'
import { cn, displayName, formatDate } from '@/lib/utils'

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
          <div className="flex items-center gap-4">
            <Avatar name={displayName(user)} src={user.avatar_url || undefined} className="h-16 w-16 text-lg" />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-slate-900">{displayName(user)}</h2>
              <p className="truncate text-sm text-slate-500">
                {user.username} · {user.email}
              </p>
            </div>
            <span
              className={cn(
                'ml-auto shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
                user.role === 'admin' ? 'bg-indigo-50 text-indigo-700 ring-indigo-200' : 'bg-slate-50 text-slate-600 ring-slate-200',
              )}
            >
              {user.role}
            </span>
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

          {user.role === 'admin' && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="mb-2 text-sm font-medium text-slate-700">Module được cấp quyền truy cập /admin</p>
              {user.admin_modules && user.admin_modules.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {ADMIN_MODULES.filter((m) => user.admin_modules?.includes(m.key)).map((m) => (
                    <span key={m.key} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
                      {m.icon} {m.label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Chưa được cấp module nào.</p>
              )}
              <Link href="/admin/users" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
                Chỉnh sửa quyền module →
              </Link>
            </div>
          )}
        </Card>
      )}
    </>
  )
}
