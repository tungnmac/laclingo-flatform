'use client'

import { useState, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/States'
import { inputClass } from '@/features/auth/components/AuthForm'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import type { DeckSummary } from '@/types/api'

/**
 * Danh sách list ôn tập có ô tích + ô "Tạo & thêm" list mới — dùng chung cho hộp "Thêm vào ôn tập" (tích = thêm
 * ngay) và form tạo từ mới của admin (tích = chọn trước, thêm khi lưu từ). Không dùng thẻ <form> để nhúng được
 * vào trong form khác: Enter ở ô tên list gọi onCreate.
 */
export function DeckPicker({
  decks,
  isChecked,
  onToggle,
  onCreate,
  busy,
  loadFailed = false,
  onNameChange,
}: {
  decks: DeckSummary[] | null
  isChecked: (deck: DeckSummary) => boolean
  onToggle: (deck: DeckSummary) => void
  /** Tạo list mới tên `name` và tích luôn — trả false khi lỗi (nơi gọi tự hiện lỗi; ô tên giữ nguyên để thử lại) */
  onCreate: (name: string) => Promise<boolean>
  busy: boolean
  /** Tải danh sách lỗi (nơi gọi tự hiện lỗi) → không hiện vòng xoay mãi */
  loadFailed?: boolean
  /** Báo tên list đang gõ dở (chưa bấm "Tạo & thêm") — form tạo từ dùng để tự tạo list khi bấm Lưu */
  onNameChange?: (name: string) => void
}) {
  const t = useTranslation()
  const [newName, setNewNameState] = useState('')
  const setNewName = (name: string) => {
    setNewNameState(name)
    onNameChange?.(name)
  }

  const create = async () => {
    const name = newName.trim()
    if (!name || busy) return
    if (await onCreate(name)) setNewName('')
  }
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return // Enter để chốt chữ của bộ gõ (IME) không tạo list
    e.preventDefault() // không submit form cha
    void create()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
        {decks === null && !loadFailed && <Spinner />}
        {decks?.length === 0 && <p className="py-2 text-sm text-slate-500">{t.decks.dialogNoDecks}</p>}
        <ul className="flex flex-col gap-1.5">
          {decks?.map((deck) => {
            const checked = isChecked(deck)
            return (
              <li key={deck.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 ring-1 ring-inset transition',
                    checked ? 'bg-indigo-50 ring-indigo-200' : 'ring-slate-200 hover:bg-slate-50',
                    busy && 'cursor-wait opacity-70',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={busy}
                    onChange={() => onToggle(deck)}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <span className="h-6 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: deck.color }} aria-hidden />
                  <span className="text-lg">{deck.icon}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{deck.name}</span>
                  <span className="shrink-0 text-xs text-slate-400">{t.decks.wordCount(deck.word_count)}</span>
                </label>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={onKeyDown}
          maxLength={100}
          placeholder={t.decks.newDeckPlaceholder}
          className={cn(inputClass.replace('mt-1 ', ''), 'flex-1')}
        />
        <Button type="button" size="sm" onClick={() => void create()} disabled={!newName.trim() || busy}>
          {t.decks.createAndAddBtn}
        </Button>
      </div>
    </div>
  )
}
