'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { BulkImportPanel } from '@/components/admin/BulkImportPanel'
import { Pagination } from '@/components/admin/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { inputClass } from '@/features/auth/components/AuthForm'
import { listeningService } from '@/features/listening/listening.service'
import { useApi } from '@/hooks/useApi'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { ListeningQuestionAdmin, ListeningQuestionRequest } from '@/types/api'

const PAGE_SIZE = 20

const bulkPlaceholder = `[
  {
    "question": "Where does Lan go every Saturday morning?",
    "options": ["To school", "To the market", "To the park", "To the beach"],
    "correct_answer": "To the market",
    "explanation": "Câu đầu tiên nói rõ điều này.",
    "order_index": 0
  }
]`

export default function AdminListeningQuestionsPage({ params }: { params: { passageId: string } }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const { data, error, loading, reload } = useApi(
    () => listeningService.listQuestionsAdmin(params.passageId, { page, pageSize: PAGE_SIZE, q: debouncedSearch }),
    [params.passageId, page, debouncedSearch],
  )
  const [editing, setEditing] = useState<ListeningQuestionAdmin | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const onEdit = (q: ListeningQuestionAdmin) => {
    setEditing(q)
    setShowForm(true)
    setFormError(null)
  }

  const onCreateNew = () => {
    setEditing(null)
    setShowForm(true)
    setFormError(null)
  }

  const onDelete = async (q: ListeningQuestionAdmin) => {
    if (!confirm(`Xoá câu hỏi "${q.question}"?`)) return
    await listeningService.deleteQuestionAdmin(q.id)
    reload()
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const options = String(form.get('options') ?? '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const body: ListeningQuestionRequest = {
      passage_id: params.passageId,
      question: String(form.get('question') ?? '').trim(),
      options,
      correct_answer: String(form.get('correct_answer') ?? '').trim(),
      explanation: String(form.get('explanation') ?? '').trim() || undefined,
      order_index: Number(form.get('order_index')),
    }
    if (!options.includes(body.correct_answer)) {
      setFormError('Đáp án đúng phải khớp CHÍNH XÁC với 1 trong các lựa chọn phía trên.')
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      if (editing) await listeningService.updateQuestionAdmin(editing.id, body)
      else await listeningService.createQuestionAdmin(body)
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
      <Link href="/admin/listening" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600">
        ← Danh sách bài luyện nghe
      </Link>
      <PageHeader
        title="Câu hỏi hiểu nội dung"
        description="Trắc nghiệm cho bài luyện nghe này."
        action={!showForm && <Button onClick={onCreateNew}>+ Tạo câu hỏi</Button>}
      />

      <label className="mb-4 block text-sm font-medium text-slate-700">
        Tìm kiếm
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Tìm theo nội dung câu hỏi..."
          className={`${inputClass} max-w-xs`}
        />
      </label>

      {showForm && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900">{editing ? 'Sửa câu hỏi' : 'Tạo câu hỏi mới'}</h3>
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Câu hỏi
              <input name="question" type="text" required defaultValue={editing?.question} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Lựa chọn (mỗi dòng 1 lựa chọn)
              <textarea
                name="options"
                required
                rows={4}
                defaultValue={editing?.options.join('\n')}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Đáp án đúng (phải khớp đúng 1 trong các lựa chọn trên)
              <input name="correct_answer" type="text" required defaultValue={editing?.correct_answer} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Giải thích (tuỳ chọn)
              <input name="explanation" type="text" defaultValue={editing?.explanation} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Thứ tự
              <input name="order_index" type="number" defaultValue={editing?.order_index ?? 0} className={inputClass} />
            </label>

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
      {data && data.items.length === 0 && <EmptyState title="Chưa có câu hỏi nào" icon="❓" />}

      {data && data.items.length > 0 && (
        <Card className="mb-2 p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {data.items.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{q.question}</p>
                  <p className="truncate text-sm text-slate-500">
                    {q.options.map((o) => (o === q.correct_answer ? `✅ ${o}` : o)).join(' · ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => onEdit(q)}>
                    Sửa
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => onDelete(q)}>
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

      <BulkImportPanel<ListeningQuestionRequest>
        onImport={(items) => listeningService.bulkImportQuestions(items.map((i) => ({ ...i, passage_id: params.passageId })))}
        placeholder={bulkPlaceholder}
        onDone={reload}
      />
    </>
  )
}
