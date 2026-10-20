import type { Locale } from '@/store/locale'

// Namespace "decks" — danh sách ôn tập do user tự quản lý (hộp "Thêm vào ôn
// tập", trang danh sách, chi tiết list). Chỉ vi+en — zh/ja/ko fallback về en.
export interface DecksDict {
  decks: {
    pageTitle: string
    pageDesc: string
    hubDesc: string
    manageBtn: string
    createTitle: string
    nameLabel: string
    namePlaceholder: string
    descriptionLabel: string
    iconLabel: string
    colorLabel: string
    createBtn: string
    saveBtn: string
    cancelBtn: string
    editBtn: string
    deleteBtn: string
    deleteConfirm: (name: string) => string
    empty: string
    emptyHint: string
    wordCount: (n: number) => string
    dueCount: (n: number) => string
    listPracticeCount: (n: number) => string
    practiceBtn: string
    viewBtn: string
    backToLists: string
    emptyWords: string
    emptyWordsHint: string
    removeWordBtn: string
    removeWordConfirm: (term: string) => string
    moveCopyBtn: string
    moveBtn: string
    copyBtn: string
    targetDeckLabel: string
    noOtherDecks: string
    moved: (deck: string) => string
    copied: (deck: string) => string
    practiceCount: (n: number) => string
    // Hộp "Thêm vào ôn tập"
    dialogTitle: (term: string) => string
    dialogDesc: string
    dialogNoDecks: string
    newDeckPlaceholder: string
    createAndAddBtn: string
    onlyQueueBtn: string
    doneBtn: string
    manageListsLink: string
    inReviewManageBtn: string
    // Học lại list
    practiceTitle: string
    emptyPracticeTitle: string
    emptyPracticeBody: string
  }
}

export const decksTranslations: Partial<Record<Locale, DecksDict>> = {
  vi: {
    decks: {
      pageTitle: 'Danh sách ôn tập',
      pageDesc: 'Gom từ vựng thành các list của riêng bạn để học lại theo từng nhóm.',
      hubDesc: 'Tự tạo list từ vựng, học lại cả list, chuyển/sao chép hoặc bỏ từ khỏi list.',
      manageBtn: 'Quản lý danh sách',
      createTitle: 'Tạo danh sách mới',
      nameLabel: 'Tên danh sách',
      namePlaceholder: 'VD: Từ khó tuần này',
      descriptionLabel: 'Mô tả',
      iconLabel: 'Icon',
      colorLabel: 'Màu',
      createBtn: 'Tạo danh sách',
      saveBtn: 'Lưu',
      cancelBtn: 'Huỷ',
      editBtn: 'Sửa',
      deleteBtn: 'Xoá danh sách',
      deleteConfirm: (name) => `Xoá danh sách "${name}"? Các từ vẫn được giữ trong hàng đợi ôn tập.`,
      empty: 'Bạn chưa có danh sách ôn tập nào',
      emptyHint: 'Tạo danh sách ở trên, hoặc bấm "Thêm vào ôn tập" trên thẻ từ khi học từ mới.',
      wordCount: (n) => `${n} từ`,
      dueCount: (n) => `${n} đến hạn`,
      listPracticeCount: (n) => `🔁 Đã ôn ${n} lần`,
      practiceBtn: '▶ Học lại list',
      viewBtn: 'Xem từ',
      backToLists: 'Danh sách ôn tập',
      emptyWords: 'Danh sách chưa có từ nào',
      emptyWordsHint: 'Vào Học từ mới, bấm "Thêm vào ôn tập" trên thẻ từ và chọn danh sách này.',
      removeWordBtn: 'Bỏ khỏi list',
      removeWordConfirm: (term) => `Bỏ "${term}" khỏi danh sách? Tiến độ ôn tập của từ vẫn được giữ.`,
      moveCopyBtn: 'Chuyển / Sao chép',
      moveBtn: 'Chuyển',
      copyBtn: 'Sao chép',
      targetDeckLabel: 'Sang danh sách',
      noOtherDecks: 'Chưa có danh sách khác',
      moved: (deck) => `Đã chuyển sang "${deck}"`,
      copied: (deck) => `Đã sao chép sang "${deck}"`,
      practiceCount: (n) => `Đã luyện ${n} lần`,
      dialogTitle: (term) => `Thêm "${term}" vào ôn tập`,
      dialogDesc: 'Chọn danh sách để lưu từ — từ sẽ vào hàng đợi ôn tập SRS.',
      dialogNoDecks: 'Bạn chưa có danh sách nào — tạo danh sách đầu tiên bên dưới.',
      newDeckPlaceholder: 'Tên danh sách mới...',
      createAndAddBtn: 'Tạo & thêm',
      onlyQueueBtn: 'Chỉ thêm vào ôn tập (không vào list)',
      doneBtn: 'Xong',
      manageListsLink: 'Quản lý danh sách →',
      inReviewManageBtn: '📋 Danh sách',
      practiceTitle: 'Học lại danh sách',
      emptyPracticeTitle: 'Danh sách chưa có từ để học',
      emptyPracticeBody: 'Thêm từ vào danh sách rồi quay lại học nhé.',
    },
  },
  en: {
    decks: {
      pageTitle: 'Review lists',
      pageDesc: 'Group words into your own lists and practice them list by list.',
      hubDesc: 'Create your own word lists, practice a whole list, move/copy or remove words.',
      manageBtn: 'Manage lists',
      createTitle: 'Create a new list',
      nameLabel: 'List name',
      namePlaceholder: 'e.g. Hard words this week',
      descriptionLabel: 'Description',
      iconLabel: 'Icon',
      colorLabel: 'Color',
      createBtn: 'Create list',
      saveBtn: 'Save',
      cancelBtn: 'Cancel',
      editBtn: 'Edit',
      deleteBtn: 'Delete list',
      deleteConfirm: (name) => `Delete the list "${name}"? Its words stay in your review queue.`,
      empty: "You don't have any review lists yet",
      emptyHint: 'Create one above, or tap "Add to review" on a word card while learning new words.',
      wordCount: (n) => `${n} word${n === 1 ? '' : 's'}`,
      dueCount: (n) => `${n} due`,
      listPracticeCount: (n) => `🔁 Reviewed ${n} time${n === 1 ? '' : 's'}`,
      practiceBtn: '▶ Practice list',
      viewBtn: 'View words',
      backToLists: 'Review lists',
      emptyWords: 'This list has no words yet',
      emptyWordsHint: 'Go to New words, tap "Add to review" on a word card and pick this list.',
      removeWordBtn: 'Remove from list',
      removeWordConfirm: (term) => `Remove "${term}" from the list? Its review progress is kept.`,
      moveCopyBtn: 'Move / Copy',
      moveBtn: 'Move',
      copyBtn: 'Copy',
      targetDeckLabel: 'To list',
      noOtherDecks: 'No other lists yet',
      moved: (deck) => `Moved to "${deck}"`,
      copied: (deck) => `Copied to "${deck}"`,
      practiceCount: (n) => `Practiced ${n} time${n === 1 ? '' : 's'}`,
      dialogTitle: (term) => `Add "${term}" to review`,
      dialogDesc: 'Pick the lists to save this word to — it also joins your SRS review queue.',
      dialogNoDecks: "You don't have any lists yet — create your first one below.",
      newDeckPlaceholder: 'New list name...',
      createAndAddBtn: 'Create & add',
      onlyQueueBtn: 'Just add to review (no list)',
      doneBtn: 'Done',
      manageListsLink: 'Manage lists →',
      inReviewManageBtn: '📋 Lists',
      practiceTitle: 'Practice list',
      emptyPracticeTitle: 'This list has no words to practice',
      emptyPracticeBody: 'Add some words to the list and come back.',
    },
  },
}
