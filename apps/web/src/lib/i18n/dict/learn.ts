import type { Locale } from '@/store/locale'

// Namespace "learn" (chọn ngôn ngữ + trang khoá học) và "grammar" (bài học +
// bài tập ngữ pháp, dùng chung bởi learn/[courseId]/grammar/[lessonCode] và
// ExerciseCard). Tách riêng file khỏi translations.ts để file đó không phình
// quá lớn khi dịch toàn bộ app — ghép lại ở translations.ts bằng spread.
export interface LearnDict {
  learn: {
    pageTitle: string
    pageDescription: string
    emptyTitle: string
    emptyBody: string
    backToLanguages: string
    languageCodeLabel: string
    reviewNow: string
    srsCardTitle: string
    srsCardDesc: string
    grammarSectionTitle: string
    loadingLessons: string
    mascotCourse: (name: string) => string
  }
  grammar: {
    backToLessons: string
    formulaAffirmative: string
    formulaNegative: string
    formulaInterrogative: string
    usageTitle: string
    formulaTitle: string
    examplePrefix: string
    signalsTitle: string
    exercisesTitle: string
    mascotExercise: string
    emptyLessons: string
    questionPrefix: string
    fillPlaceholder: string
    check: string
    correct: string
    incorrect: (answer: string) => string
  }
}

export const learnTranslations: Record<Locale, LearnDict> = {
  vi: {
    learn: {
      pageTitle: 'Chọn ngôn ngữ',
      pageDescription: 'Bắt đầu hành trình học cùng Chim Lạc.',
      emptyTitle: 'Chưa có ngôn ngữ nào',
      emptyBody: 'Hãy chạy seeds.sql để thêm dữ liệu mẫu.',
      backToLanguages: '← Tất cả ngôn ngữ',
      languageCodeLabel: 'Mã ngôn ngữ',
      reviewNow: 'Ôn tập ngay',
      srsCardTitle: '🧠 Ôn tập từ vựng (SRS)',
      srsCardDesc: 'Thuật toán SM-2 nhắc bạn ôn đúng lúc sắp quên — mỗi lần trả lời đúng, khoảng cách ôn tập sẽ dài hơn.',
      grammarSectionTitle: '📖 Ngữ pháp',
      loadingLessons: 'Đang tải bài học...',
      mascotCourse: (name) => `Cùng chinh phục ${name} mỗi ngày nhé!`,
    },
    grammar: {
      backToLessons: '← Danh sách bài học',
      formulaAffirmative: 'Khẳng định',
      formulaNegative: 'Phủ định',
      formulaInterrogative: 'Nghi vấn',
      usageTitle: '📌 Cách dùng',
      formulaTitle: '🧮 Công thức',
      examplePrefix: 'Ví dụ',
      signalsTitle: '🔍 Dấu hiệu nhận biết',
      exercisesTitle: '✏️ Luyện tập',
      mascotExercise: 'Làm hết bài tập rồi hẵng lướt tiếp nha! 🦩',
      emptyLessons: 'Chưa có bài học ngữ pháp cho ngôn ngữ này',
      questionPrefix: 'Câu',
      fillPlaceholder: 'Điền đáp án...',
      check: 'Kiểm tra',
      correct: '✅ Chính xác!',
      incorrect: (answer) => `❌ Chưa đúng — đáp án: ${answer}`,
    },
  },
  en: {
    learn: {
      pageTitle: 'Choose a language',
      pageDescription: 'Start your learning journey with Chim Lạc.',
      emptyTitle: 'No languages yet',
      emptyBody: 'Run seeds.sql to add sample data.',
      backToLanguages: '← All languages',
      languageCodeLabel: 'Language code',
      reviewNow: 'Review now',
      srsCardTitle: '🧠 Vocabulary review (SRS)',
      srsCardDesc: 'The SM-2 algorithm reminds you to review right before you forget — each correct answer stretches the interval further.',
      grammarSectionTitle: '📖 Grammar',
      loadingLessons: 'Loading lessons...',
      mascotCourse: (name) => `Let's conquer ${name} every day!`,
    },
    grammar: {
      backToLessons: '← Lesson list',
      formulaAffirmative: 'Affirmative',
      formulaNegative: 'Negative',
      formulaInterrogative: 'Interrogative',
      usageTitle: '📌 Usage',
      formulaTitle: '🧮 Formula',
      examplePrefix: 'Example',
      signalsTitle: '🔍 Signal words',
      exercisesTitle: '✏️ Exercises',
      mascotExercise: 'Finish the exercises before moving on! 🦩',
      emptyLessons: 'No grammar lessons for this language yet',
      questionPrefix: 'Question',
      fillPlaceholder: 'Fill in the answer...',
      check: 'Check',
      correct: '✅ Correct!',
      incorrect: (answer) => `❌ Not quite — answer: ${answer}`,
    },
  },
  zh: {
    learn: {
      pageTitle: '选择语言',
      pageDescription: '和 Chim Lạc 一起开始你的学习之旅吧。',
      emptyTitle: '暂无语言',
      emptyBody: '请运行 seeds.sql 添加示例数据。',
      backToLanguages: '← 所有语言',
      languageCodeLabel: '语言代码',
      reviewNow: '立即复习',
      srsCardTitle: '🧠 单词复习（SRS）',
      srsCardDesc: 'SM-2 算法会在你快要遗忘时提醒你复习——每次答对，复习间隔都会变长。',
      grammarSectionTitle: '📖 语法',
      loadingLessons: '正在加载课程...',
      mascotCourse: (name) => `一起每天征服${name}吧！`,
    },
    grammar: {
      backToLessons: '← 课程列表',
      formulaAffirmative: '肯定句',
      formulaNegative: '否定句',
      formulaInterrogative: '疑问句',
      usageTitle: '📌 用法',
      formulaTitle: '🧮 公式',
      examplePrefix: '例句',
      signalsTitle: '🔍 识别标志',
      exercisesTitle: '✏️ 练习',
      mascotExercise: '先做完练习再继续哦！🦩',
      emptyLessons: '该语言暂无语法课程',
      questionPrefix: '第',
      fillPlaceholder: '请输入答案...',
      check: '检查',
      correct: '✅ 正确！',
      incorrect: (answer) => `❌ 不对——正确答案：${answer}`,
    },
  },
  ja: {
    learn: {
      pageTitle: '言語を選択',
      pageDescription: 'Chim Lạc と一緒に学習の旅を始めましょう。',
      emptyTitle: '言語がまだありません',
      emptyBody: 'seeds.sql を実行してサンプルデータを追加してください。',
      backToLanguages: '← すべての言語',
      languageCodeLabel: '言語コード',
      reviewNow: '今すぐ復習',
      srsCardTitle: '🧠 単語復習（SRS）',
      srsCardDesc: 'SM-2 アルゴリズムが忘れる直前に復習のタイミングを教えてくれます——正解するたびに復習間隔が長くなります。',
      grammarSectionTitle: '📖 文法',
      loadingLessons: 'レッスンを読み込み中...',
      mascotCourse: (name) => `毎日一緒に${name}を制覇しましょう！`,
    },
    grammar: {
      backToLessons: '← レッスン一覧',
      formulaAffirmative: '肯定文',
      formulaNegative: '否定文',
      formulaInterrogative: '疑問文',
      usageTitle: '📌 使い方',
      formulaTitle: '🧮 文型',
      examplePrefix: '例',
      signalsTitle: '🔍 見分けるサイン',
      exercisesTitle: '✏️ 練習問題',
      mascotExercise: '練習問題を終えてから次に進んでね！🦩',
      emptyLessons: 'この言語の文法レッスンはまだありません',
      questionPrefix: '問',
      fillPlaceholder: '答えを入力...',
      check: '確認',
      correct: '✅ 正解！',
      incorrect: (answer) => `❌ 不正解 — 正解：${answer}`,
    },
  },
  ko: {
    learn: {
      pageTitle: '언어 선택',
      pageDescription: 'Chim Lạc 와 함께 학습 여정을 시작하세요.',
      emptyTitle: '아직 언어가 없습니다',
      emptyBody: 'seeds.sql 을 실행해서 샘플 데이터를 추가하세요.',
      backToLanguages: '← 모든 언어',
      languageCodeLabel: '언어 코드',
      reviewNow: '지금 복습하기',
      srsCardTitle: '🧠 단어 복습 (SRS)',
      srsCardDesc: 'SM-2 알고리즘이 잊어버리기 직전에 복습하도록 알려줍니다 — 맞출 때마다 복습 간격이 더 길어집니다.',
      grammarSectionTitle: '📖 문법',
      loadingLessons: '레슨을 불러오는 중...',
      mascotCourse: (name) => `매일 함께 ${name}을 정복해봐요!`,
    },
    grammar: {
      backToLessons: '← 레슨 목록',
      formulaAffirmative: '긍정문',
      formulaNegative: '부정문',
      formulaInterrogative: '의문문',
      usageTitle: '📌 사용법',
      formulaTitle: '🧮 공식',
      examplePrefix: '예문',
      signalsTitle: '🔍 구별 신호',
      exercisesTitle: '✏️ 연습 문제',
      mascotExercise: '연습 문제를 다 풀고 넘어가요! 🦩',
      emptyLessons: '이 언어의 문법 레슨이 아직 없습니다',
      questionPrefix: '문제',
      fillPlaceholder: '답을 입력하세요...',
      check: '확인',
      correct: '✅ 정답이에요!',
      incorrect: (answer) => `❌ 오답 — 정답: ${answer}`,
    },
  },
}
