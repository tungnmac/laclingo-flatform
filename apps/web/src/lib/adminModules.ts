import type { User } from '@/types/api'

export interface AdminModule {
  key: string
  label: string
  icon: string
  href: string
}

// Khớp 1-1 với service.AdminModules (backend) + modulePathPrefixes (middleware.go)
export const ADMIN_MODULES: AdminModule[] = [
  { key: 'users', label: 'Học viên', icon: '👤', href: '/admin/users' },
  { key: 'missions', label: 'Nhiệm vụ', icon: '🎯', href: '/admin/missions' },
  { key: 'vocabulary', label: 'Từ vựng', icon: '📚', href: '/admin/vocabulary' },
  { key: 'grammar', label: 'Ngữ pháp', icon: '📖', href: '/admin/grammar' },
  { key: 'challenge_questions', label: 'Câu hỏi thách đấu', icon: '🎮', href: '/admin/challenge-questions' },
  { key: 'listening', label: 'Luyện nghe', icon: '🎧', href: '/admin/listening' },
]

/** Suy module cần thiết từ pathname hiện tại (so khớp dài nhất trước) — trả null nếu không thuộc module nào (vd trang hub /admin) */
export function moduleForAdminPath(pathname: string): string | null {
  const match = ADMIN_MODULES.find((m) => pathname === m.href || pathname.startsWith(`${m.href}/`))
  return match?.key ?? null
}

export function hasModule(user: Pick<User, 'role' | 'admin_modules'> | null | undefined, moduleKey: string): boolean {
  return !!user && user.role === 'admin' && !!user.admin_modules?.includes(moduleKey)
}
