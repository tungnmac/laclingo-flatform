'use client'

import { useEffect, useRef, useState } from 'react'
import { inputClass } from '@/features/auth/components/AuthForm'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import { useAutoplaySettings, type AutoplayLoopMode } from '@/store/autoplaySettings'

/** Nút ⚙️ mở dropdown cài đặt tự động đọc (số lần đọc/từ, giãn cách giây,
 * shadowing, lặp lại cả danh sách) — dùng chung cho trang học từ theo chủ đề và trang ôn SRS, đọc/ghi
 * trực tiếp vào store persist nên đổi ở đâu cũng áp dụng mọi nơi. */
export function AutoplaySettingsDropdown() {
  const t = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const repeatCount = useAutoplaySettings((s) => s.repeatCount)
  const gapSeconds = useAutoplaySettings((s) => s.gapSeconds)
  const shadowMode = useAutoplaySettings((s) => s.shadowMode)
  const setRepeatCount = useAutoplaySettings((s) => s.setRepeatCount)
  const setGapSeconds = useAutoplaySettings((s) => s.setGapSeconds)
  const setShadowMode = useAutoplaySettings((s) => s.setShadowMode)
  const loopMode = useAutoplaySettings((s) => s.loopMode)
  const loopCount = useAutoplaySettings((s) => s.loopCount)
  const setLoopMode = useAutoplaySettings((s) => s.setLoopMode)
  const setLoopCount = useAutoplaySettings((s) => s.setLoopCount)
  // Bản nháp cho ô số vòng — kẹp 2-20 ngay mỗi phím gõ thì không gõ được 10-19
  const [loopDraft, setLoopDraft] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClickOutside)
    return () => window.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="text-xs font-medium text-slate-500 hover:text-indigo-600"
      >
        ⚙️ {t.review.autoplaySettingsBtn}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-2 w-64 space-y-3 rounded-xl bg-white p-3 text-left shadow-lg ring-1 ring-slate-200">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            {t.review.repeatCountLabel}
            <input
              type="number"
              min={1}
              max={10}
              value={repeatCount}
              onChange={(e) => setRepeatCount(Number(e.target.value))}
              className={cn(inputClass, 'mt-0')}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            {t.review.gapSecondsLabel}
            <input
              type="number"
              min={1}
              max={20}
              value={gapSeconds}
              onChange={(e) => setGapSeconds(Number(e.target.value))}
              className={cn(inputClass, 'mt-0')}
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={shadowMode}
              onChange={(e) => setShadowMode(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            {t.review.shadowModeLabel}
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            {t.review.loopLabel}
            <select value={loopMode} onChange={(e) => setLoopMode(e.target.value as AutoplayLoopMode)} className={cn(inputClass, 'mt-0')}>
              <option value="once">{t.review.loopOnce}</option>
              <option value="count">{t.review.loopCount}</option>
              <option value="infinite">{t.review.loopInfinite}</option>
            </select>
          </label>
          {loopMode === 'count' && (
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              {t.review.loopCountLabel}
              <input
                type="number"
                min={2}
                max={20}
                value={loopDraft ?? loopCount}
                onChange={(e) => {
                  setLoopDraft(e.target.value)
                  const n = Number(e.target.value)
                  if (Number.isInteger(n) && n >= 2 && n <= 20) setLoopCount(n)
                }}
                onBlur={() => {
                  if (loopDraft !== null) setLoopCount(Number(loopDraft))
                  setLoopDraft(null)
                }}
                className={cn(inputClass, 'mt-0')}
              />
            </label>
          )}
        </div>
      )}
    </div>
  )
}
