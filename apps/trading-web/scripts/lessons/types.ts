export interface SeedQuestion {
  prompt: string
  options: string[]
  correct_index: number
  explanation: string
}

export interface SeedLesson {
  slug: string
  title: string
  summary: string
  content_md: string
  questions: SeedQuestion[]
}

export interface SeedChapter {
  slug: string
  title: string
  description: string
  lessons: SeedLesson[]
}
