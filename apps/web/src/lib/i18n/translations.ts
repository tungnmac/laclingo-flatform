import type { Locale } from '@/store/locale'

// Dịch TỪNG PHẦN theo module UI (nav, auth, profile...) — chưa phủ hết toàn
// app (giai đoạn nền tảng). Phần chưa có trong dict này vẫn hiển thị tiếng
// Việt cứng trong component, dịch tiếp dần ở các lần sau. Lưu ý: message lỗi
// trả về từ backend (ApiError) luôn là tiếng Việt — i18n phía BE là phạm vi
// khác, chưa làm ở đây.
interface Dictionary {
  nav: {
    learn: string
    review: string
    challenges: string
    leaderboard: string
    profile: string
    listening: string
    missions: string
    admin: string
    logout: string
  }
  auth: {
    loginTitle: string
    loginSubtitle: string
    noAccount: string
    registerLink: string
    registerTitle: string
    registerSubtitle: string
    hasAccount: string
    loginLink: string
    fullNameLabel: string
    fullNamePlaceholder: string
    usernameLabel: string
    usernamePlaceholder: string
    usernameHint: string
    emailLabel: string
    emailPlaceholder: string
    identifierLabel: string
    identifierPlaceholder: string
    passwordLabel: string
    showPassword: string
    hidePassword: string
    submitting: string
    submitRegister: string
    submitLogin: string
  }
  profile: {
    title: string
    logout: string
    level: string
    streak: string
    challengePoints: string
    joinedAt: string
    editProfile: string
    fullNameLabel: string
    avatarUrlLabel: string
    saving: string
    save: string
    saved: string
    voiceSettingsTitle: string
    voiceSettingsDesc: string
    systemDefault: string
    preview: string
  }
}

export const translations: Record<Locale, Dictionary> = {
  vi: {
    nav: {
      learn: 'Học',
      review: 'Ôn tập',
      challenges: 'Thách đấu',
      leaderboard: 'Xếp hạng',
      profile: 'Hồ sơ',
      listening: 'Luyện nghe',
      missions: 'Nhiệm vụ',
      admin: 'Quản trị',
      logout: 'Đăng xuất',
    },
    auth: {
      loginTitle: 'Đăng nhập',
      loginSubtitle: 'Chào mừng quay lại! Chim Lạc nhớ bạn lắm 🦩',
      noAccount: 'Chưa có tài khoản?',
      registerLink: 'Đăng ký',
      registerTitle: 'Tạo tài khoản',
      registerSubtitle: 'Học mỗi ngày cùng Chim Lạc 🦩 Mật khẩu tối thiểu 8 ký tự.',
      hasAccount: 'Đã có tài khoản?',
      loginLink: 'Đăng nhập',
      fullNameLabel: 'Họ tên',
      fullNamePlaceholder: 'Nguyễn Văn A',
      usernameLabel: 'Tên đăng nhập',
      usernamePlaceholder: 'nguyenvana',
      usernameHint: '3-50 ký tự: chữ, số, dấu chấm, gạch dưới, gạch ngang',
      emailLabel: 'Email',
      emailPlaceholder: 'ban@laclingo.vn',
      identifierLabel: 'Email hoặc tên đăng nhập',
      identifierPlaceholder: 'ban@laclingo.vn hoặc nguyenvana',
      passwordLabel: 'Mật khẩu',
      showPassword: 'Hiện mật khẩu',
      hidePassword: 'Ẩn mật khẩu',
      submitting: 'Đang xử lý...',
      submitRegister: 'Đăng ký',
      submitLogin: 'Đăng nhập',
    },
    profile: {
      title: 'Hồ sơ',
      logout: 'Đăng xuất',
      level: 'Cấp độ',
      streak: 'Chuỗi ngày học',
      challengePoints: 'Điểm thách đấu',
      joinedAt: 'Tham gia từ',
      editProfile: 'Chỉnh sửa hồ sơ',
      fullNameLabel: 'Họ tên',
      avatarUrlLabel: 'Ảnh đại diện (URL)',
      saving: 'Đang lưu...',
      save: 'Lưu thay đổi',
      saved: 'Đã lưu thay đổi.',
      voiceSettingsTitle: '🔊 Giọng đọc phát âm',
      voiceSettingsDesc: 'Chọn giọng Web Speech cho từng ngôn ngữ — danh sách phụ thuộc giọng đã cài trên máy/trình duyệt của bạn.',
      systemDefault: 'Mặc định hệ thống',
      preview: 'Nghe thử',
    },
  },
  en: {
    nav: {
      learn: 'Learn',
      review: 'Review',
      challenges: 'Challenges',
      leaderboard: 'Leaderboard',
      profile: 'Profile',
      listening: 'Listening',
      missions: 'Missions',
      admin: 'Admin',
      logout: 'Log out',
    },
    auth: {
      loginTitle: 'Log in',
      loginSubtitle: 'Welcome back! Chim Lạc missed you 🦩',
      noAccount: "Don't have an account?",
      registerLink: 'Sign up',
      registerTitle: 'Create an account',
      registerSubtitle: 'Learn every day with Chim Lạc 🦩 Password must be at least 8 characters.',
      hasAccount: 'Already have an account?',
      loginLink: 'Log in',
      fullNameLabel: 'Full name',
      fullNamePlaceholder: 'John Smith',
      usernameLabel: 'Username',
      usernamePlaceholder: 'johnsmith',
      usernameHint: '3-50 characters: letters, numbers, dot, underscore, hyphen',
      emailLabel: 'Email',
      emailPlaceholder: 'you@laclingo.vn',
      identifierLabel: 'Email or username',
      identifierPlaceholder: 'you@laclingo.vn or johnsmith',
      passwordLabel: 'Password',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      submitting: 'Processing...',
      submitRegister: 'Sign up',
      submitLogin: 'Log in',
    },
    profile: {
      title: 'Profile',
      logout: 'Log out',
      level: 'Level',
      streak: 'Day streak',
      challengePoints: 'Challenge points',
      joinedAt: 'Joined on',
      editProfile: 'Edit profile',
      fullNameLabel: 'Full name',
      avatarUrlLabel: 'Avatar (URL)',
      saving: 'Saving...',
      save: 'Save changes',
      saved: 'Changes saved.',
      voiceSettingsTitle: '🔊 Pronunciation voice',
      voiceSettingsDesc: 'Pick a Web Speech voice per language — the list depends on voices installed on your device/browser.',
      systemDefault: 'System default',
      preview: 'Preview',
    },
  },
}
