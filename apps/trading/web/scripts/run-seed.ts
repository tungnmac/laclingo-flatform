// Chạy 1 bộ seed từ dòng lệnh: tsx scripts/run-seed.ts <instruments|lessons|companies|library|references>
// (trang Quản trị → Công cụ gọi cùng các hàm này). Mọi seed đều idempotent: chỉ thêm phần còn thiếu, không xoá.
try {
  process.loadEnvFile('.env')
} catch {
  // không có .env → dùng biến môi trường sẵn có
}

export {}

async function main() {
  const { SEEDS, isSeedName } = await import('../src/server/admin/seeds')
  const name = process.argv[2]
  if (!isSeedName(name)) throw new Error(`seed không hợp lệ: ${name} — chọn 1 trong ${Object.keys(SEEDS).join(', ')}`)
  console.log(await SEEDS[name]())
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
