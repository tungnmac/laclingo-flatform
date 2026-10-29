// Nâng quyền admin cho user đã đăng ký. Chạy: npm run make-admin -- <email>
try {
  process.loadEnvFile('.env')
} catch {
  // không có .env → dùng biến môi trường sẵn có
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase()
  if (!email) throw new Error('Cách dùng: npm run make-admin -- <email>')
  const { db } = await import('../src/server/db/client')
  const { users } = await import('../src/server/db/schema')
  const { eq } = await import('drizzle-orm')
  const rows = await db.update(users).set({ role: 'admin' }).where(eq(users.email, email)).returning({ id: users.id })
  if (rows.length === 0) throw new Error(`Không tìm thấy user ${email}`)
  console.log(`✅ ${email} → admin`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})

export {} // module riêng — tránh trùng tên main() với scripts/seed.ts khi tsc
