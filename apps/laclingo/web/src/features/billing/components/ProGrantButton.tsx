'use client'

import { useState, type MouseEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { inputClass } from '@/features/auth/components/AuthForm'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import { displayName, formatDate } from '@/lib/utils'
import type { SubscriptionPlan, User } from '@/types/api'
import { billingService } from '../billing.service'
import { PLAN_ORDER } from '../pricing'

/** Admin (module users): xem / cấp / thu hồi gói Pro của 1 học viên — đợt này chưa có thanh toán online */
export function ProGrantButton({ user }: { user: User }) {
  const t = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={(e: MouseEvent) => {
          e.stopPropagation()
          setOpen(true)
        }}
      >
        {t.billing.admin.proBtn}
      </Button>
      {open && <ProGrantDialog user={user} onClose={() => setOpen(false)} />}
    </>
  )
}

function ProGrantDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const t = useTranslation()
  const a = t.billing.admin
  const confirm = useConfirm()
  const { data: sub, loading, reload } = useApi(() => billingService.adminGet(user.id), [user.id])
  const [plan, setPlan] = useState<SubscriptionPlan>('MONTHLY')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
      reload()
    } catch (err) {
      setError(inlineError(err))
    } finally {
      setBusy(false)
    }
  }
  const revoke = async () => {
    if (!(await confirm({ description: a.revokeConfirm(displayName(user)), danger: true }))) return
    await run(() => billingService.adminRevoke(user.id))
  }

  return (
    <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" onClick={(e) => (e.stopPropagation(), onClose())}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pro-grant-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-xl"
      >
        <h3 id="pro-grant-title" className="text-base font-semibold text-slate-900">
          {a.dialogTitle(displayName(user))}
        </h3>
        <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
          <span className="text-slate-500">{a.current}: </span>
          {loading ? '…' : sub ? (
            <span className="font-semibold text-orange-700">
              ⭐ {t.billing.plans[sub.plan]} · {sub.expires_at ? a.expires(formatDate(sub.expires_at)) : a.lifetime}
              {sub.note && <span className="block text-xs font-normal text-slate-500">{sub.note}</span>}
            </span>
          ) : (
            <span className="font-semibold text-slate-700">{a.noPlan}</span>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
          <label className="block text-sm font-medium text-slate-700">
            {a.plan}
            <select value={plan} onChange={(e) => setPlan(e.target.value as SubscriptionPlan)} className={inputClass}>
              {PLAN_ORDER.map((p) => (
                <option key={p} value={p}>
                  {t.billing.plans[p]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            {a.note}
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder={a.notePlaceholder} className={inputClass} />
          </label>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          {sub && (
            <Button variant="danger" size="sm" disabled={busy} onClick={() => void revoke()}>
              {a.revokeBtn}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onClose}>
            {a.close}
          </Button>
          <Button size="sm" disabled={busy} onClick={() => void run(() => billingService.adminGrant(user.id, plan, note.trim() || undefined))}>
            {a.grantBtn}
          </Button>
        </div>
      </div>
    </div>
  )
}
