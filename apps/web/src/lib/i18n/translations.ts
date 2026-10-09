import type { Locale } from '@/store/locale'
import { learnTranslations, type LearnDict } from './dict/learn'
import { reviewTranslations, type ReviewDict } from './dict/review'

// Dịch TỪNG PHẦN theo module UI. Namespace lớn (learn/review/...) tách file
// riêng trong ./dict/ để file này không phình quá lớn — ghép lại bằng `pick`
// bên dưới. Theo yêu cầu hiện tại: ưu tiên dịch đủ vi+en trước, zh/ja/ko bổ
// sung sau — `pick` tự fallback về en rồi vi nếu namespace đó chưa có bản
// dịch cho locale đang chọn, để không bao giờ hiện undefined. Lưu ý: message
// lỗi trả về từ backend (ApiError) luôn là tiếng Việt — i18n phía BE là phạm
// vi khác, chưa làm ở đây.
function pick<T>(dict: Partial<Record<Locale, T>>, locale: Locale): T {
  return (dict[locale] ?? dict.en ?? dict.vi) as T
}

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

const base: Record<Locale, Dictionary> = {
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
  zh: {
    nav: {
      learn: '学习',
      review: '复习',
      challenges: '挑战',
      leaderboard: '排行榜',
      profile: '个人资料',
      listening: '听力练习',
      missions: '任务',
      admin: '管理',
      logout: '退出登录',
    },
    auth: {
      loginTitle: '登录',
      loginSubtitle: '欢迎回来！Chim Lạc 很想你哦 🦩',
      noAccount: '还没有账号？',
      registerLink: '注册',
      registerTitle: '创建账号',
      registerSubtitle: '每天和 Chim Lạc 一起学习吧 🦩 密码至少需要 8 个字符。',
      hasAccount: '已经有账号了？',
      loginLink: '登录',
      fullNameLabel: '姓名',
      fullNamePlaceholder: '王小明',
      usernameLabel: '用户名',
      usernamePlaceholder: 'wangxiaoming',
      usernameHint: '3-50 个字符：字母、数字、点、下划线、横线',
      emailLabel: '邮箱',
      emailPlaceholder: 'you@laclingo.vn',
      identifierLabel: '邮箱或用户名',
      identifierPlaceholder: 'you@laclingo.vn 或 wangxiaoming',
      passwordLabel: '密码',
      showPassword: '显示密码',
      hidePassword: '隐藏密码',
      submitting: '处理中...',
      submitRegister: '注册',
      submitLogin: '登录',
    },
    profile: {
      title: '个人资料',
      logout: '退出登录',
      level: '等级',
      streak: '连续学习天数',
      challengePoints: '挑战积分',
      joinedAt: '加入时间',
      editProfile: '编辑资料',
      fullNameLabel: '姓名',
      avatarUrlLabel: '头像（URL）',
      saving: '保存中...',
      save: '保存更改',
      saved: '已保存更改。',
      voiceSettingsTitle: '🔊 发音语音',
      voiceSettingsDesc: '为每种语言选择 Web Speech 语音——列表取决于您设备/浏览器上已安装的语音。',
      systemDefault: '系统默认',
      preview: '试听',
    },
  },
  ja: {
    nav: {
      learn: '学習',
      review: '復習',
      challenges: 'チャレンジ',
      leaderboard: 'ランキング',
      profile: 'プロフィール',
      listening: 'リスニング練習',
      missions: 'ミッション',
      admin: '管理',
      logout: 'ログアウト',
    },
    auth: {
      loginTitle: 'ログイン',
      loginSubtitle: 'おかえりなさい！Chim Lạc があなたを待っていました 🦩',
      noAccount: 'アカウントをお持ちでないですか？',
      registerLink: '登録',
      registerTitle: 'アカウントを作成',
      registerSubtitle: 'Chim Lạc と一緒に毎日学びましょう 🦩 パスワードは8文字以上必要です。',
      hasAccount: 'すでにアカウントをお持ちですか？',
      loginLink: 'ログイン',
      fullNameLabel: '氏名',
      fullNamePlaceholder: '山田太郎',
      usernameLabel: 'ユーザー名',
      usernamePlaceholder: 'yamadataro',
      usernameHint: '3〜50文字：英数字、ピリオド、アンダースコア、ハイフン',
      emailLabel: 'メールアドレス',
      emailPlaceholder: 'you@laclingo.vn',
      identifierLabel: 'メールアドレスまたはユーザー名',
      identifierPlaceholder: 'you@laclingo.vn または yamadataro',
      passwordLabel: 'パスワード',
      showPassword: 'パスワードを表示',
      hidePassword: 'パスワードを隠す',
      submitting: '処理中...',
      submitRegister: '登録',
      submitLogin: 'ログイン',
    },
    profile: {
      title: 'プロフィール',
      logout: 'ログアウト',
      level: 'レベル',
      streak: '連続学習日数',
      challengePoints: 'チャレンジポイント',
      joinedAt: '登録日',
      editProfile: 'プロフィールを編集',
      fullNameLabel: '氏名',
      avatarUrlLabel: 'アバター画像（URL）',
      saving: '保存中...',
      save: '変更を保存',
      saved: '変更を保存しました。',
      voiceSettingsTitle: '🔊 発音ボイス',
      voiceSettingsDesc: '言語ごとに Web Speech のボイスを選択します — 一覧はお使いのデバイス/ブラウザにインストールされているボイスによって異なります。',
      systemDefault: 'システム既定',
      preview: '試聴',
    },
  },
  ko: {
    nav: {
      learn: '학습',
      review: '복습',
      challenges: '도전',
      leaderboard: '순위',
      profile: '프로필',
      listening: '듣기 연습',
      missions: '미션',
      admin: '관리',
      logout: '로그아웃',
    },
    auth: {
      loginTitle: '로그인',
      loginSubtitle: '다시 오신 것을 환영해요! Chim Lạc 가 많이 보고 싶어했어요 🦩',
      noAccount: '계정이 없으신가요?',
      registerLink: '가입하기',
      registerTitle: '계정 만들기',
      registerSubtitle: 'Chim Lạc 와 함께 매일 배워보세요 🦩 비밀번호는 최소 8자 이상이어야 합니다.',
      hasAccount: '이미 계정이 있으신가요?',
      loginLink: '로그인',
      fullNameLabel: '이름',
      fullNamePlaceholder: '홍길동',
      usernameLabel: '사용자 이름',
      usernamePlaceholder: 'honggildong',
      usernameHint: '3-50자: 문자, 숫자, 점, 밑줄, 하이픈',
      emailLabel: '이메일',
      emailPlaceholder: 'you@laclingo.vn',
      identifierLabel: '이메일 또는 사용자 이름',
      identifierPlaceholder: 'you@laclingo.vn 또는 honggildong',
      passwordLabel: '비밀번호',
      showPassword: '비밀번호 표시',
      hidePassword: '비밀번호 숨기기',
      submitting: '처리 중...',
      submitRegister: '가입하기',
      submitLogin: '로그인',
    },
    profile: {
      title: '프로필',
      logout: '로그아웃',
      level: '레벨',
      streak: '연속 학습일',
      challengePoints: '도전 포인트',
      joinedAt: '가입일',
      editProfile: '프로필 수정',
      fullNameLabel: '이름',
      avatarUrlLabel: '프로필 사진 (URL)',
      saving: '저장 중...',
      save: '변경사항 저장',
      saved: '변경사항이 저장되었습니다.',
      voiceSettingsTitle: '🔊 발음 음성',
      voiceSettingsDesc: '언어별로 Web Speech 음성을 선택하세요 — 목록은 사용 중인 기기/브라우저에 설치된 음성에 따라 다릅니다.',
      systemDefault: '시스템 기본값',
      preview: '미리 듣기',
    },
  },
}

const LOCALE_LIST: Locale[] = ['vi', 'en', 'zh', 'ja', 'ko']

export const translations: Record<Locale, Dictionary & LearnDict & ReviewDict> = Object.fromEntries(
  LOCALE_LIST.map((locale) => [
    locale,
    {
      ...base[locale],
      ...pick(learnTranslations, locale),
      ...pick(reviewTranslations, locale),
    },
  ]),
) as Record<Locale, Dictionary & LearnDict & ReviewDict>
