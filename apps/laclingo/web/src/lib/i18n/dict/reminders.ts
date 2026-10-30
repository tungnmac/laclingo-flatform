import type { BuiltinLocale } from '@/store/locale'

// Namespace "reminders" (học viên — thẻ "Nhắc học" ở trang Cài đặt) và
// "adminReminders" (admin — lịch nhắc mặc định). Chỉ vi+en — zh/ja/ko fallback về en.
export interface RemindersDict {
  reminders: {
    title: string
    desc: string
    // Thông báo trên trình duyệt này
    notSupported: string
    notConfigured: string
    permissionDenied: string
    nativeUnavailable: string
    enabledOnDevice: string
    disabledOnDevice: string
    enableBtn: string
    disableBtn: string
    testBtn: string
    testSent: (n: number) => string
    deviceCount: (n: number) => string
    // Lịch nhắc
    followingDefault: string
    customized: string
    resetBtn: string
    resetDone: string
    saveBtn: string
    saving: string
    saved: string
    dailyLabel: string
    dailyHint: string
    timeLabel: string
    daysLabel: string
    dayNames: string[] // index 0 = Thứ 2 (ISO 1) ... 6 = Chủ nhật (ISO 7)
    inactiveLabel: string
    inactiveHint: string
    inactiveDaysLabel: string
    timezoneLabel: (tz: string) => string
  }
  adminReminders: {
    pageTitle: string
    pageDesc: string
    timezoneFieldLabel: string
    timezoneFieldHint: string
  }
}

export const remindersTranslations: Partial<Record<BuiltinLocale, RemindersDict>> = {
  vi: {
    reminders: {
      title: '🔔 Nhắc học',
      desc: 'Nhận thông báo trên điện thoại/máy tính để quay lại học đều đặn.',
      notSupported:
        'Trình duyệt này không hỗ trợ thông báo đẩy. Trên iPhone/iPad, hãy "Thêm vào Màn hình chính" rồi mở LacLingo từ biểu tượng đó.',
      notConfigured: 'Máy chủ chưa bật tính năng thông báo đẩy. Vui lòng liên hệ quản trị viên.',
      permissionDenied: 'Bạn đã chặn thông báo. Hãy cho phép thông báo cho trang này trong cài đặt trình duyệt rồi thử lại.',
      nativeUnavailable: 'Chưa bật được thông báo trên thiết bị này. Vui lòng thử lại sau.',
      enabledOnDevice: '✅ Đã bật thông báo trên thiết bị này',
      disabledOnDevice: 'Chưa bật thông báo trên thiết bị này',
      enableBtn: 'Bật thông báo',
      disableBtn: 'Tắt trên thiết bị này',
      testBtn: 'Gửi thử',
      testSent: (n) => `Đã gửi thông báo thử tới ${n} thiết bị`,
      deviceCount: (n) => `Đang nhận thông báo trên ${n} thiết bị`,
      followingDefault: 'Đang theo lịch mặc định',
      customized: 'Lịch do bạn tự chỉnh',
      resetBtn: 'Dùng lịch mặc định',
      resetDone: 'Đã quay về lịch mặc định',
      saveBtn: 'Lưu lịch nhắc',
      saving: 'Đang lưu...',
      saved: 'Đã lưu lịch nhắc',
      dailyLabel: 'Nhắc theo giờ',
      dailyHint: 'Chỉ nhắc vào những ngày bạn chưa học.',
      timeLabel: 'Giờ nhắc',
      daysLabel: 'Ngày nhắc',
      dayNames: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      inactiveLabel: 'Nhắc khi bỏ học',
      inactiveHint: 'Gửi vào giờ nhắc khi bạn không học liên tục số ngày dưới đây.',
      inactiveDaysLabel: 'Số ngày bỏ học',
      timezoneLabel: (tz) => `Múi giờ: ${tz}`,
    },
    adminReminders: {
      pageTitle: 'Nhắc học',
      pageDesc: 'Lịch nhắc mặc định — áp dụng cho mọi học viên chưa tự chỉnh lịch trong trang Cài đặt.',
      timezoneFieldLabel: 'Múi giờ mặc định',
      timezoneFieldHint: 'Chỉ dùng cho học viên chưa bật thông báo trên trình duyệt nào (khi bật, hệ thống lấy múi giờ của trình duyệt).',
    },
  },
  en: {
    reminders: {
      title: '🔔 Study reminders',
      desc: 'Get notifications on your phone or computer to keep a steady study habit.',
      notSupported:
        'This browser does not support push notifications. On iPhone/iPad, use "Add to Home Screen" and open LacLingo from that icon.',
      notConfigured: 'Push notifications are not enabled on the server. Please contact an administrator.',
      permissionDenied: 'Notifications are blocked. Allow notifications for this site in your browser settings, then try again.',
      nativeUnavailable: "Couldn't turn on notifications on this device. Please try again later.",
      enabledOnDevice: '✅ Notifications are on for this device',
      disabledOnDevice: 'Notifications are off for this device',
      enableBtn: 'Turn on notifications',
      disableBtn: 'Turn off on this device',
      testBtn: 'Send test',
      testSent: (n) => `Test notification sent to ${n} device${n === 1 ? '' : 's'}`,
      deviceCount: (n) => `Receiving notifications on ${n} device${n === 1 ? '' : 's'}`,
      followingDefault: 'Using the default schedule',
      customized: 'Your own schedule',
      resetBtn: 'Use default schedule',
      resetDone: 'Back to the default schedule',
      saveBtn: 'Save schedule',
      saving: 'Saving...',
      saved: 'Schedule saved',
      dailyLabel: 'Daily reminder',
      dailyHint: 'Only on days you have not studied yet.',
      timeLabel: 'Time',
      daysLabel: 'Days',
      dayNames: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      inactiveLabel: 'Comeback reminder',
      inactiveHint: 'Sent at your reminder time after you skip studying for this many days in a row.',
      inactiveDaysLabel: 'Days without studying',
      timezoneLabel: (tz) => `Time zone: ${tz}`,
    },
    adminReminders: {
      pageTitle: 'Study reminders',
      pageDesc: 'Default reminder schedule — applies to every learner who has not customised their own on the Settings page.',
      timezoneFieldLabel: 'Default time zone',
      timezoneFieldHint: 'Only used for learners who have never turned on notifications in a browser (turning them on uses the browser time zone).',
    },
  },
}
