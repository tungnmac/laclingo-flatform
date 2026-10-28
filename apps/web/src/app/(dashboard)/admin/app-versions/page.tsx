'use client'

import { useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { ErrorState, Spinner } from '@/components/ui/States'
import { useToast } from '@/components/ui/ToastProvider'
import { inputClass } from '@/features/auth/components/AuthForm'
import { appVersionService, compareVersions } from '@/features/app-version/appVersion'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { AppVersionInfo } from '@/types/api'

/** Phiên bản app iOS/Android (module app_versions): tối thiểu = bắt buộc cập nhật, mới nhất = nhắc cập nhật */
export default function AdminAppVersionsPage() {
  const t = useTranslation().appVersion
  const { data, error, loading, reload } = useApi(() => appVersionService.list(), [])

  return (
    <>
      <PageHeader title={t.moduleTitle} description={t.pageDesc} />
      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      <div className="grid gap-4 lg:grid-cols-2">
        {data?.map((v) => (
          <PlatformForm key={v.platform} value={v} />
        ))}
      </div>
    </>
  )
}

function PlatformForm({ value }: { value: AppVersionInfo }) {
  const t = useTranslation().appVersion
  const toast = useToast()
  const confirm = useConfirm()
  const [current, setCurrent] = useState(value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const field = (name: string) => String(form.get(name) ?? '').trim()
    // Nâng phiên bản tối thiểu = chặn mọi máy cũ hơn — gõ nhầm (2.0 thay vì 1.2) là khoá toàn bộ học viên
    const min = field('min_version')
    if (compareVersions(min, current.min_version) > 0 && !(await confirm({ description: t.raiseMinConfirm(min), danger: true }))) return
    setSaving(true)
    setError(null)
    try {
      setCurrent(
        await appVersionService.update(value.platform, {
          min_version: field('min_version'),
          latest_version: field('latest_version'),
          store_url: field('store_url'),
          message: field('message'),
        }),
      )
      toast(t.saved)
    } catch (err) {
      setError(inlineError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900">{t.platform[value.platform]}</h2>
      <p className="mt-0.5 text-xs text-slate-400">{t.updatedAt(formatDate(current.updated_at))}</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-slate-700">
            {t.minLabel}
            <input name="min_version" defaultValue={current.min_version} required pattern="\d{1,4}(\.\d{1,4}){0,2}" placeholder="1.0.0" className={inputClass} />
            <span className="mt-1 block text-xs font-normal text-slate-500">{t.minHint}</span>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            {t.latestLabel}
            <input name="latest_version" defaultValue={current.latest_version} required pattern="\d{1,4}(\.\d{1,4}){0,2}" placeholder="1.2.0" className={inputClass} />
            <span className="mt-1 block text-xs font-normal text-slate-500">{t.latestHint}</span>
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          {t.storeUrlLabel}
          <input
            name="store_url"
            type="url"
            required
            defaultValue={current.store_url}
            placeholder={value.platform === 'ios' ? 'https://apps.apple.com/app/id…' : 'https://play.google.com/store/apps/details?id=vn.laclingo.app'}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t.messageLabel}
          <textarea name="message" defaultValue={current.message} rows={2} maxLength={300} placeholder={t.messagePlaceholder} className={inputClass} />
        </label>
        {error && (
          <p role="alert" className="text-sm text-rose-600">
            {error}
          </p>
        )}
        <Button type="submit" disabled={saving}>
          {t.save}
        </Button>
      </form>
    </Card>
  )
}
