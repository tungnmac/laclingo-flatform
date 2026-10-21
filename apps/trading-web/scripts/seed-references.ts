// Seed Tài liệu tham khảo: nhà đầu tư + nguồn học (đã công bố). Idempotent: khớp nhà đầu tư theo slug, nguồn học theo url;
// bản ghi chưa ai sửa thì cập nhật theo seed (giữ updated_at = created_at), admin đã sửa thì BỎ QUA.
// Bản admin đã XOÁ sẽ được thêm lại khi chạy seed (giống seed:library).
// Chạy: npm run seed:references
import { INVESTORS } from './references/investors'
import { RESOURCES } from './references/resources'
import { seedAction } from './references/seed-plan'

try {
  process.loadEnvFile('.env')
} catch {
  // không có .env → dùng biến môi trường sẵn có
}

async function main() {
  const { db } = await import('../src/server/db/client')
  const { investors, learningResources } = await import('../src/server/db/schema')
  const { eq, or, sql } = await import('drizzle-orm')
  const { isUniqueViolation } = await import('../src/server/http')
  const { investorSchema, resourceSchema, investorSearchText, resourceSearchText } = await import('../src/server/references/validation')
  const { investorColumns, resourceColumns } = await import('../src/server/references/references-service')
  const keepUnedited = { updatedAt: sql`created_at` } // vẫn là "chưa sửa" để lần seed sau được cập nhật tiếp
  const count = { insert: 0, update: 0, skip: 0 }

  for (const [i, raw] of INVESTORS.entries()) {
    const x = investorSchema.parse({ ...raw, published: true, position: i })
    // khớp theo slug HOẶC tên — admin đổi slug của bản seed thì không bị thêm bản thứ 2 cùng người
    const [existing] = await db
      .select({ id: investors.id, createdAt: investors.createdAt, updatedAt: investors.updatedAt })
      .from(investors)
      .where(or(eq(investors.slug, x.slug), sql`lower(${investors.name}) = lower(${x.name})`))
    const action = seedAction(existing)
    const values = { ...investorColumns(x), slug: x.slug, name: x.name, country: x.country, style: x.style, searchText: investorSearchText(x) }
    if (action === 'insert') await db.insert(investors).values(values).onConflictDoNothing()
    if (action === 'update') await db.update(investors).set({ ...values, ...keepUnedited }).where(eq(investors.id, existing!.id))
    count[action]++
  }

  const resCount = { insert: 0, update: 0, skip: 0 }
  for (const [i, raw] of RESOURCES.entries()) {
    const r = resourceSchema.parse({ ...raw, published: true, position: i })
    const [existing] = await db
      .select({ id: learningResources.id, createdAt: learningResources.createdAt, updatedAt: learningResources.updatedAt })
      .from(learningResources)
      .where(or(eq(learningResources.url, r.url), sql`lower(btrim(${learningResources.title})) = lower(btrim(${r.title}))`))
    const action = seedAction(existing)
    const values = { ...resourceColumns(r), title: r.title, url: r.url, type: r.type, language: r.language, topic: r.topic, searchText: resourceSearchText(r) }
    // trùng tên với nguồn admin tự thêm (khác url) → bỏ qua thay vì lỗi
    if (action === 'insert') await db.insert(learningResources).values(values).onConflictDoNothing()
    if (action === 'update')
      await db
        .update(learningResources)
        .set({ ...values, ...keepUnedited })
        .where(eq(learningResources.id, existing!.id))
        .catch((err) => {
          if (!isUniqueViolation(err)) throw err // url/tên mới của seed trùng nguồn admin tự thêm → giữ nguyên bản cũ
        })
    resCount[action]++
  }

  console.log(`✅ Seed references — investors: ${JSON.stringify(count)}, resources: ${JSON.stringify(resCount)}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
