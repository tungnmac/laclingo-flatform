import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Locale = 'vi' | 'en' | 'zh' | 'ja' | 'ko'

// Nguồn duy nhất liệt kê ngôn ngữ UI khả dụng — thêm ngôn ngữ mới chỉ cần
// thêm 1 dòng ở đây + dịch Dictionary tương ứng trong lib/i18n/translations.ts,
// LanguageSwitcher tự render thêm option mà không cần sửa gì khác.
export const LOCALES: { value: Locale; flag: string; label: string }[] = [
  { value: 'vi', flag: '🇻🇳', label: 'Tiếng Việt' },
  { value: 'en', flag: '🇬🇧', label: 'English' },
  { value: 'zh', flag: '🇨🇳', label: '中文' },
  { value: 'ja', flag: '🇯🇵', label: '日本語' },
  { value: 'ko', flag: '🇰🇷', label: '한국어' },
]

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

// Ngôn ngữ HIỂN THỊ của giao diện (UI) — khác với "ngôn ngữ học" (course/learn),
// vốn do người dùng chọn riêng ở từng trang học. Lưu local, không gửi lên server.
export const useLocale = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'vi',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'laclingo-locale' },
  ),
)
