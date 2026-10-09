import type { Locale } from '@/store/locale'

// Namespace "review" (hub ôn tập + học từ mới + chủ đề/mục con + yêu thích +
// phiên ôn SRS) và "vocabCard" (WordCard/Flashcard/QualityButtons/ProgressHeader
// dùng chung). Theo yêu cầu: chỉ dịch vi+en trước, các ngôn ngữ khác (zh/ja/ko)
// bổ sung sau — nếu thiếu locale thì useTranslation() nên fallback, xem translations.ts.
export interface ReviewDict {
  review: {
    pageTitle: string
    pageDescWithLang: (name: string) => string
    pageDescNoLang: string
    dueBadge: (display: string | number) => string
    allDoneBadge: string
    vocabReviewTitle: string
    vocabReviewDesc: string
    reviewNowBtn: string
    newWordsTitle: string
    newWordsDesc: string
    newWordsBtn: string
    grammarPracticeTitle: string
    grammarPracticeDesc: string
    chooseLessonBtn: string
    favoritesTitle: string
    favoritesDesc: string
    viewFavoritesBtn: string
    mascotHub: string

    reviewTypesLabel: string
    loadingTopics: string
    newWordsPageDesc: string
    favoritesBtnShort: string
    emptyTopics: string
    hasChildrenBadge: string
    doneBadge: string
    learnedLabel: string

    subtopicsDesc: string
    emptySubtopicWords: string
    ownWordsLabel: string

    emptyNoTopic: string
    loadingWords: string
    emptyTopicNamed: (topic: string) => string
    wordCounter: (index: number, total: number, learned: number) => string
    prevBtn: string
    nextBtn: string
    arrowHint: string
    autoplayStartBtn: string
    autoplayStopBtn: string
    autoplaySettingsBtn: string
    repeatCountLabel: string
    gapSecondsLabel: string
    shadowModeLabel: string
    autoplayRunningHint: string
    srsAutoplayRunningHint: string

    loadingFavorites: string
    emptyFavoritesTitle: string
    emptyFavoritesBody: string

    loadingReviewCards: string
    emptyDueTitle: string
    emptyDueBody: string
    sessionDoneTitle: string
    sessionDoneBody: (remembered: number, total: number) => string
    continueReviewBtn: string
    reviewAgainIn: (days: number) => string
    howWellRemember: string
    showMeaningBtn: string
  }
  vocabCard: {
    favoritedLabel: string
    favoriteLabel: string
    inReviewLabel: string
    addingToReview: string
    addToReview: string
    flipToBack: string
    flipToFront: string
    termLabel: string
    meaningLabel: string
    tapToFlip: string
    progressLabel: string
    qualityForget: string
    qualityHard: string
    qualityGood: string
    qualityEasy: string
    keyHint: (key: string) => string
  }
}

// Chỉ vi+en — zh/ja/ko fallback về en tại nơi merge (xem translations.ts), bổ sung sau.
export const reviewTranslations: Partial<Record<Locale, ReviewDict>> = {
  vi: {
    review: {
      pageTitle: 'Ôn tập',
      pageDescWithLang: (name) => `Đang học: ${name} — chọn dạng ôn tập phù hợp với bạn hôm nay`,
      pageDescNoLang: 'Chọn dạng ôn tập phù hợp với bạn hôm nay',
      dueBadge: (display) => `${display} từ đến hạn`,
      allDoneBadge: 'Đã ôn hết',
      vocabReviewTitle: 'Ôn tập từ vựng (SRS)',
      vocabReviewDesc: 'Flashcard theo thuật toán SM-2 — nhắc bạn ôn đúng lúc sắp quên.',
      reviewNowBtn: 'Ôn ngay',
      newWordsTitle: 'Học từ mới',
      newWordsDesc: 'Chọn chủ đề, học từ qua hình minh họa và câu mẫu — thêm từ bạn muốn vào hàng đợi ôn tập.',
      newWordsBtn: 'Học từ mới',
      grammarPracticeTitle: 'Luyện tập ngữ pháp',
      grammarPracticeDesc: 'Làm bài tập trắc nghiệm và điền từ trong từng bài học 12 thì.',
      chooseLessonBtn: 'Chọn bài học',
      favoritesTitle: 'Từ yêu thích',
      favoritesDesc: 'Xem lại những từ bạn đã đánh dấu yêu thích khi học.',
      viewFavoritesBtn: 'Xem từ yêu thích',
      mascotHub: 'Mỗi ngày một chút, chữ sẽ tự ở lại trong đầu! 🦩',

      reviewTypesLabel: 'Các dạng ôn tập',
      loadingTopics: 'Đang lấy chủ đề...',
      newWordsPageDesc: 'Chọn một chủ đề — xem hình, nghe phát âm, đọc câu mẫu rồi thêm từ vào ôn tập.',
      favoritesBtnShort: '⭐ Từ yêu thích',
      emptyTopics: 'Chưa có chủ đề từ vựng cho ngôn ngữ này',
      hasChildrenBadge: 'Có mục con',
      doneBadge: 'Hoàn thành',
      learnedLabel: 'Đã học',

      subtopicsDesc: 'Chọn mục con để học — hoặc xem từ chung của chủ đề này.',
      emptySubtopicWords: 'Chủ đề này chưa có từ nào',
      ownWordsLabel: 'Từ chung',

      emptyNoTopic: 'Chưa chọn chủ đề',
      loadingWords: 'Đang lấy từ vựng...',
      emptyTopicNamed: (topic) => `Chủ đề "${topic}" chưa có từ nào`,
      wordCounter: (index, total, learned) => `Từ ${index}/${total} · Đã vào ôn tập ${learned}`,
      prevBtn: '← Trước',
      nextBtn: 'Tiếp →',
      arrowHint: 'Dùng phím ← → để chuyển từ',
      autoplayStartBtn: '▶️ Tự động đọc',
      autoplayStopBtn: '⏸ Dừng tự động',
      autoplaySettingsBtn: 'Cài đặt',
      repeatCountLabel: 'Số lần đọc mỗi từ',
      gapSecondsLabel: 'Cách nhau (giây)',
      shadowModeLabel: 'Shadowing — xen đọc nghĩa giữa các lần đọc từ',
      autoplayRunningHint: '🔊 Đang tự động đọc — bấm ← → hoặc Trước/Tiếp để dừng và tự chuyển từ.',
      srsAutoplayRunningHint: '🔊 Đang tự động đọc và lật thẻ — bạn vẫn tự bấm chọn mức độ nhớ như thường. Bấm "Dừng tự động" để tắt.',

      loadingFavorites: 'Đang lấy từ yêu thích...',
      emptyFavoritesTitle: 'Chưa có từ yêu thích nào',
      emptyFavoritesBody: 'Bấm "Yêu thích" trên thẻ từ khi học theo chủ đề để lưu vào đây.',

      loadingReviewCards: 'Đang lấy thẻ ôn tập...',
      emptyDueTitle: 'Không có từ nào đến hạn ôn tập',
      emptyDueBody: 'Học thêm từ mới để có thẻ ôn tập, hoặc quay lại sau nhé.',
      sessionDoneTitle: 'Hoàn thành phiên ôn tập!',
      sessionDoneBody: (remembered, total) => `Bạn nhớ ${remembered}/${total} từ.`,
      continueReviewBtn: 'Ôn tiếp',
      reviewAgainIn: (days) => `Ôn lại sau ${days} ngày`,
      howWellRemember: 'Bạn nhớ từ này thế nào?',
      showMeaningBtn: 'Xem nghĩa',
    },
    vocabCard: {
      favoritedLabel: '⭐ Đã yêu thích',
      favoriteLabel: '☆ Yêu thích',
      inReviewLabel: '✓ Đã trong ôn tập',
      addingToReview: 'Đang thêm...',
      addToReview: '➕ Thêm vào ôn tập',
      flipToBack: 'Mặt sau thẻ, chạm để lật lại',
      flipToFront: 'Mặt trước thẻ, chạm để xem nghĩa',
      termLabel: 'Từ vựng',
      meaningLabel: 'Nghĩa',
      tapToFlip: 'Chạm thẻ hoặc nhấn Space để lật',
      progressLabel: 'Tiến độ',
      qualityForget: 'Quên',
      qualityHard: 'Khó',
      qualityGood: 'Tốt',
      qualityEasy: 'Dễ',
      keyHint: (key) => `Phím ${key}`,
    },
  },
  en: {
    review: {
      pageTitle: 'Review',
      pageDescWithLang: (name) => `Learning: ${name} — pick the review mode that suits you today`,
      pageDescNoLang: 'Pick the review mode that suits you today',
      dueBadge: (display) => `${display} due`,
      allDoneBadge: 'All caught up',
      vocabReviewTitle: 'Vocabulary review (SRS)',
      vocabReviewDesc: 'SM-2 flashcards — reminds you to review right before you forget.',
      reviewNowBtn: 'Review now',
      newWordsTitle: 'Learn new words',
      newWordsDesc: 'Pick a topic, learn words through pictures and example sentences — add the ones you want to your review queue.',
      newWordsBtn: 'Learn new words',
      grammarPracticeTitle: 'Grammar practice',
      grammarPracticeDesc: 'Multiple-choice and fill-in-the-blank exercises across all 12 tenses.',
      chooseLessonBtn: 'Choose a lesson',
      favoritesTitle: 'Favorite words',
      favoritesDesc: 'Look back at the words you marked as favorites while learning.',
      viewFavoritesBtn: 'View favorites',
      mascotHub: 'A little each day — the words will stick! 🦩',

      reviewTypesLabel: 'Review modes',
      loadingTopics: 'Loading topics...',
      newWordsPageDesc: 'Pick a topic — see the picture, hear the pronunciation, read the example, then add the word to review.',
      favoritesBtnShort: '⭐ Favorites',
      emptyTopics: 'No vocabulary topics for this language yet',
      hasChildrenBadge: 'Has subtopics',
      doneBadge: 'Done',
      learnedLabel: 'Learned',

      subtopicsDesc: 'Pick a subtopic to learn — or see the shared words of this topic.',
      emptySubtopicWords: 'This topic has no words yet',
      ownWordsLabel: 'Shared words',

      emptyNoTopic: 'No topic selected',
      loadingWords: 'Loading words...',
      emptyTopicNamed: (topic) => `Topic "${topic}" has no words yet`,
      wordCounter: (index, total, learned) => `Word ${index}/${total} · In review: ${learned}`,
      prevBtn: '← Previous',
      nextBtn: 'Next →',
      arrowHint: 'Use ← → to switch words',
      autoplayStartBtn: '▶️ Auto-play',
      autoplayStopBtn: '⏸ Stop auto-play',
      autoplaySettingsBtn: 'Settings',
      repeatCountLabel: 'Repeats per word',
      gapSecondsLabel: 'Gap (seconds)',
      shadowModeLabel: 'Shadowing — read the meaning between word repeats',
      autoplayRunningHint: '🔊 Auto-playing — press ← → or Previous/Next to stop and move manually.',
      srsAutoplayRunningHint: '🔊 Auto-playing and auto-flipping — you still pick how well you remembered as usual. Press "Stop auto-play" to turn it off.',

      loadingFavorites: 'Loading favorites...',
      emptyFavoritesTitle: 'No favorite words yet',
      emptyFavoritesBody: 'Tap "Favorite" on a word card while learning by topic to save it here.',

      loadingReviewCards: 'Loading review cards...',
      emptyDueTitle: 'No words due for review',
      emptyDueBody: 'Learn more new words to build up your review queue, or come back later.',
      sessionDoneTitle: 'Review session complete!',
      sessionDoneBody: (remembered, total) => `You remembered ${remembered}/${total} words.`,
      continueReviewBtn: 'Keep reviewing',
      reviewAgainIn: (days) => `Review again in ${days} days`,
      howWellRemember: 'How well did you remember this word?',
      showMeaningBtn: 'Show meaning',
    },
    vocabCard: {
      favoritedLabel: '⭐ Favorited',
      favoriteLabel: '☆ Favorite',
      inReviewLabel: '✓ In review',
      addingToReview: 'Adding...',
      addToReview: '➕ Add to review',
      flipToBack: 'Card back, tap to flip back',
      flipToFront: 'Card front, tap to see meaning',
      termLabel: 'Term',
      meaningLabel: 'Meaning',
      tapToFlip: 'Tap the card or press Space to flip',
      progressLabel: 'Progress',
      qualityForget: 'Forgot',
      qualityHard: 'Hard',
      qualityGood: 'Good',
      qualityEasy: 'Easy',
      keyHint: (key) => `Key ${key}`,
    },
  },
}
