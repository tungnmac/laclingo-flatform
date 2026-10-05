'use client'

import { XPBadge } from './XPBadge'
import { StreakDisplay } from './StreakDisplay'
import type { UserProgress } from '@/api/exerciseApi'

interface ProgressDashboardProps {
  progress: UserProgress | null
  loading?: boolean
  error?: string | null
}

export function ProgressDashboard({ progress, loading, error }: ProgressDashboardProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        {error}
      </div>
    )
  }

  if (!progress) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <XPBadge xp={progress.totalXp} level={progress.level} />
      <StreakDisplay streak={progress.streak} />
    </div>
  )
}
