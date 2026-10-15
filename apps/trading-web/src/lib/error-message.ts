import type { TFunction } from '@/i18n/I18nProvider'
import { hasKey } from '@/i18n/translate'
import { ApiError } from './api'

/** Câu lỗi theo ngôn ngữ đang chọn — dịch lại từ `code` mỗi lần render nên đổi ngôn ngữ là đổi ngay. */
export function errorMessage(err: unknown, t: TFunction): string {
  if (err instanceof ApiError && hasKey(`errors.${err.code}`)) return t(`errors.${err.code}`, err.params)
  return t('errors.INTERNAL')
}
