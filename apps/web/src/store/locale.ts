import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Locale = 'vi' | 'en'

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
