import type { BuiltinLocale } from '@/store/locale'
import type { ReportReason } from '@/types/api'

// Namespace "moderation" — báo cáo nội dung vi phạm, chặn người dùng, hàng chờ báo cáo (admin). Chỉ vi+en.
export interface ModerationDict {
  moderation: {
    report: string
    reportPost: string
    reportComment: string
    reportChat: string
    reportTitle: string
    reportHint: string
    reasons: Record<ReportReason, string>
    notePlaceholder: string
    submit: string
    cancel: string
    reported: string
    reportedAutoHidden: string
    block: (name: string) => string
    blockConfirm: (name: string) => string
    blocked: (name: string) => string
    unblock: string
    unblocked: (name: string) => string
    blockedPost: (name: string) => string
    blockedComment: string
    hiddenComment: string
    blockedChat: string
    blockedListTitle: string
    blockedListHint: string
    blockedListEmpty: string
    // Admin
    adminTitle: string
    adminSubtitle: string
    adminTab: string
    statusOpen: string
    statusResolved: string
    statusDismissed: string
    targetPost: string
    targetComment: string
    targetChat: (room: string) => string
    reportCount: (n: number) => string
    deletedContent: string
    hiddenNow: string
    openPost: string
    actionHide: string
    actionConfirmChat: string
    actionDismiss: string
    actionDone: string
    empty: string
  }
}

export const moderationTranslations: Partial<Record<BuiltinLocale, ModerationDict>> = {
  vi: {
    moderation: {
      report: 'Báo cáo',
      reportPost: 'Báo cáo bài viết',
      reportComment: 'Báo cáo bình luận',
      reportChat: 'Báo cáo tin nhắn',
      reportTitle: 'Báo cáo nội dung vi phạm',
      reportHint: 'Quản trị viên sẽ xem xét trong vòng 24 giờ. Người bị báo cáo không biết ai đã báo cáo.',
      reasons: {
        spam: 'Spam / quảng cáo',
        harassment: 'Quấy rối, bắt nạt',
        hate: 'Thù ghét, phân biệt đối xử',
        sexual: 'Nội dung khiêu dâm',
        violence: 'Bạo lực, nguy hiểm',
        other: 'Lý do khác',
      },
      notePlaceholder: 'Mô tả thêm (không bắt buộc)',
      submit: 'Gửi báo cáo',
      cancel: 'Huỷ',
      reported: 'Đã gửi báo cáo — cảm ơn bạn!',
      reportedAutoHidden: 'Đã gửi báo cáo — nội dung đã tạm ẩn chờ quản trị viên xem xét.',
      block: (n) => `Chặn ${n}`,
      blockConfirm: (n) =>
        `Chặn ${n}? Bạn sẽ không thấy bài viết, bình luận của người này và không nhận thông báo từ họ. Có thể bỏ chặn trong Hồ sơ.`,
      blocked: (n) => `Đã chặn ${n}`,
      unblock: 'Bỏ chặn',
      unblocked: (n) => `Đã bỏ chặn ${n}`,
      blockedPost: (n) => `Bạn đã chặn ${n} — nội dung bài viết được ẩn.`,
      blockedComment: 'Bình luận từ người bạn đã chặn',
      hiddenComment: 'Bình luận đã bị ẩn do vi phạm quy định cộng đồng',
      blockedChat: 'Tin nhắn từ người bạn đã chặn',
      blockedListTitle: 'Người đã chặn',
      blockedListHint: 'Bạn không thấy bài viết, bình luận của những người này và không nhận thông báo từ họ.',
      blockedListEmpty: 'Bạn chưa chặn ai.',
      adminTitle: 'Báo cáo nội dung',
      adminSubtitle: 'Bài viết / bình luận bị học viên báo cáo. Nội dung bị 3 người báo cáo sẽ tự ẩn chờ xử lý.',
      adminTab: '🚩 Báo cáo',
      statusOpen: 'Chờ xử lý',
      statusResolved: 'Đã ẩn',
      statusDismissed: 'Đã bỏ qua',
      targetPost: 'Bài viết',
      targetComment: 'Bình luận',
      targetChat: (room) => (room ? `Chat phòng ${room}` : 'Chat thử thách'),
      reportCount: (n) => `${n} báo cáo`,
      deletedContent: 'Nội dung đã bị xoá',
      hiddenNow: 'Đang ẩn',
      openPost: 'Mở bài viết',
      actionHide: 'Vi phạm — ẩn nội dung',
      actionConfirmChat: 'Xác nhận vi phạm',
      actionDismiss: 'Không vi phạm — bỏ qua',
      actionDone: 'Đã xử lý báo cáo',
      empty: 'Không có báo cáo nào.',
    },
  },
  en: {
    moderation: {
      report: 'Report',
      reportPost: 'Report post',
      reportComment: 'Report comment',
      reportChat: 'Report message',
      reportTitle: 'Report objectionable content',
      reportHint: 'Moderators review reports within 24 hours. The reported user is not told who reported them.',
      reasons: {
        spam: 'Spam / advertising',
        harassment: 'Harassment or bullying',
        hate: 'Hate or discrimination',
        sexual: 'Sexual content',
        violence: 'Violence or dangerous content',
        other: 'Something else',
      },
      notePlaceholder: 'Add details (optional)',
      submit: 'Send report',
      cancel: 'Cancel',
      reported: 'Report sent — thank you!',
      reportedAutoHidden: 'Report sent — the content is hidden until a moderator reviews it.',
      block: (n) => `Block ${n}`,
      blockConfirm: (n) =>
        `Block ${n}? You won't see their posts or comments or get notifications from them. You can unblock them in your Profile.`,
      blocked: (n) => `Blocked ${n}`,
      unblock: 'Unblock',
      unblocked: (n) => `Unblocked ${n}`,
      blockedPost: (n) => `You blocked ${n} — this post's content is hidden.`,
      blockedComment: 'Comment from a user you blocked',
      hiddenComment: 'This comment was hidden for breaking community guidelines',
      blockedChat: 'Message from a user you blocked',
      blockedListTitle: 'Blocked users',
      blockedListHint: "You don't see posts or comments from these people and get no notifications from them.",
      blockedListEmpty: "You haven't blocked anyone.",
      adminTitle: 'Content reports',
      adminSubtitle: 'Posts / comments reported by learners. Content reported by 3 people is hidden automatically until reviewed.',
      adminTab: '🚩 Reports',
      statusOpen: 'Open',
      statusResolved: 'Hidden',
      statusDismissed: 'Dismissed',
      targetPost: 'Post',
      targetComment: 'Comment',
      targetChat: (room) => (room ? `Chat in room ${room}` : 'Challenge chat'),
      reportCount: (n) => `${n} report${n > 1 ? 's' : ''}`,
      deletedContent: 'Content was deleted',
      hiddenNow: 'Hidden',
      openPost: 'Open post',
      actionHide: 'Violation — hide content',
      actionConfirmChat: 'Confirm violation',
      actionDismiss: 'No violation — dismiss',
      actionDone: 'Report handled',
      empty: 'No reports.',
    },
  },
}
