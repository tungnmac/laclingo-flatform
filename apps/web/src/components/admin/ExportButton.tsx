'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useTranslation } from '@/hooks/useTranslation'

/** Xuất TOÀN BỘ dữ liệu khớp filter hiện tại (không chỉ trang đang xem) ra 1 file JSON. */
export function ExportButton<T>({ fetchAll, filename }: { fetchAll: () => Promise<T[]>; filename: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslation()

  const onExport = async () => {
    setBusy(true)
    setError(null)
    try {
      const items = await fetchAll()
      const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button type="button" variant="secondary" size="sm" onClick={onExport} disabled={busy}>
        {busy ? t.adminCommon.exporting : t.adminCommon.exportJson}
      </Button>
      {error && <span className="text-sm text-rose-600">{error}</span>}
    </span>
  )
}
