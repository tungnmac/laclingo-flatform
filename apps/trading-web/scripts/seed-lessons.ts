// Seed bộ bài khởi đầu vi + en — idempotent theo (locale, slug): chương/bài đã có thì BỎ QUA
// (không ghi đè chỉnh sửa của admin), chỉ thêm phần còn thiếu — xếp vào CUỐI danh sách hiện có.
// Bài seed cũ chưa có mã bản dịch → bổ sung (chỉ khi còn trống và mã chưa bị bài khác dùng).
// Chạy: npm run seed:lessons
import { balanceAnswers } from './lessons/balance'
import { EN } from './lessons/en'
import { translationKeys } from './lessons/translations'
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
  const { and, eq, isNull, sql } = await import('drizzle-orm')

  let addedChapters = 0
  let addedLessons = 0
  let linkedLessons = 0
  const keys = translationKeys(VI, EN)
  const sets: [string, SeedChapter[], Map<string, string>][] = [
    ['vi', VI, keys.vi],
    ['en', EN, keys.en],
  ]

  for (const [locale, seed, keyOf] of sets) {
    for (const c of seed) {
      const [{ maxChapter }] = await db
        .select({ maxChapter: sql<number>`coalesce(max(${chapters.position}), -1)` })
        .from(chapters)
        .where(eq(chapters.locale, locale))
      const inserted = await db
        .insert(chapters)
        .values({ locale, slug: c.slug, title: c.title, description: c.description, level: c.level ?? 'basic', position: Number(maxChapter) + 1, published: true })
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
          // gắn mã bản dịch cho cả bài mới lẫn bài đã có — chỉ khi còn trống và mã chưa bị bài khác cùng ngôn ngữ dùng
          const linked = await tx
            .update(lessons)
            .set({ translationKey: keyOf.get(l.slug) })
            .where(
              and(
                eq(lessons.locale, locale),
                eq(lessons.slug, l.slug),
                isNull(lessons.translationKey),
                sql`not exists (select 1 from ${lessons} other where other.locale = ${locale} and other.translation_key = ${keyOf.get(l.slug)})`,
              ),
            )
            .returning({ id: lessons.id })
          if (!lesson) {
            linkedLessons += linked.length // bài đã tồn tại → giữ nguyên nội dung & câu hỏi
            return false
          }
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

  console.log(`✅ Seed lessons: ${addedChapters} chapters, ${addedLessons} lessons added, ${linkedLessons} linked to translations (vi+en)`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
