// Seed danh mục mã crypto — idempotent (upsert theo market+symbol). Chạy: npm run db:seed
try {
  process.loadEnvFile('.env')
} catch {
  // không có .env → dùng biến môi trường sẵn có
}

const CRYPTO = [
  ['BTC', 'Bitcoin'],
  ['ETH', 'Ethereum'],
  ['BNB', 'BNB'],
  ['SOL', 'Solana'],
  ['XRP', 'XRP'],
  ['ADA', 'Cardano'],
  ['DOGE', 'Dogecoin'],
  ['TON', 'Toncoin'],
  ['AVAX', 'Avalanche'],
  ['LINK', 'Chainlink'],
] as const

async function main() {
  // import động SAU khi nạp .env — client đọc DATABASE_URL lúc import
  const { db } = await import('../src/server/db/client')
  const { instruments } = await import('../src/server/db/schema')
  const { sql } = await import('drizzle-orm')

  await db
    .insert(instruments)
    .values(CRYPTO.map(([base, name], i) => ({ market: 'crypto', symbol: `${base}USDT`, base, quote: 'USDT', name, sortOrder: i + 1 })))
    .onConflictDoUpdate({
      target: [instruments.market, instruments.symbol],
      set: { name: sql`excluded.name`, sortOrder: sql`excluded.sort_order`, isActive: sql`excluded.is_active` },
    })
  console.log(`✅ Seed ${CRYPTO.length} instruments`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
