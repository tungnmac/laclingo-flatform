'use client'

import { useId, useState, type ChangeEvent, type DragEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { inputClass } from '@/features/auth/components/AuthForm'
import { useTranslation } from '@/hooks/useTranslation'
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
  const fileInputId = useId()
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [results, setResults] = useState<BulkImportResult[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslation()

  const loadFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      setError(t.adminCommon.onlyJsonFiles)
      return
    }
    setError(null)
    try {
      setText(await file.text())
      setFileName(file.name)
    } catch {
      setError(t.adminCommon.cannotReadFile)
    }
  }

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await loadFile(file)
    // Cho phép chọn lại CÙNG file lần 2 (onChange không bắn nếu value không đổi)
    e.target.value = ''
  }

  const onDrop = async (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await loadFile(file)
  }

  const clearFile = () => {
    setFileName(null)
    setText('')
  }

  const onSubmit = async () => {
    let items: T[]
    try {
      items = JSON.parse(text)
    } catch {
      setError(t.adminCommon.invalidJson)
      return
    }
    if (!Array.isArray(items) || items.length === 0) {
      setError(t.adminCommon.mustBeArray)
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
      <h3 className="text-base font-semibold text-slate-900">{t.adminCommon.bulkImportTitle}</h3>
      <p className="mt-1 text-sm text-slate-500">{t.adminCommon.bulkImportDesc}</p>
      <label
        htmlFor={fileInputId}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'mt-3 flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-5 text-center transition',
          dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50',
        )}
      >
        <input id={fileInputId} type="file" accept=".json,application/json" onChange={onFileChange} className="sr-only" />
        {fileName ? (
          <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <span className="text-lg" aria-hidden>
              📄
            </span>
            {fileName}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                clearFile()
              }}
              aria-label={t.adminCommon.removeSelectedFile}
              className="ml-1 rounded-full px-1.5 py-0.5 text-slate-400 transition hover:bg-rose-100 hover:text-rose-600"
            >
              ✕
            </button>
          </span>
        ) : (
          <span className="text-sm text-slate-500">
            <span className="text-lg" aria-hidden>
              📁
            </span>{' '}
            <span className="font-semibold text-indigo-600">{t.adminCommon.chooseJsonFile}</span> {t.adminCommon.orDragDrop}
          </span>
        )}
      </label>
      <p className="mt-3 text-center text-xs text-slate-400">{t.adminCommon.orPasteJson}</p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setFileName(null)
        }}
        placeholder={placeholder}
        rows={6}
        className={cn(inputClass, 'mt-2 font-mono text-xs')}
      />
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      <Button type="button" size="sm" className="mt-3" disabled={busy || !text.trim()} onClick={onSubmit}>
        {busy ? t.adminCommon.importing : t.adminCommon.importBtn}
      </Button>

      {results && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-700">{t.adminCommon.importResultSummary(successCount, results.length)}</p>
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs">
            {results.map((r) => (
              <li
                key={r.index}
                className={cn('rounded px-2 py-1', r.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}
              >
                {t.adminCommon.rowLabel(r.index + 1)}: {r.success ? t.adminCommon.rowOk : r.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
