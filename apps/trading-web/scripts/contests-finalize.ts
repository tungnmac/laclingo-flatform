// Chốt kết quả giải đấu đã kết thúc (quá 10 phút): quyết toán ví thi đấu, trừ lỗ chưa chốt, lưu bảng xếp hạng.
//   npm run contests:finalize        (chạy định kỳ, VD cron mỗi 10 phút — chạy lại an toàn)

try {
  process.loadEnvFile('.env')
} catch {
  // không có .env → dùng biến môi trường sẵn có
}

export {}

async function main() {
  const { finalizeDueContests } = await import('../src/server/contests/contest-service')
  const { finalized, skipped } = await finalizeDueContests()
  console.log(`✅ contests finalized: ${finalized.join(', ') || '—'}${skipped.length ? ` · ⚠️ chờ lần sau (thiếu giá): ${skipped.join(', ')}` : ''}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('❌', (err as Error).message)
  process.exit(1)
})
