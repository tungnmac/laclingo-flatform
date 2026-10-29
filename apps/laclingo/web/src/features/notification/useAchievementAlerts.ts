import { useEffect } from 'react'
import { create } from 'zustand'
import { billingService } from '@/features/billing/billing.service'
import { useRewardsCount } from '@/features/billing/rewardsStore'
import { API_WRITE_EVENT } from '@/lib/api'
import type { AppNotification, GemReward, NotificationType } from '@/types/api'
import { notificationService } from './notification.service'
import { useNotificationStore } from './notificationStore'

// Thành tích báo ngay bằng hộp thoại giữa màn hình (AchievementDialog) thay vì chỉ tăng số trên chuông
const ALERT_TYPES: NotificationType[] = ['mission_completed', 'level_up']
const CHECK_DELAY_MS = 700 // chờ 1 nhịp sau thao tác ghi rồi mới kiểm tra
const MIN_CHECK_INTERVAL_MS = 4000 // ôn liên tục nhiều thẻ: tối đa 1 lần kiểm tra / 4 giây
// Quà gems đi kèm thành tích hiện ở hộp thoại (quà thắng thử thách nhận ở Ví như cũ)
const ALERT_REWARD_SOURCES: GemReward['source'][] = ['MISSION', 'LEVEL_UP']

/** Thành tích vừa đạt + quà gems vừa phát sinh, chờ hiện ở AchievementDialog */
interface AchievementState {
  items: AppNotification[]
  rewards: GemReward[]
  push: (items: AppNotification[], rewards: GemReward[]) => void
  /** Bỏ các thành tích / quà đã xử lý (thành tích mới tới trong lúc hộp thoại đang mở vẫn được giữ) */
  dismiss: (itemIds: string[], rewardIds: string[]) => void
}

export const useAchievements = create<AchievementState>()((set) => ({
  items: [],
  rewards: [],
  push: (items, rewards) => set((s) => ({ items: [...s.items, ...items], rewards: [...s.rewards, ...rewards] })),
  dismiss: (itemIds, rewardIds) =>
    set((s) => ({ items: s.items.filter((n) => !itemIds.includes(n.id)), rewards: s.rewards.filter((r) => !rewardIds.includes(r.id)) })),
}))

/**
 * Phát hiện hoàn thành nhiệm vụ / lên cấp: kiểm tra sau mỗi thao tác ghi dữ liệu (API_WRITE_EVENT) và khi số chưa đọc
 * tăng (thắng thử thách qua WebSocket — làm mới định kỳ ở useUnreadPolling). Thông báo / quà đã có lúc mở app không
 * báo lại. Gọi 1 lần ở dashboard layout (BackgroundSync).
 */
export function useAchievementAlerts() {
  useEffect(() => {
    const seenNotices = new Set<string>()
    const seenRewards = new Set<string>()
    let ready = false
    let selfUpdate = false // setUnread do chính check() — không kích hoạt kiểm tra lần nữa
    let lastCheck = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    // Quà mới phát sinh của nhiệm vụ / lên cấp; mọi quà đang có đều đánh dấu đã thấy
    const loadRewards = async () => {
      const { items } = await billingService.rewards()
      const fresh = items.filter((r) => !seenRewards.has(r.id))
      fresh.forEach((r) => seenRewards.add(r.id))
      return fresh.filter((r) => ALERT_REWARD_SOURCES.includes(r.source))
    }

    const check = async () => {
      lastCheck = Date.now()
      try {
        const page = await notificationService.list()
        selfUpdate = true
        useNotificationStore.getState().setUnread(page.unread_count)
        selfUpdate = false
        const fresh = page.items.filter((n) => !seenNotices.has(n.id))
        fresh.forEach((n) => seenNotices.add(n.id))
        if (!ready) {
          await loadRewards() // lần đầu: chỉ ghi nhận thông báo / quà đang có
          ready = true
          return
        }
        const achieved = fresh.filter((n) => ALERT_TYPES.includes(n.type) && !n.read_at).reverse()
        if (achieved.length === 0) return
        const rewards = await loadRewards().catch(() => [])
        useAchievements.getState().push(achieved, rewards)
        void useRewardsCount.getState().refresh()
      } catch {
        // lỗi mạng — lần thao tác sau kiểm tra lại
      }
    }
    const schedule = () => {
      clearTimeout(timer)
      const wait = Math.max(CHECK_DELAY_MS, lastCheck + MIN_CHECK_INTERVAL_MS - Date.now())
      timer = setTimeout(() => void check(), wait)
    }

    void check()
    window.addEventListener(API_WRITE_EVENT, schedule)
    const unsubscribe = useNotificationStore.subscribe((s, prev) => {
      if (ready && !selfUpdate && s.unread > prev.unread) schedule()
    })
    return () => {
      clearTimeout(timer)
      window.removeEventListener(API_WRITE_EVENT, schedule)
      unsubscribe()
    }
  }, [])
}
