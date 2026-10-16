'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Pagination } from '@/components/admin/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { useToast } from '@/components/ui/ToastProvider'
import { inputClass } from '@/features/auth/components/AuthForm'
import { notificationService } from '@/features/notification/notification.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { formatDate } from '@/lib/utils'
import type { Announcement } from '@/types/api'

const PAGE_SIZE = 20

/** Admin: gửi thông báo chung vào chuông của mọi học viên + lịch sử đã gửi (thu hồi được). */
export default function AdminAnnouncementsPage() {
  const t = useTranslation()
  const toast = useToast()
  const confirm = useConfirm()
  const [page, setPage] = useState(1)
  const { data, error, loading, reload } = useApi(() => notificationService.listAnnouncements(page, PAGE_SIZE), [page])
  const [sending, setSending] = useState(false)

  // Thu hồi mục cuối của 1 trang > 1 → trang đó rỗng (total cũng về 0 do COUNT OVER()) — lùi về trang trước
  useEffect(() => {
    if (page > 1 && data && data.items.length === 0) setPage(page - 1)
  }, [data, page])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formEl = e.currentTarget
    const form = new FormData(formEl)
    if (!(await confirm({ description: t.adminAnnouncements.sendConfirm }))) return
    setSending(true)
    try {
      const sent = await notificationService.createAnnouncement({
        title: String(form.get('title') ?? '').trim(),
        body: String(form.get('body') ?? '').trim(),
        url: String(form.get('url') ?? '').trim() || undefined,
      })
      toast(t.adminAnnouncements.sent(sent.recipient_count))
      formEl.reset()
      setPage(1)
      reload()
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setSending(false)
    }
  }

  const onDelete = async (a: Announcement) => {
    if (!(await confirm({ description: t.adminAnnouncements.deleteConfirm(a.title), danger: true }))) return
    try {
      await notificationService.deleteAnnouncement(a.id)
      reload()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  return (
    <>
      <PageHeader title={t.adminAnnouncements.pageTitle} description={t.adminAnnouncements.pageDesc} />

      <Card className="max-w-2xl">
        <h3 className="text-base font-semibold text-slate-900">{t.adminAnnouncements.formTitle}</h3>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <fieldset disabled={sending} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              {t.adminAnnouncements.titleLabel}
              <input name="title" type="text" required maxLength={200} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t.adminAnnouncements.bodyLabel}
              <textarea name="body" rows={3} maxLength={2000} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t.adminAnnouncements.urlLabel}
              <input name="url" type="text" pattern="/(?!/).*" placeholder="/blog" className={inputClass} />
              <span className="mt-1 block text-xs font-normal text-slate-500">{t.adminAnnouncements.urlHint}</span>
            </label>
          </fieldset>
          <div className="flex justify-end">
            <Button type="submit" disabled={sending}>
              {sending ? t.adminAnnouncements.sending : t.adminAnnouncements.sendBtn}
            </Button>
          </div>
        </form>
      </Card>

      <h3 className="mb-3 mt-8 text-lg font-semibold text-slate-900">{t.adminAnnouncements.historyTitle}</h3>
      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon="📭" title={t.adminAnnouncements.empty} />
      ) : (
        <>
          <Card className="p-0">
            <ul className="divide-y divide-slate-100">
              {data.items.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-4 py-3 sm:px-6">
                  <span className="text-xl">📢</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{a.title}</p>
                    {a.body && <p className="mt-0.5 whitespace-pre-line text-sm text-slate-600">{a.body}</p>}
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(a.created_at)} · {t.adminAnnouncements.stats(a.read_count, a.recipient_count)}
                      {a.url && <> · {a.url}</>}
                    </p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => onDelete(a)}>
                    {t.adminAnnouncements.deleteBtn}
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
          <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
        </>
      )}
    </>
  )
}
