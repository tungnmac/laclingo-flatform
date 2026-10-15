import { asc, count, eq, inArray, sql } from 'drizzle-orm'
import type { z } from 'zod'
import type { Locale } from '@/i18n/locales'
import { db } from '../db/client'
import { chapters, lessons, quizQuestions, type ChapterRow, type LessonRow } from '../db/schema'
import { HttpError, isUniqueViolation } from '../http'
import { reorder } from './order'
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
    db.select().from(chapters).where(eq(chapters.locale, locale)).orderBy(asc(chapters.position), asc(chapters.id)),
    db.select().from(lessons).where(eq(lessons.locale, locale)).orderBy(asc(lessons.position), asc(lessons.id)),
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

/** Khoá theo phạm vi để 2 thao tác tạo/chuyển cùng lúc không nhận cùng position */
const lockChapters = (tx: Tx, locale: string) => tx.execute(sql`select pg_advisory_xact_lock(hashtext(${'chapters:' + locale}))`)
const lockLessons = (tx: Tx, chapterId: string) => tx.select({ id: chapters.id }).from(chapters).where(eq(chapters.id, chapterId)).for('update')

export async function createChapter(input: z.infer<typeof chapterSchema>): Promise<AdminChapterDto> {
  return slugGuard(() =>
    db.transaction(async (tx) => {
      await lockChapters(tx, input.locale)
      const [{ max }] = await tx
        .select({ max: sql<number>`coalesce(max(${chapters.position}), -1)` })
        .from(chapters)
        .where(eq(chapters.locale, input.locale))
      const [row] = await tx
        .insert(chapters)
        .values({ ...input, position: Number(max) + 1 })
        .returning()
      return toChapterDto(row)
    }),
  )
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

/**
 * Đổi chỗ với phần tử kề cùng phạm vi rồi đánh lại position 0..n-1 (tự sửa position trùng);
 * ở đầu/cuối danh sách → không làm gì. Khoá phạm vi trước để 2 lần chuyển đồng thời không deadlock.
 */
export async function moveChapter(id: string, direction: Direction): Promise<void> {
  await db.transaction(async (tx) => {
    const cur = await findChapter(id, tx)
    await lockChapters(tx, cur.locale)
    const siblings = await tx
      .select({ id: chapters.id })
      .from(chapters)
      .where(eq(chapters.locale, cur.locale))
      .orderBy(asc(chapters.position), asc(chapters.id))
    const order = reorder(siblings.map((r) => r.id), id, direction)
    if (!order) return
    for (const [i, cid] of order.entries()) await tx.update(chapters).set({ position: i }).where(eq(chapters.id, cid))
  })
}

// ── Bài ──

async function nextLessonPosition(chapterId: string, tx: Tx): Promise<number> {
  await lockLessons(tx, chapterId)
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
  const id = await slugGuard(() =>
    db.transaction(async (tx) => {
      const [row] = await tx
        .insert(lessons)
        .values({
          chapterId: chapter.id,
          locale: chapter.locale,
          slug: input.slug,
          title: input.title,
          summary: input.summary,
          contentMd: input.content_md,
          published: input.published,
          position: await nextLessonPosition(chapter.id, tx),
        })
        .returning({ id: lessons.id })
      return row.id
    }),
  )
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
  let target: ChapterRow | null = null
  if (patch.chapter_id !== undefined && patch.chapter_id !== lesson.chapterId) {
    target = await findChapter(patch.chapter_id)
    if (target.locale !== lesson.locale) throw new HttpError(404, 'NOT_FOUND') // không chuyển bài sang chương khác ngôn ngữ
    set.chapterId = target.id
  }
  await slugGuard(() =>
    db.transaction(async (tx) => {
      if (target) set.position = await nextLessonPosition(target.id, tx)
      await tx
        .update(lessons)
        .set({ ...set, updatedAt: sql`now()` })
        .where(eq(lessons.id, id))
    }),
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
    await lockLessons(tx, cur.chapterId)
    const siblings = await tx
      .select({ id: lessons.id })
      .from(lessons)
      .where(eq(lessons.chapterId, cur.chapterId))
      .orderBy(asc(lessons.position), asc(lessons.id))
    const order = reorder(siblings.map((r) => r.id), id, direction)
    if (!order) return
    for (const [i, lid] of order.entries()) await tx.update(lessons).set({ position: i }).where(eq(lessons.id, lid))
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
