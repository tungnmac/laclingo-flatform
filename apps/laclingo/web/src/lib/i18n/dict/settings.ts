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
    },
  },
}
