'use client'

import { useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { inputClass } from '@/features/auth/components/AuthForm'
import { cn } from '@/lib/utils'
import type { BulkImportResult } from '@/types/api'

/**
 * Nhập hàng loạt qua JSON array — dùng chung cho mọi loại nội dung (từ vựng,
 * ngữ pháp, câu hỏi thách đấu, luyện nghe). Lỗi từng dòng hiển thị riêng,
 * không chặn các dòng còn lại (khớp hành vi best-effort của backend).
 */
export function BulkImportPanel<T>({
  onImport,
  placeholder,
  onDone,
}: {
  onImport: (items: T[]) => Promise<BulkImportResult[]>
  placeholder: string
  onDone?: () => void
}) {
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [results, setResults] = useState<BulkImportResult[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      setText(await file.text())
      setFileName(file.name)
    } catch {
      setError('Không đọc được file.')
    } finally {
      // Cho phép chọn lại CÙNG file lần 2 (onChange không bắn nếu value không đổi)
      e.target.value = ''
    }
  }

  const onSubmit = async () => {
    let items: T[]
    try {
      items = JSON.parse(text)
    } catch {
      setError('JSON không hợp lệ.')
      return
    }
    if (!Array.isArray(items) || items.length === 0) {
      setError('Phải là 1 mảng JSON có ít nhất 1 phần tử.')
      return
    }

    setBusy(true)
    setError(null)
    setResults(null)
    try {
      const res = await onImport(items)
      setResults(res)
      onDone?.()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const successCount = results?.filter((r) => r.success).length ?? 0

  return (
    <Card>
      <h3 className="text-base font-semibold text-slate-900">📥 Nhập hàng loạt (JSON)</h3>
      <p className="mt-1 text-sm text-slate-500">
        Dán 1 mảng JSON (hoặc tải lên file .json) — mỗi phần tử cùng cấu trúc với form thêm 1 cái phía trên.
      </p>
      <label className="mt-3 block text-sm font-medium text-slate-700">
        Tải lên file .json
        <input
          type="file"
          accept=".json,application/json"
          onChange={onFileChange}
          className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
        />
      </label>
      {fileName && <p className="mt-1 text-xs text-slate-500">Đã nạp từ file: {fileName}</p>}
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setFileName(null)
        }}
        placeholder={placeholder}
        rows={6}
        className={cn(inputClass, 'mt-3 font-mono text-xs')}
      />
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      <Button type="button" size="sm" className="mt-3" disabled={busy || !text.trim()} onClick={onSubmit}>
        {busy ? 'Đang nhập...' : 'Nhập'}
      </Button>

      {results && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-700">
            ✅ {successCount}/{results.length} dòng thành công
          </p>
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs">
            {results.map((r) => (
              <li
                key={r.index}
                className={cn('rounded px-2 py-1', r.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}
              >
                Dòng {r.index + 1}: {r.success ? 'OK' : r.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
