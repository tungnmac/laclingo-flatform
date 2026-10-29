import type { Locale } from '@/store/locale'
import type { SentenceErrorType } from '@/types/api'

// Namespace "analyze" — trang Phân tích câu (AI). Chỉ vi+en — zh/ja/ko fallback về en.
export interface AnalyzeDict {
  analyze: {
    pageTitle: string
    pageSubtitle: string
    languageLabel: string
    languages: Record<'en' | 'zh', string>
    placeholder: Record<'en' | 'zh', string>
    charCount: (n: number, max: number) => string
    analyzeBtn: string
    analyzing: string
    quota: (remaining: number, limit: number) => string
    quotaOut: string
    noAI: string
    cached: string
    correctTitle: string
    incorrectTitle: (n: number) => string
    notNaturalTitle: string
    yourSentence: string
    corrected: string
    translation: string
    errorsTitle: string
    missing: string
    remove: string
    structureTitle: string
    grammarTitle: string
    vocabTitle: string
    inAppHint: string
    addToReview: string
    errorTypes: Record<SentenceErrorType, string>
    analyzeExample: string
  }
}

export const analyzeTranslations: Partial<Record<Locale, AnalyzeDict>> = {
  vi: {
    analyze: {
      pageTitle: 'Phân tích câu',
      pageSubtitle: 'Nhập 1 câu tiếng Anh hoặc tiếng Trung — AI chỉ ra lỗi ngữ pháp, thiếu/sai giới từ, mạo từ, trợ từ, giải thích cấu trúc và từ vựng.',
      languageLabel: 'Ngôn ngữ',
      languages: { en: '🇬🇧 Tiếng Anh', zh: '🇨🇳 Tiếng Trung' },
      placeholder: { en: 'Vd: I am interested about learning English.', zh: 'Vd: 我昨天去超市买三苹果。' },
      charCount: (n, max) => `${n}/${max}`,
      analyzeBtn: '🔍 Phân tích',
      analyzing: 'Đang phân tích…',
      quota: (remaining, limit) => `Còn ${remaining}/${limit} lượt hôm nay`,
      quotaOut: 'Hết lượt phân tích hôm nay — câu đã phân tích trước đó vẫn xem lại được.',
      noAI: 'Server chưa cấu hình AI nên chưa phân tích câu được.',
      cached: 'Kết quả đã lưu — không tính lượt',
      correctTitle: '✅ Câu đúng ngữ pháp',
      incorrectTitle: (n) => `⚠️ Có ${n} lỗi cần sửa`,
      notNaturalTitle: '⚠️ Câu chưa tự nhiên — xem câu đã sửa',
      yourSentence: 'Câu của bạn',
      corrected: 'Câu đã sửa',
      translation: 'Nghĩa',
      errorsTitle: 'Lỗi & cách sửa',
      missing: '(thiếu)',
      remove: '(bỏ đi)',
      structureTitle: 'Cấu trúc câu',
      grammarTitle: 'Điểm ngữ pháp',
      vocabTitle: 'Từ vựng trong câu',
      inAppHint: 'Từ này có trong kho từ vựng — thêm vào ôn tập để học',
      addToReview: '+ Ôn tập',
      errorTypes: {
        grammar: 'Ngữ pháp',
        tense: 'Thì',
        agreement: 'Hòa hợp chủ–vị',
        article: 'Mạo từ',
        preposition: 'Giới từ',
        particle: 'Trợ từ',
        measure_word: 'Lượng từ',
        word_order: 'Trật tự từ',
        word_choice: 'Dùng từ',
        missing_word: 'Thiếu từ',
        extra_word: 'Thừa từ',
        spelling: 'Chính tả',
        punctuation: 'Dấu câu',
        other: 'Khác',
      },
      analyzeExample: 'Phân tích câu ví dụ',
    },
  },
  en: {
    analyze: {
      pageTitle: 'Sentence check',
      pageSubtitle: 'Enter an English or Chinese sentence — AI points out grammar mistakes, missing or wrong prepositions, articles and particles, and explains the structure and vocabulary.',
      languageLabel: 'Language',
      languages: { en: '🇬🇧 English', zh: '🇨🇳 Chinese' },
      placeholder: { en: 'e.g. I am interested about learning English.', zh: 'e.g. 我昨天去超市买三苹果。' },
      charCount: (n, max) => `${n}/${max}`,
      analyzeBtn: '🔍 Analyze',
      analyzing: 'Analyzing…',
      quota: (remaining, limit) => `${remaining}/${limit} checks left today`,
      quotaOut: 'No checks left today — sentences you analyzed before can still be viewed.',
      noAI: 'AI is not configured on the server, so sentences cannot be analyzed yet.',
      cached: 'Saved result — no check used',
      correctTitle: '✅ The sentence is correct',
      incorrectTitle: (n) => `⚠️ ${n} mistake${n === 1 ? '' : 's'} to fix`,
      notNaturalTitle: '⚠️ Not quite natural — see the corrected sentence',
      yourSentence: 'Your sentence',
      corrected: 'Corrected',
      translation: 'Meaning',
      errorsTitle: 'Mistakes & fixes',
      missing: '(missing)',
      remove: '(remove)',
      structureTitle: 'Sentence structure',
      grammarTitle: 'Grammar points',
      vocabTitle: 'Vocabulary',
      inAppHint: 'This word is in the vocabulary bank — add it to review to study it',
      addToReview: '+ Review',
      errorTypes: {
        grammar: 'Grammar',
        tense: 'Tense',
        agreement: 'Agreement',
        article: 'Article',
        preposition: 'Preposition',
        particle: 'Particle',
        measure_word: 'Measure word',
        word_order: 'Word order',
        word_choice: 'Word choice',
        missing_word: 'Missing word',
        extra_word: 'Extra word',
        spelling: 'Spelling',
        punctuation: 'Punctuation',
        other: 'Other',
      },
      analyzeExample: 'Analyze the example sentence',
    },
  },
}
