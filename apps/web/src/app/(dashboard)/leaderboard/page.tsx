'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { StreakBadge } from '@/features/user/components/StreakBadge'
import { userService } from '@/features/user/user.service'
import { useApi } from '@/hooks/useApi'
import { cn, displayName } from '@/lib/utils'
import { useSession } from '@/store/session'

const medals = ['🥇', '🥈', '🥉']

export default function LeaderboardPage() {
  const me = useSession((s) => s.user)
  const { data, error, loading, reload } = useApi(userService.list, [])
  const ranked = data ? [...data].sort((a, b) => b.streak_count - a.streak_count) : []

  return (
    <>
      <PageHeader title="Bảng xếp hạng" description="Xếp hạng theo chuỗi ngày học liên tiếp." />

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && ranked.length === 0 && <EmptyState title="Chưa có người học nào" />}
      {ranked.length > 0 && (
        <Card className="p-0 sm:p-0">
          <ol className="divide-y divide-slate-100">
            {ranked.map((user, i) => (
              <li
                key={user.id}
                className={cn('flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4', user.id === me?.id && 'bg-indigo-50')}
              >
                <span className="w-8 shrink-0 text-center text-lg font-bold text-slate-500">{medals[i] ?? i + 1}</span>
                <Avatar name={displayName(user)} src={user.avatar_url || undefined} className="h-10 w-10 shrink-0 text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {displayName(user)}
                    {user.id === me?.id && <span className="ml-2 text-xs font-normal text-indigo-600">(bạn)</span>}
                  </p>
                  <p className="hidden truncate text-sm text-slate-500 sm:block">{user.email}</p>
                </div>
                <StreakBadge count={user.streak_count} />
              </li>
            ))}
          </ol>
        </Card>
      )}
    </>
  )
}
