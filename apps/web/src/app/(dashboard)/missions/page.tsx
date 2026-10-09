'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { missionService } from '@/features/mission/mission.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import type { MissionPeriod, MyMission } from '@/types/api'

const periodOrder: MissionPeriod[] = ['daily', 'weekly', 'monthly', 'event']

const actionIcons: Record<MyMission['action_type'], string> = {
  srs_review: '🧠',
  learn_word: '📚',
  grammar_exercise: '✍️',
  challenge_participate: '🎮',
  challenge_win: '🏆',
  listening_practice: '🎧',
}

export default function MissionsPage() {
  const { data, error, loading, reload } = useApi(missionService.listMine, [])
  const t = useTranslation()
  const periodLabels: Record<MissionPeriod, string> = {
    daily: t.missions.periodDaily,
    weekly: t.missions.periodWeekly,
    monthly: t.missions.periodMonthly,
    event: t.missions.periodEvent,
  }

  const grouped = periodOrder
    .map((period) => ({ period, missions: data?.filter((m) => m.period === period) ?? [] }))
    .filter((g) => g.missions.length > 0)

  return (
    <>
      <PageHeader title={t.missions.pageTitle} description={t.missions.pageDesc} />

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title={t.missions.emptyTitle} icon="🎯" />}

      <div className="space-y-6">
        {grouped.map((g) => (
          <section key={g.period}>
            <h2 className="mb-3 text-sm font-semibold text-slate-500">{periodLabels[g.period]}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {g.missions.map((m) => (
                <MissionCard key={m.id} mission={m} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}

function MissionCard({ mission }: { mission: MyMission }) {
  const percent = Math.min(100, Math.round((mission.progress_count / mission.target_count) * 100))
  const t = useTranslation()

  return (
    <Card className={cn('flex flex-col gap-3', mission.completed && 'bg-emerald-50 ring-emerald-200')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">
            {actionIcons[mission.action_type]} {mission.title}
          </p>
          {mission.description && <p className="mt-0.5 text-sm text-slate-500">{mission.description}</p>}
        </div>
        {mission.completed && <span className="shrink-0 text-xl">✅</span>}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>{t.missions.progressLabel}</span>
          <span className="font-semibold">
            {mission.progress_count}/{mission.target_count}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={cn('h-full rounded-full transition-all duration-300', mission.completed ? 'bg-emerald-500' : 'bg-indigo-500')}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <p className="text-sm font-medium text-slate-600">{t.missions.rewardLine(mission.reward_exp, mission.reward_points)}</p>
    </Card>
  )
}
