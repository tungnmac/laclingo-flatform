// Seed bộ bài khởi đầu vi + en — idempotent theo (locale, slug): chương/bài đã có thì BỎ QUA
// (không ghi đè chỉnh sửa của admin), chỉ thêm phần còn thiếu — xếp vào CUỐI danh sách hiện có.
// Chạy: npm run seed:lessons
import { balanceAnswers } from './lessons/balance'
import { EN } from './lessons/en'
import type { SeedChapter } from './lessons/types'
import { VI } from './lessons/vi'

try {
  process.loadEnvFile('.env')
} catch {
  // không có .env → dùng biến môi trường sẵn có
}

async function main() {
  // import động SAU khi nạp .env — client đọc DATABASE_URL lúc import
  const { db } = await import('../src/server/db/client')
  const { chapters, lessons, quizQuestions } = await import('../src/server/db/schema')
  const { and, eq, sql } = await import('drizzle-orm')

  let addedChapters = 0
  let addedLessons = 0
  const sets: [string, SeedChapter[]][] = [
    ['vi', VI],
    ['en', EN],
  ]

  for (const [locale, seed] of sets) {
    for (const c of seed) {
      const [{ maxChapter }] = await db
        .select({ maxChapter: sql<number>`coalesce(max(${chapters.position}), -1)` })
        .from(chapters)
        .where(eq(chapters.locale, locale))
      const inserted = await db
        .insert(chapters)
        .values({ locale, slug: c.slug, title: c.title, description: c.description, position: Number(maxChapter) + 1, published: true })
        .onConflictDoNothing({ target: [chapters.locale, chapters.slug] })
        .returning({ id: chapters.id })
      addedChapters += inserted.length
      const [chapter] = await db
        .select({ id: chapters.id })
        .from(chapters)
        .where(and(eq(chapters.locale, locale), eq(chapters.slug, c.slug)))

      for (const l of c.lessons) {
        // bài + câu hỏi trong 1 transaction: chết giữa chừng thì lần chạy sau thêm lại đủ cả hai
        const added = await db.transaction(async (tx) => {
          const [{ maxLesson }] = await tx
            .select({ maxLesson: sql<number>`coalesce(max(${lessons.position}), -1)` })
            .from(lessons)
            .where(eq(lessons.chapterId, chapter.id))
          const [lesson] = await tx
            .insert(lessons)
            .values({
              chapterId: chapter.id,
              locale,
              slug: l.slug,
              title: l.title,
              summary: l.summary,
              contentMd: l.content_md,
              position: Number(maxLesson) + 1,
              published: true,
            })
            .onConflictDoNothing({ target: [lessons.locale, lessons.slug] })
            .returning({ id: lessons.id })
          if (!lesson) return false // bài đã tồn tại → giữ nguyên cả câu hỏi
          await tx.insert(quizQuestions).values(
            balanceAnswers(l.questions).map((q, qi) => ({
              lessonId: lesson.id,
              prompt: q.prompt,
              options: q.options,
              correctIndex: q.correct_index,
              explanation: q.explanation,
              position: qi,
            })),
          )
          return true
        })
        if (added) addedLessons++
      }
    }
  }

  console.log(`✅ Seed lessons: ${addedChapters} chapters, ${addedLessons} lessons added (vi+en)`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
