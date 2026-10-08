'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const items = [
  { href: '/admin/users', label: 'Học viên', icon: '👤' },
  { href: '/admin/missions', label: 'Nhiệm vụ', icon: '🎯' },
  { href: '/admin/vocabulary', label: 'Từ vựng', icon: '📚' },
  { href: '/admin/grammar', label: 'Ngữ pháp', icon: '📖' },
  { href: '/admin/challenge-questions', label: 'Câu hỏi thách đấu', icon: '🎮' },
  { href: '/admin/listening', label: 'Luyện nghe', icon: '🎧' },
]

/** Tab điều hướng giữa các trang quản trị — luôn hiện trên mọi trang /admin/*
 * (trừ trang tổng quan) để chuyển loại nội dung không cần quay lại hub. */
export function AdminSubNav() {
  const pathname = usePathname()

  return (
    <nav className="mb-6 -mx-4 flex gap-1 overflow-x-auto border-b border-slate-200 px-4 sm:mx-0 sm:px-0">
      <Link
        href="/admin"
        className="shrink-0 border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:text-slate-700"
      >
        🏠 Tổng quan
      </Link>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition',
              active ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            {item.icon} {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
