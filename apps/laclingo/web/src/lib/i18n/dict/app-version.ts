import type { BuiltinLocale } from '@/store/locale'

// Namespace "appVersion" — kiểm tra phiên bản app iOS/Android (bắt buộc / nhắc cập nhật) + trang admin. Chỉ vi+en.
export interface AppVersionDict {
  appVersion: {
    forceTitle: string
    forceBody: string
    softTitle: string
    softBody: (version: string) => string
    update: string
    later: string
    noStoreLink: string
    // Admin
    moduleTitle: string
    hubDesc: string
    pageDesc: string
    platform: { ios: string; android: string }
    minLabel: string
    minHint: string
    latestLabel: string
    latestHint: string
    storeUrlLabel: string
    messageLabel: string
    messagePlaceholder: string
    save: string
    saved: string
    updatedAt: (date: string) => string
    raiseMinConfirm: (version: string) => string
  }
}

export const appVersionTranslations: Partial<Record<BuiltinLocale, AppVersionDict>> = {
  vi: {
    appVersion: {
      forceTitle: 'Cần cập nhật ứng dụng',
      forceBody: 'Phiên bản LacLingo trên máy bạn đã cũ và không còn được hỗ trợ. Vui lòng cập nhật để tiếp tục học.',
      softTitle: 'Đã có phiên bản mới',
      softBody: (v) => `LacLingo ${v} đã có trên store với nhiều cải tiến. Cập nhật ngay nhé!`,
      update: 'Cập nhật',
      later: 'Để sau',
      noStoreLink: 'Vui lòng mở App Store / Google Play để cập nhật LacLingo.',
      moduleTitle: 'Phiên bản app',
      hubDesc: 'Bắt buộc / nhắc cập nhật app iOS, Android khi phát hành bản mới.',
      pageDesc:
        'App so phiên bản đang cài với cấu hình dưới đây mỗi khi mở. Chỉ cần đổi khi phát hành bản native mới (web cập nhật tự động).',
      platform: { ios: '🍎 iOS (App Store)', android: '🤖 Android (Google Play)' },
      minLabel: 'Phiên bản tối thiểu',
      minHint: 'Thấp hơn → bắt buộc cập nhật, không dùng được app',
      latestLabel: 'Phiên bản mới nhất',
      latestHint: 'Thấp hơn → nhắc cập nhật (bỏ qua được)',
      storeUrlLabel: 'Link trang app trên store',
      messageLabel: 'Lời nhắn (không bắt buộc)',
      messagePlaceholder: 'Ví dụ: Bản mới có luyện nói offline và sửa lỗi thông báo.',
      save: 'Lưu',
      saved: 'Đã lưu cấu hình phiên bản',
      updatedAt: (d) => `Cập nhật lần cuối: ${d}`,
      raiseMinConfirm: (v) =>
        `Mọi máy đang cài bản thấp hơn ${v} sẽ bị chặn dùng app cho tới khi cập nhật. Chỉ lưu khi bản ${v} đã có trên store. Tiếp tục?`,
    },
  },
  en: {
    appVersion: {
      forceTitle: 'Update required',
      forceBody: 'This version of LacLingo is no longer supported. Please update to keep learning.',
      softTitle: 'A new version is available',
      softBody: (v) => `LacLingo ${v} is now on the store with new improvements. Update now!`,
      update: 'Update',
      later: 'Later',
      noStoreLink: 'Please open the App Store / Google Play to update LacLingo.',
      moduleTitle: 'App versions',
      hubDesc: 'Force or suggest iOS / Android app updates when you release a new version.',
      pageDesc:
        'The app compares its installed version with these settings on every launch. Change them only when releasing a new native build (the web updates automatically).',
      platform: { ios: '🍎 iOS (App Store)', android: '🤖 Android (Google Play)' },
      minLabel: 'Minimum version',
      minHint: 'Below this → update required, the app is blocked',
      latestLabel: 'Latest version',
      latestHint: 'Below this → update suggested (can be skipped)',
      storeUrlLabel: 'Store page link',
      messageLabel: 'Message (optional)',
      messagePlaceholder: 'E.g. The new version adds offline speaking practice and fixes notifications.',
      save: 'Save',
      saved: 'Version settings saved',
      updatedAt: (d) => `Last updated: ${d}`,
      raiseMinConfirm: (v) =>
        `Every device on a version below ${v} will be blocked until it updates. Only save once ${v} is live on the store. Continue?`,
    },
  },
}
