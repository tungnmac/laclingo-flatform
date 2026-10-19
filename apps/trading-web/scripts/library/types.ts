export type BookLevel = 'basic' | 'intermediate' | 'advanced'
export type BookTopic = 'investing' | 'trading' | 'psychology' | 'finance' | 'economics'

/** Đầu sách — CHỈ thông tin công khai (tên, tác giả, năm) + tóm tắt tự viết "vì sao nên đọc", không trích nội dung sách */
export interface SeedBook {
  title: string // tên gốc của sách
  /** Tên bản dịch tiếng Việt đã xuất bản và phổ biến (vd "Nhà đầu tư thông minh") — không chắc thì null */
  title_vi: string | null
  author: string
  year: number | null
  level: BookLevel
  topic: BookTopic
  summary_vi: string
  summary_en: string
}

export interface SeedTerm {
  term: string
  definition_md: string
  /** slug bài học liên quan ở CÙNG ngôn ngữ (phải tồn tại trong seed bài học), hoặc null */
  lesson_slug: string | null
}
