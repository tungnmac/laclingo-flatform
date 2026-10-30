import type { BuiltinLocale } from '@/store/locale'
import type { ThemeId } from '@/lib/themes'

// Namespace "settings" — trang Cài đặt (tông màu chủ đạo; thẻ Nhắc học và Giọng đọc dùng chuỗi của reminders/profile)
export interface SettingsDict {
  settings: {
    title: string
    themeTitle: string
    themeDesc: string
    themeNames: Record<ThemeId, string>
    current: string
    saved: string
    securityTitle: string
    securityDesc: string
    logoutAllBtn: string
    logoutAllConfirm: string
  }
}

export const settingsTranslations: Partial<Record<BuiltinLocale, SettingsDict>> = {
  vi: {
    settings: {
      title: 'Cài đặt',
      themeTitle: '🎨 Tông màu chủ đạo',
      themeDesc: 'Màu của nút, chữ nhấn và các điểm nổi bật trên toàn hệ thống. Lưu theo tài khoản — đăng nhập máy nào cũng giữ.',
      themeNames: { 'lac-gold': 'Vàng đồng chim Lạc', patina: 'Xanh đồng', indigo: 'Chàm', cinnabar: 'Đỏ son', green: 'Xanh lá', cyan: 'Xanh cyan' },
      current: 'Đang dùng',
      saved: 'Đã đổi tông màu',
      securityTitle: '🔒 Bảo mật phiên đăng nhập',
      securityDesc: 'Nghi tài khoản bị người khác dùng, hoặc mất / bán thiết bị? Đăng xuất khỏi mọi thiết bị — máy khác mất quyền truy cập trong vòng 1 giờ, máy này đăng nhập lại bằng mật khẩu.',
      logoutAllBtn: 'Đăng xuất mọi thiết bị',
      logoutAllConfirm: 'Đăng xuất tài khoản này khỏi mọi thiết bị, kể cả máy này?',
    },
  },
  en: {
    settings: {
      title: 'Settings',
      themeTitle: '🎨 Accent color',
      themeDesc: 'Color of buttons, highlights and accents across the app. Saved to your account — kept on every device.',
      themeNames: { 'lac-gold': 'Lạc bird gold', patina: 'Bronze patina', indigo: 'Indigo', cinnabar: 'Cinnabar red', green: 'Green', cyan: 'Cyan' },
      current: 'In use',
      saved: 'Accent color updated',
      securityTitle: '🔒 Session security',
      securityDesc: 'Think someone else is using your account, or lost / sold a device? Sign out everywhere — other devices lose access within 1 hour, this one signs in again with your password.',
      logoutAllBtn: 'Sign out of all devices',
      logoutAllConfirm: 'Sign this account out of every device, including this one?',
    },
  },
  zh: {
    settings: {
      title: '设置',
      themeTitle: '🎨 主题色',
      themeDesc: '整个应用中按钮、强调文字和重点的颜色。保存到账户——在任何设备登录都保持一致。',
      themeNames: { 'lac-gold': '雒鸟金铜色', patina: '铜绿色', indigo: '靛蓝', cinnabar: '朱红', green: '绿色', cyan: '青色' },
      current: '使用中',
      saved: '主题色已更改',
      securityTitle: '🔒 登录安全',
      securityDesc: '怀疑账户被他人使用，或设备丢失/转卖？退出所有设备——其他设备将在 1 小时内失去访问权限，本机需用密码重新登录。',
      logoutAllBtn: '退出所有设备',
      logoutAllConfirm: '要在所有设备（包括本机）上退出此账户吗？',
    },
  },
  ja: {
    settings: {
      title: '設定',
      themeTitle: '🎨 テーマカラー',
      themeDesc: 'アプリ全体のボタン・強調文字・アクセントの色です。アカウントに保存され、どの端末でも同じになります。',
      themeNames: { 'lac-gold': 'ラック鳥の金銅色', patina: '青銅色', indigo: '藍色', cinnabar: '朱色', green: '緑', cyan: 'シアン' },
      current: '使用中',
      saved: 'テーマカラーを変更しました',
      securityTitle: '🔒 ログインの安全',
      securityDesc: 'アカウントが他人に使われている、または端末を紛失・譲渡した場合は、すべての端末からログアウトしてください。他の端末は 1 時間以内にアクセスできなくなり、この端末はパスワードで再ログインします。',
      logoutAllBtn: 'すべての端末からログアウト',
      logoutAllConfirm: 'この端末を含むすべての端末からこのアカウントをログアウトしますか？',
    },
  },
  ko: {
    settings: {
      title: '설정',
      themeTitle: '🎨 테마 색상',
      themeDesc: '앱 전체의 버튼, 강조 글자, 포인트 색상입니다. 계정에 저장되어 어느 기기에서나 유지됩니다.',
      themeNames: { 'lac-gold': '락새 황동색', patina: '청동색', indigo: '남색', cinnabar: '주홍색', green: '초록', cyan: '시안' },
      current: '사용 중',
      saved: '테마 색상을 변경했어요',
      securityTitle: '🔒 로그인 보안',
      securityDesc: '다른 사람이 계정을 쓰는 것 같거나 기기를 잃어버리거나 팔았나요? 모든 기기에서 로그아웃하세요 — 다른 기기는 1시간 안에 접근이 막히고, 이 기기는 비밀번호로 다시 로그인합니다.',
      logoutAllBtn: '모든 기기에서 로그아웃',
      logoutAllConfirm: '이 기기를 포함한 모든 기기에서 이 계정을 로그아웃할까요?',
    },
  },
}
