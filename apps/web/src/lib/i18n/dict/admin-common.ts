import type { Locale } from '@/store/locale'

// Namespace "adminCommon" — dùng chung bởi AdminSubNav, trang hub /admin,
// Pagination, ExportButton, BulkImportPanel, UserAdminControls, phần không
// phải category/keyword của IconPickerInput. Chỉ vi+en — zh/ja/ko bổ sung sau.
// LƯU Ý phạm vi: tên 12 category + từ khoá tìm kiếm (~175 icon) trong
// IconPickerInput.tsx KHÔNG dịch ở lần này — khối lượng rất lớn, giá trị
// thấp (chỉ hiện dạng tooltip/placeholder search), picker vẫn dùng được qua
// lưới icon trực quan dù không gõ đúng từ khoá tiếng Anh.
export interface AdminCommonDict {
  adminCommon: {
    overviewTab: string
    moduleUsers: string
    moduleMissions: string
    moduleVocabulary: string
    moduleGrammar: string
    moduleChallengeQuestions: string
    moduleListening: string
    hubTitle: string
    hubDesc: string
    noAccessTitle: string
    noAccessBody: string
    usersDesc: string
    missionsDesc: string
    vocabularyDesc: string
    grammarDesc: string
    challengeQuestionsDesc: string
    listeningDesc: string
    paginationLabel: (page: number, totalPages: number, total: number) => string
    prevPage: string
    nextPage: string
    exporting: string
    exportJson: string
    bulkImportTitle: string
    bulkImportDesc: string
    onlyJsonFiles: string
    cannotReadFile: string
    removeSelectedFile: string
    chooseJsonFile: string
    orDragDrop: string
    orPasteJson: string
    invalidJson: string
    mustBeArray: string
    importing: string
    importBtn: string
    importResultSummary: (success: number, total: number) => string
    rowLabel: (n: number) => string
    rowOk: string
    lockedLabel: string
    revokeConfirm: (name: string) => string
    grantConfirm: (name: string) => string
    revokeBtn: string
    grantBtn: string
    revokedToast: (name: string) => string
    grantedToast: (name: string) => string
    lockConfirm: (name: string) => string
    restoredToast: (name: string) => string
    lockedToast: (name: string) => string
    restoreAccountBtn: string
    lockAccountBtn: string
    modulesAccessLabel: string
    cannotRevokeSelfUsers: string
    savedModulesToast: (name: string) => string
    saveBtn: string
    cancelBtn: string
    confirmBtn: string
    iconSearchPlaceholder: string
    chooseIconAria: string
    noIconsFound: string
    editBtn: string
    deleteBtn: string
    savingBtn: string
    searchLabel: string
    allLabel: string
    languageLabel: string
  }
}

export const adminCommonTranslations: Partial<Record<Locale, AdminCommonDict>> = {
  vi: {
    adminCommon: {
      overviewTab: '🏠 Tổng quan',
      moduleUsers: 'Học viên',
      moduleMissions: 'Nhiệm vụ',
      moduleVocabulary: 'Từ vựng',
      moduleGrammar: 'Ngữ pháp',
      moduleChallengeQuestions: 'Câu hỏi thách đấu',
      moduleListening: 'Luyện nghe',
      hubTitle: 'Quản trị nội dung',
      hubDesc: 'Quản lý nguồn dữ liệu học tập — thay cho việc viết SQL seed tay.',
      noAccessTitle: 'Bạn chưa được cấp quyền truy cập mục nào',
      noAccessBody: 'Liên hệ admin đã được cấp module "Học viên" để được cấp quyền.',
      usersDesc: 'Tìm kiếm, lọc theo role, cấp/thu hồi quyền admin.',
      missionsDesc: 'Tạo/sửa/tắt nhiệm vụ daily/weekly/monthly/event.',
      vocabularyDesc: 'Quản lý từ vựng + chủ đề từ vựng theo ngôn ngữ.',
      grammarDesc: 'Quản lý chủ đề, bài học, bài tập ngữ pháp.',
      challengeQuestionsDesc: 'Ngân hàng câu hỏi trắc nghiệm cho phòng thách đấu.',
      listeningDesc: 'Bài luyện nghe (script) + câu hỏi hiểu nội dung.',
      paginationLabel: (page, totalPages, total) => `Trang ${page}/${totalPages} — ${total} kết quả`,
      prevPage: '← Trước',
      nextPage: 'Sau →',
      exporting: 'Đang xuất...',
      exportJson: '📤 Xuất JSON',
      bulkImportTitle: '📥 Nhập hàng loạt (JSON)',
      bulkImportDesc: 'Mỗi phần tử cùng cấu trúc với form thêm 1 cái phía trên.',
      onlyJsonFiles: 'Chỉ nhận file .json.',
      cannotReadFile: 'Không đọc được file.',
      removeSelectedFile: 'Bỏ file đã chọn',
      chooseJsonFile: 'Chọn file .json',
      orDragDrop: 'hoặc kéo thả vào đây',
      orPasteJson: '— hoặc dán trực tiếp JSON bên dưới —',
      invalidJson: 'JSON không hợp lệ.',
      mustBeArray: 'Phải là 1 mảng JSON có ít nhất 1 phần tử.',
      importing: 'Đang nhập...',
      importBtn: 'Nhập',
      importResultSummary: (success, total) => `✅ ${success}/${total} dòng thành công`,
      rowLabel: (n) => `Dòng ${n}`,
      rowOk: 'OK',
      lockedLabel: 'Đã khoá',
      revokeConfirm: (name) => `Thu hồi quyền admin của "${name}"?`,
      grantConfirm: (name) => `Cấp quyền admin cho "${name}"?`,
      revokeBtn: 'Thu hồi quyền',
      grantBtn: 'Cấp quyền admin',
      revokedToast: (name) => `Đã thu hồi quyền admin của "${name}"`,
      grantedToast: (name) => `Đã cấp quyền admin cho "${name}"`,
      lockConfirm: (name) => `Khoá tài khoản "${name}"? Người này sẽ không thể đăng nhập cho đến khi được khôi phục.`,
      restoredToast: (name) => `Đã khôi phục tài khoản "${name}"`,
      lockedToast: (name) => `Đã khoá tài khoản "${name}"`,
      restoreAccountBtn: 'Khôi phục tài khoản',
      lockAccountBtn: 'Khoá tài khoản',
      modulesAccessLabel: 'Module được cấp quyền truy cập /admin:',
      cannotRevokeSelfUsers: 'Không thể tự rút quyền module "Học viên" của chính mình.',
      savedModulesToast: (name) => `Đã lưu quyền module cho "${name}"`,
      saveBtn: 'Lưu',
      cancelBtn: 'Hủy',
      confirmBtn: 'Xác nhận',
      iconSearchPlaceholder: 'Tìm icon theo từ khoá...',
      chooseIconAria: 'Chọn icon có sẵn',
      noIconsFound: 'Không tìm thấy icon nào',
      editBtn: 'Sửa',
      deleteBtn: 'Xoá',
      savingBtn: 'Đang lưu...',
      searchLabel: 'Tìm kiếm',
      allLabel: 'Tất cả',
      languageLabel: 'Ngôn ngữ',
    },
  },
  en: {
    adminCommon: {
      overviewTab: '🏠 Overview',
      moduleUsers: 'Users',
      moduleMissions: 'Missions',
      moduleVocabulary: 'Vocabulary',
      moduleGrammar: 'Grammar',
      moduleChallengeQuestions: 'Challenge questions',
      moduleListening: 'Listening',
      hubTitle: 'Content admin',
      hubDesc: 'Manage learning content sources — instead of hand-writing SQL seeds.',
      noAccessTitle: "You haven't been granted access to any section",
      noAccessBody: 'Contact an admin with the "Users" module to request access.',
      usersDesc: 'Search, filter by role, grant/revoke admin rights.',
      missionsDesc: 'Create/edit/disable daily/weekly/monthly/event missions.',
      vocabularyDesc: 'Manage vocabulary + vocabulary topics per language.',
      grammarDesc: 'Manage grammar topics, lessons, and exercises.',
      challengeQuestionsDesc: 'Multiple-choice question bank for challenge rooms.',
      listeningDesc: 'Listening passages (script) + comprehension questions.',
      paginationLabel: (page, totalPages, total) => `Page ${page}/${totalPages} — ${total} results`,
      prevPage: '← Previous',
      nextPage: 'Next →',
      exporting: 'Exporting...',
      exportJson: '📤 Export JSON',
      bulkImportTitle: '📥 Bulk import (JSON)',
      bulkImportDesc: 'Each item follows the same structure as the "add one" form above.',
      onlyJsonFiles: 'Only .json files are accepted.',
      cannotReadFile: 'Could not read the file.',
      removeSelectedFile: 'Remove selected file',
      chooseJsonFile: 'Choose a .json file',
      orDragDrop: 'or drag and drop here',
      orPasteJson: '— or paste JSON directly below —',
      invalidJson: 'Invalid JSON.',
      mustBeArray: 'Must be a JSON array with at least one item.',
      importing: 'Importing...',
      importBtn: 'Import',
      importResultSummary: (success, total) => `✅ ${success}/${total} rows succeeded`,
      rowLabel: (n) => `Row ${n}`,
      rowOk: 'OK',
      lockedLabel: 'Locked',
      revokeConfirm: (name) => `Revoke admin rights from "${name}"?`,
      grantConfirm: (name) => `Grant admin rights to "${name}"?`,
      revokeBtn: 'Revoke rights',
      grantBtn: 'Grant admin',
      revokedToast: (name) => `Revoked admin rights from "${name}"`,
      grantedToast: (name) => `Granted admin rights to "${name}"`,
      lockConfirm: (name) => `Lock account "${name}"? This person won't be able to log in until restored.`,
      restoredToast: (name) => `Restored account "${name}"`,
      lockedToast: (name) => `Locked account "${name}"`,
      restoreAccountBtn: 'Restore account',
      lockAccountBtn: 'Lock account',
      modulesAccessLabel: 'Modules granted access to /admin:',
      cannotRevokeSelfUsers: 'You cannot revoke your own "Users" module access.',
      savedModulesToast: (name) => `Saved module access for "${name}"`,
      saveBtn: 'Save',
      cancelBtn: 'Cancel',
      confirmBtn: 'Confirm',
      iconSearchPlaceholder: 'Search icons by keyword...',
      chooseIconAria: 'Choose an icon',
      noIconsFound: 'No icons found',
      editBtn: 'Edit',
      deleteBtn: 'Delete',
      savingBtn: 'Saving...',
      searchLabel: 'Search',
      allLabel: 'All',
      languageLabel: 'Language',
    },
  },
}
