'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'

const sections = [
  { href: '/admin/users', icon: '👤', title: 'Học viên', description: 'Tìm kiếm, lọc theo role, cấp/thu hồi quyền admin.' },
  { href: '/admin/missions', icon: '🎯', title: 'Nhiệm vụ', description: 'Tạo/sửa/tắt nhiệm vụ daily/weekly/monthly/event.' },
  { href: '/admin/vocabulary', icon: '📚', title: 'Từ vựng', description: 'Quản lý từ vựng + chủ đề từ vựng theo ngôn ngữ.' },
  { href: '/admin/grammar', icon: '📖', title: 'Ngữ pháp', description: 'Quản lý chủ đề, bài học, bài tập ngữ pháp.' },
  { href: '/admin/challenge-questions', icon: '🎮', title: 'Câu hỏi thách đấu', description: 'Ngân hàng câu hỏi trắc nghiệm cho phòng thách đấu.' },
  { href: '/admin/listening', icon: '🎧', title: 'Luyện nghe', description: 'Bài luyện nghe (script) + câu hỏi hiểu nội dung.' },
]

export default function AdminHubPage() {
  return (
    <>
      <PageHeader title="Quản trị nội dung" description="Quản lý nguồn dữ liệu học tập — thay cho việc viết SQL seed tay." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex flex-col gap-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-indigo-300"
          >
            <span className="text-3xl">{s.icon}</span>
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600">{s.title}</h3>
            <p className="text-sm text-slate-500">{s.description}</p>
          </Link>
        ))}
      </div>
    </>
  )
}
