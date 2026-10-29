import type { Locale } from '@/store/locale'

// Namespace "classes" (learner — danh sách lớp + chi tiết giáo án) và
// "adminClasses" (quản trị lớp học). Chỉ vi+en.
export interface ClassesDict {
  classes: {
    sectionTitle: string
    cardDesc: string
    emptyClasses: string
    lessonCountSuffix: string
    enrollBtn: string
    enrolling: string
    detailProgressLabel: string
    lessonsTitle: string
    completedBadge: string
    notEnrolledHint: string
  }
  adminClasses: {
    pageTitle: string
    pageDesc: string
    addClassBtn: string
    editClassTitle: (title: string) => string
    addClassTitle: string
    titleLabel: string
    descriptionLabel: string
    levelLabel: string
    orderLabel: string
    emptyClasses: string
    deleteClassConfirm: (title: string) => string
    lessonCountSuffix: string
    curriculumTitle: string
    curriculumHint: string
    saveCurriculumBtn: string
    savingCurriculumBtn: string
    curriculumSaved: string
    noLessonsForLanguage: string
  }
}

export const classesTranslations: Partial<Record<Locale, ClassesDict>> = {
  vi: {
    classes: {
      sectionTitle: '📋 Lớp học',
      cardDesc: 'Học theo giáo án có sẵn — chuỗi bài ngữ pháp theo thứ tự cố định cho từng level.',
      emptyClasses: 'Chưa có lớp học nào cho ngôn ngữ này',
      lessonCountSuffix: 'bài học',
      enrollBtn: 'Ghi danh',
      enrolling: 'Đang ghi danh...',
      detailProgressLabel: 'Tiến độ giáo án',
      lessonsTitle: 'Giáo án',
      completedBadge: '✅ Hoàn thành',
      notEnrolledHint: 'Ghi danh để theo dõi tiến độ giáo án này.',
    },
    adminClasses: {
      pageTitle: 'Lớp học',
      pageDesc: 'Quản lý lớp học và giáo án (chuỗi bài ngữ pháp theo thứ tự) theo ngôn ngữ.',
      addClassBtn: '+ Tạo lớp',
      editClassTitle: (title) => `Sửa: ${title}`,
      addClassTitle: 'Tạo lớp mới',
      titleLabel: 'Tiêu đề',
      descriptionLabel: 'Mô tả',
      levelLabel: 'Level',
      orderLabel: 'Thứ tự',
      emptyClasses: 'Chưa có lớp học nào',
      deleteClassConfirm: (title) =>
        `Xoá lớp "${title}"? Giáo án và ghi danh của học viên sẽ bị xoá theo (bài ngữ pháp gốc không bị ảnh hưởng).`,
      lessonCountSuffix: 'bài',
      curriculumTitle: '📋 Giáo án',
      curriculumHint: 'Chọn bài ngữ pháp thuộc lớp này và nhập thứ tự học — lưu sẽ thay TOÀN BỘ giáo án hiện tại.',
      saveCurriculumBtn: 'Lưu giáo án',
      savingCurriculumBtn: 'Đang lưu giáo án...',
      curriculumSaved: 'Đã lưu giáo án.',
      noLessonsForLanguage: 'Ngôn ngữ này chưa có bài ngữ pháp nào.',
    },
  },
  en: {
    classes: {
      sectionTitle: '📋 Classes',
      cardDesc: 'Follow a ready-made curriculum — a fixed-order sequence of grammar lessons for each level.',
      emptyClasses: 'No classes for this language yet',
      lessonCountSuffix: 'lessons',
      enrollBtn: 'Enroll',
      enrolling: 'Enrolling...',
      detailProgressLabel: 'Curriculum progress',
      lessonsTitle: 'Curriculum',
      completedBadge: '✅ Done',
      notEnrolledHint: 'Enroll to track progress through this curriculum.',
    },
    adminClasses: {
      pageTitle: 'Classes',
      pageDesc: 'Manage classes and their curriculum (an ordered sequence of grammar lessons) per language.',
      addClassBtn: '+ Create class',
      editClassTitle: (title) => `Edit: ${title}`,
      addClassTitle: 'Create a new class',
      titleLabel: 'Title',
      descriptionLabel: 'Description',
      levelLabel: 'Level',
      orderLabel: 'Order',
      emptyClasses: 'No classes yet',
      deleteClassConfirm: (title) =>
        `Delete class "${title}"? Its curriculum and student enrollments will be deleted too (the underlying grammar lessons are unaffected).`,
      lessonCountSuffix: 'lessons',
      curriculumTitle: '📋 Curriculum',
      curriculumHint: 'Pick the grammar lessons that belong to this class and set their order — saving replaces the ENTIRE current curriculum.',
      saveCurriculumBtn: 'Save curriculum',
      savingCurriculumBtn: 'Saving curriculum...',
      curriculumSaved: 'Curriculum saved.',
      noLessonsForLanguage: 'This language has no grammar lessons yet.',
    },
  },
}
