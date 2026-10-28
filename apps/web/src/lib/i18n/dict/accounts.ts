import type { Locale } from '@/store/locale'

// Namespace "accounts" — chuyển giữa các tài khoản đã đăng nhập. Chỉ vi+en — zh/ja/ko fallback về en.
export interface AccountsDict {
  accounts: {
    switchBtn: string
    title: string
    current: string
    expired: string
    add: string
    logoutAll: string
    logoutAllConfirm: string
    remove: (name: string) => string
    addTitle: string
    addSubtitle: string
    reloginTitle: (name: string) => string
    backToApp: string
    max: (n: number) => string
    privacy: string
    deleteTitle: string
    deleteDesc: string
    deletePasswordLabel: string
    deleteBtn: string
    deleting: string
    deleteConfirmTitle: string
    deleteConfirm: string
    deleteOwner: string
    deleteAppleWarning: string
  }
}

export const accountsTranslations: Partial<Record<Locale, AccountsDict>> = {
  vi: {
    accounts: {
      switchBtn: 'Chuyển tài khoản',
      title: 'Tài khoản trên máy này',
      current: 'Đang dùng',
      expired: 'Hết phiên — đăng nhập lại',
      add: '+ Thêm tài khoản',
      logoutAll: 'Đăng xuất tất cả',
      logoutAllConfirm: 'Đăng xuất tất cả tài khoản trên trình duyệt này?',
      remove: (n) => `Gỡ tài khoản ${n} khỏi máy này`,
      addTitle: 'Thêm tài khoản',
      addSubtitle: 'Đăng nhập thêm 1 tài khoản — các tài khoản đang có vẫn được giữ để chuyển qua lại.',
      reloginTitle: (n) => `Đăng nhập lại ${n}`,
      backToApp: '← Quay lại',
      max: (n) => `Giữ tối đa ${n} tài khoản — thêm mới sẽ bỏ tài khoản lâu chưa dùng nhất.`,
      privacy: 'Chính sách quyền riêng tư',
      deleteTitle: 'Xoá tài khoản',
      deleteDesc:
        'Xoá vĩnh viễn tài khoản cùng toàn bộ dữ liệu học (từ vựng, lịch ôn, nhật ký, bài viết, gems, gói Pro còn lại). Gói tự gia hạn sẽ được huỷ. Không thể khôi phục.',
      deletePasswordLabel: 'Nhập mật khẩu để xác nhận',
      deleteBtn: 'Xoá tài khoản vĩnh viễn',
      deleting: 'Đang xoá...',
      deleteConfirmTitle: 'Xoá tài khoản?',
      deleteConfirm: 'Toàn bộ dữ liệu của bạn sẽ bị xoá vĩnh viễn và không thể khôi phục.',
      deleteOwner: 'Tài khoản owner không thể tự xoá.',
      deleteAppleWarning:
        'Gói Pro của bạn mua qua App Store và đang tự gia hạn. Xoá tài khoản không tự huỷ được gói này — hãy tắt tự gia hạn trong Cài đặt → Apple ID → Đăng ký để không bị trừ tiền kỳ sau.',
    },
  },
  en: {
    accounts: {
      switchBtn: 'Switch account',
      title: 'Accounts on this device',
      current: 'Current',
      expired: 'Session expired — sign in again',
      add: '+ Add account',
      logoutAll: 'Log out of all',
      logoutAllConfirm: 'Log out of every account on this browser?',
      remove: (n) => `Remove ${n} from this device`,
      addTitle: 'Add account',
      addSubtitle: 'Sign in to another account — your current accounts stay here so you can switch between them.',
      reloginTitle: (n) => `Sign in again as ${n}`,
      backToApp: '← Back',
      max: (n) => `Up to ${n} accounts — adding another removes the least recently used one.`,
      privacy: 'Privacy policy',
      deleteTitle: 'Delete account',
      deleteDesc:
        'Permanently delete your account and all of your learning data (vocabulary, review schedule, diary, posts, gems, remaining Pro time). Auto-renewing plans are cancelled. This cannot be undone.',
      deletePasswordLabel: 'Enter your password to confirm',
      deleteBtn: 'Delete account permanently',
      deleting: 'Deleting...',
      deleteConfirmTitle: 'Delete account?',
      deleteConfirm: 'All of your data will be permanently deleted and cannot be recovered.',
      deleteOwner: 'The owner account cannot delete itself.',
      deleteAppleWarning:
        'Your Pro plan was bought through the App Store and renews automatically. Deleting your account does not cancel it — turn off auto-renew in Settings → Apple ID → Subscriptions to avoid being charged again.',
    },
  },
}
