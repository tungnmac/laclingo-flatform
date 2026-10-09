/** Ghép className, bỏ qua giá trị falsy */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Tên hiển thị: ưu tiên full_name, fallback phần trước @ của email */
export function displayName(user: { full_name: string; email: string }) {
  return user.full_name || user.email.split('@')[0]
}

/** Lấy video ID từ 1 link YouTube (watch?v=, youtu.be/, /embed/) — null nếu không nhận ra được. */
export function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/)
  return match ? match[1] : null
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}
