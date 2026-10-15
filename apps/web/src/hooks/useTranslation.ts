import { translations } from '@/lib/i18n/translations'
import { useLocale } from '@/store/locale'

/** Trả về dict theo locale hiện tại — dùng trực tiếp vd. t.nav.learn (type-safe, không cần parser key dạng chuỗi). */
export function useTranslation() {
  const locale = useLocale((s) => s.locale)
  return translations[locale]
}
