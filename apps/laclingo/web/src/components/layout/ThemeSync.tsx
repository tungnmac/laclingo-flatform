'use client'

import { useEffect } from 'react'
import { DEFAULT_THEME, applyTheme, isThemeId } from '@/lib/themes'
import { useSession } from '@/store/session'

/**
 * Áp tông màu chủ đạo theo tài khoản đang đăng nhập (users.theme — chưa có thì mặc định, kể cả user lưu trên máy từ
 * trước khi có theme: dashboard nạp lại user từ server sau đó); đã đăng xuất thì giữ theme đã nhớ trên máy
 */
export function ThemeSync() {
  const loggedIn = useSession((s) => !!s.user)
  const theme = useSession((s) => s.user?.theme)
  useEffect(() => {
    if (loggedIn) applyTheme(isThemeId(theme) ? theme : DEFAULT_THEME)
  }, [loggedIn, theme])
  return null
}
