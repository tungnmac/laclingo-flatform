'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { SpeechErrorToaster } from '@/components/audio/SpeechErrorToaster'
import { BottomNav, Sidebar, TopBar } from '@/components/layout/DashboardNav'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialogProvider'
import { Spinner } from '@/components/ui/States'
import { MutationToaster } from '@/components/ui/MutationToaster'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { reloadAsActiveAccount } from '@/features/auth/components/AccountList'
import { useRewardsCount } from '@/features/billing/rewardsStore'
import { PaywallDialog } from '@/features/billing/components/PaywallDialog'
import { useUnreadPolling } from '@/features/notification/notificationStore'
import { initStoreTransactions } from '@/features/billing/iap'
import { browserTimezone } from '@/features/reminder/push'
import { reminderService } from '@/features/reminder/reminder.service'
import { userService } from '@/features/user/user.service'
import { useHydrated } from '@/hooks/useHydrated'
import { isSessionValid, useSession } from '@/store/session'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const hydrated = useHydrated()
  const router = useRouter()
  const user = useSession((s) => s.user)
  const token = useSession((s) => s.token)
  const expiresAt = useSession((s) => s.expiresAt)
  const setUser = useSession((s) => s.setUser)

  const valid = isSessionValid({ token, expiresAt }) && !!user

  useEffect(() => {
    if (!hydrated || valid) return
    // Phiên đang dùng hết hạn / chưa đăng nhập: còn tài khoản khác còn phiên → chuyển sang (tải lại trang như mọi lần
    // chuyển tài khoản); không thì về đăng nhập — tài khoản hết hạn vẫn giữ trong danh sách để đăng nhập lại (điền sẵn tên).
    // Đọc store trực tiếp + chỉ chạy theo hydrated/valid: deactivate() xoá user thì effect không chạy lại làm mất ?relogin
    const { accounts, user: current, activate, deactivate } = useSession.getState()
    const other = accounts.find((a) => a.user.id !== current?.id && isSessionValid(a))
    if (other && activate(other.user.id)) return reloadAsActiveAccount()
    deactivate()
    router.replace(current ? `/login?relogin=${encodeURIComponent(current.username)}` : '/login')
  }, [hydrated, valid, router])

  useEffect(() => {
    if (!valid) return
    // Đồng bộ lại role/admin_modules/is_active từ server 1 lần khi vào dashboard —
    // dữ liệu user cached trong localStorage từ lúc login, nếu quyền bị người
    // khác đổi (cấp/thu hồi quyền, owner migration...) sau đó thì sẽ bị cũ cho
    // tới khi đăng nhập lại nếu không refresh chủ động như này.
    userService.me().then(setUser).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid])

  if (!hydrated || !valid || !user) return <Spinner />

  return (
    <ToastProvider>
      <ConfirmDialogProvider>
        <BackgroundSync />
        <SpeechErrorToaster />
        <PaywallDialog />
        <MutationToaster />
        <div className="flex min-h-screen">
          <Sidebar user={user} />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar user={user} />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-10 lg:px-8 lg:pt-10">{children}</main>
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
