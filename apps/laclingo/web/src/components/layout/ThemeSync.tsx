'use client'

import { useEffect } from 'react'
import { applyTheme, isThemeId } from '@/lib/themes'
import { useSession } from '@/store/session'

/** Áp tông màu chủ đạo theo tài khoản đang đăng nhập (users.theme); chưa đăng nhập thì giữ theme đã nhớ trên máy */
export function ThemeSync() {
  const theme = useSession((s) => s.user?.theme)
  useEffect(() => {
    if (isThemeId(theme)) applyTheme(theme)
  }, [theme])
  return null
}
