'use client'

import { useEffect, useRef, useState } from 'react'
import { inputClass } from '@/features/auth/components/AuthForm'
import { cn } from '@/lib/utils'

export const TOPIC_ICON_OPTIONS = [
  '📘', '📚', '🍜', '🍎', '✈️', '🏠', '👔', '⚽', '🌤️', '🏥', '⚙️', '🔨', '💼', '🎓',
  '💻', '🩺', '🏢', '📊', '🎨', '🎵', '🚗', '🌾', '👮', '🧑‍🏫', '🛒', '💰', '🗣️', '🌍',
]

export const WORD_EMOJI_OPTIONS = [
  '🍎', '🍜', '🍔', '☕', '🚗', '🏠', '📱', '💻', '📚', '✏️', '🐶', '🐱', '🌳', '☀️',
  '🌧️', '❄️', '🎵', '👕', '👟', '🕐', '💰', '✈️', '🎂', '🔑', '📷', '⚽', '🎮', '❤️',
]

/** Input emoji/icon có kèm nút mở bảng chọn sẵn các icon thường dùng — vẫn cho
 * gõ/dán emoji tuỳ ý trong input, bảng chọn chỉ là lối tắt tiện lợi. */
export function IconPickerInput({
  name,
  defaultValue = '',
  options = TOPIC_ICON_OPTIONS,
}: {
  name: string
  defaultValue?: string
  options?: string[]
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const pick = (emoji: string) => {
    if (inputRef.current) inputRef.current.value = emoji
    setValue(emoji)
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          name={name}
          type="text"
          defaultValue={defaultValue}
          onChange={(e) => setValue(e.target.value)}
          className={cn(inputClass, 'flex-1')}
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 rounded-lg border border-slate-300 px-3 text-lg hover:bg-slate-50"
          aria-label="Chọn icon có sẵn"
        >
          {value || '📘'}
        </button>
      </div>
      {open && (
        <div className="absolute right-0 z-10 mt-1 grid grid-cols-7 gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => pick(opt)}
              className="rounded p-1 text-xl hover:bg-slate-100"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
