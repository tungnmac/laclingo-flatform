import type { Locale } from '@/store/locale'
import type { DailyTaskKind } from '@/types/api'

// Namespace "daily" — trang Nhật ký học (riêng tư của học viên). Chỉ vi+en — zh/ja/ko fallback về en.
export interface DailyDict {
  daily: {
    pageTitle: string
    pageDesc: string
    privateNote: string
    today: string
    prevDay: string
    nextDay: string
    backToToday: string
    summary: (done: number, total: number) => string
    streak: (n: number) => string
    readOnly: string
    noNote: string
    empty: string
    kinds: Record<DailyTaskKind, string>
    auto: string
    /** Giải thích cách tự cộng tiến độ theo loại việc (hiện khi rê chuột nhãn "tự cập nhật" và trong phần sửa) */
    autoHints: Record<Exclude<DailyTaskKind, 'free'>, string>
    goStudy: string
    repeat: string
    carriedIn: string
    carried: string
    addTitle: string
    titlePlaceholder: string
    kindLabel: string
    targetLabel: string
    targetPlaceholder: string
    repeatLabel: string
    addBtn: string
    suggestions: string
    suggestionItems: { title: string; kind: DailyTaskKind; target?: number }[]
    memoPlaceholder: string
    save: string
    delete: string
    deleteConfirm: (title: string) => string
    moveUp: string
    moveDown: string
    journalTitle: string
    journalPlaceholder: string
    saving: string
    saved: string
    unfinishedTitle: (n: number) => string
    carryBtn: string
    itemsProgress: (done: number, total: number) => string
    addItem: string
    itemPlaceholder: string
    deleteItem: (title: string) => string
    dragItem: (title: string) => string
    editItem: (title: string) => string
    checklistAuto: string
    calendarTitle: string
    prevMonth: string
    nextMonth: string
    weekdays: string[]
  }
}

export const dailyTranslations: Partial<Record<Locale, DailyDict>> = {
  vi: {
    daily: {
      pageTitle: 'Nhật ký học',
      pageDesc: 'Đặt việc cần làm mỗi ngày và theo dõi đã làm tới đâu.',
      privateNote: '🔒 Chỉ mình bạn xem được nhật ký này.',
      today: 'Hôm nay',
      prevDay: 'Ngày trước',
      nextDay: 'Ngày sau',
      backToToday: 'Về hôm nay',
      summary: (done, total) => `${done}/${total} việc xong`,
      streak: (n) => `🔥 ${n} ngày liên tiếp hoàn thành`,
      readOnly: 'Ngày đã qua — chỉ xem. Việc chưa xong có thể chuyển sang hôm nay.',
      noNote: 'Ngày này chưa có nhật ký.',
      empty: 'Chưa có việc nào — thêm việc đầu tiên ở dưới, hoặc chọn một gợi ý.',
      kinds: {
        free: '📝 Tự do',
        srs_review: '🧠 Ôn từ',
        learn_word: '📚 Học từ mới',
        grammar_exercise: '✍️ Ngữ pháp',
        listening_practice: '🎧 Luyện nghe',
        speaking_practice: '🎤 Luyện nói',
        challenge_participate: '🎮 Thi đấu',
      },
      auto: 'tự cập nhật',
      autoHints: {
        srs_review: 'Tự +1 mỗi từ ôn xong trong phiên ôn tập',
        learn_word: 'Tự +1 mỗi từ mới thêm vào ôn tập',
        grammar_exercise: 'Tự +1 mỗi câu ngữ pháp trả lời đúng',
        listening_practice: 'Tự +1 mỗi câu nghe trả lời đúng',
        speaking_practice: 'Tự +1 mỗi lần luyện nói đạt từ 60 điểm',
        challenge_participate: 'Tự +1 mỗi trận thách đấu tham gia',
      },
      goStudy: 'Học ngay →',
      repeat: '🔁 Lặp lại hằng ngày',
      carriedIn: '↪ chuyển từ hôm trước',
      carried: '↪ đã chuyển sang ngày sau',
      addTitle: 'Thêm việc',
      titlePlaceholder: 'Vd: Ôn 30 từ',
      kindLabel: 'Loại',
      targetLabel: 'Mục tiêu (số)',
      targetPlaceholder: 'Để trống = tích xong',
      repeatLabel: 'Lặp lại hằng ngày',
      addBtn: '＋ Thêm',
      suggestions: 'Gợi ý:',
      suggestionItems: [
        { title: 'Ôn 30 từ', kind: 'srs_review', target: 30 },
        { title: 'Học 10 từ mới', kind: 'learn_word', target: 10 },
        { title: 'Nghe đúng 5 câu', kind: 'listening_practice', target: 5 },
        { title: 'Làm đúng 10 câu ngữ pháp', kind: 'grammar_exercise', target: 10 },
      ],
      memoPlaceholder: 'Ghi chú ngắn cho việc này…',
      save: 'Lưu',
      delete: 'Xoá',
      deleteConfirm: (title) => `Xoá việc "${title}" khỏi hôm nay?`,
      moveUp: 'Lên',
      moveDown: 'Xuống',
      journalTitle: 'Ghi chú trong ngày',
      journalPlaceholder: 'Hôm nay học được gì, cảm thấy thế nào…',
      saving: 'Đang lưu…',
      saved: 'Đã lưu',
      unfinishedTitle: (n) => `Còn ${n} việc dở hôm qua`,
      carryBtn: 'Chuyển sang hôm nay',
      itemsProgress: (done, total) => `${done}/${total} việc con`,
      addItem: '+ Thêm việc con',
      itemPlaceholder: 'Tên việc con, Enter để thêm…',
      deleteItem: (title) => `Xoá việc con "${title}"`,
      dragItem: (title) => `Kéo để đổi thứ tự "${title}"`,
      editItem: (title) => `Sửa tên việc con "${title}"`,
      checklistAuto: 'Tự xong khi tích hết việc con',
      calendarTitle: 'Lịch',
      prevMonth: 'Tháng trước',
      nextMonth: 'Tháng sau',
      weekdays: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    },
  },
  en: {
    daily: {
      pageTitle: 'Daily note',
      pageDesc: 'Set what to do each day and track how far you got.',
      privateNote: '🔒 Only you can see this note.',
      today: 'Today',
      prevDay: 'Previous day',
      nextDay: 'Next day',
      backToToday: 'Back to today',
      summary: (done, total) => `${done}/${total} tasks done`,
      streak: (n) => `🔥 ${n}-day completion streak`,
      readOnly: 'Past day — read only. Unfinished tasks can be moved to today.',
      noNote: 'No note for this day.',
      empty: 'No tasks yet — add your first one below or pick a suggestion.',
      kinds: {
        free: '📝 Free',
        srs_review: '🧠 Review words',
        learn_word: '📚 Learn new words',
        grammar_exercise: '✍️ Grammar',
        listening_practice: '🎧 Listening',
        speaking_practice: '🎤 Speaking',
        challenge_participate: '🎮 Challenges',
      },
      auto: 'auto-tracked',
      autoHints: {
        srs_review: '+1 for every word you finish in a review session',
        learn_word: '+1 for every new word added to review',
        grammar_exercise: '+1 for every grammar question answered correctly',
        listening_practice: '+1 for every listening question answered correctly',
        speaking_practice: '+1 for every speaking attempt scoring 60 or more',
        challenge_participate: '+1 for every challenge match you join',
      },
      goStudy: 'Study now →',
      repeat: '🔁 Repeats daily',
      carriedIn: '↪ moved from a previous day',
      carried: '↪ moved to a later day',
      addTitle: 'Add a task',
      titlePlaceholder: 'E.g. Review 30 words',
      kindLabel: 'Type',
      targetLabel: 'Target (number)',
      targetPlaceholder: 'Leave empty = checkbox',
      repeatLabel: 'Repeat every day',
      addBtn: '＋ Add',
      suggestions: 'Suggestions:',
      suggestionItems: [
        { title: 'Review 30 words', kind: 'srs_review', target: 30 },
        { title: 'Learn 10 new words', kind: 'learn_word', target: 10 },
        { title: 'Answer 5 listening questions', kind: 'listening_practice', target: 5 },
        { title: 'Get 10 grammar questions right', kind: 'grammar_exercise', target: 10 },
      ],
      memoPlaceholder: 'Short note for this task…',
      save: 'Save',
      delete: 'Delete',
      deleteConfirm: (title) => `Remove "${title}" from today?`,
      moveUp: 'Move up',
      moveDown: 'Move down',
      journalTitle: 'Today’s journal',
      journalPlaceholder: 'What did you learn today, how did it go…',
      saving: 'Saving…',
      saved: 'Saved',
      unfinishedTitle: (n) => `${n} unfinished task${n === 1 ? '' : 's'} from yesterday`,
      carryBtn: 'Move to today',
      itemsProgress: (done, total) => `${done}/${total} subtask${total === 1 ? '' : 's'}`,
      addItem: '+ Add subtask',
      itemPlaceholder: 'Subtask name, press Enter to add…',
      deleteItem: (title) => `Remove subtask "${title}"`,
      dragItem: (title) => `Drag to reorder "${title}"`,
      editItem: (title) => `Rename subtask "${title}"`,
      checklistAuto: 'Completes when every subtask is checked',
      calendarTitle: 'Calendar',
      prevMonth: 'Previous month',
      nextMonth: 'Next month',
      weekdays: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
    },
  },
}
