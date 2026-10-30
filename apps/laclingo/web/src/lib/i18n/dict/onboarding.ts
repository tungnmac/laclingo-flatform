import type { BuiltinLocale } from '@/store/locale'
import type { LevelCode } from '@/types/api'

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
    // Tên + mô tả mọi mã của mọi thang (CEFR, JLPT, HSK, TOPIK) — ô chọn trình độ hiện theo thang của ngôn ngữ
    levels: Record<LevelCode, { name: string; desc: string }>
    needLanguage: string
    topicsHint: string
    noTopics: string
    doneTitle: string
    doneSubtitle: string
    profileSetup: string
    profileSetupHint: string
  }
  // Luồng "Học ngôn ngữ mới" (/learn/new-language): chọn ngôn ngữ → trình độ → chủ đề (mặc định hoặc đồng bộ)
  addLanguage: {
    cta: string
    title: string
    steps: { language: string; level: string; topics: string }
    languageHint: string
    allLearning: string
    needLanguage: string
    topicSource: string
    sourceDefault: string
    sourceSync: (language: string) => string
    syncedCount: (count: number, language: string) => string
    syncNone: (language: string) => string
    existingTopics: string
    buildFrom: (language: string) => string
    buildHint: string
    noContentYet: string
    needTopic: string
    maxTopics: (max: number) => string
    start: string
  }
  // Banner tiến độ hàng đợi dựng nội dung cho ngôn ngữ mới (hiện ở mọi trang trong app)
  languageSync: {
    building: (language: string, done: number, total: number) => string
    waiting: string
    failed: (language: string, count: number) => string
    ready: (language: string) => string
    autoClose: (seconds: number) => string
    retry: string
    open: string
    dismiss: string
  }
}

export const onboardingTranslations: Partial<Record<BuiltinLocale, OnboardingDict>> = {
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
        N5: { name: 'N5 · Nhập môn', desc: 'Đọc được kana, câu rất đơn giản' },
        N4: { name: 'N4 · Sơ cấp', desc: 'Hiểu hội thoại cơ bản hằng ngày' },
        N3: { name: 'N3 · Trung cấp', desc: 'Hiểu các tình huống quen thuộc trong đời sống' },
        N2: { name: 'N2 · Trung cao cấp', desc: 'Đọc báo, giao tiếp trong công việc' },
        N1: { name: 'N1 · Cao cấp', desc: 'Hiểu tiếng Nhật trong nhiều tình huống phức tạp' },
        HSK1: { name: 'HSK1 · Nhập môn', desc: 'Khoảng 150 từ, câu rất đơn giản' },
        HSK2: { name: 'HSK2 · Sơ cấp', desc: 'Khoảng 300 từ, giao tiếp đơn giản hằng ngày' },
        HSK3: { name: 'HSK3 · Trung cấp', desc: 'Khoảng 600 từ, xoay xở được việc thường ngày' },
        HSK4: { name: 'HSK4 · Trung cao cấp', desc: 'Khoảng 1.200 từ, trao đổi nhiều chủ đề' },
        HSK5: { name: 'HSK5 · Cao cấp', desc: 'Khoảng 2.500 từ, đọc báo, xem phim' },
        HSK6: { name: 'HSK6 · Thành thạo', desc: 'Khoảng 5.000 từ, diễn đạt trôi chảy' },
        TOPIK1: { name: 'TOPIK1 · Sơ cấp 1', desc: 'Chào hỏi, giới thiệu bản thân' },
        TOPIK2: { name: 'TOPIK2 · Sơ cấp 2', desc: 'Giao tiếp đơn giản ở nơi công cộng' },
        TOPIK3: { name: 'TOPIK3 · Trung cấp 1', desc: 'Sinh hoạt hằng ngày không khó khăn' },
        TOPIK4: { name: 'TOPIK4 · Trung cấp 2', desc: 'Hiểu tin tức, chủ đề xã hội quen thuộc' },
        TOPIK5: { name: 'TOPIK5 · Cao cấp 1', desc: 'Dùng được trong công việc, học thuật' },
        TOPIK6: { name: 'TOPIK6 · Cao cấp 2', desc: 'Gần như người bản xứ' },
      },
      needLanguage: 'Chọn ít nhất 1 ngôn ngữ để tiếp tục.',
      topicsHint: 'Chọn chủ đề bạn thích — LacLingo ưu tiên gợi ý các chủ đề này.',
      noTopics: 'Ngôn ngữ này chưa có chủ đề.',
      doneTitle: 'Mọi thứ đã sẵn sàng',
      doneSubtitle: 'Chim Lạc đã ghi nhớ lộ trình của bạn. Bắt đầu bài học đầu tiên thôi!',
      profileSetup: 'Thiết lập lộ trình học',
      profileSetupHint: 'Quốc gia, ngôn ngữ mẹ đẻ, ngôn ngữ đang học, trình độ và chủ đề yêu thích.',
    },
    addLanguage: {
      cta: '+ Học ngôn ngữ mới',
      title: 'Học ngôn ngữ mới',
      steps: { language: 'Chọn ngôn ngữ', level: 'Trình độ hiện tại', topics: 'Chủ đề muốn học' },
      languageHint: 'Chọn ngôn ngữ bạn muốn bắt đầu học (ngoài các ngôn ngữ bạn đang học).',
      allLearning: 'Bạn đang học tất cả ngôn ngữ hiện có.',
      needLanguage: 'Chọn 1 ngôn ngữ để tiếp tục.',
      topicSource: 'Lấy chủ đề từ',
      sourceDefault: 'Danh sách mặc định',
      sourceSync: (language) => `Đồng bộ từ ${language}`,
      syncedCount: (count, language) => `Đã chọn sẵn ${count} chủ đề tương ứng với những gì bạn chọn/đã học ở ${language}.`,
      syncNone: (language) => `Chưa có chủ đề nào ở ${language} khớp với ngôn ngữ này — hãy chọn trong danh sách bên dưới.`,
      existingTopics: 'Chủ đề có sẵn',
      buildFrom: (language) => `Dựng từ chủ đề ${language}`,
      buildHint:
        'Từ vựng được dựng dần từ chủ đề nguồn (ưu tiên những từ bạn đã học) ở chế độ nền — bạn vẫn học bình thường, tiến độ hiện ở đầu trang.',
      noContentYet: 'Ngôn ngữ này chưa có nội dung — chọn chủ đề để dựng từ vựng.',
      needTopic: 'Chọn ít nhất 1 chủ đề để dựng nội dung.',
      maxTopics: (max) => `Chọn tối đa ${max} chủ đề.`,
      start: 'Bắt đầu học',
    },
    languageSync: {
      building: (language, done, total) => `Đang chuẩn bị nội dung ${language}: ${done}/${total} chủ đề`,
      waiting: 'Dịch vụ AI đang bận — sẽ tự thử lại, bạn cứ học tiếp.',
      failed: (language, count) => `${count} chủ đề ${language} chưa dựng được.`,
      ready: (language) => `Nội dung ${language} đã sẵn sàng.`,
      autoClose: (seconds) => `Tự đóng sau ${seconds}s`,
      retry: 'Thử lại',
      open: 'Vào học',
      dismiss: 'Đóng',
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
        N5: { name: 'N5 · Beginner', desc: 'Read kana and very simple sentences' },
        N4: { name: 'N4 · Elementary', desc: 'Understand basic everyday conversations' },
        N3: { name: 'N3 · Intermediate', desc: 'Handle familiar everyday situations' },
        N2: { name: 'N2 · Upper intermediate', desc: 'Read newspapers, communicate at work' },
        N1: { name: 'N1 · Advanced', desc: 'Understand Japanese in complex situations' },
        HSK1: { name: 'HSK1 · Beginner', desc: 'About 150 words, very simple sentences' },
        HSK2: { name: 'HSK2 · Elementary', desc: 'About 300 words, simple daily exchanges' },
        HSK3: { name: 'HSK3 · Intermediate', desc: 'About 600 words, manage daily tasks' },
        HSK4: { name: 'HSK4 · Upper intermediate', desc: 'About 1,200 words, discuss many topics' },
        HSK5: { name: 'HSK5 · Advanced', desc: 'About 2,500 words, read news, watch films' },
        HSK6: { name: 'HSK6 · Proficient', desc: 'About 5,000 words, express yourself fluently' },
        TOPIK1: { name: 'TOPIK1 · Beginner 1', desc: 'Greetings, introduce yourself' },
        TOPIK2: { name: 'TOPIK2 · Beginner 2', desc: 'Simple communication in public places' },
        TOPIK3: { name: 'TOPIK3 · Intermediate 1', desc: 'Get by in daily life without trouble' },
        TOPIK4: { name: 'TOPIK4 · Intermediate 2', desc: 'Follow news and familiar social topics' },
        TOPIK5: { name: 'TOPIK5 · Advanced 1', desc: 'Use it at work or in academic settings' },
        TOPIK6: { name: 'TOPIK6 · Advanced 2', desc: 'Near-native' },
      },
      needLanguage: 'Pick at least 1 language to continue.',
      topicsHint: 'Pick topics you enjoy — LacLingo will suggest them first.',
      noTopics: 'This language has no topics yet.',
      doneTitle: 'You are all set',
      doneSubtitle: 'The Lac bird has saved your learning path. Let’s start your first lesson!',
      profileSetup: 'Set up learning path',
      profileSetupHint: 'Country, native language, languages you learn, level and favourite topics.',
    },
    addLanguage: {
      cta: '+ Learn a new language',
      title: 'Learn a new language',
      steps: { language: 'Pick a language', level: 'Current level', topics: 'Topics to learn' },
      languageHint: 'Pick the language you want to start learning (besides the ones you already learn).',
      allLearning: 'You are already learning every available language.',
      needLanguage: 'Pick a language to continue.',
      topicSource: 'Take topics from',
      sourceDefault: 'Default list',
      sourceSync: (language) => `Sync from ${language}`,
      syncedCount: (count, language) => `Pre-selected ${count} topics matching what you picked or studied in ${language}.`,
      syncNone: (language) => `None of your ${language} topics exist in this language yet — pick from the list below.`,
      existingTopics: 'Available topics',
      buildFrom: (language) => `Build from ${language} topics`,
      buildHint:
        'Words are built gradually from the source topics (words you studied first) in the background — keep learning, progress shows at the top.',
      noContentYet: 'This language has no content yet — pick topics to build its vocabulary.',
      needTopic: 'Pick at least 1 topic to build content.',
      maxTopics: (max) => `Pick at most ${max} topics.`,
      start: 'Start learning',
    },
    languageSync: {
      building: (language, done, total) => `Preparing ${language} content: ${done}/${total} topics`,
      waiting: 'The AI service is busy — it will retry automatically, keep learning.',
      failed: (language, count) => `${count} ${language} topics could not be built.`,
      ready: (language) => `${language} content is ready.`,
      autoClose: (seconds) => `Closing in ${seconds}s`,
      retry: 'Retry',
      open: 'Start learning',
      dismiss: 'Dismiss',
    },
  },
}
