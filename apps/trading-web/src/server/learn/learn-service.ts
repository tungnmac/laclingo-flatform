import { and, asc, count, eq, inArray, sql } from 'drizzle-orm'
import type { Locale } from '@/i18n/locales'
import { db } from '../db/client'
import { chapters, lessonProgress, lessons, quizQuestions } from '../db/schema'
import { HttpError } from '../http'
import { toProgressDto, toPublicQuestions, type ProgressDto, type PublicQuestion } from './dto'
import { applyAttempt, gradeQuiz, nextLesson, type QuizResult } from './quiz'

export interface CatalogLessonDto {
  id: string
  slug: string
  title: string
  summary: string | null
  question_count: number
  progress: ProgressDto | null
}

export interface CatalogDto {
  chapters: { id: string; slug: string; title: string; description: string | null; lessons: CatalogLessonDto[] }[]
  next_lesson_slug: string | null
  completed: number
  total: number
}

export interface LessonDetailDto {
  id: string
  slug: string
  title: string
  summary: string | null
  content_md: string
  chapter: { slug: string; title: string }
  questions: PublicQuestion[]
  progress: ProgressDto | null
  prev_slug: string | null
  next_slug: string | null
}

export type QuizSubmitDto = QuizResult & { progress: ProgressDto }

/**
 * Định nghĩa DUY NHẤT của "bài người học nhìn thấy": bài & chương đều đã công bố, đúng ngôn ngữ,
 * theo thứ tự chương → bài. Danh sách, chi tiết, bài trước/sau và nộp quiz đều dùng hàm này.
 */
async function visibleLessons(locale: Locale) {
  return db
    .select({
      id: lessons.id,
      slug: lessons.slug,
      title: lessons.title,
      summary: lessons.summary,
      chapterId: chapters.id,
      chapterSlug: chapters.slug,
      chapterTitle: chapters.title,
      chapterDescription: chapters.description,
    })
    .from(lessons)
    .innerJoin(chapters, eq(lessons.chapterId, chapters.id))
    .where(and(eq(lessons.locale, locale), eq(lessons.published, true), eq(chapters.published, true)))
    .orderBy(asc(chapters.position), asc(lessons.position))
}

async function progressMap(userId: string, lessonIds: string[]) {
  if (lessonIds.length === 0) return new Map<string, typeof lessonProgress.$inferSelect>()
  const rows = await db
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, userId), inArray(lessonProgress.lessonId, lessonIds)))
  return new Map(rows.map((r) => [r.lessonId, r]))
}

export async function getCatalog(userId: string, locale: Locale): Promise<CatalogDto> {
  const visible = await visibleLessons(locale)
  const ids = visible.map((l) => l.id)
  const counts = ids.length
    ? await db
        .select({ lessonId: quizQuestions.lessonId, n: count() })
        .from(quizQuestions)
        .where(inArray(quizQuestions.lessonId, ids))
        .groupBy(quizQuestions.lessonId)
    : []
  const countBy = new Map(counts.map((c) => [c.lessonId, c.n]))
  const progress = await progressMap(userId, ids)

  const result: CatalogDto['chapters'] = []
  for (const l of visible) {
    let chapter = result[result.length - 1]
    if (!chapter || chapter.id !== l.chapterId) {
      chapter = { id: l.chapterId, slug: l.chapterSlug, title: l.chapterTitle, description: l.chapterDescription, lessons: [] }
      result.push(chapter)
    }
    chapter.lessons.push({
      id: l.id,
      slug: l.slug,
      title: l.title,
      summary: l.summary,
      question_count: countBy.get(l.id) ?? 0,
      progress: toProgressDto(progress.get(l.id)),
    })
  }

  const completedIds = new Set([...progress.values()].filter((p) => p.completedAt !== null).map((p) => p.lessonId))
  return {
    chapters: result,
    next_lesson_slug: nextLesson(visible, completedIds)?.slug ?? null,
    completed: completedIds.size,
    total: visible.length,
  }
}

async function findVisible(locale: Locale, slug: string) {
  const visible = await visibleLessons(locale)
  const index = visible.findIndex((l) => l.slug === slug)
  if (index < 0) throw new HttpError(404, 'NOT_FOUND')
  return { visible, index, lesson: visible[index] }
}

const questionsOf = (lessonId: string) =>
  db.select().from(quizQuestions).where(eq(quizQuestions.lessonId, lessonId)).orderBy(asc(quizQuestions.position))

export async function getLesson(userId: string, locale: Locale, slug: string): Promise<LessonDetailDto> {
  const { visible, index, lesson } = await findVisible(locale, slug)
  const [[row], questions, progress] = await Promise.all([
    db.select({ contentMd: lessons.contentMd }).from(lessons).where(eq(lessons.id, lesson.id)),
    questionsOf(lesson.id),
    progressMap(userId, [lesson.id]),
  ])
  return {
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    summary: lesson.summary,
    content_md: row.contentMd,
    chapter: { slug: lesson.chapterSlug, title: lesson.chapterTitle },
    questions: toPublicQuestions(questions),
    progress: toProgressDto(progress.get(lesson.id)),
    prev_slug: visible[index - 1]?.slug ?? null,
    next_slug: visible[index + 1]?.slug ?? null,
  }
}

export async function submitQuiz(userId: string, locale: Locale, slug: string, answers: (number | null)[]): Promise<QuizSubmitDto> {
  const { lesson } = await findVisible(locale, slug)
  const questions = await questionsOf(lesson.id)
  const result = gradeQuiz(
    questions.map((q) => ({ id: q.id, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation })),
    answers,
  )

  const saved = await db.transaction(async (tx) => {
    const [prev] = await tx
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.lessonId, lesson.id)))
      .for('update')
    const next = applyAttempt(prev ?? null, result.score, new Date())
    const values = { bestScore: next.bestScore, attempts: next.attempts, completedAt: next.completedAt, updatedAt: sql`now()` }
    const [row] = await tx
      .insert(lessonProgress)
      .values({ userId, lessonId: lesson.id, ...values })
      .onConflictDoUpdate({ target: [lessonProgress.userId, lessonProgress.lessonId], set: values })
      .returning()
    return row
  })

  return { ...result, progress: toProgressDto(saved)! }
}
