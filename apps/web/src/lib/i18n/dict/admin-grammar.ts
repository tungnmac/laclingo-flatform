import type { Locale } from '@/store/locale'

// Namespace "adminGrammar" — CRUD chủ đề/bài học/bài tập ngữ pháp. Chỉ vi+en.
export interface AdminGrammarDict {
  adminGrammar: {
    pageTitle: string
    pageDesc: string
    tabLessons: string
    tabTopics: string
    topicsTitle: string
    addTopicBtn: string
    topicSearchPlaceholder: string
    editTopicTitle: (title: string) => string
    addTopicTitle: string
    topicCodeLabel: string
    titleLabel: string
    descriptionLabel: string
    orderLabel: string
    emptyTopics: string
    deleteTopicConfirm: (title: string) => string
    lessonsTitle: string
    addLessonBtn: string
    createTopicFirst: string
    lessonSearchPlaceholder: string
    topicFilterLabel: string
    levelFilterLabel: string
    editLessonTitle: (title: string) => string
    addLessonTitle: string
    chooseTopicLabel: string
    chooseTopicPlaceholder: string
    lessonCodeLabel: string
    contentLabel: string
    emptyLessons: string
    deleteLessonConfirm: (title: string) => string
    exercisesBtn: string
    backToLessons: string
    exercisesPageTitle: string
    exercisesPageDesc: string
    addExerciseBtn: string
    exerciseSearchPlaceholder: string
    editExerciseTitle: string
    addExerciseTitle: string
    exerciseTypeLabel: string
    multipleChoiceOption: string
    fillBlankOption: string
    questionLabel: string
    optionsLabel: string
    correctAnswerLabel: string
    explanationLabel: string
    difficultyLabel: string
    xpRewardLabel: string
    hintLabel: string
    emptyExercises: string
    deleteExerciseConfirm: (question: string) => string
    typeAndAnswer: (type: string, answer: string) => string
    invalidContentJson: string
  }
}

export const adminGrammarTranslations: Partial<Record<Locale, AdminGrammarDict>> = {
  vi: {
    adminGrammar: {
      pageTitle: 'Ngữ pháp',
      pageDesc: 'Quản lý chủ đề, bài học, bài tập ngữ pháp.',
      tabLessons: '📖 Bài học',
      tabTopics: '🗂️ Chủ đề',
      topicsTitle: '🗂️ Chủ đề',
      addTopicBtn: '+ Tạo chủ đề',
      topicSearchPlaceholder: 'Tìm theo tiêu đề/mã chủ đề...',
      editTopicTitle: (title) => `Sửa: ${title}`,
      addTopicTitle: 'Tạo chủ đề mới',
      topicCodeLabel: 'Mã chủ đề (duy nhất, không đổi được sau khi tạo)',
      titleLabel: 'Tiêu đề',
      descriptionLabel: 'Mô tả',
      orderLabel: 'Thứ tự',
      emptyTopics: 'Chưa có chủ đề nào',
      deleteTopicConfirm: (title) => `Xoá chủ đề "${title}"? Toàn bộ bài học + bài tập bên trong sẽ bị xoá theo.`,
      lessonsTitle: '📖 Bài học',
      addLessonBtn: '+ Tạo bài học',
      createTopicFirst: 'Tạo chủ đề trước khi thêm bài học.',
      lessonSearchPlaceholder: 'Tìm theo tiêu đề/mã bài học...',
      topicFilterLabel: 'Chủ đề',
      levelFilterLabel: 'Cấp độ',
      editLessonTitle: (title) => `Sửa: ${title}`,
      addLessonTitle: 'Tạo bài học mới',
      chooseTopicLabel: 'Chủ đề',
      chooseTopicPlaceholder: 'Chọn chủ đề...',
      lessonCodeLabel: 'Mã bài học (duy nhất, không đổi được sau khi tạo)',
      contentLabel: 'Nội dung (JSON — summary/formulas/signals)',
      emptyLessons: 'Chưa có bài học nào',
      deleteLessonConfirm: (title) => `Xoá bài học "${title}"? Toàn bộ bài tập bên trong sẽ bị xoá theo.`,
      exercisesBtn: 'Bài tập',
      backToLessons: '← Danh sách bài học',
      exercisesPageTitle: 'Bài tập ngữ pháp',
      exercisesPageDesc: 'Trắc nghiệm (MULTIPLE_CHOICE) hoặc điền từ (FILL_BLANK) cho bài học này.',
      addExerciseBtn: '+ Tạo bài tập',
      exerciseSearchPlaceholder: 'Tìm theo nội dung câu hỏi...',
      editExerciseTitle: 'Sửa bài tập',
      addExerciseTitle: 'Tạo bài tập mới',
      exerciseTypeLabel: 'Dạng bài',
      multipleChoiceOption: 'Trắc nghiệm (MULTIPLE_CHOICE)',
      fillBlankOption: 'Điền từ (FILL_BLANK)',
      questionLabel: 'Câu hỏi',
      optionsLabel: 'Lựa chọn (mỗi dòng 1 lựa chọn — chỉ cần nếu là trắc nghiệm)',
      correctAnswerLabel: 'Đáp án đúng',
      explanationLabel: 'Giải thích',
      difficultyLabel: 'Độ khó (1-4)',
      xpRewardLabel: 'XP thưởng',
      hintLabel: 'Gợi ý (tuỳ chọn)',
      emptyExercises: 'Chưa có bài tập nào',
      deleteExerciseConfirm: (question) => `Xoá bài tập "${question}"?`,
      typeAndAnswer: (type, answer) => `${type} · đáp án: ${answer}`,
      invalidContentJson: 'Nội dung bài học (content) phải là JSON hợp lệ.',
    },
  },
  en: {
    adminGrammar: {
      pageTitle: 'Grammar',
      pageDesc: 'Manage grammar topics, lessons, and exercises.',
      tabLessons: '📖 Lessons',
      tabTopics: '🗂️ Topics',
      topicsTitle: '🗂️ Topics',
      addTopicBtn: '+ Create topic',
      topicSearchPlaceholder: 'Search by title/topic code...',
      editTopicTitle: (title) => `Edit: ${title}`,
      addTopicTitle: 'Create a new topic',
      topicCodeLabel: 'Topic code (unique, cannot be changed after creation)',
      titleLabel: 'Title',
      descriptionLabel: 'Description',
      orderLabel: 'Order',
      emptyTopics: 'No topics yet',
      deleteTopicConfirm: (title) => `Delete topic "${title}"? All lessons and exercises inside it will be deleted too.`,
      lessonsTitle: '📖 Lessons',
      addLessonBtn: '+ Create lesson',
      createTopicFirst: 'Create a topic before adding lessons.',
      lessonSearchPlaceholder: 'Search by title/lesson code...',
      topicFilterLabel: 'Topic',
      levelFilterLabel: 'Level',
      editLessonTitle: (title) => `Edit: ${title}`,
      addLessonTitle: 'Create a new lesson',
      chooseTopicLabel: 'Topic',
      chooseTopicPlaceholder: 'Choose a topic...',
      lessonCodeLabel: 'Lesson code (unique, cannot be changed after creation)',
      contentLabel: 'Content (JSON — summary/formulas/signals)',
      emptyLessons: 'No lessons yet',
      deleteLessonConfirm: (title) => `Delete lesson "${title}"? All exercises inside it will be deleted too.`,
      exercisesBtn: 'Exercises',
      backToLessons: '← Lesson list',
      exercisesPageTitle: 'Grammar exercises',
      exercisesPageDesc: 'Multiple-choice (MULTIPLE_CHOICE) or fill-in-the-blank (FILL_BLANK) for this lesson.',
      addExerciseBtn: '+ Create exercise',
      exerciseSearchPlaceholder: 'Search by question text...',
      editExerciseTitle: 'Edit exercise',
      addExerciseTitle: 'Create a new exercise',
      exerciseTypeLabel: 'Type',
      multipleChoiceOption: 'Multiple choice (MULTIPLE_CHOICE)',
      fillBlankOption: 'Fill in the blank (FILL_BLANK)',
      questionLabel: 'Question',
      optionsLabel: 'Options (one per line — only needed for multiple choice)',
      correctAnswerLabel: 'Correct answer',
      explanationLabel: 'Explanation',
      difficultyLabel: 'Difficulty (1-4)',
      xpRewardLabel: 'XP reward',
      hintLabel: 'Hint (optional)',
      emptyExercises: 'No exercises yet',
      deleteExerciseConfirm: (question) => `Delete exercise "${question}"?`,
      typeAndAnswer: (type, answer) => `${type} · answer: ${answer}`,
      invalidContentJson: 'Lesson content must be valid JSON.',
    },
  },
}
