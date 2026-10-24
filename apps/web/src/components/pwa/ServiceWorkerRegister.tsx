'use client'

import { useEffect } from 'react'

// Đăng ký /sw.js ngay khi mở app (trước đây chỉ đăng ký lúc bật nhắc học) — để cài được PWA và có trang offline
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
  return null
}
