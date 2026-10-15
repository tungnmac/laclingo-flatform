import type { Locale } from '@/store/locale'

// Namespace "common" — chuỗi nhỏ dùng rải rác nhiều nơi (tooltip, aria-label)
// không thuộc riêng 1 trang/feature nào. Chỉ vi+en.
export interface CommonDict {
  common: {
    streakTooltip: (days: number) => string
    audioAriaLabel: (text: string) => string
  }
}

export const commonTranslations: Partial<Record<Locale, CommonDict>> = {
  vi: {
    common: {
      streakTooltip: (days) => `Chuỗi ${days} ngày học liên tiếp`,
      audioAriaLabel: (text) => `Phát âm "${text}"`,
    },
  },
  en: {
    common: {
      streakTooltip: (days) => `${days}-day streak`,
      audioAriaLabel: (text) => `Play pronunciation for "${text}"`,
    },
  },
}
