'use client'

import { useState, type FormEvent } from 'react'
import { IconPickerInput } from '@/components/admin/IconPickerInput'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/features/auth/components/AuthForm'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { DeckRequest } from '@/types/api'
import { DECK_COLORS } from '../deck.service'

/** Form tạo / sửa thông tin danh sách ôn tập (tên, mô tả, icon, màu) */
export function DeckForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: DeckRequest
  submitLabel: string
  onSubmit: (body: DeckRequest) => Promise<void>
  onCancel?: () => void
}) {
  const t = useTranslation()
  const [color, setColor] = useState(initial?.color || DECK_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formEl = e.currentTarget
    const form = new FormData(formEl)
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        name: String(form.get('name') ?? '').trim(),
        description: String(form.get('description') ?? '').trim() || undefined,
        icon: String(form.get('icon') ?? '').trim() || undefined,
        color,
      })
      if (!initial) {
        formEl.reset()
        setColor(DECK_COLORS[0])
      }
    } catch (err) {
      setError(inlineError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="block text-sm font-medium text-slate-700">
        {t.decks.nameLabel}
        <input name="name" required maxLength={100} defaultValue={initial?.name} placeholder={t.decks.namePlaceholder} className={inputClass} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        {t.decks.iconLabel}
        <IconPickerInput name="icon" defaultValue={initial?.icon ?? '📚'} />
      </label>
      <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
        {t.decks.descriptionLabel}
        <input name="description" defaultValue={initial?.description} className={inputClass} />
      </label>
      <div className="text-sm font-medium text-slate-700 sm:col-span-2">
        {t.decks.colorLabel}
        <div className="mt-2 flex flex-wrap gap-2">
          {DECK_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              aria-pressed={color === c}
              className={cn('h-8 w-8 rounded-full ring-offset-2 transition', color === c ? 'ring-2 ring-slate-900' : 'hover:scale-110')}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={saving}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t.decks.cancelBtn}
          </Button>
        )}
      </div>
    </form>
  )
}
