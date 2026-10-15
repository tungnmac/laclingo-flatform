'use client'

import { useState, type FormEvent } from 'react'
import { BulkImportPanel } from '@/components/admin/BulkImportPanel'
import { ExportButton } from '@/components/admin/ExportButton'
import { IconPickerInput } from '@/components/admin/IconPickerInput'
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
import { useTranslation } from '@/hooks/useTranslation'
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
  const t = useTranslation()
  const allTopicsApi = useApi(
    () => vocabularyService.listTopicsAdmin(languageId, { page: 1, pageSize: ALL_TOPICS_PAGE_SIZE }),
    [languageId],
  )

  return (
    <>
      <PageHeader title={t.adminVocabulary.pageTitle} description={t.adminVocabulary.pageDesc} />

      <label className="mb-6 block text-sm font-medium text-slate-700">
        {t.adminCommon.languageLabel}
        <select value={languageId} onChange={(e) => setLanguageId(e.target.value)} className={cn(inputClass, 'max-w-xs')}>
          <option value="en">🇬🇧 English</option>
          <option value="zh">🇨🇳 中文</option>
        </select>
      </label>

      <Tabs<VocabTab>
        tabs={[
          { id: 'words', label: t.adminVocabulary.tabWords },
          { id: 'topics', label: t.adminVocabulary.tabTopics },
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
  const t = useTranslation()
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

  const onDelete = async (topic: VocabularyTopicAdmin) => {
    const hasChildren = childrenOf(topic.name).length > 0
    const warning = hasChildren ? t.adminVocabulary.deleteTopicWarningHasChildren : ''
    if (!(await confirm({ description: t.adminVocabulary.deleteTopicConfirm(topic.name, warning), danger: true }))) return
    await vocabularyService.deleteTopic(topic.language_id, topic.name)
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

  const renderRow = (topic: VocabularyTopicAdmin, isChild: boolean) => (
    <li key={topic.name} className={cn('flex items-center gap-3 px-4 py-2.5 sm:px-6', isChild && 'bg-slate-50 pl-10 sm:pl-12')}>
      {isChild && <span className="text-slate-300">↳</span>}
      <span className="text-xl">{topic.icon}</span>
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{topic.name}</p>
      <div className="flex shrink-0 gap-2">
        <Button variant="secondary" size="sm" onClick={() => onEdit(topic)}>
          {t.adminCommon.editBtn}
        </Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(topic)}>
          {t.adminCommon.deleteBtn}
        </Button>
      </div>
    </li>
  )

  return (
    <section className="mb-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{t.adminVocabulary.topicsTitle}</h2>
        {!showForm && (
          <div className="flex gap-2">
            <ExportButton<VocabularyTopicAdmin>
              fetchAll={() => fetchAllPages((p, ps) => vocabularyService.listTopicsAdmin(languageId, { page: p, pageSize: ps, q: debouncedSearch }))}
              filename={`vocabulary-topics-${languageId}.json`}
            />
            <Button size="sm" onClick={onCreateNew}>
              {t.adminVocabulary.addTopicBtn}
            </Button>
          </div>
        )}
      </div>

      <label className="block text-sm font-medium text-slate-700">
        {t.adminCommon.searchLabel}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.adminVocabulary.topicSearchPlaceholder}
          className={cn(inputClass, 'max-w-xs')}
        />
      </label>

      {showForm && (
        <Card>
          <h3 className="mb-3 text-base font-semibold text-slate-900">
            {editing ? t.adminVocabulary.editTopicTitle(editing.name) : t.adminVocabulary.addTopicTitle}
          </h3>
          <form key={editing?.name ?? '__new__'} onSubmit={onSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              {t.adminVocabulary.topicNameLabel}
              {editing ? (
                <p className="mt-1 text-sm text-slate-900">{t.adminVocabulary.topicNameImmutable(editing.name)}</p>
              ) : (
                <input name="name" type="text" required className={inputClass} placeholder={t.adminVocabulary.topicNamePlaceholder} />
              )}
            </label>
            <TopicParentAndOrderFields editing={editing} parentOptions={parentOptions} allTopics={allTopics} />
            {formError && (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
                {formError}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? t.adminCommon.savingBtn : t.adminCommon.saveBtn}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false)
                  setEditing(null)
                }}
              >
                {t.adminCommon.cancelBtn}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {allTopics.length === 0 && <EmptyState title={t.adminVocabulary.emptyTopics} icon="🗂️" />}
      {topLevel.length === 0 && allTopics.length > 0 && <EmptyState title={t.adminVocabulary.emptyTopicsSearch} icon="🔍" />}

      {topLevel.length > 0 && (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {topLevel.map((topic) => {
              const children = childrenOf(topic.name)
              const hasChildren = children.length > 0
              const isOpen = openParents.has(topic.name) || (query !== '' && children.some((c) => matchesQuery(c.name)))
              return (
                <div key={topic.name}>
                  <li className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => toggleOpen(topic.name)}
                        className="shrink-0 text-slate-400 transition-transform hover:text-slate-600"
                        aria-label={isOpen ? t.adminVocabulary.collapseChildren : t.adminVocabulary.expandChildren}
                      >
                        <span className={cn('inline-block transition-transform', isOpen && 'rotate-90')}>▸</span>
                      </button>
                    ) : (
                      <span className="w-4 shrink-0" />
                    )}
                    <span className="text-xl">{topic.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">{topic.name}</p>
                      {hasChildren && <p className="text-xs text-slate-400">{t.adminVocabulary.childCount(children.length)}</p>}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="secondary" size="sm" onClick={() => onEdit(topic)}>
                        {t.adminCommon.editBtn}
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => onDelete(topic)}>
                        {t.adminCommon.deleteBtn}
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

/** Chủ đề cha + icon + thứ tự hiển thị. Thứ tự mặc định khi TẠO MỚI tự tính
 * = số chủ đề đang có ở CÙNG CẤP (cùng parent_name, hoặc cùng là cấp cao
 * nhất nếu không chọn cha) — đổi chủ đề cha thì tính lại ngay. Khi SỬA thì
 * giữ nguyên thứ tự hiện tại của chủ đề đó làm mặc định, không tự tính lại.
 * Trùng thứ tự với chủ đề khác không phải lỗi — chỉ là gợi ý hiển thị, trùng
 * thì các chủ đề đó được sắp xen theo tên (ORDER BY order_index, name). */
function TopicParentAndOrderFields({
  editing,
  parentOptions,
  allTopics,
}: {
  editing: VocabularyTopicAdmin | null
  parentOptions: VocabularyTopicAdmin[]
  allTopics: VocabularyTopicAdmin[]
}) {
  const [parentName, setParentName] = useState(editing?.parent_name ?? '')
  const t = useTranslation()

  const siblingCount = allTopics.filter((x) => (x.parent_name ?? '') === parentName && x.name !== editing?.name).length
  const defaultOrder = editing ? editing.order_index : siblingCount

  return (
    <>
      <label className="block text-sm font-medium text-slate-700">
        {t.adminVocabulary.parentLabel}
        <select name="parent_name" value={parentName} onChange={(e) => setParentName(e.target.value)} className={inputClass}>
          <option value="">{t.adminVocabulary.noParentOption}</option>
          {parentOptions.map((p) => (
            <option key={p.name} value={p.name}>
              {p.icon} {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm font-medium text-slate-700">
          {t.adminVocabulary.iconLabel}
          <IconPickerInput name="icon" defaultValue={editing?.icon ?? '📘'} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t.adminVocabulary.orderIndexLabel}
          <input key={parentName} name="order_index" type="number" defaultValue={defaultOrder} className={inputClass} />
        </label>
      </div>
    </>
  )
}

function VocabularySection({ languageId, topics }: { languageId: string; topics: VocabularyTopicAdmin[] }) {
  const confirm = useConfirm()
  const t = useTranslation()
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
    if (!(await confirm({ description: t.adminVocabulary.deleteWordConfirm(v.term), danger: true }))) return
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
        <h2 className="text-lg font-semibold text-slate-900">{t.adminVocabulary.wordsTitle}</h2>
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
              {t.adminVocabulary.addWordBtn}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="block text-sm font-medium text-slate-700">
          {t.adminCommon.searchLabel}
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder={t.adminVocabulary.wordSearchPlaceholder}
            className={cn(inputClass, 'max-w-xs')}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t.adminVocabulary.topicFilterLabel}
          <input
            type="text"
            list="vocab-topic-filter-options"
            value={topicFilter}
            onChange={(e) => {
              setTopicFilter(e.target.value)
              setPage(1)
            }}
            placeholder={t.adminVocabulary.topicFilterPlaceholder}
            className={cn(inputClass, 'max-w-xs')}
          />
          <datalist id="vocab-topic-filter-options">
            {topics.map((topic) => (
              <option key={topic.name} value={topic.name} />
            ))}
          </datalist>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t.adminVocabulary.levelFilterLabel}
          <select
            value={levelFilter}
            onChange={(e) => {
              setLevelFilter(e.target.value)
              setPage(1)
            }}
            className={cn(inputClass, 'max-w-[8rem]')}
          >
            <option value="">{t.adminCommon.allLabel}</option>
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
          <h3 className="text-base font-semibold text-slate-900">
            {editing ? t.adminVocabulary.editWordTitle(editing.term) : t.adminVocabulary.addWordTitle}
          </h3>
          <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              {t.adminVocabulary.termLabel}
              <input name="term" type="text" required defaultValue={editing?.term} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t.adminVocabulary.phoneticLabel}
              <input name="phonetic" type="text" defaultValue={editing?.phonetic} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              {t.adminVocabulary.meaningLabel}
              <input name="meaning" type="text" required defaultValue={editing?.meaning} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              {t.adminVocabulary.exampleLabel}
              <input name="example" type="text" defaultValue={editing?.example} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t.adminVocabulary.topicFilterLabel}
              <input name="topic" type="text" defaultValue={editing?.topic} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t.adminVocabulary.levelFilterLabel}
              <input name="level" type="text" defaultValue={editing?.level ?? 'A1'} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t.adminVocabulary.illustrationEmojiLabel}
              <IconPickerInput name="image_emoji" defaultValue={editing?.image_emoji ?? ''} />
            </label>

            {formError && (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200 sm:col-span-2">
                {formError}
              </p>
            )}

            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? t.adminCommon.savingBtn : t.adminCommon.saveBtn}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                {t.adminCommon.cancelBtn}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title={t.adminVocabulary.emptyWords} icon="📚" />}

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
                    {t.adminCommon.editBtn}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => onDelete(v)}>
                    {t.adminCommon.deleteBtn}
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
