// Seed thư viện: sách nên đọc + thuật ngữ vi/en (đã công bố) — idempotent: sách trùng (tên + tác giả) /
// thuật ngữ trùng (ngôn ngữ + term) thì BỎ QUA, không ghi đè chỉnh sửa của admin (chỉ bổ sung tên tiếng Việt
// khi còn trống). Cuối cùng tính lại search_text (bỏ dấu) cho MỌI sách. Chạy: npm run seed:library
import { BOOKS } from './library/books'
import { GLOSSARY_EN } from './library/glossary-en'
import { GLOSSARY_VI } from './library/glossary-vi'

export async function seedLibrary(): Promise<string> {
  const { db } = await import('../src/server/db/client')
  const { books, glossaryTerms } = await import('../src/server/db/schema')
  const { and, eq, isNull } = await import('drizzle-orm')
  const { bookSearchText } = await import('../src/server/library/validation')

  let addedBooks = 0
  for (const [i, b] of BOOKS.entries()) {
    const [exists] = await db
      .select({ id: books.id })
      .from(books)
      .where(and(eq(books.title, b.title), eq(books.author, b.author)))
    if (exists) {
      if (b.title_vi) await db.update(books).set({ titleVi: b.title_vi }).where(and(eq(books.id, exists.id), isNull(books.titleVi)))
      continue
    }
    await db.insert(books).values({
      title: b.title,
      titleVi: b.title_vi,
      author: b.author,
      year: b.year,
      level: b.level,
      topic: b.topic,
      summaryVi: b.summary_vi,
      summaryEn: b.summary_en,
      published: true,
      position: i,
    })
    addedBooks++
  }

  // search_text bỏ dấu — gồm cả sách admin thêm/sửa trước khi có cột này (migration chỉ điền tạm)
  let reindexed = 0
  for (const b of await db.select({ id: books.id, title: books.title, titleVi: books.titleVi, author: books.author, searchText: books.searchText }).from(books)) {
    const searchText = bookSearchText({ title: b.title, title_vi: b.titleVi, author: b.author })
    if (searchText === b.searchText) continue
    await db.update(books).set({ searchText }).where(eq(books.id, b.id))
    reindexed++
  }

  let addedTerms = 0
  for (const [locale, terms] of [
    ['vi', GLOSSARY_VI],
    ['en', GLOSSARY_EN],
  ] as const) {
    for (const t of terms) {
      const inserted = await db
        .insert(glossaryTerms)
        .values({ locale, term: t.term, definitionMd: t.definition_md, lessonSlug: t.lesson_slug, published: true })
        .onConflictDoNothing() // unique (locale, lower(term))
        .returning({ id: glossaryTerms.id })
      addedTerms += inserted.length
    }
  }

  return `✅ Seed library: ${addedBooks} books, ${addedTerms} glossary terms added, ${reindexed} books reindexed`
}
