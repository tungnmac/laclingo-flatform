import type { Locale } from '@/store/locale'

// Namespace "adminListening" — CRUD bài luyện nghe + chủ đề + audio + câu hỏi. Chỉ vi+en.
export interface AdminListeningDict {
  adminListening: {
    pageTitle: string
    pageDesc: string
    tabPassages: string
    tabTopics: string
    topicsTitle: string
    addTopicBtn: string
    topicSearchPlaceholder: string
    editTopicTitle: (name: string) => string
    addTopicTitle: string
    topicNameLabel: string
    topicNameImmutable: (name: string) => string
    topicNamePlaceholder: string
    iconLabel: string
    emptyTopics: string
    emptyTopicsSearch: string
    deleteTopicConfirm: (name: string) => string
    audioSectionLabel: string
    processingBtn: string
    changeFileBtn: string
    removeAudioBtn: string
    uploadingBtn: string
    uploadAudioBtn: string
    audioHint: string
    removeAudioConfirm: (title: string) => string
    passagesTitle: string
    addPassageBtn: string
    passageSearchPlaceholder: string
    topicFilterLabel: string
    levelFilterLabel: string
    editPassageTitle: (title: string) => string
    addPassageTitle: string
    titleLabel: string
    scriptLabel: string
    optionalTopicLabel: string
    orderLabel: string
    emptyPassages: string
    deletePassageConfirm: (title: string) => string
    noTopicGroupLabel: string
    passageCountSuffix: string
    questionsBtn: string
    questionsPageTitle: string
    questionsPageDesc: string
    addQuestionBtn: string
    questionSearchPlaceholder: string
    editQuestionTitle: string
    addQuestionTitle: string
    questionLabel: string
    optionsLabel: string
    correctAnswerLabel: string
    explanationLabel: string
    emptyQuestions: string
    deleteQuestionConfirm: (question: string) => string
    correctAnswerMismatchError: string
  }
}

export const adminListeningTranslations: Partial<Record<Locale, AdminListeningDict>> = {
  vi: {
    adminListening: {
      pageTitle: 'Luyện nghe',
      pageDesc: 'Bài luyện nghe (script đọc bằng TTS), câu hỏi hiểu nội dung, và chủ đề.',
      tabPassages: '🎧 Bài luyện nghe',
      tabTopics: '🗂️ Chủ đề',
      topicsTitle: '🗂️ Chủ đề',
      addTopicBtn: '+ Thêm chủ đề',
      topicSearchPlaceholder: 'Tìm theo tên chủ đề...',
      editTopicTitle: (name) => `Sửa: ${name}`,
      addTopicTitle: 'Thêm chủ đề mới',
      topicNameLabel: 'Tên chủ đề',
      topicNameImmutable: (name) => `${name} (không thể đổi tên khi sửa)`,
      topicNamePlaceholder: 'Daily life',
      iconLabel: 'Icon (emoji)',
      emptyTopics: 'Chưa có chủ đề nào',
      emptyTopicsSearch: 'Không tìm thấy chủ đề nào',
      deleteTopicConfirm: (name) =>
        `Xoá chủ đề "${name}"? Bài luyện nghe đang gắn chủ đề này vẫn giữ nguyên, chỉ mất icon/thứ tự hiển thị riêng.`,
      audioSectionLabel: 'Audio thật (tuỳ chọn, thay cho TTS)',
      processingBtn: 'Đang xử lý...',
      changeFileBtn: 'Thay file khác',
      removeAudioBtn: 'Gỡ audio',
      uploadingBtn: 'Đang upload...',
      uploadAudioBtn: '📤 Upload audio',
      audioHint: 'mp3/wav/ogg/m4a/webm, tối đa 25MB. Không chọn thì bài dùng giọng đọc TTS từ script.',
      removeAudioConfirm: (title) => `Gỡ audio khỏi "${title}"? Bài sẽ quay lại dùng TTS từ script.`,
      passagesTitle: '🎧 Bài luyện nghe',
      addPassageBtn: '+ Tạo bài',
      passageSearchPlaceholder: 'Tìm theo tiêu đề/chủ đề...',
      topicFilterLabel: 'Chủ đề',
      levelFilterLabel: 'Cấp độ',
      editPassageTitle: (title) => `Sửa: ${title}`,
      addPassageTitle: 'Tạo bài luyện nghe mới',
      titleLabel: 'Tiêu đề',
      scriptLabel: 'Script (văn bản sẽ được đọc bằng Web Speech TTS)',
      optionalTopicLabel: 'Chủ đề (tuỳ chọn)',
      orderLabel: 'Thứ tự',
      emptyPassages: 'Chưa có bài luyện nghe nào',
      deletePassageConfirm: (title) => `Xoá bài "${title}"? Toàn bộ câu hỏi bên trong sẽ bị xoá theo.`,
      noTopicGroupLabel: 'Chưa có chủ đề',
      passageCountSuffix: 'bài',
      questionsBtn: 'Câu hỏi',
      questionsPageTitle: 'Câu hỏi hiểu nội dung',
      questionsPageDesc: 'Trắc nghiệm cho bài luyện nghe này.',
      addQuestionBtn: '+ Tạo câu hỏi',
      questionSearchPlaceholder: 'Tìm theo nội dung câu hỏi...',
      editQuestionTitle: 'Sửa câu hỏi',
      addQuestionTitle: 'Tạo câu hỏi mới',
      questionLabel: 'Câu hỏi',
      optionsLabel: 'Lựa chọn (mỗi dòng 1 lựa chọn)',
      correctAnswerLabel: 'Đáp án đúng (phải khớp đúng 1 trong các lựa chọn trên)',
      explanationLabel: 'Giải thích (tuỳ chọn)',
      emptyQuestions: 'Chưa có câu hỏi nào',
      deleteQuestionConfirm: (question) => `Xoá câu hỏi "${question}"?`,
      correctAnswerMismatchError: 'Đáp án đúng phải khớp CHÍNH XÁC với 1 trong các lựa chọn phía trên.',
    },
  },
  en: {
    adminListening: {
      pageTitle: 'Listening',
      pageDesc: 'Listening passages (TTS script), comprehension questions, and topics.',
      tabPassages: '🎧 Passages',
      tabTopics: '🗂️ Topics',
      topicsTitle: '🗂️ Topics',
      addTopicBtn: '+ Add topic',
      topicSearchPlaceholder: 'Search by topic name...',
      editTopicTitle: (name) => `Edit: ${name}`,
      addTopicTitle: 'Add a new topic',
      topicNameLabel: 'Topic name',
      topicNameImmutable: (name) => `${name} (name cannot be changed when editing)`,
      topicNamePlaceholder: 'Daily life',
      iconLabel: 'Icon (emoji)',
      emptyTopics: 'No topics yet',
      emptyTopicsSearch: 'No topics found',
      deleteTopicConfirm: (name) => `Delete topic "${name}"? Passages using this topic keep their name, only the icon/order metadata is removed.`,
      audioSectionLabel: 'Real audio (optional, replaces TTS)',
      processingBtn: 'Processing...',
      changeFileBtn: 'Change file',
      removeAudioBtn: 'Remove audio',
      uploadingBtn: 'Uploading...',
      uploadAudioBtn: '📤 Upload audio',
      audioHint: 'mp3/wav/ogg/m4a/webm, up to 25MB. Leave empty to use TTS from the script.',
      removeAudioConfirm: (title) => `Remove audio from "${title}"? The passage will fall back to TTS from the script.`,
      passagesTitle: '🎧 Passages',
      addPassageBtn: '+ Create passage',
      passageSearchPlaceholder: 'Search by title/topic...',
      topicFilterLabel: 'Topic',
      levelFilterLabel: 'Level',
      editPassageTitle: (title) => `Edit: ${title}`,
      addPassageTitle: 'Create a new passage',
      titleLabel: 'Title',
      scriptLabel: 'Script (text read by Web Speech TTS)',
      optionalTopicLabel: 'Topic (optional)',
      orderLabel: 'Order',
      emptyPassages: 'No passages yet',
      deletePassageConfirm: (title) => `Delete passage "${title}"? All questions inside it will be deleted too.`,
      noTopicGroupLabel: 'No topic',
      passageCountSuffix: 'passages',
      questionsBtn: 'Questions',
      questionsPageTitle: 'Comprehension questions',
      questionsPageDesc: 'Multiple-choice questions for this passage.',
      addQuestionBtn: '+ Create question',
      questionSearchPlaceholder: 'Search by question text...',
      editQuestionTitle: 'Edit question',
      addQuestionTitle: 'Create a new question',
      questionLabel: 'Question',
      optionsLabel: 'Options (one per line)',
      correctAnswerLabel: 'Correct answer (must exactly match one of the options above)',
      explanationLabel: 'Explanation (optional)',
      emptyQuestions: 'No questions yet',
      deleteQuestionConfirm: (question) => `Delete question "${question}"?`,
      correctAnswerMismatchError: 'The correct answer must EXACTLY match one of the options above.',
    },
  },
}
