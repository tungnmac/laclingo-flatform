import { useCallback } from 'react'

import { useLocale, type Locale } from '@/store/locale'

const displayNamesCache = new Map<string, Intl.DisplayNames | null>()

function displayNames(locale: string): Intl.DisplayNames | null {
  if (!displayNamesCache.has(locale)) {
    let names: Intl.DisplayNames | null = null
    try {
      names = new Intl.DisplayNames([locale], { type: 'language' })
    } catch {
      // trình duyệt cũ chưa có Intl.DisplayNames / mã không hợp lệ → dùng tên trong kho
    }
    displayNamesCache.set(locale, names)
  }
  return displayNamesCache.get(locale) ?? null
}

/**
 * Tên ngôn ngữ học theo ngôn ngữ giao diện, dựng ở client bằng Intl.DisplayNames (không lưu bản dịch): tên gốc + tên
 * theo giao diện như cách đặt tên trong kho (vd "日本語 (Japanese)"). Giao diện tiếng Việt / mã lạ (ngôn ngữ admin tự
 * thêm) / trình duyệt không hỗ trợ → tên trong kho (fallback).
 */
export function languageDisplayName(id: string, fallback: string, locale: Locale): string {
  if (locale === 'vi') return fallback // tên trong kho viết cho người Việt (vd "日本語 (Tiếng Nhật)")
  const localized = nameIn(locale, id)
  if (!localized || localized.toLowerCase() === id.toLowerCase()) return fallback
  const native = nameIn(id, id)
  return native && native !== localized ? `${native} (${localized})` : localized
}

// of() ném RangeError với mã không đúng dạng BCP-47 (mã ngôn ngữ admin tự đặt) → coi như không có tên
function nameIn(locale: string, id: string): string | undefined {
  try {
    return displayNames(locale)?.of(id)
  } catch {
    return undefined
  }
}

/** `nameOf(id, fallback)` — tên ngôn ngữ theo giao diện; fallback mặc định là mã viết hoa */
export function useLanguageName() {
  const locale = useLocale((s) => s.locale)
  return useCallback((id: string, fallback?: string) => languageDisplayName(id, fallback ?? id.toUpperCase(), locale), [locale])
}
