// PHẢI khớp công thức backend: apps/backend/internal/leveling/leveling.go
// (baseExp=100, growth=1.5) — chỉ dùng để vẽ progress bar, không phải nguồn
// sự thật (level/exp thật luôn lấy từ server).
export function expForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.round(100 * Math.pow(1.5, level - 2))
}
