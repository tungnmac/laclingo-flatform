'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { OFFLINE_REVIEW_PATH } from '@/features/srs-review/offline'
import { useTranslation } from '@/hooks/useTranslation'

/** Báo đang offline (dữ liệu đã lưu trên máy) — trang ôn tập có thông báo riêng nên không hiện ở đó */
export function OfflineBanner() {
  const t = useTranslation()
  const pathname = usePathname()
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  if (!offline || pathname === OFFLINE_REVIEW_PATH) return null
  return <p className="mb-4 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-800">📴 {t.common.offlineBanner}</p>
}
