import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  /** Bỏ trống ở mục CUỐI (trang hiện tại) — không phải link. */
  href?: string
}

/** Đường dẫn điều hướng (Học / English / Ngữ pháp / ...) — thay cho các link
 * "← Quay lại" chỉ lùi được 1 cấp, cho phép nhảy thẳng về bất kỳ cấp cha nào. */
export function Breadcrumbs({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5 overflow-x-auto text-sm text-slate-500', className)}>
      {items.map((item, i) => (
        <span key={i} className="flex shrink-0 items-center gap-1.5">
          {i > 0 && (
            <span aria-hidden className="text-slate-300">
              /
            </span>
          )}
          {item.href ? (
            <Link href={item.href} className="truncate hover:text-indigo-600 hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="truncate font-medium text-slate-700" aria-current="page">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
