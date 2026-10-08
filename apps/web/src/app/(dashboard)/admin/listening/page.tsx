'use client'

import Link from 'next/link'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { BulkImportPanel } from '@/components/admin/BulkImportPanel'
import { ExportButton } from '@/components/admin/ExportButton'
import { IconPickerInput } from '@/components/admin/IconPickerInput'
import { Tabs } from '@/components/admin/Tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { inputClass } from '@/features/auth/components/AuthForm'
import { CEFR_LEVELS, LevelBadge } from '@/features/grammar/components/LevelBadge'
import { listeningService } from '@/features/listening/listening.service'
import { useApi } from '@/hooks/useApi'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { fetchAllPages } from '@/lib/fetchAllPages'
import { cn } from '@/lib/utils'
import type { ListeningPassageAdmin, ListeningPassageRequest, ListeningTopicAdmin, ListeningTopicRequest } from '@/types/api'

// Datalist "chủ đề" ở filter cần thấy hết chủ đề, không bị cắt bởi phân trang
// của tab Chủ đề — tách riêng 1 call page_size lớn (giống trang Từ vựng).
const ALL_TOPICS_PAGE_SIZE = 100
// Tab Bài luyện nghe hiện NHÓM theo chủ đề (cần thấy hết để nhóm đúng), nên
// bỏ phân trang thật — lấy 1 lần với page_size lớn, giống cách tab Chủ đề làm.
const ALL_PASSAGES_PAGE_SIZE = 200

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

const topicBulkPlaceholder = `[
  { "language_id": "en", "name": "Daily life", "icon": "🎧", "order_index": 0 }
]`

type ListeningTab = 'passages' | 'topics'

export default function AdminListeningPage() {
  const [languageId, setLanguageId] = useState('en')
  const [tab, setTab] = useState<ListeningTab>('passages')
  const allTopicsApi = useApi(
    () => listeningService.listTopicsAdmin(languageId, { page: 1, pageSize: ALL_TOPICS_PAGE_SIZE }),
    [languageId],
  )

  return (
    <>
      <PageHeader title="Luyện nghe" description="Bài luyện nghe (script đọc bằng TTS), câu hỏi hiểu nội dung, và chủ đề." />

      <label className="mb-4 block text-sm font-medium text-slate-700">
        Ngôn ngữ
        <select value={languageId} onChange={(e) => setLanguageId(e.target.value)} className={cn(inputClass, 'max-w-xs')}>
          <option value="en">🇬🇧 English</option>
          <option value="zh">🇨🇳 中文</option>
        </select>
      </label>

      <Tabs<ListeningTab>
        tabs={[
          { id: 'passages', label: '🎧 Bài luyện nghe' },
          { id: 'topics', label: '🗂️ Chủ đề' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'topics' && (
        <TopicsSection languageId={languageId} allTopics={allTopicsApi.data?.items ?? []} onChanged={allTopicsApi.reload} />
      )}
      {tab === 'passages' && <PassagesSection languageId={languageId} topics={allTopicsApi.data?.items ?? []} />}
    </>
  )
}

function TopicsSection({
  languageId,
  allTopics,
  onChanged,
}: {
  languageId: string
  allTopics: ListeningTopicAdmin[]
  onChanged: () => void
}) {
  const confirm = useConfirm()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ListeningTopicAdmin | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const filtered = allTopics.filter((t) => !debouncedSearch || t.name.toLowerCase().includes(debouncedSearch.toLowerCase()))

  const onCreateNew = () => {
    setEditing(null)
    setFormError(null)
    setShowForm(true)
  }

  const onEdit = (t: ListeningTopicAdmin) => {
    setEditing(t)
    setFormError(null)
    setShowForm(true)
  }

  const onDelete = async (t: ListeningTopicAdmin) => {
    if (!(await confirm({ description: `Xoá chủ đề "${t.name}"? Bài luyện nghe đang gắn chủ đề này vẫn giữ nguyên, chỉ mất icon/thứ tự hiển thị riêng.`, danger: true })))
      return
    await listeningService.deleteTopic(t.language_id, t.name)
    onChanged()
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body: ListeningTopicRequest = {
      language_id: languageId,
      name: editing ? editing.name : String(form.get('name') ?? '').trim(),
      icon: String(form.get('icon') ?? '🎧').trim() || '🎧',
      order_index: editing ? editing.order_index : allTopics.length,
    }
    setSaving(true)
    setFormError(null)
    try {
      await listeningService.createOrUpdateTopic(body)
      setShowForm(false)
      setEditing(null)
      onChanged()
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
            <ExportButton<ListeningTopicAdmin>
              fetchAll={() => fetchAllPages((p, ps) => listeningService.listTopicsAdmin(languageId, { page: p, pageSize: ps, q: debouncedSearch }))}
              filename={`listening-topics-${languageId}.json`}
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
          placeholder="Tìm theo tên chủ đề..."
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
                <input name="name" type="text" required className={inputClass} placeholder="Daily life" />
              )}
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Icon (emoji)
              <IconPickerInput name="icon" defaultValue={editing?.icon ?? '🎧'} />
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
      {filtered.length === 0 && allTopics.length > 0 && <EmptyState title="Không tìm thấy chủ đề nào" icon="🔍" />}

      {filtered.length > 0 && (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {filtered.map((t) => (
              <li key={t.name} className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
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
            ))}
          </ul>
        </Card>
      )}

      <BulkImportPanel<ListeningTopicRequest>
        onImport={(items) => listeningService.bulkImportTopics(items.map((i) => ({ ...i, language_id: i.language_id || languageId })))}
        placeholder={topicBulkPlaceholder}
        onDone={onChanged}
      />
    </section>
  )
}

const NO_TOPIC_GROUP = '__no_topic__'

const ACCEPTED_AUDIO_TYPES = '.mp3,.wav,.ogg,.m4a,.webm,audio/*'

/** Upload/gỡ audio thật cho 1 bài (lưu trên Cloudflare R2) — tách riêng khỏi
 * form JSON chính vì multipart khác hẳn cách submit, chỉ hiện khi đang SỬA
 * (cần passage.id có sẵn để gắn audio vào, bài mới tạo phải lưu trước). */
function AudioUploadControl({ passage, onChanged }: { passage: ListeningPassageAdmin; onChanged: () => void }) {
  const confirm = useConfirm()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputId = `audio-upload-${passage.id}`

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      await listeningService.uploadAudio(passage.id, file)
      onChanged()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const onDelete = async () => {
    if (!(await confirm({ description: `Gỡ audio khỏi "${passage.title}"? Bài sẽ quay lại dùng TTS từ script.`, danger: true }))) return
    setBusy(true)
    setError(null)
    try {
      await listeningService.deleteAudio(passage.id)
      onChanged()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-4">
      <p className="mb-2 text-sm font-medium text-slate-700">Audio thật (tuỳ chọn, thay cho TTS)</p>
      {passage.audio_url ? (
        <div className="space-y-2">
          <audio controls src={passage.audio_url} className="w-full max-w-sm" />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => document.getElementById(inputId)?.click()}>
              {busy ? 'Đang xử lý...' : 'Thay file khác'}
            </Button>
            <Button type="button" variant="danger" size="sm" disabled={busy} onClick={onDelete}>
              Gỡ audio
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => document.getElementById(inputId)?.click()}>
          {busy ? 'Đang upload...' : '📤 Upload audio'}
        </Button>
      )}
      <input id={inputId} type="file" accept={ACCEPTED_AUDIO_TYPES} onChange={onFileChange} className="sr-only" />
      <p className="mt-1 text-xs text-slate-400">mp3/wav/ogg/m4a/webm, tối đa 25MB. Không chọn thì bài dùng giọng đọc TTS từ script.</p>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </div>
  )
}

function PassagesSection({ languageId, topics }: { languageId: string; topics: ListeningTopicAdmin[] }) {
  const confirm = useConfirm()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [topicFilter, setTopicFilter] = useState('')
  const [level, setLevel] = useState('')
  const { data, error, loading, reload } = useApi(
    () => listeningService.listPassagesAdmin(languageId, { page: 1, pageSize: ALL_PASSAGES_PAGE_SIZE, q: debouncedSearch, topic: topicFilter, level }),
    [languageId, debouncedSearch, topicFilter, level],
  )
  const [editing, setEditing] = useState<ListeningPassageAdmin | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  // Nhóm nào đang đóng (mặc định mọi nhóm MỞ — đang quản lý nội dung nên cần
  // thấy hết, khác với trang Users mặc định đóng để gọn danh sách dài).
  const [closedGroups, setClosedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (key: string) => {
    setClosedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Nhóm bài theo chủ đề — thứ tự nhóm theo order_index của topics (chủ đề
  // chưa khai báo icon/thứ tự riêng thì xếp theo tên); nhóm "chưa có chủ đề" luôn ở cuối.
  const topicOrder = new Map(topics.map((t, i) => [t.name, t.order_index ?? i]))
  const groups = new Map<string, ListeningPassageAdmin[]>()
  for (const p of data?.items ?? []) {
    const key = p.topic || NO_TOPIC_GROUP
    const list = groups.get(key) ?? []
    list.push(p)
    groups.set(key, list)
  }
  const groupKeys = [...groups.keys()].sort((a, b) => {
    if (a === NO_TOPIC_GROUP) return 1
    if (b === NO_TOPIC_GROUP) return -1
    return (topicOrder.get(a) ?? 999) - (topicOrder.get(b) ?? 999) || a.localeCompare(b)
  })

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
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">🎧 Bài luyện nghe</h2>
        {!showForm && (
          <div className="flex gap-2">
            <ExportButton<ListeningPassageAdmin>
              fetchAll={() =>
                fetchAllPages((p, ps) =>
                  listeningService.listPassagesAdmin(languageId, { page: p, pageSize: ps, q: debouncedSearch, topic: topicFilter, level }),
                )
              }
              filename={`listening-passages-${languageId}.json`}
            />
            <Button onClick={onCreateNew}>+ Tạo bài</Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="block text-sm font-medium text-slate-700">
          Tìm kiếm
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề/chủ đề..."
            className={cn(inputClass, 'max-w-xs')}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Chủ đề
          <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} className={cn(inputClass, 'max-w-xs')}>
            <option value="">Tất cả</option>
            {topics.map((t) => (
              <option key={t.name} value={t.name}>
                {t.icon} {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Cấp độ
          <select value={level} onChange={(e) => setLevel(e.target.value)} className={cn(inputClass, 'max-w-[8rem]')}>
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

          {editing && <AudioUploadControl key={editing.id} passage={editing} onChanged={reload} />}
        </Card>
      )}

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title="Chưa có bài luyện nghe nào" icon="🎧" />}

      {data &&
        data.items.length > 0 &&
        groupKeys.map((key) => {
          const passages = groups.get(key) ?? []
          const isNoTopic = key === NO_TOPIC_GROUP
          const topicMeta = isNoTopic ? undefined : topics.find((t) => t.name === key)
          const isOpen = !closedGroups.has(key)
          return (
            <div key={key} className="space-y-2">
              <button
                type="button"
                onClick={() => toggleGroup(key)}
                className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-slate-50"
              >
                <span className={cn('text-slate-400 transition-transform', isOpen && 'rotate-90')} aria-hidden>
                  ▸
                </span>
                <span className="text-lg">{isNoTopic ? '📄' : topicMeta?.icon ?? '🎧'}</span>
                <h3 className="font-semibold text-slate-800">{isNoTopic ? 'Chưa có chủ đề' : key}</h3>
                <span className="text-sm text-slate-400">{passages.length} bài</span>
              </button>

              {isOpen && (
                <Card className="p-0 sm:p-0">
                  <ul className="divide-y divide-slate-100">
                    {passages.map((p) => (
                      <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
                        <p className="min-w-0 flex-1 truncate font-semibold text-slate-900">{p.title}</p>
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
            </div>
          )
        })}

      <BulkImportPanel<ListeningPassageRequest>
        onImport={(items) => listeningService.bulkImportPassages(items.map((i) => ({ ...i, language_id: i.language_id || languageId })))}
        placeholder={bulkPlaceholder}
        onDone={reload}
      />
    </section>
  )
}
