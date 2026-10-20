import type { Locale } from '@/store/locale'

// Namespace "adminVocabulary" — CRUD từ vựng + chủ đề từ vựng. Chỉ vi+en.
export interface AdminVocabularyDict {
  adminVocabulary: {
    pageTitle: string
    pageDesc: string
    tabWords: string
    tabTopics: string
    topicsTitle: string
    topicSearchPlaceholder: string
    addTopicBtn: string
    editTopicTitle: (name: string) => string
    addTopicTitle: string
    topicNameLabel: string
    topicNameImmutable: (name: string) => string
    topicNamePlaceholder: string
    deleteTopicConfirm: (name: string, warning: string) => string
    deleteTopicWarningHasChildren: string
    emptyTopics: string
    emptyTopicsSearch: string
    collapseChildren: string
    expandChildren: string
    childCount: (n: number) => string
    parentLabel: string
    noParentOption: string
    iconLabel: string
    orderIndexLabel: string
    wordsTitle: string
    wordSearchPlaceholder: string
    topicFilterLabel: string
    topicFilterPlaceholder: string
    levelFilterLabel: string
    addWordBtn: string
    editWordTitle: (term: string) => string
    addWordTitle: string
    deckLabel: string
    deckHint: string
    addedToDeck: (term: string, decks: string) => string
    addToDeckFailed: (term: string, deck: string, error: string) => string
    termLabel: string
    phoneticLabel: string
    partOfSpeechLabel: string
    noPartOfSpeechOption: string
    meaningLabel: string
    exampleLabel: string
    exampleMeaningLabel: string
    illustrationEmojiLabel: string
    illustrationImageLabel: string
    illustrationImageHint: string
    uploadImageBtn: string
    changeImageBtn: string
    uploadingImage: string
    removeImageBtn: string
    imageTooLarge: string
    noTopicOption: string
    emptyWords: string
    deleteWordConfirm: (term: string) => string
  }
}

export const adminVocabularyTranslations: Partial<Record<Locale, AdminVocabularyDict>> = {
  vi: {
    adminVocabulary: {
      pageTitle: 'Từ vựng',
      pageDesc: 'Quản lý từ vựng và chủ đề từ vựng theo ngôn ngữ.',
      tabWords: '📚 Từ vựng',
      tabTopics: '🗂️ Chủ đề',
      topicsTitle: '🗂️ Chủ đề',
      topicSearchPlaceholder: 'Tìm theo tên chủ đề (cả chủ đề cha và con)...',
      addTopicBtn: '+ Thêm chủ đề',
      editTopicTitle: (name) => `Sửa: ${name}`,
      addTopicTitle: 'Thêm chủ đề mới',
      topicNameLabel: 'Tên chủ đề',
      topicNameImmutable: (name) => `${name} (không thể đổi tên khi sửa)`,
      topicNamePlaceholder: 'Công nghệ thông tin',
      deleteTopicConfirm: (name, warning) =>
        `Xoá chủ đề "${name}"? Từ vựng đang gắn chủ đề này vẫn giữ nguyên, chỉ mất icon/thứ tự hiển thị riêng.${warning}`,
      deleteTopicWarningHasChildren:
        ' Chủ đề này đang có chủ đề con — xoá sẽ xoá CẢ metadata của các chủ đề con đó (từ vựng vẫn giữ nguyên).',
      emptyTopics: 'Chưa có chủ đề nào',
      emptyTopicsSearch: 'Không tìm thấy chủ đề nào',
      collapseChildren: 'Thu gọn chủ đề con',
      expandChildren: 'Xem chủ đề con',
      childCount: (n) => `${n} chủ đề con`,
      parentLabel: 'Chủ đề cha (để trống = chủ đề cấp cao nhất)',
      noParentOption: '— Không có, đây là chủ đề cấp cao nhất —',
      iconLabel: 'Icon (emoji)',
      orderIndexLabel: 'Thứ tự hiển thị',
      wordsTitle: '📚 Từ vựng',
      wordSearchPlaceholder: 'Tìm theo từ/nghĩa...',
      topicFilterLabel: 'Chủ đề',
      topicFilterPlaceholder: 'Gõ để tìm hoặc chọn chủ đề...',
      levelFilterLabel: 'Cấp độ',
      addWordBtn: '+ Thêm từ',
      editWordTitle: (term) => `Sửa: ${term}`,
      addWordTitle: 'Thêm từ mới',
      deckLabel: 'Thêm vào list ôn tập (không bắt buộc)',
      deckHint: 'Tích các list muốn thêm từ này, hoặc gõ tên để tạo list mới — từ được thêm vào các list khi bấm Lưu.',
      addedToDeck: (term, decks) => `✅ Đã tạo "${term}" và thêm vào list "${decks}"`,
      addToDeckFailed: (term, deck, error) => `⚠️ Đã tạo "${term}" nhưng chưa thêm được vào list "${deck}": ${error}`,
      termLabel: 'Từ',
      phoneticLabel: 'Phiên âm',
      partOfSpeechLabel: 'Từ loại',
      noPartOfSpeechOption: '— Chưa phân loại —',
      meaningLabel: 'Nghĩa',
      exampleLabel: 'Ví dụ',
      exampleMeaningLabel: 'Nghĩa của câu ví dụ',
      illustrationEmojiLabel: 'Emoji minh họa',
      illustrationImageLabel: 'Ảnh minh họa',
      illustrationImageHint: 'JPG/PNG/WEBP/GIF, tối đa 5MB — có ảnh thì hiển thị thay emoji.',
      uploadImageBtn: '📤 Tải ảnh lên',
      changeImageBtn: 'Đổi ảnh',
      uploadingImage: 'Đang tải ảnh...',
      removeImageBtn: 'Bỏ ảnh',
      imageTooLarge: 'Ảnh quá lớn (tối đa 5MB).',
      noTopicOption: '— Không chủ đề —',
      emptyWords: 'Chưa có từ vựng nào',
      deleteWordConfirm: (term) => `Xoá từ "${term}"?`,
    },
  },
  en: {
    adminVocabulary: {
      pageTitle: 'Vocabulary',
      pageDesc: 'Manage vocabulary and vocabulary topics per language.',
      tabWords: '📚 Vocabulary',
      tabTopics: '🗂️ Topics',
      topicsTitle: '🗂️ Topics',
      topicSearchPlaceholder: 'Search by topic name (parent and child)...',
      addTopicBtn: '+ Add topic',
      editTopicTitle: (name) => `Edit: ${name}`,
      addTopicTitle: 'Add a new topic',
      topicNameLabel: 'Topic name',
      topicNameImmutable: (name) => `${name} (name cannot be changed when editing)`,
      topicNamePlaceholder: 'Information technology',
      deleteTopicConfirm: (name, warning) =>
        `Delete topic "${name}"? Vocabulary using this topic will keep its name, only the icon/display order metadata is removed.${warning}`,
      deleteTopicWarningHasChildren:
        ' This topic has subtopics — deleting it will also delete ALL subtopic metadata (vocabulary itself is kept).',
      emptyTopics: 'No topics yet',
      emptyTopicsSearch: 'No topics found',
      collapseChildren: 'Collapse subtopics',
      expandChildren: 'View subtopics',
      childCount: (n) => `${n} subtopics`,
      parentLabel: 'Parent topic (leave empty = top-level topic)',
      noParentOption: '— None, this is a top-level topic —',
      iconLabel: 'Icon (emoji)',
      orderIndexLabel: 'Display order',
      wordsTitle: '📚 Vocabulary',
      wordSearchPlaceholder: 'Search by term/meaning...',
      topicFilterLabel: 'Topic',
      topicFilterPlaceholder: 'Type to search or pick a topic...',
      levelFilterLabel: 'Level',
      addWordBtn: '+ Add word',
      editWordTitle: (term) => `Edit: ${term}`,
      addWordTitle: 'Add a new word',
      deckLabel: 'Add to review lists (optional)',
      deckHint: 'Tick the lists to add this word to, or type a name to create a new list — the word is added when you save.',
      addedToDeck: (term, decks) => `✅ Created "${term}" and added it to "${decks}"`,
      addToDeckFailed: (term, deck, error) => `⚠️ Created "${term}" but could not add it to "${deck}": ${error}`,
      termLabel: 'Term',
      phoneticLabel: 'Phonetic',
      partOfSpeechLabel: 'Part of speech',
      noPartOfSpeechOption: '— Not set —',
      meaningLabel: 'Meaning',
      exampleLabel: 'Example',
      exampleMeaningLabel: 'Example translation (Vietnamese)',
      illustrationEmojiLabel: 'Illustration emoji',
      illustrationImageLabel: 'Illustration image',
      illustrationImageHint: 'JPG/PNG/WEBP/GIF, max 5MB — shown instead of the emoji when set.',
      uploadImageBtn: '📤 Upload image',
      changeImageBtn: 'Change image',
      uploadingImage: 'Uploading...',
      removeImageBtn: 'Remove image',
      imageTooLarge: 'Image is too large (max 5MB).',
      noTopicOption: '— No topic —',
      emptyWords: 'No vocabulary yet',
      deleteWordConfirm: (term) => `Delete word "${term}"?`,
    },
  },
}
