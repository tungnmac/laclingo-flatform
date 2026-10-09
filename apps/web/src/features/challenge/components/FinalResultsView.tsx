'use client'

import { ButtonLink } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import type { ChallengeLeaderboardEntry } from '@/types/api'
import { participantName } from '../utils'

const medals = ['🥇', '🥈', '🥉']

/** Bảng xếp hạng cuối — dùng chung cho phòng vừa chơi xong (qua WS) và phòng đã finished từ trước (qua REST). */
export function FinalResultsView({ leaderboard, myUserId }: { leaderboard: ChallengeLeaderboardEntry[]; myUserId?: string }) {
  const t = useTranslation()
  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-4xl">🏁</p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">{t.challenges.gameOverTitle}</h2>
      </div>

      {leaderboard.length === 0 ? (
        <p className="text-center text-sm text-slate-500">{t.challenges.noLeaderboardData}</p>
      ) : (
        <Card className="p-0 sm:p-0">
          <ol className="divide-y divide-slate-100">
            {leaderboard.map((entry) => (
              <li
                key={entry.user_id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4',
                  entry.user_id === myUserId && 'bg-indigo-50',
                )}
              >
                <span className="w-8 shrink-0 text-center text-lg font-bold text-slate-500">{medals[entry.rank - 1] ?? entry.rank}</span>
                <Avatar
                  name={participantName(entry, t.challenges.defaultPlayerName)}
                  src={entry.avatar_url || undefined}
                  className="h-10 w-10 shrink-0 text-sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {participantName(entry, t.challenges.defaultPlayerName)}
                    {entry.user_id === myUserId && <span className="ml-2 text-xs font-normal text-indigo-600">{t.challenges.youSuffix}</span>}
                  </p>
                </div>
                <span className="shrink-0 font-bold text-indigo-600">
                  {entry.score} {t.challenges.pointsSuffix}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <div className="text-center">
        <ButtonLink href="/challenges">{t.challenges.newChallengeBtn}</ButtonLink>
      </div>
    </div>
  )
}
