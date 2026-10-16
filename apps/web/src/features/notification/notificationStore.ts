import { useEffect } from 'react'
import { create } from 'zustand'
import { notificationService } from './notification.service'

// Số thông báo chưa đọc — dùng chung cho chuông ở sidebar (desktop) và header
// (mobile) để 2 nơi luôn khớp nhau. Không persist: luôn lấy lại từ server.
interface NotificationState {
  unread: number
  setUnread: (n: number) => void
  decrementUnread: () => void
  refreshUnread: () => Promise<void>
}

const REFRESH_MS = 60_000

export const useNotificationStore = create<NotificationState>()((set) => ({
  unread: 0,
  setUnread: (n) => set({ unread: Math.max(0, n) }),
  decrementUnread: () => set((s) => ({ unread: Math.max(0, s.unread - 1) })),
  refreshUnread: async () => {
    try {
      const { count } = await notificationService.unreadCount()
      set({ unread: count })
    } catch {
      // Lỗi mạng tạm thời — giữ số cũ, lần làm mới sau sẽ thử lại
    }
  },
}))

/** Làm mới số chưa đọc mỗi 60s (chỉ khi tab đang hiện) và ngay khi quay lại tab — gọi 1 lần ở dashboard layout */
export function useUnreadPolling() {
  const refreshUnread = useNotificationStore((s) => s.refreshUnread)
  useEffect(() => {
    void refreshUnread()
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') void refreshUnread()
    }
    const timer = window.setInterval(refreshIfVisible, REFRESH_MS)
    document.addEventListener('visibilitychange', refreshIfVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refreshIfVisible)
    }
  }, [refreshUnread])
}
