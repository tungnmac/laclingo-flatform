'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { BulkImportPanel } from '@/components/admin/BulkImportPanel'
import { ExportButton } from '@/components/admin/ExportButton'
import { Pagination } from '@/components/admin/Pagination'
import { Tabs } from '@/components/admin/Tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { inputClass } from '@/features/auth/components/AuthForm'
import { grammarService } from '@/features/grammar/grammar.service'
import { CEFR_LEVELS, LevelBadge } from '@/features/grammar/components/LevelBadge'
import { useApi } from '@/hooks/useApi'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { fetchAllPages } from '@/lib/fetchAllPages'
import { cn } from '@/lib/utils'
import type { GrammarLessonAdmin, GrammarLessonRequest, GrammarTopicAdmin, GrammarTopicRequest } from '@/types/api'

const PAGE_SIZE = 20
// Dropdown "chọn chủ đề" lúc tạo bài học cần THẤY HẾT chủ đề, không bị cắt bởi
// phân trang của khối hiển thị — tách riêng 1 call page_size lớn (chủ đề ngữ
// pháp vốn ít, một ngôn ngữ hiếm khi vượt 100).
const ALL_TOPICS_PAGE_SIZE = 100

const topicBulkPlaceholder = `[
  { "language_id": "en", "code": "future_tenses", "title": "Các thì tương lai", "description": "...", "order_index": 2 }
]`

const lessonBulkPlaceholder = `[
  {
    "topic_id": "<dán topic_id ở danh sách chủ đề trên>",
    "code": "future_simple",
    "title": "Thì Tương Lai Đơn (Future Simple)",
    "level": "A1",
    "order_index": 0,
    "content": { "summary": "...", "formulas": [], "signals": ["tomorrow", "next week"] }
  }
]`

type GrammarTab = 'topics' | 'lessons'

export default function AdminGrammarPage() {
  const [languageId, setLanguageId] = useState('en')
  const [tab, setTab] = useState<GrammarTab>('lessons')
  const allTopicsApi = useApi(
    () => grammarService.listTopicsAdmin(languageId, { page: 1, pageSize: ALL_TOPICS_PAGE_SIZE }),
    [languageId],
  )

  return (
    <>
      <PageHeader title="Ngữ pháp" description="Quản lý chủ đề, bài học, bài tập ngữ pháp." />

      <label className="mb-6 block text-sm font-medium text-slate-700">
        Ngôn ngữ
        <select value={languageId} onChange={(e) => setLanguageId(e.target.value)} className={cn(inputClass, 'max-w-xs')}>
          <option value="en">🇬🇧 English</option>
          <option value="zh">🇨🇳 中文</option>
        </select>
      </label>

      <Tabs<GrammarTab>
        tabs={[
          { id: 'lessons', label: '📖 Bài học' },
          { id: 'topics', label: '🗂️ Chủ đề' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'topics' && <TopicsSection languageId={languageId} onChanged={allTopicsApi.reload} />}
      {tab === 'lessons' && <LessonsSection languageId={languageId} topics={allTopicsApi.data?.items ?? []} />}
    </>
  )
}

function TopicsSection({ languageId, onChanged }: { languageId: string; onChanged: () => void }) {
  const confirm = useConfirm()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const { data, error, loading, reload } = useApi(
    () => grammarService.listTopicsAdmin(languageId, { page, pageSize: PAGE_SIZE, q: debouncedSearch }),
    [languageId, page, debouncedSearch],
  )
  const [editing, setEditing] = useState<GrammarTopicAdmin | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const reloadAll = () => {
    reload()
    onChanged()
  }

  const onEdit = (t: GrammarTopicAdmin) => {
    setEditing(t)
    setShowForm(true)
    setFormError(null)
  }
  const onCreateNew = () => {
    setEditing(null)
    setShowForm(true)
    setFormError(null)
  }
  const onDelete = async (t: GrammarTopicAdmin) => {
    if (!(await confirm({ description: `Xoá chủ đề "${t.title}"? Toàn bộ bài học + bài tập bên trong sẽ bị xoá theo.`, danger: true }))) return
    await grammarService.deleteTopic(t.id)
    reloadAll()
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body: GrammarTopicRequest = {
      language_id: languageId,
      code: String(form.get('code') ?? '').trim(),
      title: String(form.get('title') ?? '').trim(),
      description: String(form.get('description') ?? '').trim() || undefined,
      order_index: Number(form.get('order_index')),
    }
    setSaving(true)
    setFormError(null)
    try {
      if (editing) await grammarService.updateTopic(editing.id, body)
      else await grammarService.createTopic(body)
      setShowForm(false)
      setEditing(null)
      reloadAll()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mb-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">🗂️ Chủ đề</h2>
        {!showForm && (
          <div className="flex gap-2">
            <ExportButton<GrammarTopicAdmin>
              fetchAll={() => fetchAllPages((p, ps) => grammarService.listTopicsAdmin(languageId, { page: p, pageSize: ps, q: debouncedSearch }))}
              filename={`grammar-topics-${languageId}.json`}
            />
            <Button size="sm" onClick={onCreateNew}>
              + Tạo chủ đề
            </Button>
          </div>
        )}
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Tìm kiếm
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Tìm theo tiêu đề/mã chủ đề..."
          className={cn(inputClass, 'max-w-xs')}
        />
      </label>

      {showForm && (
        <Card>
          <h3 className="text-base font-semibold text-slate-900">{editing ? `Sửa: ${editing.title}` : 'Tạo chủ đề mới'}</h3>
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Mã chủ đề (duy nhất, không đổi được sau khi tạo)
              <input name="code" type="text" required disabled={!!editing} defaultValue={editing?.code} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Tiêu đề
              <input name="title" type="text" required defaultValue={editing?.title} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Mô tả
              <input name="description" type="text" defaultValue={editing?.description} className={inputClass} />
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
      {data && data.items.length === 0 && <EmptyState title="Chưa có chủ đề nào" icon="🗂️" />}

      {data && data.items.length > 0 && (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {data.items.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 sm:px-6">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700">{t.title}</p>
                  <p className="truncate text-xs text-slate-400">
                    {t.code} · id: {t.id}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => onEdit(t)}>
                  Sửa
                </Button>
                <Button variant="danger" size="sm" onClick={() => onDelete(t)}>
                  Xoá
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />}

      <BulkImportPanel<GrammarTopicRequest>
        onImport={(items) => grammarService.bulkImportTopics(items.map((i) => ({ ...i, language_id: i.language_id || languageId })))}
        placeholder={topicBulkPlaceholder}
        onDone={reloadAll}
      />
    </section>
  )
}

function LessonsSection({ languageId, topics }: { languageId: string; topics: GrammarTopicAdmin[] }) {
  const confirm = useConfirm()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [topicFilter, setTopicFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const { data, error, loading, reload } = useApi(
    () => grammarService.listLessonsAdmin(languageId, { page, pageSize: PAGE_SIZE, q: debouncedSearch, topicId: topicFilter, level: levelFilter }),
    [languageId, page, debouncedSearch, topicFilter, levelFilter],
  )
  const [editing, setEditing] = useState<GrammarLessonAdmin | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const topicTitle = (topicId: string) => topics.find((t) => t.id === topicId)?.title ?? topicId

  const onEdit = (l: GrammarLessonAdmin) => {
    setEditing(l)
    setShowForm(true)
    setFormError(null)
  }
  const onCreateNew = () => {
    setEditing(null)
    setShowForm(true)
    setFormError(null)
  }
  const onDelete = async (l: GrammarLessonAdmin) => {
    if (!(await confirm({ description: `Xoá bài học "${l.title}"? Toàn bộ bài tập bên trong sẽ bị xoá theo.`, danger: true }))) return
    await grammarService.deleteLesson(l.id)
    reload()
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    let content
    try {
      content = JSON.parse(String(form.get('content') ?? '{}'))
    } catch {
      setFormError('Nội dung bài học (content) phải là JSON hợp lệ.')
      return
    }
    const body: GrammarLessonRequest = {
      topic_id: editing ? editing.topic_id : String(form.get('topic_id') ?? ''),
      code: String(form.get('code') ?? '').trim(),
      title: String(form.get('title') ?? '').trim(),
      level: String(form.get('level') ?? 'A1'),
      order_index: Number(form.get('order_index')),
      content,
    }

    setSaving(true)
    setFormError(null)
    try {
      if (editing) await grammarService.updateLesson(editing.id, body)
      else await grammarService.createLesson(body)
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
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">📖 Bài học</h2>
        {!showForm && (
          <div className="flex gap-2">
            <ExportButton<GrammarLessonAdmin>
              fetchAll={() =>
                fetchAllPages((p, ps) =>
                  grammarService.listLessonsAdmin(languageId, { page: p, pageSize: ps, q: debouncedSearch, topicId: topicFilter, level: levelFilter }),
                )
              }
              filename={`grammar-lessons-${languageId}.json`}
            />
            <Button size="sm" disabled={topics.length === 0} onClick={onCreateNew}>
              + Tạo bài học
            </Button>
          </div>
        )}
      </div>
      {topics.length === 0 && <p className="text-sm text-slate-500">Tạo chủ đề trước khi thêm bài học.</p>}

      <div className="flex flex-wrap gap-4">
        <label className="block text-sm font-medium text-slate-700">
          Tìm kiếm
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Tìm theo tiêu đề/mã bài học..."
            className={cn(inputClass, 'max-w-xs')}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Chủ đề
          <select
            value={topicFilter}
            onChange={(e) => {
              setTopicFilter(e.target.value)
              setPage(1)
            }}
            className={cn(inputClass, 'max-w-xs')}
          >
            <option value="">Tất cả</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Cấp độ
          <select
            value={levelFilter}
            onChange={(e) => {
              setLevelFilter(e.target.value)
              setPage(1)
            }}
            className={cn(inputClass, 'max-w-[8rem]')}
          >
            <option value="">Tất cả</option>
            {CEFR_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </label>
      </div>

      {showForm && (
        <Card>
          <h3 className="text-base font-semibold text-slate-900">{editing ? `Sửa: ${editing.title}` : 'Tạo bài học mới'}</h3>
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            {!editing && (
              <label className="block text-sm font-medium text-slate-700">
                Chủ đề
                <select name="topic_id" required defaultValue="" className={inputClass}>
                  <option value="" disabled>
                    Chọn chủ đề...
                  </option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block text-sm font-medium text-slate-700">
              Mã bài học (duy nhất, không đổi được sau khi tạo)
              <input name="code" type="text" required disabled={!!editing} defaultValue={editing?.code} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Tiêu đề
              <input name="title" type="text" required defaultValue={editing?.title} className={inputClass} />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-slate-700">
                Cấp độ
                <input name="level" type="text" defaultValue={editing?.level ?? 'A1'} className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Thứ tự
                <input name="order_index" type="number" defaultValue={editing?.order_index ?? 0} className={inputClass} />
              </label>
            </div>
            <label className="block text-sm font-medium text-slate-700">
              Nội dung (JSON — summary/formulas/signals)
              <textarea
                name="content"
                required
                rows={6}
                defaultValue={editing?.content ? JSON.stringify(editing.content, null, 2) : '{\n  "summary": "",\n  "formulas": [],\n  "signals": []\n}'}
                className={cn(inputClass, 'font-mono text-xs')}
              />
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
      {data && data.items.length === 0 && <EmptyState title="Chưa có bài học nào" icon="📖" />}

      {data && data.items.length > 0 && (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {data.items.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 sm:px-6">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700">{l.title}</p>
                  <p className="truncate text-xs text-slate-400">{topicTitle(l.topic_id)}</p>
                </div>
                <LevelBadge level={l.level} />
                <Link href={`/admin/grammar/${l.id}`}>
                  <Button variant="secondary" size="sm">
                    Bài tập
                  </Button>
                </Link>
                <Button variant="secondary" size="sm" onClick={() => onEdit(l)}>
                  Sửa
                </Button>
                <Button variant="danger" size="sm" onClick={() => onDelete(l)}>
                  Xoá
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />}

      <BulkImportPanel<GrammarLessonRequest>
        onImport={(items) => grammarService.bulkImportLessons(items)}
        placeholder={lessonBulkPlaceholder}
        onDone={reload}
      />
    </section>
  )
}
