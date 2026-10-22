// Đồng bộ dữ liệu cổ phiếu Việt Nam vào DB (web chỉ đọc DB).
//   npm run vn:sync -- symbols                    danh mục mã HOSE/HNX/UPCOM (SSI — chính thức)
//   npm run vn:sync -- indexes                    thành phần rổ VN30 (SSI)
//   npm run vn:sync -- prices [--from 2021-01-01] nến ngày, chỉ tải phần còn thiếu (SSI)
//   npm run vn:sync -- index-prices [--from …]    giá trị đóng cửa VN-Index, VN30, HNX-Index, UPCOM-Index (SSI)
//   npm run vn:sync -- profiles [--force]         hồ sơ công ty (Vietcap — KHÔNG chính thức, cần VN_UNOFFICIAL_SOURCES=1)
//   npm run vn:sync -- financials [--force]       BCTC năm/quý + chỉ số (Vietcap — như trên)
//   npm run vn:sync -- all                        lần lượt tất cả
// Tuỳ chọn: --symbols FPT,VNM (chỉ các mã này) · --vn30 (chỉ 30 mã VN30 — chạy `indexes` trước) · --limit 50 (thử ít mã) · --force (bỏ qua mốc 30 ngày)
// Giới hạn tốc độ: SSI_RPM (mặc định 30/phút), VIETCAP_RPM (20/phút). Lần đầu với ~1.600 mã mất vài giờ — chạy lại được, tự tiếp tục.

try {
  process.loadEnvFile('.env')
} catch {
  // không có .env → dùng biến môi trường sẵn có
}

export {}

const JOBS = ['symbols', 'indexes', 'prices', 'index-prices', 'profiles', 'financials'] as const
type Job = (typeof JOBS)[number]
const REFRESH_DAYS = 30
const DAY = 86_400_000

function positiveInt(v: string, name: string) {
  const n = Number(v)
  if (!Number.isInteger(n) || n < 1) throw new Error(`${name} phải là số nguyên dương`)
  return n
}

function args() {
  const [, , cmd, ...rest] = process.argv
  const opt = (name: string) => {
    const i = rest.indexOf(`--${name}`)
    return i >= 0 ? rest[i + 1] : undefined
  }
  const jobs: Job[] = cmd === 'all' ? [...JOBS] : JOBS.includes(cmd as Job) ? [cmd as Job] : []
  if (jobs.length === 0) {
    console.error('Cách dùng: npm run vn:sync -- <symbols|indexes|prices|index-prices|profiles|financials|all> [--symbols A,B | --vn30] [--from YYYY-MM-DD] [--limit N] [--force]')
    process.exit(1)
  }
  const from = opt('from') ?? new Date(Date.now() - 5 * 365 * DAY).toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) throw new Error('--from phải dạng YYYY-MM-DD')
  return {
    jobs,
    symbols: opt('symbols')?.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean),
    limit: opt('limit') === undefined ? undefined : positiveInt(opt('limit')!, '--limit'),
    from,
    force: rest.includes('--force'),
    vn30: rest.includes('--vn30'),
  }
}

async function main() {
  const a = args()
  const { db } = await import('../src/server/db/client')
  const s = await import('../src/server/db/schema')
  const { and, asc, count, eq, inArray, lt, max, sql } = await import('drizzle-orm')
  const { createSsiClient } = await import('../src/server/vn/ssi')
  const { createVietcapClient } = await import('../src/server/vn/vietcap')
  const { isStock, isStockOrEtf, lastClosedSession, priceRangeStart, stockSearchText } = await import('../src/server/vn/symbols')
  const { VN_BASKETS, VN_EXCHANGES, VN_INDEX_ALIASES, VN_INDEXES, VN_STATEMENTS } = await import('../src/server/vn/types')

  let stopping = false
  process.on('SIGINT', () => {
    if (stopping) process.exit(130)
    stopping = true
    console.log('\n⏹  Dừng sau mã hiện tại… (Ctrl+C lần nữa để thoát ngay)')
  })

  /** Ghi 1 lần chạy: lỗi từng mã không làm hỏng cả lượt */
  async function run(job: Job, items: string[], work: (symbol: string) => Promise<void>) {
    const [r] = await db.insert(s.vnSyncRuns).values({ job, status: 'running' }).returning({ id: s.vnSyncRuns.id })
    let processed = 0
    let failed = 0
    const errors: string[] = []
    for (const [i, symbol] of items.entries()) {
      if (stopping) break
      try {
        await work(symbol)
        processed++
      } catch (err) {
        failed++
        if (errors.length < 20) errors.push(`${symbol}: ${(err as Error).message}`)
      }
      if ((i + 1) % 25 === 0 || i === items.length - 1) console.log(`  ${job}: ${i + 1}/${items.length} (lỗi ${failed})`)
    }
    // failed = không mã nào thành công mà có lỗi; dừng giữa chừng / có lỗi một phần = partial
    const status = failed > 0 && processed === 0 ? 'failed' : stopping || failed > 0 ? 'partial' : 'ok'
    await db
      .update(s.vnSyncRuns)
      .set({ status, processed, failed, message: errors.join('\n') || null, finishedAt: new Date() })
      .where(eq(s.vnSyncRuns.id, r.id))
    console.log(`${status === 'ok' ? '✅' : '⚠️'} ${job}: ${processed} ok, ${failed} lỗi${errors.length ? `\n   ${errors.slice(0, 5).join('\n   ')}` : ''}`)
  }

  async function targets(): Promise<string[]> {
    if (a.symbols) return a.symbols
    if (a.vn30) {
      const rows = await db.select({ symbol: s.vnIndexMembers.symbol }).from(s.vnIndexMembers).where(eq(s.vnIndexMembers.indexCode, 'VN30')).orderBy(asc(s.vnIndexMembers.symbol))
      if (rows.length === 0) throw new Error('Chưa có danh sách VN30 — chạy `npm run vn:sync -- indexes` trước')
      return rows.map((r) => r.symbol).slice(0, a.limit)
    }
    const rows = await db.select({ symbol: s.vnStocks.symbol }).from(s.vnStocks).where(eq(s.vnStocks.active, true)).orderBy(asc(s.vnStocks.symbol))
    return rows.map((r) => r.symbol).slice(0, a.limit)
  }

  let jobErrors = 0 // lỗi cấu hình/kết nối của cả job (VD thiếu khoá SSI) → bỏ qua job đó, chạy tiếp job sau
  for (const job of a.jobs) {
    if (stopping) break
    console.log(`▶ ${job}`)
    try {
      if (job === 'symbols') {
        const ssi = createSsiClient()
        await run('symbols', [...VN_EXCHANGES], async (exchange) => {
          const list = (await ssi.securities(exchange as (typeof VN_EXCHANGES)[number])).filter((x) => isStockOrEtf(x.symbol))
          const [{ before }] = await db.select({ before: count() }).from(s.vnStocks).where(and(eq(s.vnStocks.exchange, exchange), eq(s.vnStocks.active, true)))
          for (const x of list) {
            const values = { exchange: x.exchange, nameVi: x.nameVi, nameEn: x.nameEn, searchText: stockSearchText(x), active: true, updatedAt: new Date() }
            await db.insert(s.vnStocks).values({ symbol: x.symbol, ...values }).onConflictDoUpdate({ target: s.vnStocks.symbol, set: values })
          }
          // mã của sàn này không còn trong danh mục SSI (huỷ niêm yết / chuyển sàn) → ẩn.
          // Danh sách hụt bất thường (< 90% số mã đang có) → nghi nguồn trả thiếu, không ẩn gì cả.
          const seen = list.map((x) => x.symbol)
          if (seen.length < before * 0.9) {
            console.warn(`  ⚠️ ${exchange}: SSI chỉ trả ${seen.length} mã (đang có ${before}) — bỏ qua bước ẩn mã`)
          } else if (seen.length > 0) {
            await db
              .update(s.vnStocks)
              .set({ active: false, updatedAt: new Date() })
              .where(and(eq(s.vnStocks.exchange, exchange), sql`${s.vnStocks.symbol} not in ${seen}`, lt(s.vnStocks.updatedAt, new Date(Date.now() - 60_000))))
          }
          console.log(`  ${exchange}: ${list.length} mã`)
        })
      }

      if (job === 'indexes') {
        const ssi = createSsiClient()
        await run('indexes', [...VN_BASKETS], async (index) => {
          const symbols = await ssi.indexComponents(index as (typeof VN_BASKETS)[number])
          // VN30 luôn 30 mã — lệch nhiều → nghi nguồn trả sai/thiếu, giữ rổ cũ
          if (symbols.length < 25 || symbols.length > 35) throw new Error(`SSI trả ${symbols.length} mã thành phần — bất thường, giữ nguyên rổ cũ`)
          await db.transaction(async (tx) => {
            await tx.delete(s.vnIndexMembers).where(eq(s.vnIndexMembers.indexCode, index))
            await tx.insert(s.vnIndexMembers).values(symbols.map((symbol) => ({ indexCode: index, symbol })))
          })
          console.log(`  ${index}: ${symbols.length} mã`)
        })
      }

      if (job === 'index-prices') {
        const ssi = createSsiClient()
        const today = lastClosedSession(new Date())
        // Mã thật theo IndexList (tài liệu SSI viết không thống nhất: VNIndex / VNINDEX…); không lấy được → thử các cách viết đã biết
        const known = await ssi.indexList().catch((err: unknown) => {
          console.warn(`  ⚠️ IndexList: ${(err as Error).message} — dùng mã mặc định`)
          return [] as string[]
        })
        const ssiId = (index: (typeof VN_INDEXES)[number]) =>
          known.find((k) => VN_INDEX_ALIASES[index].some((a) => a.toLowerCase() === k.toLowerCase())) ?? VN_INDEX_ALIASES[index][0]
        await run('index-prices', [...VN_INDEXES], async (index) => {
          const [{ last }] = await db.select({ last: max(s.vnIndexPrices.date) }).from(s.vnIndexPrices).where(eq(s.vnIndexPrices.indexCode, index))
          const from = priceRangeStart(last, a.from, today)
          if (!from) return
          const id = ssiId(index as (typeof VN_INDEXES)[number])
          const bars = await ssi.dailyIndex(id, from, today)
          // lần đầu mà không có phiên nào → gần như chắc sai mã chỉ số: báo lỗi thay vì "ok"
          if (!last && bars.length === 0) throw new Error(`SSI không trả dữ liệu cho chỉ số "${id}" — kiểm tra mã (IndexList)`)
          await db.transaction(async (tx) => {
            for (let i = 0; i < bars.length; i += 500) {
              const chunk = bars.slice(i, i + 500).map((b) => ({
                indexCode: index,
                date: b.date,
                value: String(b.value),
                volume: b.volume === null ? null : String(Math.round(b.volume)),
                turnover: b.turnover === null ? null : String(Math.round(b.turnover)),
              }))
              await tx
                .insert(s.vnIndexPrices)
                .values(chunk)
                .onConflictDoUpdate({
                  target: [s.vnIndexPrices.indexCode, s.vnIndexPrices.date],
                  set: { value: sql`excluded.value`, volume: sql`excluded.volume`, turnover: sql`excluded.turnover` },
                })
            }
          })
        })
      }

      if (job === 'prices') {
        const ssi = createSsiClient()
        const today = lastClosedSession(new Date())
        await run('prices', await targets(), async (symbol) => {
          const [{ last }] = await db.select({ last: max(s.vnPrices.date) }).from(s.vnPrices).where(eq(s.vnPrices.symbol, symbol))
          const from = priceRangeStart(last, a.from, today)
          if (!from) return
          const bars = await ssi.dailyBars(symbol, from, today)
          // 1 transaction/mã: lỗi giữa chừng không để lại khoảng trống mà max(date) đã vượt qua
          await db.transaction(async (tx) => {
            for (let i = 0; i < bars.length; i += 500) {
              const chunk = bars.slice(i, i + 500).map((b) => ({
                symbol,
                date: b.date,
                open: String(b.open),
                high: String(b.high),
                low: String(b.low),
                close: String(b.close),
                volume: String(Math.round(b.volume)),
                value: b.value === null ? null : String(Math.round(b.value)),
              }))
              await tx
                .insert(s.vnPrices)
                .values(chunk)
                .onConflictDoUpdate({
                  target: [s.vnPrices.symbol, s.vnPrices.date],
                  set: { open: sql`excluded.open`, high: sql`excluded.high`, low: sql`excluded.low`, close: sql`excluded.close`, volume: sql`excluded.volume`, value: sql`excluded.value` },
                })
            }
          })
        })
      }

      const fresh = async (table: 'profiles' | 'financials', symbols: string[]) => {
        if (a.force) return new Set<string>()
        const since = new Date(Date.now() - REFRESH_DAYS * DAY)
        const rows =
          table === 'profiles'
            ? await db.select({ symbol: s.vnProfiles.symbol }).from(s.vnProfiles).where(and(inArray(s.vnProfiles.symbol, symbols), sql`${s.vnProfiles.fetchedAt} >= ${since}`))
            : await db
                .selectDistinct({ symbol: s.vnFinancials.symbol })
                .from(s.vnFinancials)
                .where(and(inArray(s.vnFinancials.symbol, symbols), sql`${s.vnFinancials.fetchedAt} >= ${since}`))
        return new Set(rows.map((r) => r.symbol))
      }

      if (job === 'profiles') {
        const vc = createVietcapClient()
        const all = (await targets()).filter(isStock) // ETF không có hồ sơ / BCTC
        const skip = all.length ? await fresh('profiles', all) : new Set<string>()
        await run('profiles', all.filter((x) => !skip.has(x)), async (symbol) => {
          const data = await vc.profile(symbol)
          await db.insert(s.vnProfiles).values({ symbol, data, fetchedAt: new Date() }).onConflictDoUpdate({ target: s.vnProfiles.symbol, set: { data, fetchedAt: new Date() } })
        })
      }

      if (job === 'financials') {
        const vc = createVietcapClient()
        const known = new Set((await db.select({ statement: s.vnFinFields.statement, field: s.vnFinFields.field }).from(s.vnFinFields)).map((f) => `${f.statement}:${f.field}`))
        const all = (await targets()).filter(isStock) // ETF không có hồ sơ / BCTC
        const skip = all.length ? await fresh('financials', all) : new Set<string>()
        await run('financials', all.filter((x) => !skip.has(x)), async (symbol) => {
          const rows: (typeof s.vnFinancials.$inferInsert)[] = []
          let unknownField = false
          for (const statement of VN_STATEMENTS) {
            for (const p of await vc.statement(symbol, statement)) {
              rows.push({ symbol, statement, period: p.period, year: p.year, quarter: p.quarter, values: p.values, fetchedAt: new Date() })
              if (!unknownField && Object.keys(p.values).some((f) => !known.has(`${statement}:${f}`))) unknownField = true
            }
          }
          for (const p of await vc.ratios(symbol)) rows.push({ symbol, statement: 'RATIO', period: p.period, year: p.year, quarter: p.quarter, values: p.values, fetchedAt: new Date() })
          // Tên chỉ tiêu: chỉ tải khi gặp mã chỉ tiêu mới (ngân hàng / bảo hiểm / chứng khoán có bộ mã riêng)
          if (unknownField) {
            for (const l of await vc.fieldLabels(symbol)) {
              const values = { titleVi: l.titleVi, titleEn: l.titleEn, level: l.level, parent: l.parent, position: l.position }
              await db.insert(s.vnFinFields).values({ statement: l.statement, field: l.field, ...values }).onConflictDoUpdate({ target: [s.vnFinFields.statement, s.vnFinFields.field], set: values })
              known.add(`${l.statement}:${l.field}`)
            }
          }
          await db.transaction(async (tx) => {
            for (const r of rows) {
              await tx
                .insert(s.vnFinancials)
                .values(r)
                .onConflictDoUpdate({ target: [s.vnFinancials.symbol, s.vnFinancials.statement, s.vnFinancials.period], set: { values: r.values, year: r.year, quarter: r.quarter, fetchedAt: r.fetchedAt } })
            }
          })
        })
      }
    } catch (err) {
      jobErrors++
      console.error(`❌ ${job}: ${(err as Error).message}`)
    }
  }
  process.exit(jobErrors > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('❌', (err as Error).message)
  process.exit(1)
})
