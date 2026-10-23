'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { inputClass } from '@/features/auth/components/AuthForm'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import { missionService } from '../mission.service'

/** Admin: mức gems thưởng tự động — thắng thử thách, lên level (quà vào "Quà chờ nhận" ở Ví của học viên) */
export function GemRewardSettingsCard() {
  const t = useTranslation()
  const a = t.adminMissions
  const { data, reload } = useApi(() => missionService.getRewardSettings(), [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setSaving(true)
    setError(null)
    try {
      await missionService.updateRewardSettings({
        challenge_win_gems: Number(form.get('challenge_win_gems')),
        level_up_gems_per_level: Number(form.get('level_up_gems_per_level')),
      })
      reload()
    } catch (err) {
      setError(inlineError(err))
    } finally {
      setSaving(false)
    }
  }

  if (!data) return null
  return (
    <Card className="mb-6">
      <h2 className="text-base font-semibold text-slate-900">{a.gemSettingsTitle}</h2>
      <p className="text-sm text-slate-500">{a.gemSettingsDesc}</p>
      <form key={`${data.challenge_win_gems}-${data.level_up_gems_per_level}`} onSubmit={onSubmit} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block text-sm font-medium text-slate-700">
          {a.challengeWinGemsLabel}
          <input name="challenge_win_gems" type="number" min={0} max={1000} required defaultValue={data.challenge_win_gems} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {a.levelUpGemsLabel}
          <input name="level_up_gems_per_level" type="number" min={0} max={1000} required defaultValue={data.level_up_gems_per_level} className={inputClass} />
        </label>
        <Button type="submit" disabled={saving}>
          {a.gemSettingsSave}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </Card>
  )
}
