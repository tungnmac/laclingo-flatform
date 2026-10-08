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
import { grammarService } from '@/features/grammar/grammar.service'
import { useApi } from '@/hooks/useApi'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { fetchAllPages } from '@/lib/fetchAllPages'
import { cn } from '@/lib/utils'
import type { GrammarExercise, GrammarExerciseRequest } from '@/types/api'

const PAGE_SIZE = 20

const bulkPlaceholder = `[
  {
    "lesson_id": "<dán lesson_id>",
    "type": "MULTIPLE_CHOICE",
    "question": "She _______ to school every day.",
    "options": ["go", "goes", "going", "gone"],
    "correct_answer": "goes",
    "explanation": "Ngôi thứ 3 số ít + hiện tại đơn.",
    "order_index": 0,
    "level": 1,
    "xp_reward": 10
  }
]`

export default function AdminGrammarExercisesPage({ params }: { params: { lessonId: string } }) {
  const confirm = useConfirm()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const { data, error, loading, reload } = useApi(
    () => grammarService.listExercisesAdmin(params.lessonId, { page, pageSize: PAGE_SIZE, q: debouncedSearch }),
    [params.lessonId, page, debouncedSearch],
  )
  const [editing, setEditing] = useState<GrammarExercise | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const onEdit = (ex: GrammarExercise) => {
    setEditing(ex)
    setShowForm(true)
    setFormError(null)
  }
  const onCreateNew = () => {
    setEditing(null)
    setShowForm(true)
    setFormError(null)
  }
  const onDelete = async (ex: GrammarExercise) => {
    if (!(await confirm({ description: `Xoá bài tập "${ex.question}"?`, danger: true }))) return
    await grammarService.deleteExercise(ex.id)
    reload()
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const type = String(form.get('type') ?? 'MULTIPLE_CHOICE')
    const optionsRaw = String(form.get('options') ?? '')
    const options =
      type === 'MULTIPLE_CHOICE'
        ? optionsRaw
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined

    const body: GrammarExerciseRequest = {
      lesson_id: params.lessonId,
      type,
      question: String(form.get('question') ?? '').trim(),
      options,
      correct_answer: String(form.get('correct_answer') ?? '').trim(),
      explanation: String(form.get('explanation') ?? '').trim() || undefined,
      order_index: Number(form.get('order_index')),
      level: Number(form.get('level')),
      hint: String(form.get('hint') ?? '').trim() || undefined,
      xp_reward: Number(form.get('xp_reward')),
    }

    setSaving(true)
    setFormError(null)
    try {
      if (editing) await grammarService.updateExercise(editing.id, body)
      else await grammarService.createExercise(body)
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
      <Link href="/admin/grammar" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600">
        ← Danh sách bài học
      </Link>
      <PageHeader
        title="Bài tập ngữ pháp"
        description="Trắc nghiệm (MULTIPLE_CHOICE) hoặc điền từ (FILL_BLANK) cho bài học này."
        action={
          !showForm && (
            <div className="flex gap-2">
              <ExportButton<GrammarExercise>
                fetchAll={() =>
                  fetchAllPages((p, ps) => grammarService.listExercisesAdmin(params.lessonId, { page: p, pageSize: ps, q: debouncedSearch }))
                }
                filename="grammar-exercises.json"
              />
              <Button onClick={onCreateNew}>+ Tạo bài tập</Button>
            </div>
          )
        }
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
          className={cn(inputClass, 'max-w-xs')}
        />
      </label>

      {showForm && (
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900">{editing ? 'Sửa bài tập' : 'Tạo bài tập mới'}</h3>
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Dạng bài
              <select name="type" defaultValue={editing?.type ?? 'MULTIPLE_CHOICE'} className={inputClass}>
                <option value="MULTIPLE_CHOICE">Trắc nghiệm (MULTIPLE_CHOICE)</option>
                <option value="FILL_BLANK">Điền từ (FILL_BLANK)</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Câu hỏi
              <input name="question" type="text" required defaultValue={editing?.question} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Lựa chọn (mỗi dòng 1 lựa chọn — chỉ cần nếu là trắc nghiệm)
              <textarea name="options" rows={4} defaultValue={editing?.options?.join('\n')} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Đáp án đúng
              <input name="correct_answer" type="text" required defaultValue={editing?.correct_answer} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Giải thích
              <input name="explanation" type="text" defaultValue={editing?.explanation} className={inputClass} />
            </label>
            <div className="grid grid-cols-3 gap-4">
              <label className="block text-sm font-medium text-slate-700">
                Độ khó (1-4)
                <input name="level" type="number" min={1} max={4} defaultValue={1} className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Thứ tự
                <input name="order_index" type="number" defaultValue={editing?.order_index ?? 0} className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                XP thưởng
                <input name="xp_reward" type="number" defaultValue={10} className={inputClass} />
              </label>
            </div>
            <label className="block text-sm font-medium text-slate-700">
              Gợi ý (tuỳ chọn)
              <input name="hint" type="text" className={inputClass} />
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
      {data && data.items.length === 0 && <EmptyState title="Chưa có bài tập nào" icon="✏️" />}

      {data && data.items.length > 0 && (
        <Card className="mb-2 p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {data.items.map((ex) => (
              <li key={ex.id} className={cn('flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6')}>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{ex.question}</p>
                  <p className="truncate text-sm text-slate-500">
                    {ex.type} · đáp án: {ex.correct_answer}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => onEdit(ex)}>
                  Sửa
                </Button>
                <Button variant="danger" size="sm" onClick={() => onDelete(ex)}>
                  Xoá
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />}
      <div className="mb-6" />

      <BulkImportPanel<GrammarExerciseRequest>
        onImport={(items) => grammarService.bulkImportExercises(items.map((i) => ({ ...i, lesson_id: i.lesson_id || params.lessonId })))}
        placeholder={bulkPlaceholder}
        onDone={reload}
      />
    </>
  )
}
