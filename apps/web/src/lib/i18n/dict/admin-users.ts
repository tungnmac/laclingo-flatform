import type { Locale } from '@/store/locale'

// Namespace "adminUsers" — trang danh sách + chi tiết học viên. Chỉ vi+en.
export interface AdminUsersDict {
  adminUsers: {
    pageTitle: string
    pageDesc: string
    searchLabel: string
    searchPlaceholder: string
    roleLabel: string
    roleAll: string
    moduleFilterLabel: string
    moduleFilterAll: string
    emptyTitle: string
    youSuffix: string
    statLine: (level: number, points: number, streak: number) => string
    joinedAt: (date: string) => string
    backToUsers: string
    detailTitle: string
    detailDesc: string
    levelLabel: string
    expLabel: string
    pointsLabel: string
    streakLabel: string
    ownerNote: string
  }
}

export const adminUsersTranslations: Partial<Record<Locale, AdminUsersDict>> = {
  vi: {
    adminUsers: {
      pageTitle: 'Học viên',
      pageDesc: 'Danh sách người học — tìm kiếm, lọc theo role, cấp/thu hồi quyền admin.',
      searchLabel: 'Tìm kiếm',
      searchPlaceholder: 'Tìm theo username/email/họ tên...',
      roleLabel: 'Role',
      roleAll: 'Tất cả',
      moduleFilterLabel: 'Quyền module',
      moduleFilterAll: 'Tất cả',
      emptyTitle: 'Không tìm thấy học viên nào',
      youSuffix: '(bạn)',
      statLine: (level, points, streak) => `⭐ Lv.${level} · 🏆 ${points} · 🔥 ${streak}`,
      joinedAt: (date) => `Tham gia ${date}`,
      backToUsers: '← Danh sách học viên',
      detailTitle: 'Chi tiết học viên',
      detailDesc: 'Thông tin hồ sơ và quyền truy cập.',
      levelLabel: 'Level',
      expLabel: 'EXP',
      pointsLabel: 'Điểm',
      streakLabel: 'Streak',
      ownerNote: '👑 Owner luôn có toàn quyền trên mọi mục quản trị — không thể thu hồi hoặc khoá.',
    },
  },
  en: {
    adminUsers: {
      pageTitle: 'Users',
      pageDesc: 'List of learners — search, filter by role, grant/revoke admin rights.',
      searchLabel: 'Search',
      searchPlaceholder: 'Search by username/email/full name...',
      roleLabel: 'Role',
      roleAll: 'All',
      moduleFilterLabel: 'Module access',
      moduleFilterAll: 'All',
      emptyTitle: 'No learners found',
      youSuffix: '(you)',
      statLine: (level, points, streak) => `⭐ Lv.${level} · 🏆 ${points} · 🔥 ${streak}`,
      joinedAt: (date) => `Joined ${date}`,
      backToUsers: '← User list',
      detailTitle: 'User details',
      detailDesc: 'Profile info and access rights.',
      levelLabel: 'Level',
      expLabel: 'EXP',
      pointsLabel: 'Points',
      streakLabel: 'Streak',
      ownerNote: '👑 Owner always has full access to every admin section — cannot be revoked or locked.',
    },
  },
}
