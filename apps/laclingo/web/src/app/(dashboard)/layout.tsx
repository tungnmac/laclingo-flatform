'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { SpeechErrorToaster } from '@/components/audio/SpeechErrorToaster'
import { BottomNav, Sidebar, TopBar } from '@/components/layout/DashboardNav'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialogProvider'
import { Spinner } from '@/components/ui/States'
import { MutationToaster } from '@/components/ui/MutationToaster'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { reloadAsActiveAccount } from '@/features/auth/components/AccountList'
import { useRewardsCount } from '@/features/billing/rewardsStore'
import { PaywallDialog } from '@/features/billing/components/PaywallDialog'
import { useUnreadPolling } from '@/features/notification/notificationStore'
import { AchievementDialog } from '@/features/notification/components/AchievementDialog'
import { useAchievementAlerts } from '@/features/notification/useAchievementAlerts'
import { initStoreTransactions } from '@/features/billing/iap'
import { browserTimezone } from '@/features/reminder/push'
import { PushReceivedToaster } from '@/features/reminder/components/PushReceivedToaster'
import { reminderService } from '@/features/reminder/reminder.service'
import { LanguageSyncBanner } from '@/features/onboarding/components/LanguageSyncBanner'
import { useOfflineReviewSync } from '@/features/srs-review/offline'
import { userService } from '@/features/user/user.service'
import { useHydrated } from '@/hooks/useHydrated'
import { isSessionValid, useSession } from '@/store/session'
import { API_URL } from '@/lib/api'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const hydrated = useHydrated()
  const router = useRouter()
  const pathname = usePathname()
  const onboarding = pathname === '/onboarding'
  const user = useSession((s) => s.user)
  const token = useSession((s) => s.token)
  const expiresAt = useSession((s) => s.expiresAt)
  const refreshToken = useSession((s) => s.refreshToken)
  const refreshExpiresAt = useSession((s) => s.refreshExpiresAt)
  const setUser = useSession((s) => s.setUser)

  // Access token hết hạn mà refresh token còn hạn vẫn là phiên hợp lệ — request đầu tiên tự làm mới (xem apiFetch)
  const valid = isSessionValid({ token, expiresAt, refreshToken, refreshExpiresAt }) && !!user

  // Phiên hết hạn mà máy đang offline (không tới được máy chủ): vẫn cho vào app với dữ liệu đã lưu — offline không đăng
  // nhập lại được. Có mạng lại (sự kiện online) thì kiểm tra lại: lúc đó mới xử lý hết phiên như bình thường
  const [offlineSession, setOfflineSession] = useState(false)
  const [onlineTick, setOnlineTick] = useState(0)
  useEffect(() => {
    const onOnline = () => setOnlineTick((n) => n + 1)
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  useEffect(() => {
    if (!hydrated || valid) return
    let cancelled = false
    void (async () => {
      // Kể cả đã bị đưa về trang đăng nhập (user rỗng) lúc mất mạng: còn tài khoản trên máy thì dùng lại tài khoản gần nhất
      if (useSession.getState().accounts.length > 0 && !(await serverReachable())) {
        if (!cancelled && useSession.getState().resumeOffline()) setOfflineSession(true)
        return
      }
      if (cancelled) return
      setOfflineSession(false)
      // Phiên đang dùng hết hạn / chưa đăng nhập: còn tài khoản khác còn phiên → chuyển sang (tải lại trang như mọi lần
      // chuyển tài khoản); không thì về đăng nhập — tài khoản hết hạn vẫn giữ trong danh sách để đăng nhập lại (điền sẵn
      // tên). Đọc store trực tiếp + chỉ chạy theo hydrated/valid: deactivate() xoá user thì không làm mất ?relogin
      const { accounts, user: current, activate, deactivate } = useSession.getState()
      const other = accounts.find((a) => a.user.id !== current?.id && isSessionValid(a))
      if (other && activate(other.user.id)) return reloadAsActiveAccount()
      deactivate()
      router.replace(current ? `/login?relogin=${encodeURIComponent(current.username)}` : '/login')
    })()
    return () => {
      cancelled = true
    }
  }, [hydrated, valid, router, onlineTick])

  useEffect(() => {
    if (!valid) return
    // Đồng bộ lại role/admin_modules/is_active từ server 1 lần khi vào dashboard —
    // dữ liệu user cached trong localStorage từ lúc login, nếu quyền bị người
    // khác đổi (cấp/thu hồi quyền, owner migration...) sau đó thì sẽ bị cũ cho
    // tới khi đăng nhập lại nếu không refresh chủ động như này.
    // Chưa qua onboarding (user mới hoặc user cũ trước khi có tính năng) → mở các bước thiết lập. Chỉ khi đang có mạng
    // (mất mạng thì trang onboarding cũng không tải được) và server trả rõ null: backend bản cũ không có field này
    // (undefined) thì không chuyển
    userService
      .me()
      .then((fresh) => {
        setUser(fresh)
        if (fresh.onboarded_at === null && navigator.onLine && window.location.pathname !== '/onboarding') router.replace('/onboarding')
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid])

  if (!hydrated || !(valid || offlineSession) || !user) return <Spinner />

  // Onboarding: toàn màn hình, không sidebar / menu
  if (onboarding)
    return (
      <ToastProvider>
        <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-slate-50 px-4 pb-[calc(2.5rem+var(--safe-bottom))] pt-[calc(2rem+var(--safe-top))] sm:px-6">
          {children}
        </main>
      </ToastProvider>
    )

  return (
    <ToastProvider>
      <ConfirmDialogProvider>
        <BackgroundSync />
        <SpeechErrorToaster />
        <PaywallDialog />
        <AchievementDialog />
        <MutationToaster />
        <PushReceivedToaster />
        <div className="flex min-h-screen">
          <Sidebar user={user} />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar user={user} />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-[calc(6rem+var(--safe-bottom))] pt-6 sm:px-6 md:pb-10 lg:px-8 lg:pt-10">
              <OfflineBanner />
              <LanguageSyncBanner />
              {children}
            </main>
          </div>
          <BottomNav />
        </div>
      </ConfirmDialogProvider>
    </ToastProvider>
  )
}

/** Chỉ mount khi đã đăng nhập: làm mới số thông báo chưa đọc cho chuông, và lưu
 * múi giờ trình duyệt 1 lần mỗi lần vào app (nhắc học theo giờ địa phương) */
const REWARDS_POLL_MS = 60_000

function BackgroundSync() {
  useUnreadPolling()
  useAchievementAlerts()
  useOfflineReviewSync() // kết quả ôn lúc mất mạng → gửi khi có mạng lại
  useEffect(() => {
    reminderService.updateTimezone(browserTimezone()).catch(() => {})
    initStoreTransactions() // app iOS/Android: xử lý giao dịch store đến ngoài luồng mua (gia hạn, mua dở...)
    // Badge quà gems chờ nhận: tải khi vào app, định kỳ và khi quay lại tab (quà mới từ nhiệm vụ / thắng thử thách)
    const refresh = () => void useRewardsCount.getState().refresh()
    refresh()
    const timer = setInterval(refresh, REWARDS_POLL_MS)
    const onVisible = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
  return null
}

/** Tới được máy chủ API không — mất mạng / Wi-Fi không có Internet (navigator.onLine vẫn true) đều coi là offline */
async function serverReachable(): Promise<boolean> {
  if (!navigator.onLine) return false
  try {
    await fetch(`${API_URL}/locales`, { signal: AbortSignal.timeout(5000), cache: 'no-store' })
    return true
  } catch {
    return false
  }
}
