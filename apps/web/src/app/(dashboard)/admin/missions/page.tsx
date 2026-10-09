'use client'

import { useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { inputClass } from '@/features/auth/components/AuthForm'
import { missionService } from '@/features/mission/mission.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import type { Mission, MissionActionType, MissionPeriod, MissionRequest } from '@/types/api'

function toDateInputValue(iso?: string) {
  return iso ? iso.slice(0, 10) : ''
}

export default function AdminMissionsPage() {
  const confirm = useConfirm()
  const t = useTranslation()
  const { data, error, loading, reload } = useApi(missionService.listAll, [])

  const periodOptions: { value: MissionPeriod; label: string }[] = [
    { value: 'daily', label: t.adminMissions.periodDailyPlain },
    { value: 'weekly', label: t.adminMissions.periodWeeklyPlain },
    { value: 'monthly', label: t.adminMissions.periodMonthlyPlain },
    { value: 'event', label: t.adminMissions.periodEventPlain },
  ]

  const actionOptions: { value: MissionActionType; label: string }[] = [
    { value: 'srs_review', label: t.adminMissions.actionSrsReview },
    { value: 'learn_word', label: t.adminMissions.actionLearnWord },
    { value: 'grammar_exercise', label: t.adminMissions.actionGrammarExercise },
    { value: 'challenge_participate', label: t.adminMissions.actionChallengeParticipate },
    { value: 'challenge_win', label: t.adminMissions.actionChallengeWin },
    { value: 'listening_practice', label: t.adminMissions.actionListeningPractice },
  ]
  const [editing, setEditing] = useState<Mission | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const onEdit = (m: Mission) => {
    setEditing(m)
    setShowForm(true)
    setFormError(null)
  }

  const onCreateNew = () => {
    setEditing(null)
    setShowForm(true)
    setFormError(null)
  }

  const onDeactivate = async (m: Mission) => {
    if (!(await confirm(t.adminMissions.deactivateConfirm(m.title)))) return
    await missionService.deactivate(m.id)
    reload()
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const period = String(form.get('period')) as MissionPeriod
    const body: MissionRequest = {
      title: String(form.get('title') ?? '').trim(),
      description: String(form.get('description') ?? '').trim() || undefined,
      period,
      action_type: String(form.get('action_type')) as MissionActionType,
      target_count: Number(form.get('target_count')),
      reward_exp: Number(form.get('reward_exp')),
      reward_points: Number(form.get('reward_points')),
      is_active: editing ? form.get('is_active') === 'on' : true,
    }
    if (period === 'event') {
      const startsAt = String(form.get('starts_at') ?? '')
      const endsAt = String(form.get('ends_at') ?? '')
      if (!startsAt || !endsAt) {
        setFormError(t.adminMissions.eventDatesRequired)
        return
      }
      body.starts_at = new Date(startsAt).toISOString()
      body.ends_at = new Date(endsAt).toISOString()
    }

    setSaving(true)
    setFormError(null)
    try {
      if (editing) await missionService.update(editing.id, body)
      else await missionService.create(body)
      setShowForm(false)
      setEditing(null)
      reload()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title={t.adminMissions.pageTitle}
        description={t.adminMissions.pageDesc}
        action={!showForm && <Button onClick={onCreateNew}>{t.adminMissions.addMissionBtn}</Button>}
      />

      {showForm && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            {editing ? t.adminMissions.editMissionTitle(editing.title) : t.adminMissions.addMissionTitle}
          </h3>
          <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              {t.adminMissions.titleLabel}
              <input name="title" type="text" required maxLength={200} defaultValue={editing?.title} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              {t.adminMissions.descriptionLabel}
              <input name="description" type="text" defaultValue={editing?.description} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t.adminMissions.periodLabel}
              <select name="period" defaultValue={editing?.period ?? 'daily'} className={inputClass}>
                {periodOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t.adminMissions.actionLabel}
              <select name="action_type" defaultValue={editing?.action_type ?? 'srs_review'} className={inputClass}>
                {actionOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t.adminMissions.targetCountLabel}
              <input name="target_count" type="number" min={1} required defaultValue={editing?.target_count ?? 1} className={inputClass} />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-slate-700">
                {t.adminMissions.rewardExpLabel}
                <input name="reward_exp" type="number" min={0} required defaultValue={editing?.reward_exp ?? 0} className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                {t.adminMissions.rewardPointsLabel}
                <input
                  name="reward_points"
                  type="number"
                  min={0}
                  required
                  defaultValue={editing?.reward_points ?? 0}
                  className={inputClass}
                />
              </label>
            </div>
            <label className="block text-sm font-medium text-slate-700">
              {t.adminMissions.startsAtLabel}
              <input name="starts_at" type="date" defaultValue={toDateInputValue(editing?.starts_at)} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t.adminMissions.endsAtLabel}
              <input name="ends_at" type="date" defaultValue={toDateInputValue(editing?.ends_at)} className={inputClass} />
            </label>
            {editing && (
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
                <input name="is_active" type="checkbox" defaultChecked={editing.is_active} className="h-4 w-4 rounded border-slate-300" />
                {t.adminMissions.isActiveLabel}
              </label>
            )}

            {formError && (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200 sm:col-span-2">
                {formError}
              </p>
            )}

            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? t.adminCommon.savingBtn : t.adminCommon.saveBtn}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                {t.adminCommon.cancelBtn}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title={t.adminMissions.emptyMissions} icon="🎯" />}

      {data && data.length > 0 && (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {data.map((m) => (
              <li key={m.id} className={cn('flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6', !m.is_active && 'opacity-50')}>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {m.title} {!m.is_active && <span className="text-xs font-normal text-slate-400">{t.adminMissions.deactivatedSuffix}</span>}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {t.adminMissions.summaryLine(m.period, m.action_type, m.target_count, m.reward_exp, m.reward_points)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => onEdit(m)}>
                    {t.adminCommon.editBtn}
                  </Button>
                  {m.is_active && (
                    <Button variant="danger" size="sm" onClick={() => onDeactivate(m)}>
                      {t.adminMissions.deactivateBtn}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}
