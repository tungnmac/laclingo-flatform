'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/ToastProvider'
import { billingService } from '@/features/billing/billing.service'
import { useRewardsCount } from '@/features/billing/rewardsStore'
import { useTranslation } from '@/hooks/useTranslation'
import { notificationService } from '../notification.service'
import { useNotificationStore } from '../notificationStore'
import { useAchievements } from '../useAchievementAlerts'

/**
 * Hộp thoại giữa màn hình khi hoàn thành nhiệm vụ / lên cấp (xem useAchievementAlerts): nhận ngay quà gems vừa phát
 * sinh, hoặc "Để sau" — quà vẫn chờ nhận ở Ví. Đóng thì đánh dấu đã đọc các thông báo đó (đã xem ở đây).
 */
export function AchievementDialog() {
  const t = useTranslation()
  const b = t.billing
  const toast = useToast()
  const items = useAchievements((s) => s.items)
  const rewards = useAchievements((s) => s.rewards)
  const dismiss = useAchievements((s) => s.dismiss)
  const [busy, setBusy] = useState(false)
  const open = items.length > 0
  const gems = rewards.reduce((sum, r) => sum + r.amount, 0)

  // Chỉ xử lý những gì đang hiện lúc bấm — thành tích tới sau (trong lúc nhận quà) vẫn còn để hiện tiếp
  const close = (shownItems = items, shownRewards = rewards) => {
    for (const n of shownItems) void notificationService.markRead(n.id).catch(() => {})
    void useNotificationStore.getState().refreshUnread()
    dismiss(
      shownItems.map((n) => n.id),
      shownRewards.map((r) => r.id),
    )
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, busy, items])

  const claim = async () => {
    const shownItems = items
    const shownRewards = rewards
    setBusy(true)
    let claimed = 0
    for (const r of shownRewards) {
      try {
        claimed += (await billingService.claimReward(r.id)).claimed ?? 0
      } catch {
        // quà đã nhận ở nơi khác / lỗi mạng — vẫn nhận các quà còn lại; quà lỗi vẫn chờ ở Ví
      }
    }
    setBusy(false)
    if (claimed > 0) toast(b.claimedToast(claimed))
    void useRewardsCount.getState().refresh()
    close(shownItems, shownRewards)
  }

  if (!open) return null
  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={() => !busy && close()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievement-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl"
      >
        <p className="text-5xl" aria-hidden>
          {items.length === 1 ? items[0].icon : '🎉'}
        </p>
        <h3 id="achievement-title" className="mt-3 text-lg font-bold text-slate-900">
          {items.length === 1 ? items[0].title : b.achievementTitle(items.length)}
        </h3>
        {items.length === 1 ? (
          <p className="mt-2 text-sm text-slate-600">{items[0].body}</p>
        ) : (
          <ul className="mt-3 space-y-1 text-left text-sm text-slate-700">
            {items.map((n) => (
              <li key={n.id}>
                {n.icon} {n.title}
              </li>
            ))}
          </ul>
        )}
        {gems > 0 && <p className="mt-4 rounded-xl bg-sky-50 py-2 text-sm font-semibold text-sky-700">💎 +{gems} gems</p>}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse sm:justify-center">
          {gems > 0 ? (
            <>
              <Button autoFocus disabled={busy} onClick={() => void claim()}>
                {busy ? b.claiming : b.claimNow(gems)}
              </Button>
              <Button variant="secondary" disabled={busy} onClick={() => close()}>
                {b.claimLater}
              </Button>
            </>
          ) : (
            <Button autoFocus onClick={() => close()}>
              {b.achievementOk}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
