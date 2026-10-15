import { and, asc, count, desc, eq, gt, inArray, lt, sql } from 'drizzle-orm'
import type { z } from 'zod'
import type { Locale } from '@/i18n/locales'
import { db } from '../db/client'
import { chapters, lessons, quizQuestions, type ChapterRow, type LessonRow } from '../db/schema'
import { HttpError, isUniqueViolation } from '../http'
import type { chapterPatchSchema, chapterSchema, lessonPatchSchema, lessonSchema, questionsSchema } from './validation'

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
type Direction = 'up' | 'down'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface AdminLessonSummaryDto {
  id: string
  chapter_id: string
  slug: string
  title: string
  position: number
  published: boolean
  question_count: number
}

export interface AdminChapterDto {
  id: string
  locale: string
  slug: string
  title: string
  description: string | null
  position: number
  published: boolean
  lessons: AdminLessonSummaryDto[]
}

export interface AdminQuestionDto {
  id: string
  prompt: string
  options: string[]
  correct_index: number
  explanation: string | null
}

export interface AdminLessonDto extends AdminLessonSummaryDto {
  locale: string
  summary: string | null
  content_md: string
  questions: AdminQuestionDto[]
}

const toChapterDto = (c: ChapterRow, lessonDtos: AdminLessonSummaryDto[] = []): AdminChapterDto => ({
  id: c.id,
  locale: c.locale,
  slug: c.slug,
  title: c.title,
  description: c.description,
  position: c.position,
  published: c.published,
  lessons: lessonDtos,
})

const toLessonSummary = (l: LessonRow, questionCount: number): AdminLessonSummaryDto => ({
  id: l.id,
  chapter_id: l.chapterId,
  slug: l.slug,
  title: l.title,
  position: l.position,
  published: l.published,
  question_count: questionCount,
})

/** Lỗi trùng (locale, slug) → SLUG_TAKEN */
async function slugGuard<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, 'SLUG_TAKEN')
    throw err
  }
}

const assertId = (id: string) => {
  if (!UUID.test(id)) throw new HttpError(404, 'NOT_FOUND')
}

async function findChapter(id: string, tx: Tx | typeof db = db): Promise<ChapterRow> {
  assertId(id)
  const [row] = await tx.select().from(chapters).where(eq(chapters.id, id))
  if (!row) throw new HttpError(404, 'NOT_FOUND')
  return row
}

async function findLesson(id: string, tx: Tx | typeof db = db): Promise<LessonRow> {
  assertId(id)
  const [row] = await tx.select().from(lessons).where(eq(lessons.id, id))
  if (!row) throw new HttpError(404, 'NOT_FOUND')
  return row
}

async function questionCounts(lessonIds: string[]) {
  if (lessonIds.length === 0) return new Map<string, number>()
  const rows = await db
    .select({ lessonId: quizQuestions.lessonId, n: count() })
    .from(quizQuestions)
    .where(inArray(quizQuestions.lessonId, lessonIds))
    .groupBy(quizQuestions.lessonId)
  return new Map(rows.map((r) => [r.lessonId, r.n]))
}

// ── Cây nội dung ──

export async function listTree(locale: Locale): Promise<AdminChapterDto[]> {
  const [chapterRows, lessonRows] = await Promise.all([
    db.select().from(chapters).where(eq(chapters.locale, locale)).orderBy(asc(chapters.position)),
    db.select().from(lessons).where(eq(lessons.locale, locale)).orderBy(asc(lessons.position)),
  ])
  const counts = await questionCounts(lessonRows.map((l) => l.id))
  return chapterRows.map((c) =>
    toChapterDto(
      c,
      lessonRows.filter((l) => l.chapterId === c.id).map((l) => toLessonSummary(l, counts.get(l.id) ?? 0)),
    ),
  )
}

// ── Chương ──

export async function createChapter(input: z.infer<typeof chapterSchema>): Promise<AdminChapterDto> {
  return slugGuard(async () => {
    const [{ max }] = await db
      .select({ max: sql<number>`coalesce(max(${chapters.position}), -1)` })
      .from(chapters)
      .where(eq(chapters.locale, input.locale))
    const [row] = await db
      .insert(chapters)
      .values({ ...input, position: Number(max) + 1 })
      .returning()
    return toChapterDto(row)
  })
}

export async function updateChapter(id: string, patch: z.infer<typeof chapterPatchSchema>): Promise<AdminChapterDto> {
  await findChapter(id)
  return slugGuard(async () => {
    const [row] = await db
      .update(chapters)
      .set({ ...patch, updatedAt: sql`now()` })
      .where(eq(chapters.id, id))
      .returning()
    return toChapterDto(row)
  })
}

export async function deleteChapter(id: string): Promise<void> {
  await findChapter(id)
  await db.delete(chapters).where(eq(chapters.id, id)) // bài + câu hỏi + tiến độ xoá theo cascade
}

/** Đổi chỗ với phần tử kề cùng phạm vi; ở đầu/cuối danh sách → không làm gì */
export async function moveChapter(id: string, direction: Direction): Promise<void> {
  await db.transaction(async (tx) => {
    const cur = await findChapter(id, tx)
    const [neighbour] = await tx
      .select()
      .from(chapters)
      .where(
        and(
          eq(chapters.locale, cur.locale),
          direction === 'up' ? lt(chapters.position, cur.position) : gt(chapters.position, cur.position),
        ),
      )
      .orderBy(direction === 'up' ? desc(chapters.position) : asc(chapters.position))
      .limit(1)
      .for('update')
    if (!neighbour) return
    await tx.update(chapters).set({ position: neighbour.position }).where(eq(chapters.id, cur.id))
    await tx.update(chapters).set({ position: cur.position }).where(eq(chapters.id, neighbour.id))
  })
}

// ── Bài ──

async function nextLessonPosition(chapterId: string, tx: Tx | typeof db = db): Promise<number> {
  const [{ max }] = await tx
    .select({ max: sql<number>`coalesce(max(${lessons.position}), -1)` })
    .from(lessons)
    .where(eq(lessons.chapterId, chapterId))
  return Number(max) + 1
}

export async function getLessonAdmin(id: string): Promise<AdminLessonDto> {
  const lesson = await findLesson(id)
  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.lessonId, id))
    .orderBy(asc(quizQuestions.position))
  return {
    ...toLessonSummary(lesson, questions.length),
    locale: lesson.locale,
    summary: lesson.summary,
    content_md: lesson.contentMd,
    questions: questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options,
      correct_index: q.correctIndex,
      explanation: q.explanation,
    })),
  }
}

export async function createLesson(input: z.infer<typeof lessonSchema>): Promise<AdminLessonDto> {
  const chapter = await findChapter(input.chapter_id)
  const id = await slugGuard(async () => {
    const [row] = await db
      .insert(lessons)
      .values({
        chapterId: chapter.id,
        locale: chapter.locale,
        slug: input.slug,
        title: input.title,
        summary: input.summary,
        contentMd: input.content_md,
        published: input.published,
        position: await nextLessonPosition(chapter.id),
      })
      .returning({ id: lessons.id })
    return row.id
  })
  return getLessonAdmin(id)
}

export async function updateLesson(id: string, patch: z.infer<typeof lessonPatchSchema>): Promise<AdminLessonDto> {
  const lesson = await findLesson(id)
  const set: Partial<typeof lessons.$inferInsert> = {}
  if (patch.slug !== undefined) set.slug = patch.slug
  if (patch.title !== undefined) set.title = patch.title
  if (patch.summary !== undefined) set.summary = patch.summary
  if (patch.content_md !== undefined) set.contentMd = patch.content_md
  if (patch.published !== undefined) set.published = patch.published
  if (patch.chapter_id !== undefined && patch.chapter_id !== lesson.chapterId) {
    const target = await findChapter(patch.chapter_id)
    if (target.locale !== lesson.locale) throw new HttpError(404, 'NOT_FOUND') // không chuyển bài sang chương khác ngôn ngữ
    set.chapterId = target.id
    set.position = await nextLessonPosition(target.id)
  }
  await slugGuard(() =>
    db
      .update(lessons)
      .set({ ...set, updatedAt: sql`now()` })
      .where(eq(lessons.id, id)),
  )
  return getLessonAdmin(id)
}

export async function deleteLesson(id: string): Promise<void> {
  await findLesson(id)
  await db.delete(lessons).where(eq(lessons.id, id))
}

export async function moveLesson(id: string, direction: Direction): Promise<void> {
  await db.transaction(async (tx) => {
    const cur = await findLesson(id, tx)
    const [neighbour] = await tx
      .select()
      .from(lessons)
      .where(
        and(
          eq(lessons.chapterId, cur.chapterId),
          direction === 'up' ? lt(lessons.position, cur.position) : gt(lessons.position, cur.position),
        ),
      )
      .orderBy(direction === 'up' ? desc(lessons.position) : asc(lessons.position))
      .limit(1)
      .for('update')
    if (!neighbour) return
    await tx.update(lessons).set({ position: neighbour.position }).where(eq(lessons.id, cur.id))
    await tx.update(lessons).set({ position: cur.position }).where(eq(lessons.id, neighbour.id))
  })
}

/** Thay TOÀN BỘ câu hỏi của bài theo thứ tự gửi lên */
export async function replaceQuestions(lessonId: string, questions: z.infer<typeof questionsSchema>): Promise<AdminLessonDto> {
  await db.transaction(async (tx) => {
    await findLesson(lessonId, tx)
    await tx.delete(quizQuestions).where(eq(quizQuestions.lessonId, lessonId))
    if (questions.length) {
      await tx.insert(quizQuestions).values(
        questions.map((q, i) => ({
          lessonId,
          prompt: q.prompt,
          options: q.options,
          correctIndex: q.correct_index,
          explanation: q.explanation,
          position: i,
        })),
      )
    }
    await tx.update(lessons).set({ updatedAt: sql`now()` }).where(eq(lessons.id, lessonId))
  })
  return getLessonAdmin(lessonId)
}
