'use client'

import { cn } from '@/lib/utils'

/** Tab chuyển section trong CÙNG 1 trang (state cục bộ, không đổi URL) — dùng
 * khi 1 trang quản trị có nhiều khối nội dung xếp dọc, để chỉ hiện 1 lúc. */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
}) {
  return (
    <div className="mb-6 flex gap-1 border-b border-slate-200" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'border-b-2 px-4 py-2.5 text-sm font-semibold transition',
            active === t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
