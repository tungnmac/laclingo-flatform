import type { Locale } from '@/store/locale'

// Namespace "adminChallengeQuestions" + "adminMissions". Chỉ vi+en.
export interface AdminChallengesMissionsDict {
  adminChallengeQuestions: {
    pageTitle: string
    pageDesc: string
    addQuestionBtn: string
    searchPlaceholder: string
    difficultyLabel: string
    editQuestionTitle: string
    addQuestionTitle: string
    questionLabel: string
    optionsLabel: string
    correctIndexLabel: string
    difficultyRangeLabel: string
    explanationLabel: string
    emptyQuestions: string
    deleteQuestionConfirm: (question: string) => string
    correctIndexError: string
    difficultySuffix: (n: number) => string
  }
  adminMissions: {
    pageTitle: string
    pageDesc: string
    addMissionBtn: string
    editMissionTitle: (title: string) => string
    addMissionTitle: string
    titleLabel: string
    descriptionLabel: string
    periodLabel: string
    periodDailyPlain: string
    periodWeeklyPlain: string
    periodMonthlyPlain: string
    periodEventPlain: string
    actionLabel: string
    actionSrsReview: string
    actionLearnWord: string
    actionGrammarExercise: string
    actionChallengeParticipate: string
    actionChallengeWin: string
    actionListeningPractice: string
    targetCountLabel: string
    rewardExpLabel: string
    rewardPointsLabel: string
    startsAtLabel: string
    endsAtLabel: string
    isActiveLabel: string
    emptyMissions: string
    deactivatedSuffix: string
    summaryLine: (period: string, action: string, target: number, exp: number, points: number) => string
    deactivateConfirm: (title: string) => string
    deactivateBtn: string
    eventDatesRequired: string
  }
}

export const adminChallengesMissionsTranslations: Partial<Record<Locale, AdminChallengesMissionsDict>> = {
  vi: {
    adminChallengeQuestions: {
      pageTitle: 'Câu hỏi thách đấu',
      pageDesc: 'Ngân hàng câu hỏi trắc nghiệm dùng cho phòng thách đấu realtime.',
      addQuestionBtn: '+ Tạo câu hỏi',
      searchPlaceholder: 'Tìm theo nội dung câu hỏi...',
      difficultyLabel: 'Độ khó',
      editQuestionTitle: 'Sửa câu hỏi',
      addQuestionTitle: 'Tạo câu hỏi mới',
      questionLabel: 'Câu hỏi',
      optionsLabel: 'Lựa chọn (mỗi dòng 1 lựa chọn)',
      correctIndexLabel: 'Đáp án đúng (số thứ tự, từ 0)',
      difficultyRangeLabel: 'Độ khó (1-5)',
      explanationLabel: 'Giải thích (tuỳ chọn)',
      emptyQuestions: 'Chưa có câu hỏi nào',
      deleteQuestionConfirm: (question) => `Xoá câu hỏi "${question}"?`,
      correctIndexError: 'Đáp án đúng phải là số thứ tự (bắt đầu từ 0) trong danh sách lựa chọn.',
      difficultySuffix: (n) => ` — độ khó ${n}`,
    },
    adminMissions: {
      pageTitle: 'Quản trị nhiệm vụ',
      pageDesc: 'Tạo, sửa, tắt nhiệm vụ daily/weekly/monthly/event.',
      addMissionBtn: '+ Tạo nhiệm vụ',
      editMissionTitle: (title) => `Sửa: ${title}`,
      addMissionTitle: 'Tạo nhiệm vụ mới',
      titleLabel: 'Tiêu đề',
      descriptionLabel: 'Mô tả',
      periodLabel: 'Chu kỳ',
      periodDailyPlain: 'Hàng ngày',
      periodWeeklyPlain: 'Hàng tuần',
      periodMonthlyPlain: 'Hàng tháng',
      periodEventPlain: 'Sự kiện',
      actionLabel: 'Hành động',
      actionSrsReview: 'Ôn tập từ vựng (SRS)',
      actionLearnWord: 'Học từ mới',
      actionGrammarExercise: 'Luyện ngữ pháp',
      actionChallengeParticipate: 'Tham gia phòng thách đấu',
      actionChallengeWin: 'Thắng phòng thách đấu',
      actionListeningPractice: 'Trả lời đúng câu hỏi luyện nghe',
      targetCountLabel: 'Số lần cần đạt',
      rewardExpLabel: 'Thưởng EXP',
      rewardPointsLabel: 'Thưởng điểm',
      startsAtLabel: 'Ngày bắt đầu (chỉ sự kiện)',
      endsAtLabel: 'Ngày kết thúc (chỉ sự kiện)',
      isActiveLabel: 'Đang hoạt động',
      emptyMissions: 'Chưa có nhiệm vụ nào',
      deactivatedSuffix: '(đã tắt)',
      summaryLine: (period, action, target, exp, points) => `${period} · ${action} · mục tiêu ${target} · ⭐${exp} EXP · 🏆${points} điểm`,
      deactivateConfirm: (title) => `Tắt nhiệm vụ "${title}"? Lịch sử tiến độ sẽ được giữ lại.`,
      deactivateBtn: 'Tắt',
      eventDatesRequired: 'Nhiệm vụ sự kiện cần đủ ngày bắt đầu và kết thúc.',
    },
  },
  en: {
    adminChallengeQuestions: {
      pageTitle: 'Challenge questions',
      pageDesc: 'Multiple-choice question bank for realtime challenge rooms.',
      addQuestionBtn: '+ Create question',
      searchPlaceholder: 'Search by question text...',
      difficultyLabel: 'Difficulty',
      editQuestionTitle: 'Edit question',
      addQuestionTitle: 'Create a new question',
      questionLabel: 'Question',
      optionsLabel: 'Options (one per line)',
      correctIndexLabel: 'Correct answer (index, starting at 0)',
      difficultyRangeLabel: 'Difficulty (1-5)',
      explanationLabel: 'Explanation (optional)',
      emptyQuestions: 'No questions yet',
      deleteQuestionConfirm: (question) => `Delete question "${question}"?`,
      correctIndexError: 'The correct answer must be a valid index (starting at 0) in the options list.',
      difficultySuffix: (n) => ` — difficulty ${n}`,
    },
    adminMissions: {
      pageTitle: 'Missions admin',
      pageDesc: 'Create, edit, deactivate daily/weekly/monthly/event missions.',
      addMissionBtn: '+ Create mission',
      editMissionTitle: (title) => `Edit: ${title}`,
      addMissionTitle: 'Create a new mission',
      titleLabel: 'Title',
      descriptionLabel: 'Description',
      periodLabel: 'Period',
      periodDailyPlain: 'Daily',
      periodWeeklyPlain: 'Weekly',
      periodMonthlyPlain: 'Monthly',
      periodEventPlain: 'Event',
      actionLabel: 'Action',
      actionSrsReview: 'Vocabulary review (SRS)',
      actionLearnWord: 'Learn new words',
      actionGrammarExercise: 'Grammar practice',
      actionChallengeParticipate: 'Join a challenge room',
      actionChallengeWin: 'Win a challenge room',
      actionListeningPractice: 'Answer listening questions correctly',
      targetCountLabel: 'Target count',
      rewardExpLabel: 'EXP reward',
      rewardPointsLabel: 'Points reward',
      startsAtLabel: 'Start date (event only)',
      endsAtLabel: 'End date (event only)',
      isActiveLabel: 'Active',
      emptyMissions: 'No missions yet',
      deactivatedSuffix: '(deactivated)',
      summaryLine: (period, action, target, exp, points) => `${period} · ${action} · target ${target} · ⭐${exp} EXP · 🏆${points} pts`,
      deactivateConfirm: (title) => `Deactivate mission "${title}"? Progress history will be kept.`,
      deactivateBtn: 'Deactivate',
      eventDatesRequired: 'Event missions need both a start and end date.',
    },
  },
}
