import type { Locale } from '@/store/locale'

// Namespace "listening" (học viên: chọn ngôn ngữ/chủ đề/bài, nghe + trả lời
// câu hỏi). Chỉ vi+en — zh/ja/ko fallback về en, bổ sung sau.
export interface ListeningDict {
  listening: {
    pageTitle: string
    pageDesc: string
    emptyLanguages: string
    topicsTitle: string
    emptyTopics: string
    passageCountSuffix: string
    emptyNoTopic: string
    emptyTopicPassages: string
    audioHint: string
    hideTranscript: string
    showTranscript: string
    questionsTitle: string
    mascotListen: string
    submitting: string
    submitAnswer: string
  }
}

export const listeningTranslations: Partial<Record<Locale, ListeningDict>> = {
  vi: {
    listening: {
      pageTitle: '🎧 Luyện nghe',
      pageDesc: 'Nghe đoạn hội thoại/câu chuyện ngắn và trả lời câu hỏi hiểu nội dung.',
      emptyLanguages: 'Chưa có ngôn ngữ nào',
      topicsTitle: 'Luyện nghe',
      emptyTopics: 'Chưa có chủ đề luyện nghe cho ngôn ngữ này',
      passageCountSuffix: 'bài',
      emptyNoTopic: 'Chưa chọn chủ đề',
      emptyTopicPassages: 'Chủ đề này chưa có bài luyện nghe',
      audioHint: 'Nhấn để nghe đoạn audio. Có thể nghe lại nhiều lần trước khi trả lời.',
      hideTranscript: 'Ẩn văn bản',
      showTranscript: 'Hiện văn bản (nếu cần)',
      questionsTitle: '❓ Câu hỏi',
      mascotListen: 'Nghe kỹ trước khi trả lời nha! 🦩',
      submitting: 'Đang chấm...',
      submitAnswer: 'Nộp đáp án',
    },
  },
  en: {
    listening: {
      pageTitle: '🎧 Listening',
      pageDesc: 'Listen to short dialogues/stories and answer comprehension questions.',
      emptyLanguages: 'No languages yet',
      topicsTitle: 'Listening',
      emptyTopics: 'No listening topics for this language yet',
      passageCountSuffix: 'passages',
      emptyNoTopic: 'No topic selected',
      emptyTopicPassages: 'This topic has no listening passages yet',
      audioHint: 'Tap to play the audio. You can replay it as many times as you need before answering.',
      hideTranscript: 'Hide transcript',
      showTranscript: 'Show transcript (if needed)',
      questionsTitle: '❓ Questions',
      mascotListen: 'Listen carefully before answering! 🦩',
      submitting: 'Checking...',
      submitAnswer: 'Submit answer',
    },
  },
}
