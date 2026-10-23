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
    },
  },
}
