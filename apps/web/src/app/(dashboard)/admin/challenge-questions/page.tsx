'use client'

import { useState, type FormEvent } from 'react'
import { BulkImportPanel } from '@/components/admin/BulkImportPanel'
import { ExportButton } from '@/components/admin/ExportButton'
import { Pagination } from '@/components/admin/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { challengeQuestionService } from '@/features/challenge/challenge-question.service'
import { inputClass } from '@/features/auth/components/AuthForm'
import { useApi } from '@/hooks/useApi'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { fetchAllPages } from '@/lib/fetchAllPages'
import { cn } from '@/lib/utils'
import type { ChallengeQuestionAdmin, ChallengeQuestionRequest } from '@/types/api'

const PAGE_SIZE = 20

const bulkPlaceholder = `[
  {
    "language_id": "en",
    "question": "She _______ to school every day.",
    "options": ["go", "goes", "going", "gone"],
    "correct_index": 1,
    "explanation": "Ngôi thứ 3 số ít + hiện tại đơn.",
    "difficulty": 1
  }
]`

export default function AdminChallengeQuestionsPage() {
  const [languageId, setLanguageId] = useState('en')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [difficulty, setDifficulty] = useState(0)
  const { data, error, loading, reload } = useApi(
    () => challengeQuestionService.list(languageId, { page, pageSize: PAGE_SIZE, q: debouncedSearch, difficulty }),
    [languageId, page, debouncedSearch, difficulty],
  )
  const [editing, setEditing] = useState<ChallengeQuestionAdmin | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const onEdit = (q: ChallengeQuestionAdmin) => {
    setEditing(q)
    setShowForm(true)
    setFormError(null)
  }

  const onCreateNew = () => {
    setEditing(null)
    setShowForm(true)
    setFormError(null)
  }

  const onDelete = async (q: ChallengeQuestionAdmin) => {
    if (!confirm(`Xoá câu hỏi "${q.question}"?`)) return
    await challengeQuestionService.delete(q.id)
    reload()
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const options = String(form.get('options') ?? '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const body: ChallengeQuestionRequest = {
      language_id: languageId,
      question: String(form.get('question') ?? '').trim(),
      options,
      correct_index: Number(form.get('correct_index')),
      explanation: String(form.get('explanation') ?? '').trim() || undefined,
      difficulty: Number(form.get('difficulty')),
    }
    if (body.correct_index < 0 || body.correct_index >= options.length) {
      setFormError('Đáp án đúng phải là số thứ tự (bắt đầu từ 0) trong danh sách lựa chọn.')
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      if (editing) await challengeQuestionService.update(editing.id, body)
      else await challengeQuestionService.create(body)
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
        title="Câu hỏi thách đấu"
        description="Ngân hàng câu hỏi trắc nghiệm dùng cho phòng thách đấu realtime."
        action={
          !showForm && (
            <div className="flex gap-2">
              <ExportButton<ChallengeQuestionAdmin>
                fetchAll={() =>
                  fetchAllPages((p, ps) => challengeQuestionService.list(languageId, { page: p, pageSize: ps, q: debouncedSearch, difficulty }))
                }
                filename={`challenge-questions-${languageId}.json`}
              />
              <Button onClick={onCreateNew}>+ Tạo câu hỏi</Button>
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
            placeholder="Tìm theo nội dung câu hỏi..."
            className={cn(inputClass, 'max-w-xs')}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Độ khó
          <select
            value={difficulty}
            onChange={(e) => {
              setDifficulty(Number(e.target.value))
              setPage(1)
            }}
            className={cn(inputClass, 'max-w-xs')}
          >
            <option value={0}>Tất cả</option>
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>

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
                placeholder={'go\ngoes\ngoing\ngone'}
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-slate-700">
                Đáp án đúng (số thứ tự, từ 0)
                <input
                  name="correct_index"
                  type="number"
                  min={0}
                  required
                  defaultValue={editing?.correct_index ?? 0}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Độ khó (1-5)
                <input
                  name="difficulty"
                  type="number"
                  min={1}
                  max={5}
                  required
                  defaultValue={editing?.difficulty ?? 1}
                  className={inputClass}
                />
              </label>
            </div>
            <label className="block text-sm font-medium text-slate-700">
              Giải thích (tuỳ chọn)
              <input name="explanation" type="text" defaultValue={editing?.explanation} className={inputClass} />
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
      {data && data.items.length === 0 && <EmptyState title="Chưa có câu hỏi nào" icon="🎮" />}

      {data && data.items.length > 0 && (
        <Card className="mb-2 p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {data.items.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{q.question}</p>
                  <p className="truncate text-sm text-slate-500">
                    {q.options.map((o, i) => (i === q.correct_index ? `✅ ${o}` : o)).join(' · ')} — độ khó {q.difficulty}
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

      <BulkImportPanel<ChallengeQuestionRequest>
        onImport={(items) => challengeQuestionService.bulkImport(items.map((i) => ({ ...i, language_id: i.language_id || languageId })))}
        placeholder={bulkPlaceholder}
        onDone={reload}
      />
    </>
  )
}
