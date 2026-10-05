'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { leaderboardService } from '@/features/leaderboard/leaderboard.service'
import { useApi } from '@/hooks/useApi'
import { cn } from '@/lib/utils'
import { useSession } from '@/store/session'
import type { LeaderboardBy } from '@/types/api'

const medals = ['🥇', '🥈', '🥉']

const tabs: { by: LeaderboardBy; label: string }[] = [
  { by: 'level', label: '⭐ Level' },
  { by: 'points', label: '🏆 Điểm thách đấu' },
  { by: 'streak', label: '🔥 Streak' },
]

export default function LeaderboardPage() {
  const me = useSession((s) => s.user)
  const [by, setBy] = useState<LeaderboardBy>('level')
  const { data, error, loading, reload } = useApi(() => leaderboardService.get(by), [by])

  return (
    <>
      <PageHeader title="Bảng xếp hạng" description="Xếp hạng người học theo level, điểm thách đấu, hoặc streak." />

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.by}
            type="button"
            onClick={() => setBy(t.by)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition',
              by === t.by ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title="Chưa có người học nào" />}
      {data && data.length > 0 && (
        <Card className="p-0 sm:p-0">
          <ol className="divide-y divide-slate-100">
            {data.map((entry) => (
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
                    {entry.user_id === me?.id && <span className="ml-2 text-xs font-normal text-indigo-600">(bạn)</span>}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    ⭐ Lv.{entry.level} · 🏆 {entry.points} điểm · 🔥 {entry.streak_count}
                  </p>
                </div>
                <PrimaryStat by={by} entry={entry} />
              </li>
            ))}
          </ol>
        </Card>
      )}
    </>
  )
}

function PrimaryStat({ by, entry }: { by: LeaderboardBy; entry: { level: number; points: number; streak_count: number } }) {
  if (by === 'level') return <span className="shrink-0 text-lg font-bold text-indigo-600">Lv.{entry.level}</span>
  if (by === 'points') return <span className="shrink-0 text-lg font-bold text-indigo-600">{entry.points}</span>
  return <span className="shrink-0 text-lg font-bold text-orange-600">{entry.streak_count}</span>
}
