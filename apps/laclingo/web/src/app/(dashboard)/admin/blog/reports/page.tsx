'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Pagination } from '@/components/admin/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { useToast } from '@/components/ui/ToastProvider'
import { moderationService } from '@/features/moderation/moderation.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'
import type { ReportedContent, ReportStatus } from '@/types/api'

const PAGE_SIZE = 20

/** Hàng chờ báo cáo nội dung (module blog): mỗi dòng là 1 bài viết / bình luận bị báo cáo, gom mọi báo cáo của nó */
export default function AdminReportsPage() {
  const t = useTranslation()
  const m = t.moderation
  const toast = useToast()
  const [status, setStatus] = useState<ReportStatus>('OPEN')
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState<string | null>(null)
  const { data, error, loading, reload } = useApi(() => moderationService.listReports(status, page, PAGE_SIZE), [status, page])

  const resolve = async (r: ReportedContent, action: 'hide' | 'dismiss') => {
    setBusy(r.target_id)
    try {
      await moderationService.resolve(r.target_type, r.target_id, action)
      toast(m.actionDone)
      reload()
    } catch (err) {
      toast(inlineError(err), 'error')
    } finally {
      setBusy(null)
    }
  }

  const tabs: { value: ReportStatus; label: string }[] = [
    { value: 'OPEN', label: m.statusOpen },
    { value: 'RESOLVED', label: m.statusResolved },
    { value: 'DISMISSED', label: m.statusDismissed },
  ]

  return (
    <>
      <PageHeader
        title={m.adminTitle}
        description={m.adminSubtitle}
        action={
          <ButtonLink href="/admin/blog" variant="secondary" size="sm">
            📝 {t.adminBlog.pageTitle}
          </ButtonLink>
        }
      />

      <div className="mb-4 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={status === tab.value}
            onClick={() => {
              setStatus(tab.value)
              setPage(1)
            }}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset',
              status === tab.value
                ? 'bg-indigo-600 text-white ring-indigo-600'
                : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState icon="🚩" title={m.empty} />}

      {data && data.items.length > 0 && (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {data.items.map((r) => (
              <li key={`${r.target_type}-${r.target_id}`} className="space-y-2 px-4 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                    {r.target_type === 'post' ? m.targetPost : r.target_type === 'chat' ? m.targetChat(r.room_code ?? '') : m.targetComment}
                  </span>
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-700">{m.reportCount(r.report_count)}</span>
                  {r.reasons.map((reason) => (
                    <span key={reason} className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">
                      {m.reasons[reason]}
                    </span>
                  ))}
                  {r.is_hidden && !r.deleted && <span className="rounded-full bg-slate-800 px-2 py-0.5 text-white">{m.hiddenNow}</span>}
                  <span className="text-slate-400">{formatDate(r.last_reported_at)}</span>
                </div>
                {r.deleted ? (
                  <p className="text-sm italic text-slate-400">{m.deletedContent}</p>
                ) : (
                  <div className="text-sm">
                    {r.post_title && <p className="font-semibold text-slate-900">{r.post_title}</p>}
                    <p className="mt-0.5 text-slate-600">{r.excerpt}</p>
                    {r.author_username && <p className="mt-1 text-xs text-slate-400">@{r.author_username}</p>}
                  </div>
                )}
                {r.notes && <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">“{r.notes}”</p>}
                <div className="flex flex-wrap gap-2">
                  {r.post_id && !r.deleted && (
                    <Link
                      href={`/blog/${r.post_id}`}
                      target="_blank"
                      className="rounded-xl px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                    >
                      {m.openPost} ↗
                    </Link>
                  )}
                  {status === 'OPEN' && (
                    <>
                      <Button size="sm" variant="danger" disabled={busy !== null} onClick={() => void resolve(r, 'hide')}>
                        {/* chat đã phát tức thời, không còn gì để ẩn — chỉ ghi nhận vi phạm */}
                        {r.target_type === 'chat' ? m.actionConfirmChat : m.actionHide}
                      </Button>
                      <Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => void resolve(r, 'dismiss')}>
                        {m.actionDismiss}
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />}
    </>
  )
}
