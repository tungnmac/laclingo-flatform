'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { initNativePush } from '@/features/reminder/push'

// Chỉ có tác dụng trong app iOS/Android (Capacitor): bấm thông báo đẩy → mở đúng trang của thông báo
export function NativeAppBridge() {
  const router = useRouter()
  useEffect(() => {
    initNativePush((url) => router.push(url))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
