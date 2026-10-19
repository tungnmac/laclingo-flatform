import { and, asc, count, eq, ilike, sql } from 'drizzle-orm'
import type { z } from 'zod'
import type { Locale } from '@/i18n/locales'
import { db } from '../db/client'
import { books, glossaryTerms, userBooks, type BookRow, type GlossaryTermRow } from '../db/schema'
import { HttpError, isUniqueViolation } from '../http'
import type { bookFilterSchema, bookPatchSchema, bookSchema, BookStatus, termPatchSchema, termSchema } from './validation'
import { bookSearchText, matchesTerm, searchWords } from './validation'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const assertId = (id: string) => {
  if (!UUID.test(id)) throw new HttpError(404, 'NOT_FOUND')
}

// ── Sách (người học) ──

export interface BookDto {
  id: string
  title: string // tên hiển thị theo ngôn ngữ (vi: tên bản dịch nếu có)
  original_title: string | null // tên gốc khi khác tên hiển thị
  author: string
  year: number | null
  level: string
  topic: string
  url: string | null
  summary: string
  my_status: BookStatus | null
}

export interface BookPageDto {
  items: BookDto[]
  total: number // số sách khớp bộ lọc
  page: number
  page_size: number
  /** Tiến độ đọc trên TOÀN BỘ sách đã công bố (không theo bộ lọc) */
  stats: { books: number; want: number; reading: number; done: number }
}

export async function listBooks(userId: string, locale: Locale, filter: z.infer<typeof bookFilterSchema>): Promise<BookPageDto> {
  const mine = and(eq(userBooks.bookId, books.id), eq(userBooks.userId, userId))
  const where = and(
    eq(books.published, true),
    filter.level ? eq(books.level, filter.level) : undefined,
    filter.topic ? eq(books.topic, filter.topic) : undefined,
    filter.status ? eq(userBooks.status, filter.status) : undefined,
    ...searchWords(filter.q).map((w) => ilike(books.searchText, `%${w}%`)),
  )
  const [rows, [{ total }], statRows, [{ all }]] = await Promise.all([
    db
      .select({ book: books, status: userBooks.status })
      .from(books)
      .leftJoin(userBooks, mine)
      .where(where)
      .orderBy(asc(books.position), asc(books.title), asc(books.id))
      .limit(filter.page_size)
      .offset((filter.page - 1) * filter.page_size),
    db.select({ total: count() }).from(books).leftJoin(userBooks, mine).where(where),
    db
      .select({ status: userBooks.status, n: count() })
      .from(userBooks)
      .innerJoin(books, eq(books.id, userBooks.bookId))
      .where(and(eq(userBooks.userId, userId), eq(books.published, true)))
      .groupBy(userBooks.status),
    db.select({ all: count() }).from(books).where(eq(books.published, true)),
  ])
  const statOf = (s: BookStatus) => statRows.find((r) => r.status === s)?.n ?? 0
  return {
    items: rows.map(({ book: b, status }) => {
      const title = locale === 'vi' && b.titleVi ? b.titleVi : b.title
      return {
        id: b.id,
        title,
        original_title: title === b.title ? null : b.title,
        author: b.author,
        year: b.year,
        level: b.level,
        topic: b.topic,
        url: b.url,
        summary: (locale === 'vi' ? b.summaryVi : b.summaryEn) || b.summaryEn || b.summaryVi,
        my_status: (status as BookStatus | null) ?? null,
      }
    }),
    total,
    page: filter.page,
    page_size: filter.page_size,
    stats: { books: all, want: statOf('want'), reading: statOf('reading'), done: statOf('done') },
  }
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
  title_vi: string | null
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
  title_vi: b.titleVi,
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
  ...(input.title_vi !== undefined && { titleVi: input.title_vi }),
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
    .values({ ...bookColumns(input), title: input.title, author: input.author, topic: input.topic, searchText: bookSearchText(input) })
    .returning()
  return toAdminBook(row)
}

export async function updateBook(id: string, patch: z.infer<typeof bookPatchSchema>): Promise<AdminBookDto> {
  assertId(id)
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(books).where(eq(books.id, id)).for('update')
    if (!current) throw new HttpError(404, 'NOT_FOUND')
    // search_text tính lại từ giá trị SAU khi sửa (trường không gửi lên giữ nguyên)
    const searchText = bookSearchText({
      title: patch.title ?? current.title,
      title_vi: patch.title_vi !== undefined ? patch.title_vi : current.titleVi,
      author: patch.author ?? current.author,
    })
    const [row] = await tx
      .update(books)
      .set({ ...bookColumns(patch), searchText, updatedAt: sql`now()` })
      .where(eq(books.id, id))
      .returning()
    return toAdminBook(row)
  })
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
