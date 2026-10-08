'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { BulkImportPanel } from '@/components/admin/BulkImportPanel'
import { ExportButton } from '@/components/admin/ExportButton'
import { Pagination } from '@/components/admin/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { inputClass } from '@/features/auth/components/AuthForm'
import { LevelBadge } from '@/features/grammar/components/LevelBadge'
import { listeningService } from '@/features/listening/listening.service'
import { useApi } from '@/hooks/useApi'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { fetchAllPages } from '@/lib/fetchAllPages'
import { cn } from '@/lib/utils'
import type { ListeningPassageAdmin, ListeningPassageRequest } from '@/types/api'

const PAGE_SIZE = 20

const bulkPlaceholder = `[
  {
    "language_id": "en",
    "title": "A Trip to the Zoo",
    "script": "Last Sunday, Mai and her brother went to the zoo...",
    "topic": "Daily life",
    "level": "A1",
    "order_index": 0
  }
]`

export default function AdminListeningPage() {
  const confirm = useConfirm()
  const [languageId, setLanguageId] = useState('en')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [level, setLevel] = useState('')
  const { data, error, loading, reload } = useApi(
    () => listeningService.listPassagesAdmin(languageId, { page, pageSize: PAGE_SIZE, q: debouncedSearch, level }),
    [languageId, page, debouncedSearch, level],
  )
  const [editing, setEditing] = useState<ListeningPassageAdmin | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const onEdit = (p: ListeningPassageAdmin) => {
    setEditing(p)
    setShowForm(true)
    setFormError(null)
  }

  const onCreateNew = () => {
    setEditing(null)
    setShowForm(true)
    setFormError(null)
  }

  const onDelete = async (p: ListeningPassageAdmin) => {
    if (!(await confirm({ description: `Xoá bài "${p.title}"? Toàn bộ câu hỏi bên trong sẽ bị xoá theo.`, danger: true }))) return
    await listeningService.deletePassage(p.id)
    reload()
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body: ListeningPassageRequest = {
      language_id: languageId,
      title: String(form.get('title') ?? '').trim(),
      script: String(form.get('script') ?? '').trim(),
      topic: String(form.get('topic') ?? '').trim() || undefined,
      level: String(form.get('level') ?? 'A1'),
      order_index: Number(form.get('order_index')),
    }

    setSaving(true)
    setFormError(null)
    try {
      if (editing) await listeningService.updatePassage(editing.id, body)
      else await listeningService.createPassage(body)
      setShowForm(false)
      setEditing(null)
      reload()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Luyện nghe"
        description="Bài luyện nghe (script đọc bằng TTS) + câu hỏi hiểu nội dung."
        action={
          !showForm && (
            <div className="flex gap-2">
              <ExportButton<ListeningPassageAdmin>
                fetchAll={() =>
                  fetchAllPages((p, ps) => listeningService.listPassagesAdmin(languageId, { page: p, pageSize: ps, q: debouncedSearch, level }))
                }
                filename={`listening-passages-${languageId}.json`}
              />
              <Button onClick={onCreateNew}>+ Tạo bài</Button>
            </div>
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-4">
        <label className="block text-sm font-medium text-slate-700">
          Ngôn ngữ
          <select
            value={languageId}
            onChange={(e) => {
              setLanguageId(e.target.value)
              setPage(1)
            }}
            className={cn(inputClass, 'max-w-xs')}
          >
            <option value="en">🇬🇧 English</option>
            <option value="zh">🇨🇳 中文</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Tìm kiếm
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Tìm theo tiêu đề/chủ đề..."
            className={cn(inputClass, 'max-w-xs')}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Cấp độ
          <input
            type="text"
            value={level}
            onChange={(e) => {
              setLevel(e.target.value)
              setPage(1)
            }}
            placeholder="A1, A2, ..."
            className={cn(inputClass, 'max-w-[8rem]')}
          />
        </label>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900">{editing ? `Sửa: ${editing.title}` : 'Tạo bài luyện nghe mới'}</h3>
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Tiêu đề
              <input name="title" type="text" required defaultValue={editing?.title} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Script (văn bản sẽ được đọc bằng Web Speech TTS)
              <textarea name="script" required rows={5} defaultValue={editing?.script} className={inputClass} />
            </label>
            <div className="grid grid-cols-3 gap-4">
              <label className="block text-sm font-medium text-slate-700">
                Chủ đề (tuỳ chọn)
                <input name="topic" type="text" defaultValue={editing?.topic} className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Cấp độ
                <input name="level" type="text" defaultValue={editing?.level ?? 'A1'} className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Thứ tự
                <input name="order_index" type="number" defaultValue={editing?.order_index ?? 0} className={inputClass} />
              </label>
            </div>

            {formError && (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
                {formError}
              </p>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Hủy
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title="Chưa có bài luyện nghe nào" icon="🎧" />}

      {data && data.items.length > 0 && (
        <Card className="mb-2 p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {data.items.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{p.title}</p>
                  {p.topic && <p className="truncate text-sm text-slate-500">{p.topic}</p>}
                </div>
                <LevelBadge level={p.level} />
                <div className="flex gap-2">
                  <Link href={`/admin/listening/${p.id}`}>
                    <Button variant="secondary" size="sm">
                      Câu hỏi
                    </Button>
                  </Link>
                  <Button variant="secondary" size="sm" onClick={() => onEdit(p)}>
                    Sửa
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => onDelete(p)}>
                    Xoá
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />}
      <div className="mb-6" />

      <BulkImportPanel<ListeningPassageRequest>
        onImport={(items) => listeningService.bulkImportPassages(items.map((i) => ({ ...i, language_id: i.language_id || languageId })))}
        placeholder={bulkPlaceholder}
        onDone={reload}
      />
    </>
  )
}
