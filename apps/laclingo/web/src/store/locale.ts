import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Ngôn ngữ giao diện có từ điển dựng sẵn trong lib/i18n (chữ giao diện dịch đầy đủ) */
export type BuiltinLocale = 'vi' | 'en' | 'zh' | 'ja' | 'ko'

/**
 * Mã ngôn ngữ giao diện — chuỗi bất kỳ: danh sách thật do backend cấu hình (UI_LOCALES → GET /locales). Ngôn ngữ chưa
 * có từ điển ở web (vd fr) vẫn chọn được: chữ giao diện hiện tiếng Anh (pick() trong lib/i18n), nội dung học do backend
 * dịch sẵn theo Accept-Language.
 */
export type Locale = string

export interface LocaleOption {
  value: Locale
  flag: string
  label: string
}

/** Ngôn ngữ gốc của nội dung học — luôn có */
export const SOURCE_LOCALE: Locale = 'vi'

// Dự phòng khi chưa tải được GET /locales (lần đầu mở app khi offline) — giữ khớp UI_LOCALES mặc định của backend
export const LOCALES: LocaleOption[] = [
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

interface LocaleListState {
  locales: LocaleOption[]
  setLocales: (locales: LocaleOption[]) => void
}

/** Danh sách ngôn ngữ giao diện từ backend (LocaleSync nạp GET /locales) — lưu local để offline vẫn đủ danh sách lần trước */
export const useLocales = create<LocaleListState>()(
  persist(
    (set) => ({
      locales: LOCALES,
      setLocales: (locales) => set({ locales }),
    }),
    { name: 'laclingo-locales' },
  ),
)

/**
 * Ngôn ngữ thay thế khi ngôn ngữ đang chọn không còn trong danh sách (backend bỏ khỏi UI_LOCALES): cùng ngôn ngữ khác
 * vùng (vd pt-br → pt) → tiếng Anh (người đã chọn ngôn ngữ khác tiếng Việt) → tiếng Việt.
 */
export function fallbackLocale(locale: Locale, locales: LocaleOption[]): Locale {
  const codes = locales.map((l) => l.value)
  if (codes.includes(locale)) return locale
  const base = locale.split('-')[0]
  return codes.find((c) => c.split('-')[0] === base) ?? (codes.includes('en') ? 'en' : SOURCE_LOCALE)
}
