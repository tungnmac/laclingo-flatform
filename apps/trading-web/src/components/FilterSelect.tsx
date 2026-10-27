'use client'

import type { ReactNode } from 'react'

/** Lưới bộ lọc: 2 cột trên điện thoại, nhiều cột hơn khi rộng — các ô luôn thẳng hàng, không xuống dòng lộn xộn */
export const filterGrid = (cols: 2 | 3 | 4 | 5) =>
  `grid grid-cols-2 gap-x-3 gap-y-2 ${{ 2: '', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4', 5: 'sm:grid-cols-3 lg:grid-cols-5' }[cols]}`

/** Ô lọc dạng select: nhãn nhỏ phía trên, ô chọn rộng hết cột */
export function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 truncate rounded-lg border-0 bg-white py-1.5 pl-3 pr-8 text-sm font-normal text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-emerald-600"
      >
        {children}
      </select>
    </label>
  )
}
