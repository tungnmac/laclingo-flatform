'use client'

import { useEffect } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { useNotificationStore } from '@/features/notification/notificationStore'
import { PUSH_RECEIVED_EVENT, type PushReceived } from '../push'

/** App đang mở mà có thông báo đẩy (vd nhắc học, gửi thử): hiện toast + cập nhật số trên chuông thông báo */
export function PushReceivedToaster() {
  const toast = useToast()
  const refreshUnread = useNotificationStore((s) => s.refreshUnread)
  useEffect(() => {
    const onPush = (e: Event) => {
      const { title, body } = (e as CustomEvent<PushReceived>).detail
      const text = [title, body].filter(Boolean).join(' — ')
      if (text) toast(`🔔 ${text}`)
      void refreshUnread()
    }
    window.addEventListener(PUSH_RECEIVED_EVENT, onPush)
    return () => window.removeEventListener(PUSH_RECEIVED_EVENT, onPush)
  }, [toast, refreshUnread])
  return null
}
