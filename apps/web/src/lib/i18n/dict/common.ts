import type { Locale } from '@/store/locale'

// Namespace "common" — chuỗi nhỏ dùng rải rác nhiều nơi (tooltip, aria-label)
// không thuộc riêng 1 trang/feature nào. Chỉ vi+en.
export interface CommonDict {
  common: {
    streakTooltip: (days: number) => string
    audioAriaLabel: (text: string) => string
    speechError: (code: string) => string
  }
}

export const commonTranslations: Partial<Record<Locale, CommonDict>> = {
  vi: {
    common: {
      streakTooltip: (days) => `Chuỗi ${days} ngày học liên tiếp`,
      audioAriaLabel: (text) => `Phát âm "${text}"`,
      speechError: (code) => {
        const hint =
          code === 'not-allowed'
            ? 'Trình duyệt đang chặn phát âm thanh — hãy bấm vào trang rồi thử lại, hoặc kiểm tra quyền "Âm thanh" của trang trong cài đặt trình duyệt.'
            : code === 'audio-busy' || code === 'audio-hardware'
              ? 'Thiết bị âm thanh đang bận hoặc lỗi — kiểm tra loa/tai nghe.'
              : code === 'voice-unavailable' || code === 'language-unavailable'
                ? 'Máy chưa có giọng đọc cho ngôn ngữ này — chọn giọng khác ở trang Hồ sơ.'
                : 'Bộ đọc của trình duyệt đang lỗi — hãy tắt hẳn trình duyệt rồi mở lại.'
        return `Không phát được giọng đọc (mã lỗi: ${code}). ${hint}`
      },
    },
  },
  en: {
    common: {
      streakTooltip: (days) => `${days}-day streak`,
      audioAriaLabel: (text) => `Play pronunciation for "${text}"`,
      speechError: (code) => {
        const hint =
          code === 'not-allowed'
            ? 'The browser is blocking sound — click on the page and try again, or check the site\'s "Sound" permission in your browser settings.'
            : code === 'audio-busy' || code === 'audio-hardware'
              ? 'The audio device is busy or failing — check your speakers/headphones.'
              : code === 'voice-unavailable' || code === 'language-unavailable'
                ? 'No voice is installed for this language — pick another voice on the Profile page.'
                : 'The browser speech engine is failing — fully quit and reopen the browser.'
        return `Could not play speech (error code: ${code}). ${hint}`
      },
    },
  },
}
