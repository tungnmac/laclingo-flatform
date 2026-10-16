// Seed danh mục doanh nghiệp + bản nháp phân tích (CHƯA công bố) — idempotent:
// mã / bản phân tích đã có thì BỎ QUA (không ghi đè chỉnh sửa của admin). Lưu ý: mã admin đã XOÁ sẽ được
// tạo lại (kèm bản nháp) — muốn bỏ hẳn một mã thì Ẩn thay vì Xoá. Chạy: npm run seed:companies
import { DRAFTS_US } from './companies/drafts-us'
import { DRAFTS_VN } from './companies/drafts-vn'
import { COMPANIES } from './companies/list'

try {
  process.loadEnvFile('.env')
} catch {
  // không có .env → dùng biến môi trường sẵn có
}

async function main() {
  // import động SAU khi nạp .env — client đọc DATABASE_URL lúc import
  const { db } = await import('../src/server/db/client')
  const { companies, companyAnalyses } = await import('../src/server/db/schema')
  const { and, eq } = await import('drizzle-orm')

  let addedCompanies = 0
  let addedDrafts = 0
  for (const [market, drafts] of [
    ['vn', DRAFTS_VN],
    ['us', DRAFTS_US],
  ] as const) {
    for (const symbol of COMPANIES[market]) {
      const inserted = await db.insert(companies).values({ market, symbol }).onConflictDoNothing().returning({ id: companies.id })
      addedCompanies += inserted.length
      const draft = drafts[symbol]
      if (!draft) continue
      const [company] = await db.select({ id: companies.id }).from(companies).where(and(eq(companies.market, market), eq(companies.symbol, symbol)))
      for (const locale of ['vi', 'en'] as const) {
        const a = draft[locale]
        const added = await db
          .insert(companyAnalyses)
          .values({
            companyId: company.id,
            locale,
            summary: a.summary,
            businessMd: a.business_md,
            strategyMd: a.strategy_md,
            strengthsMd: a.strengths_md,
            risksMd: a.risks_md,
            published: false,
          })
          .onConflictDoNothing()
          .returning({ id: companyAnalyses.companyId })
        addedDrafts += added.length
      }
    }
  }

  console.log(`✅ Seed companies: ${addedCompanies} companies, ${addedDrafts} draft analyses added (unpublished)`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
