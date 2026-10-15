'use client'

import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'

/** Điều hướng trang — dùng chung cho mọi list admin có phân trang server-side */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const t = useTranslation()
  if (total === 0) return null

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <p className="text-sm text-slate-500">{t.adminCommon.paginationLabel(page, totalPages, total)}</p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          {t.adminCommon.prevPage}
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          {t.adminCommon.nextPage}
        </Button>
      </div>
    </div>
  )
}
