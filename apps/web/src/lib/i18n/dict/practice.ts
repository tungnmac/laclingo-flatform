import type { Locale } from '@/store/locale'

// Namespace "practice" — bộ bài luyện tập khi ôn tập 1 từ (chọn nghĩa, ghép câu,
// ghép nghĩa câu, nghe-viết). Chỉ vi+en — zh/ja/ko fallback về en.
export interface PracticeDict {
  practice: {
    stepOf: (step: number, total: number) => string
    practiceCount: (n: number) => string
    chooseMeaningTitle: string
    buildSentenceTitle: string
    buildMeaningTitle: string
    buildMeaningHint: string
    dictationTitle: string
    dictationPlaceholder: string
    dictationHint: string
    replayBtn: string
    answerPlaceholder: string
    checkBtn: string
    clearBtn: string
    showAnswerBtn: string
    continueBtn: string
    correct: string
    wrong: string
    answerIs: (answer: string) => string
    mistakesLabel: (n: number) => string
    saving: string
  }
}

export const practiceTranslations: Partial<Record<Locale, PracticeDict>> = {
  vi: {
    practice: {
      stepOf: (step, total) => `Bài ${step}/${total}`,
      practiceCount: (n) => `Đã luyện ${n} lần`,
      chooseMeaningTitle: 'Chọn nghĩa đúng của từ',
      buildSentenceTitle: 'Chọn từng từ để ghép thành câu ví dụ',
      buildMeaningTitle: 'Ghép thành nghĩa tiếng Việt của câu',
      buildMeaningHint: 'Câu cần dịch:',
      dictationTitle: 'Nghe và viết lại từ vựng',
      dictationPlaceholder: 'Gõ từ bạn nghe được...',
      dictationHint: 'Tiếng Trung: gõ chữ Hán hoặc pinyin (không cần dấu thanh).',
      replayBtn: '🔊 Nghe lại',
      answerPlaceholder: 'Chạm vào các từ bên dưới theo đúng thứ tự',
      checkBtn: 'Kiểm tra',
      clearBtn: 'Xoá',
      showAnswerBtn: 'Xem đáp án',
      continueBtn: 'Tiếp tục →',
      correct: '🎉 Chính xác!',
      wrong: '❌ Chưa đúng, thử lại nhé!',
      answerIs: (answer) => `Đáp án: ${answer}`,
      mistakesLabel: (n) => (n === 0 ? 'Không sai lần nào' : `Sai ${n} lần`),
      saving: 'Đang lưu kết quả...',
    },
  },
  en: {
    practice: {
      stepOf: (step, total) => `Exercise ${step}/${total}`,
      practiceCount: (n) => `Practiced ${n} time${n === 1 ? '' : 's'}`,
      chooseMeaningTitle: 'Choose the correct meaning',
      buildSentenceTitle: 'Tap the words to build the example sentence',
      buildMeaningTitle: 'Build the Vietnamese meaning of the sentence',
      buildMeaningHint: 'Sentence to translate:',
      dictationTitle: 'Listen and write the word',
      dictationPlaceholder: 'Type the word you hear...',
      dictationHint: 'Chinese: type the characters or pinyin (tone marks optional).',
      replayBtn: '🔊 Replay',
      answerPlaceholder: 'Tap the words below in the right order',
      checkBtn: 'Check',
      clearBtn: 'Clear',
      showAnswerBtn: 'Show answer',
      continueBtn: 'Continue →',
      correct: '🎉 Correct!',
      wrong: '❌ Not quite, try again!',
      answerIs: (answer) => `Answer: ${answer}`,
      mistakesLabel: (n) => (n === 0 ? 'No mistakes' : `${n} mistake${n === 1 ? '' : 's'}`),
      saving: 'Saving result...',
    },
  },
}
