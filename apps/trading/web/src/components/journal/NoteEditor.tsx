'use client'

import { useState, type KeyboardEvent } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { JournalTradeDto, NoteDto } from '@/server/journal/journal-service'

const EMOTIONS = ['calm', 'confident', 'fearful', 'greedy', 'fomo', 'revenge'] as const
const textareaClass =
  'mt-1 block w-full rounded-lg border-0 px-3 py-2 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-emerald-600'

/** Khung nhật ký của 1 trade — lý do mặc định lấy từ ghi chú lúc đặt lệnh nếu chưa ghi */
export function NoteEditor({ trade, onSaved }: { trade: JournalTradeDto; onSaved: (note: NoteDto) => void }) {
  const { t } = useT()
  const note = trade.note
  const [reason, setReason] = useState(note?.reason ?? trade.order_note ?? '')
  const [lesson, setLesson] = useState(note?.lesson ?? '')
  const [emotion, setEmotion] = useState<string | null>(note?.emotion ?? null)
  const [rating, setRating] = useState<number | null>(note?.rating ?? null)
  const [tags, setTags] = useState<string[]>(note?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [saved, setSaved] = useState(false)

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) setTags([...tags, tag])
    setTagInput('')
  }
  const onTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && !tagInput && tags.length) setTags(tags.slice(0, -1))
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const pending = tagInput.trim().toLowerCase()
      const allTags = pending && !tags.includes(pending) ? [...tags, pending] : tags
      const res = await api<NoteDto>(`/api/journal/trades/${trade.id}/note`, {
        method: 'PUT',
        body: JSON.stringify({ reason: reason.trim() || null, lesson: lesson.trim() || null, emotion, rating, tags: allTags }),
      })
      setTags(res.tags)
      setTagInput('')
      setSaved(true)
      onSaved(res)
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 bg-slate-50 px-4 py-4">
      <div>
        <p className="text-xs font-medium text-slate-600">{t('journal.emotion')}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {EMOTIONS.map((e) => (
            <button
              key={e}
              type="button"
              aria-pressed={emotion === e}
              onClick={() => setEmotion(emotion === e ? null : e)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${emotion === e ? 'bg-emerald-600 text-white ring-emerald-600' : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-100'}`}
            >
              {t(`journal.emotions.${e}`)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-slate-600">{t('journal.rating')}</p>
        <div className="mt-1 flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n}/5`}
              onClick={() => setRating(rating === n ? null : n)}
              className={`text-xl leading-none ${rating !== null && n <= rating ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <label className="block text-xs font-medium text-slate-600">
        {t('journal.reason')}
        <textarea rows={2} maxLength={2000} value={reason} onChange={(e) => setReason(e.target.value)} className={textareaClass} />
      </label>
      <label className="block text-xs font-medium text-slate-600">
        {t('journal.lesson')}
        <textarea rows={2} maxLength={2000} value={lesson} onChange={(e) => setLesson(e.target.value)} className={textareaClass} />
      </label>
      <div>
        <p className="text-xs font-medium text-slate-600">{t('journal.tags')}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 ring-1 ring-inset ring-slate-300">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              #{tag}
              <button type="button" aria-label={t('journal.removeTag', { tag })} onClick={() => setTags(tags.filter((x) => x !== tag))}>
                ×
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            maxLength={30}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={onTagKey}
            onBlur={addTag}
            placeholder={tags.length ? '' : t('journal.tagsPlaceholder')}
            className="min-w-24 flex-1 border-0 p-0.5 text-sm focus:ring-0"
          />
        </div>
      </div>
      {error !== null && <p className="text-sm text-rose-600">{errorMessage(error, t)}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {t('common.save')}
        </button>
        {saved && <span className="text-sm text-emerald-700">{t('journal.saved')}</span>}
      </div>
    </div>
  )
}
