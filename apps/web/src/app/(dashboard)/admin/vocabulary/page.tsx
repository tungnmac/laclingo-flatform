'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { BulkImportPanel } from '@/components/admin/BulkImportPanel'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { inputClass } from '@/features/auth/components/AuthForm'
import { LevelBadge } from '@/features/grammar/components/LevelBadge'
import { vocabularyService } from '@/features/vocabulary/vocabulary.service'
import { useApi } from '@/hooks/useApi'
import { cn } from '@/lib/utils'
import type { VocabularyAdmin, VocabularyRequest, VocabularyTopicAdmin, VocabularyTopicRequest } from '@/types/api'

const vocabBulkPlaceholder = `[
  { "language_id": "en", "term": "apple", "phonetic": "ˈæp.əl", "meaning": "quả táo", "example": "I eat an apple every day.", "topic": "Đồ ăn & Thức uống", "level": "A1" }
]`

const topicBulkPlaceholder = `[
  { "language_id": "en", "name": "Đồ ăn & Thức uống", "icon": "🍜", "order_index": 0 }
]`

export default function AdminVocabularyPage() {
  const [languageId, setLanguageId] = useState('en')

  return (
    <>
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600">
        ← Quản trị
      </Link>
      <PageHeader title="Từ vựng" description="Quản lý từ vựng và chủ đề từ vựng theo ngôn ngữ." />

      <label className="mb-6 block text-sm font-medium text-slate-700">
        Ngôn ngữ
        <select value={languageId} onChange={(e) => setLanguageId(e.target.value)} className={cn(inputClass, 'max-w-xs')}>
          <option value="en">🇬🇧 English</option>
          <option value="zh">🇨🇳 中文</option>
        </select>
      </label>

      <TopicsSection languageId={languageId} />
      <VocabularySection languageId={languageId} />
    </>
  )
}

function TopicsSection({ languageId }: { languageId: string }) {
  const { data, error, loading, reload } = useApi(() => vocabularyService.listTopicsAdmin(languageId), [languageId])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const onDelete = async (t: VocabularyTopicAdmin) => {
    if (!confirm(`Xoá chủ đề "${t.name}"? Từ vựng đang gắn chủ đề này vẫn giữ nguyên, chỉ mất icon/thứ tự hiển thị riêng.`)) return
    await vocabularyService.deleteTopic(t.language_id, t.name)
    reload()
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body: VocabularyTopicRequest = {
      language_id: languageId,
      name: String(form.get('name') ?? '').trim(),
      icon: String(form.get('icon') ?? '📘').trim() || '📘',
      order_index: Number(form.get('order_index')),
    }
    setSaving(true)
    setFormError(null)
    try {
      await vocabularyService.createOrUpdateTopic(body)
      setShowForm(false)
      reload()
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
          <Button size="sm" onClick={() => setShowForm(true)}>
            + Thêm/sửa chủ đề
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <p className="mb-3 text-sm text-slate-500">
            Nếu đặt tên trùng với chủ đề đã có, icon/thứ tự sẽ được cập nhật (upsert).
          </p>
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Tên chủ đề
              <input name="name" type="text" required className={inputClass} placeholder="Đồ ăn & Thức uống" />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-slate-700">
                Icon (emoji)
                <input name="icon" type="text" defaultValue="📘" className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Thứ tự
                <input name="order_index" type="number" defaultValue={0} className={inputClass} />
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
      {data && data.length === 0 && <EmptyState title="Chưa có chủ đề nào" icon="🗂️" />}

      {data && data.length > 0 && (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {data.map((t) => (
              <li key={t.name} className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
                <span className="text-xl">{t.icon}</span>
                <span className="flex-1 text-sm font-medium text-slate-700">{t.name}</span>
                <span className="text-xs text-slate-400">#{t.order_index}</span>
                <Button variant="danger" size="sm" onClick={() => onDelete(t)}>
                  Xoá
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <BulkImportPanel<VocabularyTopicRequest>
        onImport={(items) => vocabularyService.bulkImportTopics(items.map((i) => ({ ...i, language_id: i.language_id || languageId })))}
        placeholder={topicBulkPlaceholder}
        onDone={reload}
      />
    </section>
  )
}

function VocabularySection({ languageId }: { languageId: string }) {
  const { data, error, loading, reload } = useApi(() => vocabularyService.listVocabulariesAdmin(languageId), [languageId])
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
    if (!confirm(`Xoá từ "${v.term}"?`)) return
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
          <Button size="sm" onClick={onCreateNew}>
            + Thêm từ
          </Button>
        )}
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
              <input name="image_emoji" type="text" defaultValue={editing?.image_emoji} className={inputClass} placeholder="🍎" />
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
      {data && data.length === 0 && <EmptyState title="Chưa có từ vựng nào" icon="📚" />}

      {data && data.length > 0 && (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {data.map((v) => (
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

      <BulkImportPanel<VocabularyRequest>
        onImport={(items) => vocabularyService.bulkImportVocabularies(items.map((i) => ({ ...i, language_id: i.language_id || languageId })))}
        placeholder={vocabBulkPlaceholder}
        onDone={reload}
      />
    </section>
  )
}
