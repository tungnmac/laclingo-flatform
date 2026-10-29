'use client'

import { useState } from 'react'
import { Pagination } from '@/components/admin/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { inputClass } from '@/features/auth/components/AuthForm'
import { leaderboardService } from '@/features/leaderboard/leaderboard.service'
import { useApi } from '@/hooks/useApi'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import { useSession } from '@/store/session'
import type { LeaderboardBy } from '@/types/api'

const PAGE_SIZE = 20
const medals = ['🥇', '🥈', '🥉']

export default function LeaderboardPage() {
  const me = useSession((s) => s.user)
  const t = useTranslation()
  const [by, setBy] = useState<LeaderboardBy>('level')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [page, setPage] = useState(1)
  const { data, error, loading, reload } = useApi(
    () => leaderboardService.get(by, { q: debouncedSearch, page, pageSize: PAGE_SIZE }),
    [by, debouncedSearch, page],
  )

  const tabs: { by: LeaderboardBy; label: string }[] = [
    { by: 'level', label: t.leaderboard.tabLevel },
    { by: 'points', label: t.leaderboard.tabPoints },
    { by: 'streak', label: t.leaderboard.tabStreak },
  ]

  return (
    <>
      <PageHeader title={t.leaderboard.pageTitle} description={t.leaderboard.pageDesc} />

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.by}
            type="button"
            onClick={() => {
              setBy(tab.by)
              setPage(1)
            }}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition',
              by === tab.by ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <label className="mb-4 block text-sm font-medium text-slate-700">
        {t.leaderboard.searchLabel}
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder={t.leaderboard.searchPlaceholder}
          className={cn(inputClass, 'max-w-xs')}
        />
      </label>

      {loading && !data && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title={t.leaderboard.emptyTitle} />}
      {data && data.items.length > 0 && (
        <Card className="p-0 sm:p-0">
          <ol className="divide-y divide-slate-100">
            {data.items.map((entry) => (
              <li
                key={entry.user_id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4',
                  entry.user_id === me?.id && 'bg-indigo-50',
                )}
              >
                <span className="w-8 shrink-0 text-center text-lg font-bold text-slate-500">
                  {medals[entry.rank - 1] ?? entry.rank}
                </span>
                <Avatar name={entry.full_name || entry.username} src={entry.avatar_url || undefined} className="h-10 w-10 shrink-0 text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {entry.full_name || entry.username}
                    {entry.user_id === me?.id && <span className="ml-2 text-xs font-normal text-indigo-600">{t.leaderboard.youSuffix}</span>}
                  </p>
                  <p className="truncate text-sm text-slate-500">{t.leaderboard.statLine(entry.level, entry.points, entry.streak_count)}</p>
                </div>
                <PrimaryStat by={by} entry={entry} />
              </li>
            ))}
          </ol>
        </Card>
      )}
      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />}
    </>
  )
}

function PrimaryStat({ by, entry }: { by: LeaderboardBy; entry: { level: number; points: number; streak_count: number } }) {
  if (by === 'level') return <span className="shrink-0 text-lg font-bold text-indigo-600">Lv.{entry.level}</span>
  if (by === 'points') return <span className="shrink-0 text-lg font-bold text-indigo-600">{entry.points}</span>
  return <span className="shrink-0 text-lg font-bold text-orange-600">{entry.streak_count}</span>
}
