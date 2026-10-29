'use client'

import { useEffect, useRef, useState } from 'react'
import { inputClass } from '@/features/auth/components/AuthForm'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import { dailyNoteService } from '../daily.service'

/** Ghi chú trong ngày — tự lưu sau ~1 giây ngừng gõ (chỉ hôm nay) */
export function JournalBox({ initial, editable }: { initial: string; editable: boolean }) {
  const t = useTranslation()
  const [text, setText] = useState(initial)
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)
  const lastSaved = useRef(initial)

  // Rời trang / đổi ngày trước khi kịp tự lưu → lưu ngay phần còn lại; đóng tab → trình duyệt hỏi xác nhận
  const latest = useRef(text)
  latest.current = text
  useEffect(() => {
    if (!editable) return
    const warn = (e: BeforeUnloadEvent) => {
      if (latest.current !== lastSaved.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => {
      window.removeEventListener('beforeunload', warn)
      if (latest.current !== lastSaved.current) void dailyNoteService.saveJournal(latest.current).catch(() => {})
    }
  }, [editable])

  useEffect(() => {
    if (!editable || text === lastSaved.current) return
    const timer = setTimeout(async () => {
      setState('saving')
      setError(null)
      try {
        await dailyNoteService.saveJournal(text)
        lastSaved.current = text
        setState('saved')
      } catch (err) {
        setError(inlineError(err))
        setState('idle')
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [text, editable])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">{t.daily.journalTitle}</h2>
        {state !== 'idle' && <span className="text-xs text-slate-400">{state === 'saving' ? t.daily.saving : t.daily.saved}</span>}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        readOnly={!editable}
        maxLength={5000}
        rows={4}
        placeholder={t.daily.journalPlaceholder}
        className={inputClass}
      />
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  )
}
