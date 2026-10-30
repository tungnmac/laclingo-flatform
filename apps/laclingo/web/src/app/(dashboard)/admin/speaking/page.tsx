'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Pagination } from '@/components/admin/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { useToast } from '@/components/ui/ToastProvider'
import { inputClass } from '@/features/auth/components/AuthForm'
import { LevelBadge } from '@/features/grammar/components/LevelBadge'
import { speakingService } from '@/features/speaking/speaking.service'
import { useApi } from '@/hooks/useApi'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTranslation } from '@/hooks/useTranslation'
import { levelOptions, levelScale } from '@/lib/levels'
import { cn } from '@/lib/utils'
import type { SpeakingItemAdmin, SpeakingItemRequest, SpeakingKind, SpeakingTopicAdmin } from '@/types/api'
import { LanguageOptions } from '@/features/course/components/LanguageOptions'

const PAGE_SIZE = 20

/** Admin: chủ đề + câu luyện nói (nhắc lại câu mẫu / trả lời câu hỏi) theo từng ngôn ngữ */
export default function AdminSpeakingPage() {
  const t = useTranslation()
  const [languageId, setLanguageId] = useState('en')
  const topicsApi = useApi(() => speakingService.listTopicsAdmin(languageId), [languageId])

  return (
    <>
      <PageHeader title={t.adminSpeaking.pageTitle} description={t.adminSpeaking.pageDesc} />
      <label className="mb-6 block text-sm font-medium text-slate-700">
        {t.adminCommon.languageLabel}
        <select value={languageId} onChange={(e) => setLanguageId(e.target.value)} className={cn(inputClass, 'max-w-xs')}>
          <LanguageOptions />
        </select>
      </label>
      <div className="flex flex-col gap-8">
        {/* key = ngôn ngữ: đổi ngôn ngữ thì bỏ form đang sửa / bộ lọc của ngôn ngữ cũ */}
        <TopicsSection key={`topics-${languageId}`} languageId={languageId} api={topicsApi} />
        <ItemsSection key={`items-${languageId}`} languageId={languageId} topics={topicsApi.data ?? []} onItemsChanged={topicsApi.reload} />
      </div>
    </>
  )
}

function TopicsSection({
  languageId,
  api,
}: {
  languageId: string
  api: { data: SpeakingTopicAdmin[] | null; error: Error | null; loading: boolean; reload: () => void }
}) {
  const t = useTranslation()
  const toast = useToast()
  const confirm = useConfirm()
  const [editing, setEditing] = useState<SpeakingTopicAdmin | null>(null)
  const [saving, setSaving] = useState(false)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formEl = e.currentTarget
    const form = new FormData(formEl)
    setSaving(true)
    try {
      await speakingService.upsertTopic({
        language_id: languageId,
        name: editing?.name ?? String(form.get('name') ?? '').trim(),
        icon: String(form.get('icon') ?? '').trim(),
        description: String(form.get('description') ?? '').trim(),
        order_index: Number(form.get('order_index') ?? 0),
        create_only: !editing,
      })
      setEditing(null)
      formEl.reset()
      api.reload()
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (topic: SpeakingTopicAdmin) => {
    if (!(await confirm({ description: t.adminSpeaking.deleteTopicConfirm(topic.name, topic.item_count ?? 0), danger: true }))) return
    try {
      await speakingService.deleteTopic(languageId, topic.name)
      api.reload()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">{t.adminSpeaking.topicsTitle}</h2>
      <Card>
        <form key={editing?.name ?? '__new__'} onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_6rem_6rem]">
          <label className="block text-sm font-medium text-slate-700">
            {t.adminSpeaking.topicNameLabel}
            {editing ? (
              <p className="mt-2 text-slate-900">{editing.name}</p>
            ) : (
              <input name="name" required maxLength={100} placeholder="Phỏng vấn CNTT" className={inputClass} />
            )}
          </label>
          <label className="block text-sm font-medium text-slate-700">
            {t.adminSpeaking.topicIconLabel}
            <input name="icon" defaultValue={editing?.icon ?? '🎤'} maxLength={16} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            {t.adminSpeaking.orderLabel}
            <input name="order_index" type="number" defaultValue={editing?.order_index ?? 0} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-3">
            {t.adminSpeaking.topicDescLabel}
            <input name="description" defaultValue={editing?.description} className={inputClass} />
          </label>
          <div className="flex justify-end gap-2 sm:col-span-3">
            {editing && (
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                {t.adminSpeaking.cancel}
              </Button>
            )}
            <Button type="submit" disabled={saving}>
              {t.adminSpeaking.saveTopic}
            </Button>
          </div>
        </form>
      </Card>
      {api.loading && !api.data ? (
        <Spinner />
      ) : api.error ? (
        <ErrorState error={api.error} onRetry={api.reload} />
      ) : (
        api.data &&
        api.data.length > 0 && (
          <Card className="p-0">
            <ul className="divide-y divide-slate-100">
              {api.data.map((topic) => (
                <li key={topic.name} className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
                  <span className="text-xl">{topic.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{topic.name}</p>
                    {topic.description && <p className="truncate text-xs text-slate-500">{topic.description}</p>}
                  </div>
                  <span className="text-xs text-slate-400">{t.adminSpeaking.itemCount(topic.item_count ?? 0)}</span>
                  <Button variant="secondary" size="sm" onClick={() => setEditing(topic)}>
                    {t.adminSpeaking.edit}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => onDelete(topic)}>
                    {t.adminSpeaking.delete}
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        )
      )}
    </section>
  )
}

function ItemsSection({ languageId, topics, onItemsChanged }: { languageId: string; topics: SpeakingTopicAdmin[]; onItemsChanged: () => void }) {
  const t = useTranslation()
  const toast = useToast()
  const confirm = useConfirm()
  const [topicFilter, setTopicFilter] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const [page, setPage] = useState(1)
  const { data, error, loading, reload } = useApi(
    () => speakingService.listItemsAdmin(languageId, { topic: topicFilter, q: debouncedSearch, page, pageSize: PAGE_SIZE }),
    [languageId, topicFilter, debouncedSearch, page],
  )
  const [form, setForm] = useState<{ editing: SpeakingItemAdmin | null } | null>(null)

  useEffect(() => setPage(1), [topicFilter, debouncedSearch])

  const afterChange = () => {
    reload()
    onItemsChanged() // số câu của từng chủ đề
  }

  const onDelete = async (item: SpeakingItemAdmin) => {
    if (!(await confirm({ description: t.adminSpeaking.deleteItemConfirm, danger: true }))) return
    try {
      await speakingService.deleteItem(item.id)
      afterChange()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">{t.adminSpeaking.itemsTitle}</h2>
        <Button onClick={() => setForm({ editing: null })} disabled={topics.length === 0}>
          {t.adminSpeaking.addItem}
        </Button>
      </div>
      {topics.length === 0 && <p className="text-sm text-slate-500">{t.adminSpeaking.needTopicFirst}</p>}

      {form && (
        <ItemForm
          key={form.editing?.id ?? '__new__'}
          languageId={languageId}
          topics={topics}
          editing={form.editing}
          defaultTopic={topicFilter || topics[0]?.name || ''}
          onCancel={() => setForm(null)}
          onSaved={() => {
            setForm(null)
            afterChange()
          }}
        />
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} className={cn(inputClass, 'mt-0 sm:w-60')}>
          <option value="">{t.adminSpeaking.allTopics}</option>
          {topics.map((topic) => (
            <option key={topic.name} value={topic.name}>
              {topic.icon} {topic.name}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.adminSpeaking.searchPlaceholder}
          className={cn(inputClass, 'mt-0 flex-1')}
        />
      </div>

      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon="🎤" title={t.adminSpeaking.emptyItems} />
      ) : (
        <>
          <Card className="p-0">
            <ul className="divide-y divide-slate-100">
              {data.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
                  <span title={item.kind === 'repeat' ? t.adminSpeaking.kindRepeat : t.adminSpeaking.kindAnswer}>
                    {item.kind === 'repeat' ? '🔁' : '💬'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{item.prompt}</p>
                    <p className="truncate text-xs text-slate-500">
                      {item.topic}
                      {item.keywords.length > 0 && ` · ${item.keywords.map((k) => k.split('|')[0]).join(', ')}`}
                    </p>
                  </div>
                  <LevelBadge level={item.level} />
                  <Button variant="secondary" size="sm" onClick={() => setForm({ editing: item })}>
                    {t.adminSpeaking.edit}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => onDelete(item)}>
                    {t.adminSpeaking.delete}
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
          <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
        </>
      )}
    </section>
  )
}

function ItemForm({
  languageId,
  topics,
  editing,
  defaultTopic,
  onCancel,
  onSaved,
}: {
  languageId: string
  topics: SpeakingTopicAdmin[]
  editing: SpeakingItemAdmin | null
  defaultTopic: string
  onCancel: () => void
  onSaved: () => void
}) {
  const t = useTranslation()
  const toast = useToast()
  const [kind, setKind] = useState<SpeakingKind>(editing?.kind ?? 'answer')
  const [saving, setSaving] = useState(false)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body: SpeakingItemRequest = {
      language_id: languageId,
      topic: String(form.get('topic') ?? ''),
      kind,
      prompt: String(form.get('prompt') ?? '').trim(),
      prompt_meaning: String(form.get('prompt_meaning') ?? '').trim(),
      sample_answer: kind === 'answer' ? String(form.get('sample_answer') ?? '').trim() : '',
      keywords:
        kind === 'answer'
          ? String(form.get('keywords') ?? '')
              .split('\n')
              .map((k) => k.trim())
              .filter(Boolean)
          : [],
      level: String(form.get('level') ?? ''), // rỗng → backend đặt bậc trung cấp của thang
      order_index: Number(form.get('order_index') ?? 0),
    }
    setSaving(true)
    try {
      if (editing) await speakingService.updateItem(editing.id, body)
      else await speakingService.createItem(body)
      onSaved()
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <h3 className="text-base font-semibold text-slate-900">{editing ? t.adminSpeaking.editItem : t.adminSpeaking.addItem}</h3>
      <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          {t.adminSpeaking.topicLabel}
          <select name="topic" defaultValue={editing?.topic ?? defaultTopic} className={inputClass}>
            {topics.map((topic) => (
              <option key={topic.name} value={topic.name}>
                {topic.icon} {topic.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t.adminSpeaking.kindLabel}
          <select value={kind} onChange={(e) => setKind(e.target.value as SpeakingKind)} className={inputClass}>
            <option value="repeat">🔁 {t.adminSpeaking.kindRepeat}</option>
            <option value="answer">💬 {t.adminSpeaking.kindAnswer}</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          {kind === 'repeat' ? t.adminSpeaking.promptLabelRepeat : t.adminSpeaking.promptLabelAnswer}
          <input name="prompt" required maxLength={1000} defaultValue={editing?.prompt} className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          {t.adminSpeaking.meaningLabel}
          <input name="prompt_meaning" defaultValue={editing?.prompt_meaning} className={inputClass} />
        </label>
        {kind === 'answer' && (
          <>
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              {t.adminSpeaking.sampleAnswerLabel}
              <textarea name="sample_answer" rows={4} defaultValue={editing?.sample_answer} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              {t.adminSpeaking.keywordsLabel}
              <textarea name="keywords" rows={4} defaultValue={editing?.keywords.join('\n')} className={inputClass} />
              <span className="mt-1 block text-xs font-normal text-slate-500">{t.adminSpeaking.keywordsHint}</span>
            </label>
          </>
        )}
        <label className="block text-sm font-medium text-slate-700">
          {t.adminSpeaking.levelLabel}
          {/* Mặc định bậc trung cấp của thang: B1 / N3 / HSK3 / TOPIK3 */}
          <select name="level" defaultValue={editing?.level || levelScale(languageId)[2]} className={inputClass}>
            {levelOptions(languageId, editing?.level).map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t.adminSpeaking.orderLabel}
          <input name="order_index" type="number" defaultValue={editing?.order_index ?? 0} className={inputClass} />
        </label>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t.adminSpeaking.cancel}
          </Button>
          <Button type="submit" disabled={saving}>
            {t.adminSpeaking.save}
          </Button>
        </div>
      </form>
    </Card>
  )
}
