'use client'

import { useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { useToast } from '@/components/ui/ToastProvider'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { inputClass } from '@/features/auth/components/AuthForm'
import { classService } from '@/features/class/class.service'
import { CEFR_LEVELS, LevelBadge } from '@/features/grammar/components/LevelBadge'
import { grammarService } from '@/features/grammar/grammar.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import type { ClassAdmin, ClassRequest } from '@/types/api'

// Số lớp/ngôn ngữ ít (giống Missions admin) — không cần phân trang thật.
const ALL_CLASSES_PAGE_SIZE = 100
// Dropdown chọn bài trong giáo án cần THẤY HẾT bài ngữ pháp của ngôn ngữ đó,
// giống ALL_TOPICS_PAGE_SIZE ở trang Từ vựng/Ngữ pháp admin.
const ALL_LESSONS_PAGE_SIZE = 200

export default function AdminClassesPage() {
  const [languageId, setLanguageId] = useState('en')
  const t = useTranslation()
  const confirm = useConfirm()
  const toast = useToast()
  const { data, error, loading, reload } = useApi(
    () => classService.listAdmin(languageId, { page: 1, pageSize: ALL_CLASSES_PAGE_SIZE }),
    [languageId],
  )
  const allLessonsApi = useApi(
    () => grammarService.listLessonsAdmin(languageId, { page: 1, pageSize: ALL_LESSONS_PAGE_SIZE }),
    [languageId],
  )

  const [editing, setEditing] = useState<ClassAdmin | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const onEdit = (c: ClassAdmin) => {
    setEditing(c)
    setShowForm(true)
    setFormError(null)
  }

  const onCreateNew = () => {
    setEditing(null)
    setShowForm(true)
    setFormError(null)
  }

  const onDelete = async (c: ClassAdmin) => {
    if (!(await confirm({ description: t.adminClasses.deleteClassConfirm(c.title), danger: true }))) return
    await classService.delete(c.id)
    reload()
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body: ClassRequest = {
      language_id: languageId,
      title: String(form.get('title') ?? '').trim(),
      description: String(form.get('description') ?? '').trim() || undefined,
      level: String(form.get('level') ?? 'A1'),
      order_index: Number(form.get('order_index')),
    }
    setSaving(true)
    setFormError(null)
    try {
      if (editing) {
        const updated = await classService.update(editing.id, body)
        setEditing(updated)
      } else {
        const created = await classService.create(body)
        setEditing(created)
      }
      reload()
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title={t.adminClasses.pageTitle} description={t.adminClasses.pageDesc} />

      <label className="mb-6 block text-sm font-medium text-slate-700">
        {t.adminCommon.languageLabel}
        <select
          value={languageId}
          onChange={(e) => {
            setLanguageId(e.target.value)
            setShowForm(false)
            setEditing(null)
          }}
          className={cn(inputClass, 'max-w-xs')}
        >
          <option value="en">🇬🇧 English</option>
          <option value="zh">🇨🇳 中文</option>
        </select>
      </label>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{t.adminClasses.pageTitle}</h2>
        {!showForm && (
          <Button size="sm" onClick={onCreateNew}>
            {t.adminClasses.addClassBtn}
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="mb-6">
          <h3 className="text-base font-semibold text-slate-900">
            {editing ? t.adminClasses.editClassTitle(editing.title) : t.adminClasses.addClassTitle}
          </h3>
          <form key={editing?.id ?? '__new__'} onSubmit={onSubmit} className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              {t.adminClasses.titleLabel}
              <input name="title" type="text" required defaultValue={editing?.title} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              {t.adminClasses.descriptionLabel}
              <input name="description" type="text" defaultValue={editing?.description} className={inputClass} />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-slate-700">
                {t.adminClasses.levelLabel}
                <select name="level" defaultValue={editing?.level ?? 'A1'} className={inputClass}>
                  {CEFR_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                {t.adminClasses.orderLabel}
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

          {editing && (
            <CurriculumEditor
              key={editing.id}
              classId={editing.id}
              allLessons={allLessonsApi.data?.items ?? []}
              toast={toast}
            />
          )}
        </Card>
      )}

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title={t.adminClasses.emptyClasses} icon="📋" />}

      {data && data.items.length > 0 && (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {data.items.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 sm:px-6">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700">{c.title}</p>
                  {c.description && <p className="truncate text-xs text-slate-400">{c.description}</p>}
                </div>
                <LevelBadge level={c.level} />
                <div className="flex shrink-0 gap-2">
                  <Button variant="secondary" size="sm" onClick={() => onEdit(c)}>
                    {t.adminCommon.editBtn}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => onDelete(c)}>
                    {t.adminCommon.deleteBtn}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}

/** Giáo án của 1 lớp — chỉ hiện khi đang SỬA (cần classId có sẵn, lớp mới tạo
 * phải lưu trước). Checkbox chọn bài + input số "Thứ tự" (không kéo-thả, khớp
 * cách order_index vẫn luôn là input thủ công ở mọi nơi khác trong app). Lưu
 * là 1 lần PUT thay TOÀN BỘ giáo án, không add/remove/reorder rời. */
function CurriculumEditor({
  classId,
  allLessons,
  toast,
}: {
  classId: string
  allLessons: { id: string; title: string; level: string }[]
  toast: (message: string, variant?: 'success' | 'error') => void
}) {
  const t = useTranslation()
  const lessonsApi = useApi(() => classService.getLessons(classId), [classId])
  const [selected, setSelected] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)

  if (lessonsApi.data && !initialized) {
    const initial: Record<string, number> = {}
    lessonsApi.data.forEach((l) => {
      initial[l.lesson_id] = l.order_index
    })
    setSelected(initial)
    setInitialized(true)
  }

  const toggle = (lessonId: string) => {
    setSelected((prev) => {
      const next = { ...prev }
      if (lessonId in next) delete next[lessonId]
      else next[lessonId] = Object.keys(next).length
      return next
    })
  }

  const setOrder = (lessonId: string, order: number) => {
    setSelected((prev) => ({ ...prev, [lessonId]: order }))
  }

  const onSave = async () => {
    setSaving(true)
    try {
      const lessonIds = Object.entries(selected)
        .sort((a, b) => a[1] - b[1])
        .map(([id]) => id)
      await classService.setLessons(classId, lessonIds)
      toast(t.adminClasses.curriculumSaved)
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-4">
      <h4 className="text-sm font-semibold text-slate-900">{t.adminClasses.curriculumTitle}</h4>
      <p className="mt-1 text-xs text-slate-500">{t.adminClasses.curriculumHint}</p>

      {lessonsApi.loading && <Spinner />}
      {allLessons.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">{t.adminClasses.noLessonsForLanguage}</p>
      ) : (
        <ul className="mt-3 max-h-80 space-y-1.5 overflow-y-auto">
          {allLessons.map((l) => {
            const isSelected = l.id in selected
            return (
              <li key={l.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(l.id)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <LevelBadge level={l.level} />
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{l.title}</span>
                <input
                  type="number"
                  disabled={!isSelected}
                  value={isSelected ? selected[l.id] : ''}
                  onChange={(e) => setOrder(l.id, Number(e.target.value))}
                  className={cn(inputClass, 'mt-0 w-16 text-center disabled:bg-slate-50')}
                />
              </li>
            )
          })}
        </ul>
      )}

      <Button type="button" size="sm" className="mt-3" disabled={saving} onClick={onSave}>
        {saving ? t.adminClasses.savingCurriculumBtn : t.adminClasses.saveCurriculumBtn}
      </Button>
    </div>
  )
}
