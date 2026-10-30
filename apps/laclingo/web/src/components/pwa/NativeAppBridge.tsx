'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { initNativePush } from '@/features/reminder/push'
import { hideNativeSplash } from '@/lib/nativeSplash'

// Chỉ có tác dụng trong app iOS/Android (Capacitor): ẩn màn khởi động khi web đã vẽ; bấm thông báo đẩy → mở đúng trang
export function NativeAppBridge() {
  const router = useRouter()
  useEffect(() => {
    hideNativeSplash()
    initNativePush((url) => router.push(url))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
