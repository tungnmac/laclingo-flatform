import type { Locale } from '@/store/locale'

// Namespace "notifications" (chuông thông báo — sidebar/header) và
// "adminAnnouncements" (admin gửi thông báo chung). Chỉ vi+en — zh/ja/ko fallback về en.
// Lưu ý: tiêu đề/nội dung từng thông báo do backend tạo sẵn (tiếng Việt).
export interface NotificationsDict {
  notifications: {
    bellLabel: string
    bellLabelUnread: (n: number) => string
    title: string
    markAllRead: string
    clearAll: string
    clearConfirm: string
    empty: string
    loadMore: string
    deleteOne: string
    unreadDot: string
    justNow: string
  }
  adminAnnouncements: {
    pageTitle: string
    pageDesc: string
    formTitle: string
    titleLabel: string
    bodyLabel: string
    urlLabel: string
    urlHint: string
    sendBtn: string
    sending: string
    sendConfirm: string
    sent: (n: number) => string
    historyTitle: string
    empty: string
    stats: (read: number, total: number) => string
    deleteBtn: string
    deleteConfirm: (title: string) => string
  }
}

export const notificationsTranslations: Partial<Record<Locale, NotificationsDict>> = {
  vi: {
    notifications: {
      bellLabel: 'Thông báo',
      bellLabelUnread: (n) => `Thông báo (${n} chưa đọc)`,
      title: 'Thông báo',
      markAllRead: 'Đánh dấu đã đọc hết',
      clearAll: 'Xoá tất cả',
      clearConfirm: 'Xoá toàn bộ thông báo? Không thể hoàn tác.',
      empty: 'Chưa có thông báo nào',
      loadMore: 'Xem thêm',
      deleteOne: 'Xoá thông báo',
      unreadDot: 'Chưa đọc',
      justNow: 'Vừa xong',
    },
    adminAnnouncements: {
      pageTitle: 'Thông báo chung',
      pageDesc: 'Gửi thông báo vào chuông của mọi học viên đang hoạt động (vd lịch bảo trì, sự kiện mới).',
      formTitle: 'Soạn thông báo',
      titleLabel: 'Tiêu đề',
      bodyLabel: 'Nội dung',
      urlLabel: 'Đường dẫn khi bấm vào (tuỳ chọn)',
      urlHint: 'Trang trong app, bắt đầu bằng / — vd /blog, /missions',
      sendBtn: 'Gửi tới mọi học viên',
      sending: 'Đang gửi...',
      sendConfirm: 'Gửi thông báo này tới MỌI học viên đang hoạt động?',
      sent: (n) => `Đã gửi tới ${n} học viên`,
      historyTitle: 'Đã gửi',
      empty: 'Chưa gửi thông báo chung nào',
      stats: (read, total) => `${read}/${total} đã đọc`,
      deleteBtn: 'Thu hồi',
      deleteConfirm: (title) => `Thu hồi "${title}"? Thông báo sẽ bị xoá khỏi chuông của mọi học viên.`,
    },
  },
  en: {
    notifications: {
      bellLabel: 'Notifications',
      bellLabelUnread: (n) => `Notifications (${n} unread)`,
      title: 'Notifications',
      markAllRead: 'Mark all as read',
      clearAll: 'Clear all',
      clearConfirm: 'Delete all notifications? This cannot be undone.',
      empty: 'No notifications yet',
      loadMore: 'Load more',
      deleteOne: 'Delete notification',
      unreadDot: 'Unread',
      justNow: 'Just now',
    },
    adminAnnouncements: {
      pageTitle: 'Announcements',
      pageDesc: 'Send a notification to the bell of every active learner (e.g. maintenance windows, new events).',
      formTitle: 'New announcement',
      titleLabel: 'Title',
      bodyLabel: 'Message',
      urlLabel: 'Link when clicked (optional)',
      urlHint: 'An in-app page starting with / — e.g. /blog, /missions',
      sendBtn: 'Send to all learners',
      sending: 'Sending...',
      sendConfirm: 'Send this announcement to EVERY active learner?',
      sent: (n) => `Sent to ${n} learner${n === 1 ? '' : 's'}`,
      historyTitle: 'Sent',
      empty: 'No announcements sent yet',
      stats: (read, total) => `${read}/${total} read`,
      deleteBtn: 'Retract',
      deleteConfirm: (title) => `Retract "${title}"? It will be removed from every learner's notifications.`,
    },
  },
}
