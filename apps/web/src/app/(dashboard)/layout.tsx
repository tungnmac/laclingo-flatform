'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { SpeechErrorToaster } from '@/components/audio/SpeechErrorToaster'
import { BottomNav, MobileHeader, Sidebar } from '@/components/layout/DashboardNav'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialogProvider'
import { Spinner } from '@/components/ui/States'
import { MutationToaster } from '@/components/ui/MutationToaster'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { PaywallDialog } from '@/features/billing/components/PaywallDialog'
import { useUnreadPolling } from '@/features/notification/notificationStore'
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
  const logout = useSession((s) => s.logout)
  const setUser = useSession((s) => s.setUser)

  const valid = isSessionValid({ token, expiresAt }) && !!user

  useEffect(() => {
    if (!hydrated || valid) return
    // Token hết hạn hoặc chưa đăng nhập → dọn phiên rồi về trang đăng nhập
    logout()
    router.replace('/login')
  }, [hydrated, valid, logout, router])

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
            <MobileHeader user={user} />
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
function BackgroundSync() {
  useUnreadPolling()
  useEffect(() => {
    reminderService.updateTimezone(browserTimezone()).catch(() => {})
  }, [])
  return null
}
