import type { Locale } from '@/store/locale'
import type { CefrLevel } from '@/types/api'

// Namespace "onboarding" — các bước thiết lập lần đầu đăng nhập (/onboarding). Chỉ vi+en.
export interface OnboardingDict {
  onboarding: {
    title: string
    stepOf: (step: number, total: number) => string
    steps: { basic: string; avatar: string; languages: string; topics: string; done: string }
    skip: string
    back: string
    next: string
    finish: string
    saving: string
    fullName: string
    country: string
    nativeLanguage: string
    selectPlaceholder: string
    birthYear: string
    bio: string
    bioPlaceholder: string
    optional: string
    avatarHint: string
    upload: string
    uploading: string
    presets: string
    removeAvatar: string
    languagesHint: string
    levelLabel: string
    levels: Record<CefrLevel, { name: string; desc: string }>
    needLanguage: string
    topicsHint: string
    noTopics: string
    doneTitle: string
    doneSubtitle: string
    profileSetup: string
    profileSetupHint: string
  }
}

export const onboardingTranslations: Partial<Record<Locale, OnboardingDict>> = {
  vi: {
    onboarding: {
      title: 'Thiết lập lộ trình học',
      stepOf: (step, total) => `Bước ${step}/${total}`,
      steps: {
        basic: 'Thông tin cơ bản',
        avatar: 'Ảnh đại diện',
        languages: 'Ngôn ngữ muốn học',
        topics: 'Chủ đề yêu thích',
        done: 'Sẵn sàng!',
      },
      skip: 'Để sau',
      back: 'Quay lại',
      next: 'Tiếp tục',
      finish: 'Bắt đầu học',
      saving: 'Đang lưu…',
      fullName: 'Họ tên',
      country: 'Quốc gia',
      nativeLanguage: 'Ngôn ngữ mẹ đẻ',
      selectPlaceholder: '— Chọn —',
      birthYear: 'Năm sinh',
      bio: 'Giới thiệu ngắn',
      bioPlaceholder: 'Vài dòng về bạn và lý do học ngoại ngữ…',
      optional: '(không bắt buộc)',
      avatarHint: 'Tải ảnh của bạn lên hoặc chọn một linh vật.',
      upload: 'Tải ảnh lên',
      uploading: 'Đang tải ảnh…',
      presets: 'Hoặc chọn linh vật',
      removeAvatar: 'Bỏ ảnh',
      languagesHint: 'Chọn ngôn ngữ bạn muốn học và trình độ hiện tại — đổi lại được bất cứ lúc nào.',
      levelLabel: 'Trình độ hiện tại',
      levels: {
        A1: { name: 'A1 · Mới bắt đầu', desc: 'Chưa biết hoặc biết rất ít' },
        A2: { name: 'A2 · Sơ cấp', desc: 'Hiểu câu đơn giản hằng ngày' },
        B1: { name: 'B1 · Trung cấp', desc: 'Giao tiếp được chủ đề quen thuộc' },
        B2: { name: 'B2 · Trung cao cấp', desc: 'Trò chuyện khá trôi chảy' },
        C1: { name: 'C1 · Cao cấp', desc: 'Dùng linh hoạt trong công việc, học tập' },
        C2: { name: 'C2 · Thành thạo', desc: 'Gần như người bản xứ' },
      },
      needLanguage: 'Chọn ít nhất 1 ngôn ngữ để tiếp tục.',
      topicsHint: 'Chọn chủ đề bạn thích — LacLingo ưu tiên gợi ý các chủ đề này.',
      noTopics: 'Ngôn ngữ này chưa có chủ đề.',
      doneTitle: 'Mọi thứ đã sẵn sàng 🦩',
      doneSubtitle: 'Chim Lạc đã ghi nhớ lộ trình của bạn. Bắt đầu bài học đầu tiên thôi!',
      profileSetup: 'Thiết lập lộ trình học',
      profileSetupHint: 'Quốc gia, ngôn ngữ mẹ đẻ, ngôn ngữ đang học, trình độ và chủ đề yêu thích.',
    },
  },
  en: {
    onboarding: {
      title: 'Set up your learning path',
      stepOf: (step, total) => `Step ${step}/${total}`,
      steps: {
        basic: 'Basic info',
        avatar: 'Profile picture',
        languages: 'Languages to learn',
        topics: 'Favourite topics',
        done: 'All set!',
      },
      skip: 'Later',
      back: 'Back',
      next: 'Continue',
      finish: 'Start learning',
      saving: 'Saving…',
      fullName: 'Full name',
      country: 'Country',
      nativeLanguage: 'Native language',
      selectPlaceholder: '— Select —',
      birthYear: 'Birth year',
      bio: 'Short bio',
      bioPlaceholder: 'A few lines about you and why you learn languages…',
      optional: '(optional)',
      avatarHint: 'Upload your photo or pick a mascot.',
      upload: 'Upload photo',
      uploading: 'Uploading…',
      presets: 'Or pick a mascot',
      removeAvatar: 'Remove photo',
      languagesHint: 'Pick the languages you want to learn and your current level — you can change them any time.',
      levelLabel: 'Current level',
      levels: {
        A1: { name: 'A1 · Beginner', desc: 'Know nothing or very little' },
        A2: { name: 'A2 · Elementary', desc: 'Understand simple everyday sentences' },
        B1: { name: 'B1 · Intermediate', desc: 'Handle familiar topics' },
        B2: { name: 'B2 · Upper intermediate', desc: 'Converse fairly fluently' },
        C1: { name: 'C1 · Advanced', desc: 'Use it flexibly at work or school' },
        C2: { name: 'C2 · Proficient', desc: 'Near-native' },
      },
      needLanguage: 'Pick at least 1 language to continue.',
      topicsHint: 'Pick topics you enjoy — LacLingo will suggest them first.',
      noTopics: 'This language has no topics yet.',
      doneTitle: 'You are all set 🦩',
      doneSubtitle: 'The Lac bird has saved your learning path. Let’s start your first lesson!',
      profileSetup: 'Set up learning path',
      profileSetupHint: 'Country, native language, languages you learn, level and favourite topics.',
    },
  },
}
