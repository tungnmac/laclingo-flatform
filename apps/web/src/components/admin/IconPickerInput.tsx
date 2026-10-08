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

/** Input emoji/icon có nút mở bảng chọn sẵn nằm bên trong, mép phải — vẫn cho
 * gõ/dán emoji tuỳ ý trong input, bảng chọn chỉ là lối tắt tiện lợi. Icon của
 * nút luôn cố định (không đổi theo emoji đang chọn). */
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
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input ref={inputRef} name={name} type="text" defaultValue={defaultValue} className={cn(inputClass, 'pr-10')} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-lg text-slate-400 hover:text-slate-600"
        aria-label="Chọn icon có sẵn"
      >
        🙂
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 grid grid-cols-7 gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          {options.map((opt) => (
            <button key={opt} type="button" onClick={() => pick(opt)} className="rounded p-1 text-xl hover:bg-slate-100">
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
