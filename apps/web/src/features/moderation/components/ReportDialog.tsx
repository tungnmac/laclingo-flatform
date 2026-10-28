'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/ToastProvider'
import { inputClass } from '@/features/auth/components/AuthForm'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { ReportReason, ReportTargetType } from '@/types/api'
import { moderationService } from '../moderation.service'

const REASONS: ReportReason[] = ['spam', 'harassment', 'hate', 'sexual', 'violence', 'other']

/** Hộp thoại báo cáo 1 bài viết / bình luận — chọn lý do + mô tả thêm. onReported: nội dung có thể vừa bị tự ẩn. */
export function ReportDialog({
  target,
  onClose,
  onReported,
}: {
  target: { type: ReportTargetType; id: string } | null
  onClose: () => void
  onReported?: (autoHidden: boolean) => void
}) {
  const m = useTranslation().moderation
  const toast = useToast()
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setReason(null)
    setNote('')
    setError(null)
  }, [target])
  useEffect(() => {
    if (!target) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [target, busy, onClose])

  if (!target) return null
  const submit = async () => {
    if (!reason) return
    setBusy(true)
    setError(null)
    try {
      const { auto_hidden } = await moderationService.report({ target_type: target.type, target_id: target.id, reason, note: note.trim() })
      toast(auto_hidden ? m.reportedAutoHidden : m.reported)
      onReported?.(auto_hidden)
      onClose()
    } catch (err) {
      setError(inlineError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h3 id="report-title" className="text-lg font-bold text-slate-900">
          🚩 {target.type === 'post' ? m.reportPost : m.reportComment}
        </h3>
        <p className="mt-1 text-sm text-slate-500">{m.reportHint}</p>
        <fieldset className="mt-4 space-y-1.5">
          <legend className="sr-only">{m.reportTitle}</legend>
          {REASONS.map((r) => (
            <label
              key={r}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm ring-1 ring-inset',
                reason === r ? 'bg-rose-50 text-rose-800 ring-rose-200' : 'text-slate-700 ring-slate-200 hover:bg-slate-50',
              )}
            >
              <input
                type="radio"
                name="report-reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                autoFocus={r === REASONS[0]}
                className="accent-rose-600"
              />
              {m.reasons[r]}
            </label>
          ))}
        </fieldset>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder={m.notePlaceholder}
          className={cn(inputClass, 'mt-3')}
        />
        {error && (
          <p role="alert" className="mt-2 text-sm text-rose-600">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <Button variant="danger" disabled={!reason || busy} onClick={() => void submit()}>
            {m.submit}
          </Button>
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            {m.cancel}
          </Button>
        </div>
      </div>
    </div>
  )
}
