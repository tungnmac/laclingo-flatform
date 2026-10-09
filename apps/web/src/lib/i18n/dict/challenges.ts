import type { Locale } from '@/store/locale'

// Namespace "challenges" (tạo/tham gia phòng, lobby, câu hỏi, kết quả, chat),
// "leaderboard" và "missions". Chỉ vi+en — zh/ja/ko fallback về en, bổ sung sau.
export interface ChallengesDict {
  challenges: {
    pageTitle: string
    pageDesc: string
    createCardTitle: string
    createCardDesc: string
    questionCountLabel: string
    timePerQuestionLabel: string
    difficultyLabel: string
    difficultyAny: string
    difficultyEasy: string
    difficultyMedium: string
    difficultyHard: string
    practiceModeLabel: string
    creating: string
    createBtn: string
    joinCardTitle: string
    joinCardDesc: string
    roomCodeLabel: string
    joining: string
    joinBtn: string
    roomPageTitle: string
    leaveRoomConfirm: string
    leaveRoomBtn: string
    backToChallenges: string
    chatReactionToggle: string
    defaultPlayerName: string
    questionCounter: (index: number, total: number) => string
    correctWithPoints: (points: number) => string
    incorrectZero: string
    waitingOthers: string
    questionLeaderboardTitle: string
    pointsSuffix: string
    readyToggleOn: string
    readyToggleOff: string
    gameOverTitle: string
    noLeaderboardData: string
    youSuffix: string
    newChallengeBtn: string
    noMessagesYet: string
    chatPlaceholder: string
    sendBtn: string
    roomCodeHint: string
    connecting: string
    questionsCountAndTime: (count: number, seconds: number) => string
    practiceNoRanking: string
    difficultyBadge: (n: number) => string
    participantsTitle: (n: number) => string
    roomHostLabel: string
    participantReady: string
    participantNotReady: string
    inviteByUsernameTitle: string
    inviteByUsernameDesc: string
    inviting: string
    inviteBtn: string
    inviteSuccess: (username: string) => string
    waitingForReady: string
    startGameBtn: string
    waitingHostStart: string
    kickLabel: string
  }
  leaderboard: {
    pageTitle: string
    pageDesc: string
    tabLevel: string
    tabPoints: string
    tabStreak: string
    searchLabel: string
    searchPlaceholder: string
    emptyTitle: string
    youSuffix: string
    statLine: (level: number, points: number, streak: number) => string
  }
  missions: {
    pageTitle: string
    pageDesc: string
    emptyTitle: string
    periodDaily: string
    periodWeekly: string
    periodMonthly: string
    periodEvent: string
    progressLabel: string
    rewardLine: (exp: number, points: number) => string
  }
}

export const challengesTranslations: Partial<Record<Locale, ChallengesDict>> = {
  vi: {
    challenges: {
      pageTitle: 'Thách đấu',
      pageDesc: 'Tạo phòng thử thách kiểu game show hoặc tham gia bằng mã.',
      createCardTitle: '🎮 Tạo phòng mới',
      createCardDesc: 'Mời bạn bè cùng thi đấu — bạn sẽ là chủ phòng.',
      questionCountLabel: 'Số câu hỏi',
      timePerQuestionLabel: 'Thời gian mỗi câu (giây)',
      difficultyLabel: 'Độ khó',
      difficultyAny: 'Bất kỳ',
      difficultyEasy: '1 — Dễ',
      difficultyMedium: '3 — Trung bình',
      difficultyHard: '5 — Khó',
      practiceModeLabel: 'Chế độ luyện tập (không xếp hạng)',
      creating: 'Đang tạo...',
      createBtn: 'Tạo phòng',
      joinCardTitle: '🔑 Tham gia bằng mã',
      joinCardDesc: 'Nhập mã phòng mà chủ phòng vừa chia sẻ.',
      roomCodeLabel: 'Mã phòng',
      joining: 'Đang tham gia...',
      joinBtn: 'Tham gia',
      roomPageTitle: 'Phòng thử thách',
      leaveRoomConfirm: 'Bạn chắc chắn muốn rời phòng?',
      leaveRoomBtn: '🚪 Rời phòng',
      backToChallenges: 'Về trang thách đấu',
      chatReactionToggle: '💬 Chat & reaction',
      defaultPlayerName: 'Người chơi',
      questionCounter: (index, total) => `Câu ${index}/${total}`,
      correctWithPoints: (points) => `Chính xác! +${points} điểm`,
      incorrectZero: 'Chưa đúng — 0 điểm',
      waitingOthers: 'Đã gửi câu trả lời, chờ người khác...',
      questionLeaderboardTitle: 'Bảng xếp hạng',
      pointsSuffix: 'điểm',
      readyToggleOn: '✅ Đã sẵn sàng — bấm để hủy',
      readyToggleOff: 'Sẵn sàng',
      gameOverTitle: 'Trò chơi đã kết thúc!',
      noLeaderboardData: 'Chưa có dữ liệu xếp hạng.',
      youSuffix: '(bạn)',
      newChallengeBtn: 'Tạo thử thách mới',
      noMessagesYet: 'Chưa có tin nhắn nào.',
      chatPlaceholder: 'Nhập tin nhắn...',
      sendBtn: 'Gửi',
      roomCodeHint: 'Mã phòng — đọc cho bạn bè để tham gia',
      connecting: 'Đang kết nối...',
      questionsCountAndTime: (count, seconds) => `${count} câu · ${seconds}s/câu`,
      practiceNoRanking: 'Luyện tập — không xếp hạng',
      difficultyBadge: (n) => `Độ khó ${n}`,
      participantsTitle: (n) => `Người tham gia (${n})`,
      roomHostLabel: 'Chủ phòng',
      participantReady: '✅ Sẵn sàng',
      participantNotReady: '⏳ Chưa sẵn sàng',
      inviteByUsernameTitle: 'Mời theo username',
      inviteByUsernameDesc: 'Thêm trực tiếp người này vào phòng — kể cả người vừa bị mời ra trước đó.',
      inviting: 'Đang mời...',
      inviteBtn: 'Mời',
      inviteSuccess: (username) => `Đã mời ${username} vào phòng.`,
      waitingForReady: 'Chờ mọi người sẵn sàng...',
      startGameBtn: 'Bắt đầu trò chơi',
      waitingHostStart: 'Đang chờ chủ phòng bắt đầu...',
      kickLabel: 'Mời ra khỏi phòng',
    },
    leaderboard: {
      pageTitle: 'Bảng xếp hạng',
      pageDesc: 'Xếp hạng người học theo level, điểm thách đấu, hoặc streak.',
      tabLevel: '⭐ Level',
      tabPoints: '🏆 Điểm thách đấu',
      tabStreak: '🔥 Streak',
      searchLabel: 'Tìm kiếm',
      searchPlaceholder: 'Tìm theo username/họ tên...',
      emptyTitle: 'Không tìm thấy người học nào',
      youSuffix: '(bạn)',
      statLine: (level, points, streak) => `⭐ Lv.${level} · 🏆 ${points} điểm · 🔥 ${streak}`,
    },
    missions: {
      pageTitle: 'Nhiệm vụ',
      pageDesc: 'Hoàn thành nhiệm vụ để nhận EXP (lên level) và điểm (xếp hạng).',
      emptyTitle: 'Chưa có nhiệm vụ nào',
      periodDaily: '📅 Hàng ngày',
      periodWeekly: '🗓️ Hàng tuần',
      periodMonthly: '📆 Hàng tháng',
      periodEvent: '🎉 Sự kiện',
      progressLabel: 'Tiến độ',
      rewardLine: (exp, points) => `Phần thưởng: ⭐ ${exp} EXP · 🏆 ${points} điểm`,
    },
  },
  en: {
    challenges: {
      pageTitle: 'Challenges',
      pageDesc: 'Create a game-show-style challenge room or join one with a code.',
      createCardTitle: '🎮 Create a new room',
      createCardDesc: "Invite friends to compete — you'll be the host.",
      questionCountLabel: 'Number of questions',
      timePerQuestionLabel: 'Time per question (seconds)',
      difficultyLabel: 'Difficulty',
      difficultyAny: 'Any',
      difficultyEasy: '1 — Easy',
      difficultyMedium: '3 — Medium',
      difficultyHard: '5 — Hard',
      practiceModeLabel: 'Practice mode (not ranked)',
      creating: 'Creating...',
      createBtn: 'Create room',
      joinCardTitle: '🔑 Join with a code',
      joinCardDesc: 'Enter the room code the host just shared.',
      roomCodeLabel: 'Room code',
      joining: 'Joining...',
      joinBtn: 'Join',
      roomPageTitle: 'Challenge room',
      leaveRoomConfirm: 'Are you sure you want to leave the room?',
      leaveRoomBtn: '🚪 Leave room',
      backToChallenges: 'Back to challenges',
      chatReactionToggle: '💬 Chat & reactions',
      defaultPlayerName: 'Player',
      questionCounter: (index, total) => `Question ${index}/${total}`,
      correctWithPoints: (points) => `Correct! +${points} points`,
      incorrectZero: 'Not quite — 0 points',
      waitingOthers: 'Answer submitted, waiting for others...',
      questionLeaderboardTitle: 'Leaderboard',
      pointsSuffix: 'pts',
      readyToggleOn: '✅ Ready — tap to cancel',
      readyToggleOff: 'Ready',
      gameOverTitle: 'Game over!',
      noLeaderboardData: 'No leaderboard data yet.',
      youSuffix: '(you)',
      newChallengeBtn: 'Start a new challenge',
      noMessagesYet: 'No messages yet.',
      chatPlaceholder: 'Type a message...',
      sendBtn: 'Send',
      roomCodeHint: 'Room code — share it with friends to join',
      connecting: 'Connecting...',
      questionsCountAndTime: (count, seconds) => `${count} questions · ${seconds}s/question`,
      practiceNoRanking: 'Practice — not ranked',
      difficultyBadge: (n) => `Difficulty ${n}`,
      participantsTitle: (n) => `Participants (${n})`,
      roomHostLabel: 'Host',
      participantReady: '✅ Ready',
      participantNotReady: '⏳ Not ready',
      inviteByUsernameTitle: 'Invite by username',
      inviteByUsernameDesc: 'Add this person directly to the room — even if they were kicked before.',
      inviting: 'Inviting...',
      inviteBtn: 'Invite',
      inviteSuccess: (username) => `Invited ${username} to the room.`,
      waitingForReady: 'Waiting for everyone to be ready...',
      startGameBtn: 'Start game',
      waitingHostStart: 'Waiting for the host to start...',
      kickLabel: 'Remove from room',
    },
    leaderboard: {
      pageTitle: 'Leaderboard',
      pageDesc: 'Ranked by level, challenge points, or streak.',
      tabLevel: '⭐ Level',
      tabPoints: '🏆 Challenge points',
      tabStreak: '🔥 Streak',
      searchLabel: 'Search',
      searchPlaceholder: 'Search by username/full name...',
      emptyTitle: 'No learners found',
      youSuffix: '(you)',
      statLine: (level, points, streak) => `⭐ Lv.${level} · 🏆 ${points} pts · 🔥 ${streak}`,
    },
    missions: {
      pageTitle: 'Missions',
      pageDesc: 'Complete missions to earn EXP (level up) and points (leaderboard).',
      emptyTitle: 'No missions yet',
      periodDaily: '📅 Daily',
      periodWeekly: '🗓️ Weekly',
      periodMonthly: '📆 Monthly',
      periodEvent: '🎉 Event',
      progressLabel: 'Progress',
      rewardLine: (exp, points) => `Reward: ⭐ ${exp} EXP · 🏆 ${points} pts`,
    },
  },
}
