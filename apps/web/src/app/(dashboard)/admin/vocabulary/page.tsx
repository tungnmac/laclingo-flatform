'use client'

import { useState, type FormEvent } from 'react'
import { BulkImportPanel } from '@/components/admin/BulkImportPanel'
import { ExportButton } from '@/components/admin/ExportButton'
import { IconPickerInput, TOPIC_ICON_OPTIONS, WORD_EMOJI_OPTIONS } from '@/components/admin/IconPickerInput'
import { Pagination } from '@/components/admin/Pagination'
import { Tabs } from '@/components/admin/Tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { inputClass } from '@/features/auth/components/AuthForm'
import { CEFR_LEVELS, LevelBadge } from '@/features/grammar/components/LevelBadge'
import { vocabularyService } from '@/features/vocabulary/vocabulary.service'
import { useApi } from '@/hooks/useApi'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { fetchAllPages } from '@/lib/fetchAllPages'
import { cn } from '@/lib/utils'
import type { VocabularyAdmin, VocabularyRequest, VocabularyTopicAdmin, VocabularyTopicRequest } from '@/types/api'

const PAGE_SIZE = 20
// Dropdown/datalist "chủ đề" ở filter cần THẤY HẾT chủ đề, không bị cắt bởi
// phân trang của tab Chủ đề — tách riêng 1 call page_size lớn (giống trang Ngữ pháp).
const ALL_TOPICS_PAGE_SIZE = 100

const vocabBulkPlaceholder = `[
  { "language_id": "en", "term": "apple", "phonetic": "ˈæp.əl", "meaning": "quả táo", "example": "I eat an apple every day.", "topic": "Đồ ăn & Thức uống", "level": "A1" }
]`

const topicBulkPlaceholder = `[
  { "language_id": "en", "name": "Đồ ăn & Thức uống", "icon": "🍜", "order_index": 0 }
]`

type VocabTab = 'topics' | 'words'

export default function AdminVocabularyPage() {
  const [languageId, setLanguageId] = useState('en')
  const [tab, setTab] = useState<VocabTab>('words')
  const allTopicsApi = useApi(
    () => vocabularyService.listTopicsAdmin(languageId, { page: 1, pageSize: ALL_TOPICS_PAGE_SIZE }),
    [languageId],
  )

  return (
    <>
      <PageHeader title="Từ vựng" description="Quản lý từ vựng và chủ đề từ vựng theo ngôn ngữ." />

      <label className="mb-6 block text-sm font-medium text-slate-700">
        Ngôn ngữ
        <select value={languageId} onChange={(e) => setLanguageId(e.target.value)} className={cn(inputClass, 'max-w-xs')}>
          <option value="en">🇬🇧 English</option>
          <option value="zh">🇨🇳 中文</option>
        </select>
      </label>

      <Tabs<VocabTab>
        tabs={[
          { id: 'words', label: '📚 Từ vựng' },
          { id: 'topics', label: '🗂️ Chủ đề' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'topics' && (
        <TopicsSection languageId={languageId} allTopics={allTopicsApi.data?.items ?? []} onChanged={allTopicsApi.reload} />
      )}
      {tab === 'words' && <VocabularySection languageId={languageId} topics={allTopicsApi.data?.items ?? []} />}
    </>
  )
}

function TopicsSection({
  languageId,
  allTopics,
  onChanged,
}: {
  languageId: string
  allTopics: VocabularyTopicAdmin[]
  onChanged: () => void
}) {
  const confirm = useConfirm()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<VocabularyTopicAdmin | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  // Chủ đề cha nào đang mở dropdown xem các chủ đề con (theo tên).
  const [openParents, setOpenParents] = useState<Set<string>>(new Set())

  // Chỉ chủ đề CẤP CAO NHẤT mới được chọn làm cha (tối đa lồng 2 cấp — backend
  // cũng tự chặn lại nếu chọn 1 chủ đề đã có con khác, hoặc đã là con). Khi
  // sửa, loại chính nó ra khỏi danh sách (không thể tự làm cha của mình).
  const parentOptions = allTopics.filter((t) => !t.parent_name && t.name !== editing?.name)

  const childrenOf = (parentName: string) => allTopics.filter((t) => t.parent_name === parentName)

  const toggleOpen = (name: string) => {
    setOpenParents((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const query = debouncedSearch.trim().toLowerCase()
  const matchesQuery = (name: string) => !query || name.toLowerCase().includes(query)
  const topLevel = allTopics
    .filter((t) => !t.parent_name)
    .filter((t) => matchesQuery(t.name) || childrenOf(t.name).some((c) => matchesQuery(c.name)))

  const reloadAll = () => {
    onChanged()
  }

  const onCreateNew = () => {
    setEditing(null)
    setFormError(null)
    setShowForm(true)
  }

  const onEdit = (t: VocabularyTopicAdmin) => {
    setEditing(t)
    setFormError(null)
    setShowForm(true)
  }

  const onDelete = async (t: VocabularyTopicAdmin) => {
    const hasChildren = childrenOf(t.name).length > 0
    const warning = hasChildren
      ? ` Chủ đề này đang có chủ đề con — xoá sẽ xoá CẢ metadata của các chủ đề con đó (từ vựng vẫn giữ nguyên).`
      : ''
    if (!(await confirm({ description: `Xoá chủ đề "${t.name}"? Từ vựng đang gắn chủ đề này vẫn giữ nguyên, chỉ mất icon/thứ tự hiển thị riêng.${warning}`, danger: true })))
      return
    await vocabularyService.deleteTopic(t.language_id, t.name)
    reloadAll()
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body: VocabularyTopicRequest = {
      language_id: languageId,
      name: editing ? editing.name : String(form.get('name') ?? '').trim(),
      icon: String(form.get('icon') ?? '📘').trim() || '📘',
      order_index: Number(form.get('order_index')),
      parent_name: String(form.get('parent_name') ?? '').trim() || null,
    }
    setSaving(true)
    setFormError(null)
    try {
      await vocabularyService.createOrUpdateTopic(body)
      setShowForm(false)
      setEditing(null)
      reloadAll()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const renderRow = (t: VocabularyTopicAdmin, isChild: boolean) => (
    <li key={t.name} className={cn('flex items-center gap-3 px-4 py-2.5 sm:px-6', isChild && 'bg-slate-50 pl-10 sm:pl-12')}>
      {isChild && <span className="text-slate-300">↳</span>}
      <span className="text-xl">{t.icon}</span>
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{t.name}</p>
      <div className="flex shrink-0 gap-2">
        <Button variant="secondary" size="sm" onClick={() => onEdit(t)}>
          Sửa
        </Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(t)}>
          Xoá
        </Button>
      </div>
    </li>
  )

  return (
    <section className="mb-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">🗂️ Chủ đề</h2>
        {!showForm && (
          <div className="flex gap-2">
            <ExportButton<VocabularyTopicAdmin>
              fetchAll={() => fetchAllPages((p, ps) => vocabularyService.listTopicsAdmin(languageId, { page: p, pageSize: ps, q: debouncedSearch }))}
              filename={`vocabulary-topics-${languageId}.json`}
            />
            <Button size="sm" onClick={onCreateNew}>
              + Thêm chủ đề
            </Button>
          </div>
        )}
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Tìm kiếm
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên chủ đề (cả chủ đề cha và con)..."
          className={cn(inputClass, 'max-w-xs')}
        />
      </label>

      {showForm && (
        <Card>
          <h3 className="mb-3 text-base font-semibold text-slate-900">{editing ? `Sửa: ${editing.name}` : 'Thêm chủ đề mới'}</h3>
          <form key={editing?.name ?? '__new__'} onSubmit={onSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Tên chủ đề
              {editing ? (
                <p className="mt-1 text-sm text-slate-900">{editing.name} (không thể đổi tên khi sửa)</p>
              ) : (
                <input name="name" type="text" required className={inputClass} placeholder="Công nghệ thông tin" />
              )}
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Chủ đề cha (để trống = chủ đề cấp cao nhất)
              <select name="parent_name" defaultValue={editing?.parent_name ?? ''} className={inputClass}>
                <option value="">— Không có, đây là chủ đề cấp cao nhất —</option>
                {parentOptions.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.icon} {p.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-slate-700">
                Icon (emoji)
                <IconPickerInput name="icon" defaultValue={editing?.icon ?? '📘'} options={TOPIC_ICON_OPTIONS} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Thứ tự hiển thị
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
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false)
                  setEditing(null)
                }}
              >
                Hủy
              </Button>
            </div>
          </form>
        </Card>
      )}

      {allTopics.length === 0 && <EmptyState title="Chưa có chủ đề nào" icon="🗂️" />}
      {topLevel.length === 0 && allTopics.length > 0 && <EmptyState title="Không tìm thấy chủ đề nào" icon="🔍" />}

      {topLevel.length > 0 && (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {topLevel.map((t) => {
              const children = childrenOf(t.name)
              const hasChildren = children.length > 0
              const isOpen = openParents.has(t.name) || (query !== '' && children.some((c) => matchesQuery(c.name)))
              return (
                <div key={t.name}>
                  <li className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => toggleOpen(t.name)}
                        className="shrink-0 text-slate-400 transition-transform hover:text-slate-600"
                        aria-label={isOpen ? 'Thu gọn chủ đề con' : 'Xem chủ đề con'}
                      >
                        <span className={cn('inline-block transition-transform', isOpen && 'rotate-90')}>▸</span>
                      </button>
                    ) : (
                      <span className="w-4 shrink-0" />
                    )}
                    <span className="text-xl">{t.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">{t.name}</p>
                      {hasChildren && <p className="text-xs text-slate-400">{children.length} chủ đề con</p>}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="secondary" size="sm" onClick={() => onEdit(t)}>
                        Sửa
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => onDelete(t)}>
                        Xoá
                      </Button>
                    </div>
                  </li>
                  {hasChildren && isOpen && <ul className="divide-y divide-slate-100">{children.map((c) => renderRow(c, true))}</ul>}
                </div>
              )
            })}
          </ul>
        </Card>
      )}

      <BulkImportPanel<VocabularyTopicRequest>
        onImport={(items) => vocabularyService.bulkImportTopics(items.map((i) => ({ ...i, language_id: i.language_id || languageId })))}
        placeholder={topicBulkPlaceholder}
        onDone={reloadAll}
      />
    </section>
  )
}

function VocabularySection({ languageId, topics }: { languageId: string; topics: VocabularyTopicAdmin[] }) {
  const confirm = useConfirm()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [topicFilter, setTopicFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const { data, error, loading, reload } = useApi(
    () =>
      vocabularyService.listVocabulariesAdmin(languageId, {
        page,
        pageSize: PAGE_SIZE,
        q: debouncedSearch,
        topic: topicFilter,
        level: levelFilter,
      }),
    [languageId, page, debouncedSearch, topicFilter, levelFilter],
  )
  const [editing, setEditing] = useState<VocabularyAdmin | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const onEdit = (v: VocabularyAdmin) => {
    setEditing(v)
    setShowForm(true)
    setFormError(null)
  }

  const onCreateNew = () => {
    setEditing(null)
    setShowForm(true)
    setFormError(null)
  }

  const onDelete = async (v: VocabularyAdmin) => {
    if (!(await confirm({ description: `Xoá từ "${v.term}"?`, danger: true }))) return
    await vocabularyService.deleteVocabulary(v.id)
    reload()
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body: VocabularyRequest = {
      language_id: languageId,
      term: String(form.get('term') ?? '').trim(),
      phonetic: String(form.get('phonetic') ?? '').trim() || undefined,
      meaning: String(form.get('meaning') ?? '').trim(),
      example: String(form.get('example') ?? '').trim() || undefined,
      topic: String(form.get('topic') ?? '').trim() || undefined,
      level: String(form.get('level') ?? 'A1'),
      image_emoji: String(form.get('image_emoji') ?? '').trim() || undefined,
    }

    setSaving(true)
    setFormError(null)
    try {
      if (editing) await vocabularyService.updateVocabulary(editing.id, body)
      else await vocabularyService.createVocabulary(body)
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
        <h2 className="text-lg font-semibold text-slate-900">📚 Từ vựng</h2>
        {!showForm && (
          <div className="flex gap-2">
            <ExportButton<VocabularyAdmin>
              fetchAll={() =>
                fetchAllPages((p, ps) =>
                  vocabularyService.listVocabulariesAdmin(languageId, {
                    page: p,
                    pageSize: ps,
                    q: debouncedSearch,
                    topic: topicFilter,
                    level: levelFilter,
                  }),
                )
              }
              filename={`vocabulary-${languageId}.json`}
            />
            <Button size="sm" onClick={onCreateNew}>
              + Thêm từ
            </Button>
          </div>
        )}
      </div>

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
            placeholder="Tìm theo từ/nghĩa..."
            className={cn(inputClass, 'max-w-xs')}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Chủ đề
          <input
            type="text"
            list="vocab-topic-filter-options"
            value={topicFilter}
            onChange={(e) => {
              setTopicFilter(e.target.value)
              setPage(1)
            }}
            placeholder="Gõ để tìm hoặc chọn chủ đề..."
            className={cn(inputClass, 'max-w-xs')}
          />
          <datalist id="vocab-topic-filter-options">
            {topics.map((t) => (
              <option key={t.name} value={t.name} />
            ))}
          </datalist>
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
          <h3 className="text-base font-semibold text-slate-900">{editing ? `Sửa: ${editing.term}` : 'Thêm từ mới'}</h3>
          <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Từ
              <input name="term" type="text" required defaultValue={editing?.term} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Phiên âm
              <input name="phonetic" type="text" defaultValue={editing?.phonetic} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              Nghĩa
              <input name="meaning" type="text" required defaultValue={editing?.meaning} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              Ví dụ
              <input name="example" type="text" defaultValue={editing?.example} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Chủ đề
              <input name="topic" type="text" defaultValue={editing?.topic} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Cấp độ
              <input name="level" type="text" defaultValue={editing?.level ?? 'A1'} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Emoji minh họa
              <IconPickerInput name="image_emoji" defaultValue={editing?.image_emoji ?? ''} options={WORD_EMOJI_OPTIONS} />
            </label>

            {formError && (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200 sm:col-span-2">
                {formError}
              </p>
            )}

            <div className="flex gap-2 sm:col-span-2">
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
      {data && data.items.length === 0 && <EmptyState title="Chưa có từ vựng nào" icon="📚" />}

      {data && data.items.length > 0 && (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {data.items.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 sm:px-6">
                <span className="text-xl">{v.image_emoji || '📘'}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {v.term} {v.phonetic && <span className="font-normal text-slate-400">/{v.phonetic}/</span>}
                  </p>
                  <p className="truncate text-sm text-slate-500">
                    {v.meaning}
                    {v.topic && ` · ${v.topic}`}
                  </p>
                </div>
                <LevelBadge level={v.level} />
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => onEdit(v)}>
                    Sửa
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => onDelete(v)}>
                    Xoá
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />}

      <BulkImportPanel<VocabularyRequest>
        onImport={(items) => vocabularyService.bulkImportVocabularies(items.map((i) => ({ ...i, language_id: i.language_id || languageId })))}
        placeholder={vocabBulkPlaceholder}
        onDone={reload}
      />
    </section>
  )
}
