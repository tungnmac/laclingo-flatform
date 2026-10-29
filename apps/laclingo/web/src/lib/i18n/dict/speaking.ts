import type { Locale } from '@/store/locale'
import type { SpeakingTip } from '@/types/api'

// Namespace "speaking" (học viên — luyện nói) và "adminSpeaking" (quản lý chủ
// đề/câu luyện). Chỉ vi+en — zh/ja/ko fallback về en.
export interface SpeakingDict {
  speaking: {
    pageTitle: string
    pageDesc: string
    cardDesc: string
    emptyLanguages: string
    topicsTitle: string
    emptyTopics: string
    topicProgress: (practiced: number, total: number, avgBest: number) => string
    repeatSection: string
    repeatSectionDesc: string
    answerSection: string
    answerSectionDesc: string
    emptyItems: string
    notPracticed: string
    bestScore: (score: number) => string
    // Màn luyện
    itemOf: (index: number, total: number) => string
    repeatInstruction: string
    answerInstruction: string
    showMeaning: string
    hideMeaning: string
    listenSample: string
    startRecording: string
    stopRecording: string
    recordingHint: string
    yourAnswer: string
    transcriptPlaceholder: string
    typeInstead: string
    typePlaceholder: string
    notSupported: string
    micError: (code: string) => string
    submit: string
    submitting: string
    tryAgain: string
    next: string
    prev: string
    backToTopic: string
    // Kết quả
    scoreLabel: string
    newBest: string
    bestSoFar: (score: number) => string
    wordsLegend: string
    keywordsHit: string
    keywordsMissed: string
    stats: (words: number, fillers: number, wpm: number) => string
    tips: Record<SpeakingTip, string>
    sampleAnswer: string
    showSample: string
    keywordsHint: string
  }
  adminSpeaking: {
    pageTitle: string
    pageDesc: string
    hubDesc: string
    topicsTitle: string
    topicNameLabel: string
    topicIconLabel: string
    topicDescLabel: string
    orderLabel: string
    saveTopic: string
    deleteTopicConfirm: (name: string, count: number) => string
    itemsTitle: string
    addItem: string
    editItem: string
    allTopics: string
    searchPlaceholder: string
    kindLabel: string
    kindRepeat: string
    kindAnswer: string
    promptLabelRepeat: string
    promptLabelAnswer: string
    meaningLabel: string
    sampleAnswerLabel: string
    keywordsLabel: string
    keywordsHint: string
    levelLabel: string
    topicLabel: string
    save: string
    cancel: string
    edit: string
    delete: string
    deleteItemConfirm: string
    emptyItems: string
    needTopicFirst: string
    itemCount: (n: number) => string
  }
}

export const speakingTranslations: Partial<Record<Locale, SpeakingDict>> = {
  vi: {
    speaking: {
      pageTitle: 'Luyện nói',
      pageDesc: 'Nói theo câu mẫu và trả lời câu hỏi — hệ thống nhận diện giọng nói và chấm điểm ngay.',
      cardDesc: 'Nói theo câu mẫu, trả lời câu hỏi phỏng vấn và nhận điểm ngay.',
      emptyLanguages: 'Chưa có ngôn ngữ nào',
      topicsTitle: 'Chủ đề luyện nói',
      emptyTopics: 'Ngôn ngữ này chưa có chủ đề luyện nói',
      topicProgress: (practiced, total, avgBest) =>
        practiced === 0 ? `${total} câu · chưa luyện` : `Đã luyện ${practiced}/${total} câu · điểm TB ${avgBest}`,
      repeatSection: '🔁 Nhắc lại câu mẫu',
      repeatSectionDesc: 'Nghe câu mẫu rồi nói lại thật chính xác.',
      answerSection: '💬 Trả lời câu hỏi',
      answerSectionDesc: 'Tự trả lời bằng lời của bạn — cố gắng nhắc tới các ý chính.',
      emptyItems: 'Chủ đề này chưa có câu luyện nào',
      notPracticed: 'Chưa luyện',
      bestScore: (score) => `Cao nhất ${score}`,
      itemOf: (index, total) => `Câu ${index}/${total}`,
      repeatInstruction: 'Nghe rồi nói lại câu sau:',
      answerInstruction: 'Trả lời câu hỏi phỏng vấn sau (nói ít nhất 25 từ):',
      showMeaning: 'Xem nghĩa',
      hideMeaning: 'Ẩn nghĩa',
      listenSample: '🔊 Nghe mẫu',
      startRecording: '🎤 Bắt đầu nói',
      stopRecording: '⏹ Dừng',
      recordingHint: 'Đang nghe... nói rõ ràng, không cần vội',
      yourAnswer: 'Bạn đã nói',
      transcriptPlaceholder: 'Bấm "Bắt đầu nói" rồi nói vào micro',
      typeInstead: 'Gõ thay vì nói',
      typePlaceholder: 'Gõ câu trả lời của bạn bằng tiếng Anh...',
      notSupported: 'Trình duyệt này chưa hỗ trợ nhận diện giọng nói — hãy dùng Chrome, Edge hoặc Safari. Bạn vẫn có thể gõ câu trả lời để được chấm.',
      micError: (code) =>
        code === 'app-not-allowed'
          ? 'LacLingo chưa được phép dùng micro / nhận diện giọng nói — mở Cài đặt của điện thoại > LacLingo, bật Micro rồi thử lại.'
          : code === 'not-allowed' || code === 'service-not-allowed'
          ? 'Trình duyệt chưa được phép dùng micro — bấm biểu tượng ổ khoá cạnh thanh địa chỉ để cho phép rồi thử lại.'
          : code === 'audio-capture'
            ? 'Không tìm thấy micro — kiểm tra micro/tai nghe rồi thử lại.'
            : code === 'network'
              ? 'Mất kết nối tới dịch vụ nhận diện giọng nói — kiểm tra mạng rồi thử lại.'
              : `Không nhận diện được giọng nói (mã lỗi: ${code}).`,
      submit: 'Chấm điểm',
      submitting: 'Đang chấm...',
      tryAgain: '↻ Nói lại',
      next: 'Câu tiếp →',
      prev: '← Câu trước',
      backToTopic: 'Danh sách câu',
      scoreLabel: 'Điểm',
      newBest: '🎉 Kỷ lục mới!',
      bestSoFar: (score) => `Cao nhất: ${score}`,
      wordsLegend: 'Xanh = nói đúng, đỏ = bị thiếu hoặc sai',
      keywordsHit: 'Ý chính đã nhắc tới',
      keywordsMissed: 'Ý chính còn thiếu',
      stats: (words, fillers, wpm) => `${words} từ · ${fillers} từ đệm${wpm ? ` · ${wpm} từ/phút` : ''}`,
      tips: {
        missed_words: 'Một số từ bị thiếu hoặc nói chưa rõ — nghe lại câu mẫu và chú ý các từ màu đỏ.',
        too_short: 'Câu trả lời còn ngắn — hãy nói thêm ví dụ hoặc kết quả cụ thể.',
        missed_keywords: 'Thử nhắc tới các ý chính còn thiếu bên dưới.',
        fillers: 'Hạn chế từ đệm (um, uh) — ngừng một nhịp ngắn thay vì kéo dài âm.',
        too_slow: 'Bạn nói hơi chậm — tự tin nói liền mạch hơn một chút.',
        too_fast: 'Bạn nói hơi nhanh — chậm lại để người nghe theo kịp.',
      },
      sampleAnswer: 'Câu trả lời mẫu',
      showSample: 'Xem câu trả lời mẫu',
      keywordsHint: 'Gợi ý ý chính',
    },
    adminSpeaking: {
      pageTitle: 'Luyện nói',
      pageDesc: 'Quản lý chủ đề và câu luyện nói (nhắc lại câu mẫu / trả lời câu hỏi).',
      hubDesc: 'Chủ đề và câu luyện nói, vd phỏng vấn CNTT.',
      topicsTitle: 'Chủ đề',
      topicNameLabel: 'Tên chủ đề',
      topicIconLabel: 'Icon',
      topicDescLabel: 'Mô tả',
      orderLabel: 'Thứ tự',
      saveTopic: 'Lưu chủ đề',
      deleteTopicConfirm: (name, count) => `Xoá chủ đề "${name}" và ${count} câu luyện của nó?`,
      itemsTitle: 'Câu luyện',
      addItem: '+ Thêm câu luyện',
      editItem: 'Sửa câu luyện',
      allTopics: 'Tất cả chủ đề',
      searchPlaceholder: 'Tìm theo nội dung...',
      kindLabel: 'Loại',
      kindRepeat: 'Nhắc lại câu mẫu',
      kindAnswer: 'Trả lời câu hỏi',
      promptLabelRepeat: 'Câu mẫu cần nói lại',
      promptLabelAnswer: 'Câu hỏi',
      meaningLabel: 'Nghĩa tiếng Việt',
      sampleAnswerLabel: 'Câu trả lời mẫu',
      keywordsLabel: 'Ý chính / từ khoá (mỗi dòng 1 ý)',
      keywordsHint: 'Nhiều cách nói cho 1 ý thì ngăn bằng |, vd: REST|RESTful',
      levelLabel: 'Trình độ',
      topicLabel: 'Chủ đề',
      save: 'Lưu',
      cancel: 'Huỷ',
      edit: 'Sửa',
      delete: 'Xoá',
      deleteItemConfirm: 'Xoá câu luyện này? Lịch sử luyện của học viên cũng bị xoá.',
      emptyItems: 'Chưa có câu luyện nào',
      needTopicFirst: 'Hãy tạo chủ đề trước khi thêm câu luyện.',
      itemCount: (n) => `${n} câu`,
    },
  },
  en: {
    speaking: {
      pageTitle: 'Speaking',
      pageDesc: 'Repeat model sentences and answer questions — your speech is recognised and scored instantly.',
      cardDesc: 'Repeat model sentences, answer interview questions and get scored instantly.',
      emptyLanguages: 'No languages yet',
      topicsTitle: 'Speaking topics',
      emptyTopics: 'This language has no speaking topics yet',
      topicProgress: (practiced, total, avgBest) =>
        practiced === 0 ? `${total} items · not practised` : `Practised ${practiced}/${total} · avg best ${avgBest}`,
      repeatSection: '🔁 Repeat after me',
      repeatSectionDesc: 'Listen to the model sentence and say it back accurately.',
      answerSection: '💬 Answer questions',
      answerSectionDesc: 'Answer in your own words — try to cover the key points.',
      emptyItems: 'This topic has no items yet',
      notPracticed: 'Not practised',
      bestScore: (score) => `Best ${score}`,
      itemOf: (index, total) => `Item ${index}/${total}`,
      repeatInstruction: 'Listen, then say this sentence:',
      answerInstruction: 'Answer this interview question (at least 25 words):',
      showMeaning: 'Show meaning',
      hideMeaning: 'Hide meaning',
      listenSample: '🔊 Listen',
      startRecording: '🎤 Start speaking',
      stopRecording: '⏹ Stop',
      recordingHint: 'Listening... speak clearly, take your time',
      yourAnswer: 'You said',
      transcriptPlaceholder: 'Press "Start speaking" and talk into your microphone',
      typeInstead: 'Type instead',
      typePlaceholder: 'Type your answer in English...',
      notSupported: 'This browser does not support speech recognition — use Chrome, Edge or Safari. You can still type your answer to get a score.',
      micError: (code) =>
        code === 'app-not-allowed'
          ? 'LacLingo is not allowed to use the microphone / speech recognition — open your phone Settings > LacLingo, turn on Microphone, then try again.'
          : code === 'not-allowed' || code === 'service-not-allowed'
          ? 'Microphone access is blocked — click the lock icon next to the address bar to allow it, then try again.'
          : code === 'audio-capture'
            ? 'No microphone found — check your microphone/headset and try again.'
            : code === 'network'
              ? 'Lost connection to the speech recognition service — check your network and try again.'
              : `Speech could not be recognised (error code: ${code}).`,
      submit: 'Score it',
      submitting: 'Scoring...',
      tryAgain: '↻ Try again',
      next: 'Next →',
      prev: '← Previous',
      backToTopic: 'All items',
      scoreLabel: 'Score',
      newBest: '🎉 New best!',
      bestSoFar: (score) => `Best: ${score}`,
      wordsLegend: 'Green = correct, red = missing or wrong',
      keywordsHit: 'Key points covered',
      keywordsMissed: 'Key points missing',
      stats: (words, fillers, wpm) => `${words} words · ${fillers} fillers${wpm ? ` · ${wpm} wpm` : ''}`,
      tips: {
        missed_words: 'Some words were missing or unclear — listen again and focus on the red words.',
        too_short: 'Your answer is short — add an example or a concrete result.',
        missed_keywords: 'Try to mention the missing key points below.',
        fillers: 'Cut down on fillers (um, uh) — pause briefly instead.',
        too_slow: 'You spoke a bit slowly — try to speak more fluently.',
        too_fast: 'You spoke a bit fast — slow down so the listener can follow.',
      },
      sampleAnswer: 'Sample answer',
      showSample: 'Show sample answer',
      keywordsHint: 'Key point hints',
    },
    adminSpeaking: {
      pageTitle: 'Speaking',
      pageDesc: 'Manage speaking topics and items (repeat a model sentence / answer a question).',
      hubDesc: 'Speaking topics and items, e.g. IT job interviews.',
      topicsTitle: 'Topics',
      topicNameLabel: 'Topic name',
      topicIconLabel: 'Icon',
      topicDescLabel: 'Description',
      orderLabel: 'Order',
      saveTopic: 'Save topic',
      deleteTopicConfirm: (name, count) => `Delete topic "${name}" and its ${count} items?`,
      itemsTitle: 'Items',
      addItem: '+ Add item',
      editItem: 'Edit item',
      allTopics: 'All topics',
      searchPlaceholder: 'Search by text...',
      kindLabel: 'Type',
      kindRepeat: 'Repeat a sentence',
      kindAnswer: 'Answer a question',
      promptLabelRepeat: 'Sentence to repeat',
      promptLabelAnswer: 'Question',
      meaningLabel: 'Vietnamese meaning',
      sampleAnswerLabel: 'Sample answer',
      keywordsLabel: 'Key points / keywords (one per line)',
      keywordsHint: 'Several ways to say one point: separate with |, e.g. REST|RESTful',
      levelLabel: 'Level',
      topicLabel: 'Topic',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      deleteItemConfirm: "Delete this item? Learners' practice history for it is deleted too.",
      emptyItems: 'No items yet',
      needTopicFirst: 'Create a topic before adding items.',
      itemCount: (n) => `${n} item${n === 1 ? '' : 's'}`,
    },
  },
}
