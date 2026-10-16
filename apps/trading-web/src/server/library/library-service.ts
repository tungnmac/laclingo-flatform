import { and, asc, eq, sql } from 'drizzle-orm'
import type { z } from 'zod'
import type { Locale } from '@/i18n/locales'
import { db } from '../db/client'
import { books, glossaryTerms, userBooks, type BookRow, type GlossaryTermRow } from '../db/schema'
import { HttpError, isUniqueViolation } from '../http'
import type { bookFilterSchema, bookPatchSchema, bookSchema, BookStatus, termPatchSchema, termSchema } from './validation'
import { matchesTerm } from './validation'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const assertId = (id: string) => {
  if (!UUID.test(id)) throw new HttpError(404, 'NOT_FOUND')
}

// ── Sách (người học) ──

export interface BookDto {
  id: string
  title: string
  author: string
  year: number | null
  level: string
  topic: string
  url: string | null
  summary: string
  my_status: BookStatus | null
}

export async function listBooks(userId: string, locale: Locale, filter: z.infer<typeof bookFilterSchema>): Promise<BookDto[]> {
  const rows = await db
    .select({ book: books, status: userBooks.status })
    .from(books)
    .leftJoin(userBooks, and(eq(userBooks.bookId, books.id), eq(userBooks.userId, userId)))
    .where(
      and(
        eq(books.published, true),
        filter.level ? eq(books.level, filter.level) : undefined,
        filter.topic ? eq(books.topic, filter.topic) : undefined,
        filter.status ? eq(userBooks.status, filter.status) : undefined,
      ),
    )
    .orderBy(asc(books.position), asc(books.title))
  return rows.map(({ book: b, status }) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    year: b.year,
    level: b.level,
    topic: b.topic,
    url: b.url,
    summary: (locale === 'vi' ? b.summaryVi : b.summaryEn) || b.summaryEn || b.summaryVi,
    my_status: (status as BookStatus | null) ?? null,
  }))
}

/** null = bỏ đánh dấu. Sách chưa công bố coi như không tồn tại. */
export async function setBookStatus(userId: string, bookId: string, status: BookStatus | null): Promise<{ my_status: BookStatus | null }> {
  assertId(bookId)
  const [book] = await db.select({ id: books.id }).from(books).where(and(eq(books.id, bookId), eq(books.published, true)))
  if (!book) throw new HttpError(404, 'NOT_FOUND')
  if (status === null) {
    await db.delete(userBooks).where(and(eq(userBooks.userId, userId), eq(userBooks.bookId, bookId)))
  } else {
    await db
      .insert(userBooks)
      .values({ userId, bookId, status })
      .onConflictDoUpdate({ target: [userBooks.userId, userBooks.bookId], set: { status, updatedAt: sql`now()` } })
  }
  return { my_status: status }
}

// ── Sách (admin) ──

export interface AdminBookDto {
  id: string
  title: string
  author: string
  year: number | null
  level: string
  topic: string
  url: string | null
  summary_vi: string
  summary_en: string
  published: boolean
  position: number
}

const toAdminBook = (b: BookRow): AdminBookDto => ({
  id: b.id,
  title: b.title,
  author: b.author,
  year: b.year,
  level: b.level,
  topic: b.topic,
  url: b.url,
  summary_vi: b.summaryVi,
  summary_en: b.summaryEn,
  published: b.published,
  position: b.position,
})

export async function listBooksAdmin(): Promise<AdminBookDto[]> {
  return (await db.select().from(books).orderBy(asc(books.position), asc(books.title))).map(toAdminBook)
}

const bookColumns = (input: z.infer<typeof bookPatchSchema>) => ({
  ...(input.title !== undefined && { title: input.title }),
  ...(input.author !== undefined && { author: input.author }),
  ...(input.year !== undefined && { year: input.year }),
  ...(input.level !== undefined && { level: input.level }),
  ...(input.topic !== undefined && { topic: input.topic }),
  ...(input.url !== undefined && { url: input.url }),
  ...(input.summary_vi !== undefined && { summaryVi: input.summary_vi }),
  ...(input.summary_en !== undefined && { summaryEn: input.summary_en }),
  ...(input.published !== undefined && { published: input.published }),
  ...(input.position !== undefined && { position: input.position }),
})

export async function createBook(input: z.infer<typeof bookSchema>): Promise<AdminBookDto> {
  const [row] = await db
    .insert(books)
    .values({ ...bookColumns(input), title: input.title, author: input.author, topic: input.topic })
    .returning()
  return toAdminBook(row)
}

export async function updateBook(id: string, patch: z.infer<typeof bookPatchSchema>): Promise<AdminBookDto> {
  assertId(id)
  const [row] = await db
    .update(books)
    .set({ ...bookColumns(patch), updatedAt: sql`now()` })
    .where(eq(books.id, id))
    .returning()
  if (!row) throw new HttpError(404, 'NOT_FOUND')
  return toAdminBook(row)
}

export async function deleteBook(id: string): Promise<void> {
  assertId(id)
  const deleted = await db.delete(books).where(eq(books.id, id)).returning({ id: books.id })
  if (deleted.length === 0) throw new HttpError(404, 'NOT_FOUND')
}

// ── Thuật ngữ ──

export interface TermDto {
  id: string
  term: string
  definition_md: string
  lesson_slug: string | null
}
export type AdminTermDto = TermDto & { locale: string; published: boolean }

const toTerm = (t: GlossaryTermRow): TermDto => ({ id: t.id, term: t.term, definition_md: t.definitionMd, lesson_slug: t.lessonSlug })

/** Bảng nhỏ (vài trăm dòng) → lọc & sắp xếp ở app: tìm không dấu, sắp theo bảng chữ cái của ngôn ngữ */
export async function listGlossary(locale: Locale, q?: string): Promise<TermDto[]> {
  const rows = await db
    .select()
    .from(glossaryTerms)
    .where(and(eq(glossaryTerms.locale, locale), eq(glossaryTerms.published, true)))
  return rows
    .filter((t) => !q || matchesTerm(t.term, q))
    .sort((a, b) => a.term.localeCompare(b.term, locale))
    .map(toTerm)
}

export async function listGlossaryAdmin(locale: Locale): Promise<AdminTermDto[]> {
  const rows = await db.select().from(glossaryTerms).where(eq(glossaryTerms.locale, locale))
  return rows.sort((a, b) => a.term.localeCompare(b.term, locale)).map((t) => ({ ...toTerm(t), locale: t.locale, published: t.published }))
}

async function termGuard<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, 'TERM_TAKEN')
    throw err
  }
}

export async function createTerm(input: z.infer<typeof termSchema>): Promise<AdminTermDto> {
  const [row] = await termGuard(() =>
    db
      .insert(glossaryTerms)
      .values({ locale: input.locale, term: input.term, definitionMd: input.definition_md, lessonSlug: input.lesson_slug, published: input.published })
      .returning(),
  )
  return { ...toTerm(row), locale: row.locale, published: row.published }
}

export async function updateTerm(id: string, patch: z.infer<typeof termPatchSchema>): Promise<AdminTermDto> {
  assertId(id)
  const [row] = await termGuard(() =>
    db
      .update(glossaryTerms)
      .set({
        ...(patch.term !== undefined && { term: patch.term }),
        ...(patch.definition_md !== undefined && { definitionMd: patch.definition_md }),
        ...(patch.lesson_slug !== undefined && { lessonSlug: patch.lesson_slug }),
        ...(patch.published !== undefined && { published: patch.published }),
        updatedAt: sql`now()`,
      })
      .where(eq(glossaryTerms.id, id))
      .returning(),
  )
  if (!row) throw new HttpError(404, 'NOT_FOUND')
  return { ...toTerm(row), locale: row.locale, published: row.published }
}

export async function deleteTerm(id: string): Promise<void> {
  assertId(id)
  const deleted = await db.delete(glossaryTerms).where(eq(glossaryTerms.id, id)).returning({ id: glossaryTerms.id })
  if (deleted.length === 0) throw new HttpError(404, 'NOT_FOUND')
}
