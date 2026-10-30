'use client'

import { useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { registerLanguages } from '@/lib/languageMeta'
import { fallbackLocale, useLocale, useLocales } from '@/store/locale'
import type { Language, UILocale } from '@/types/api'

/**
 * Nạp 1 lần khi mở app: danh sách ngôn ngữ giao diện (GET /locales — backend cấu hình UI_LOCALES) và thông tin ngôn ngữ
 * học (GET /languages/catalog: cờ, mã đọc phát âm...). Ngôn ngữ đang chọn không còn trong danh sách → đổi sang ngôn ngữ
 * thay thế (fallbackLocale). Lỗi / offline: giữ danh sách lần trước (lưu local) hoặc bản dựng sẵn.
 */
export function LocaleSync() {
  useEffect(() => {
    apiFetch<UILocale[]>('/locales')
      .then((list) => {
        if (!list?.length) return
        const locales = list.map((l) => ({ value: l.code, flag: l.flag, label: l.native_name }))
        useLocales.getState().setLocales(locales)
        const { locale, setLocale } = useLocale.getState()
        const next = fallbackLocale(locale, locales)
        if (next !== locale) setLocale(next)
      })
      .catch(() => {})
    apiFetch<Language[]>('/languages/catalog')
      .then(registerLanguages)
      .catch(() => {})
  }, [])
  return null
}
