'use client'

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/States'
import { inputClass } from '@/features/auth/components/AuthForm'
import { srsService } from '@/features/srs-review/srs.service'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import type { DeckSummary } from '@/types/api'
import { deckService } from '../deck.service'

/**
 * Hộp "Thêm vào ôn tập": tích/bỏ tích list là thêm/bỏ từ ngay (không cần nút
 * Lưu), tạo list mới tại chỗ, hoặc chỉ đưa vào hàng đợi SRS không qua list.
 * onAdded báo cha khi từ đã chắc chắn nằm trong hàng đợi ôn tập.
 */
export function AddToDeckDialog({
  vocabularyId,
  term,
  onClose,
  onAdded,
  onMembershipChange,
}: {
  vocabularyId: string
  term: string
  onClose: () => void
  onAdded: () => void
  /** Báo mỗi lần từ được thêm vào / gỡ khỏi 1 list (kể cả list vừa tạo) */
  onMembershipChange?: (deck: DeckSummary, contained: boolean) => void
}) {
  const t = useTranslation()
  const [decks, setDecks] = useState<DeckSummary[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    deckService
      .list(vocabularyId)
      .then(setDecks)
      .catch((err: Error) => setError(err.message))
  }, [vocabularyId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const run = async (id: string, action: () => Promise<void>) => {
    if (busyId) return
    setBusyId(id)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const toggle = (deck: DeckSummary) =>
    run(deck.id, async () => {
      if (deck.contains_vocabulary) await deckService.removeWord(deck.id, vocabularyId)
      else {
        await deckService.addWord(deck.id, vocabularyId)
        onAdded()
      }
      onMembershipChange?.(deck, !deck.contains_vocabulary)
      setDecks(
        (ds) =>
          ds?.map((d) =>
            d.id === deck.id
              ? { ...d, contains_vocabulary: !d.contains_vocabulary, word_count: d.word_count + (d.contains_vocabulary ? -1 : 1) }
              : d,
          ) ?? null,
      )
    })

  const createAndAdd = (e: FormEvent) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    void run('__new__', async () => {
      const deck = await deckService.create({ name })
      // Hiện list mới NGAY sau khi tạo — nếu bước thêm từ lỗi, user tích lại
      // list này thay vì bấm "Tạo & thêm" lần nữa (sẽ tạo list trùng tên)
      setDecks((ds) => [{ ...deck, word_count: 0, contains_vocabulary: false }, ...(ds ?? [])])
      setNewName('')
      await deckService.addWord(deck.id, vocabularyId)
      onAdded()
      onMembershipChange?.(deck, true)
      setDecks((ds) => ds?.map((d) => (d.id === deck.id ? { ...d, word_count: 1, contains_vocabulary: true } : d)) ?? null)
    })
  }

  const onlyQueue = () =>
    run('__queue__', async () => {
      await srsService.learn(vocabularyId)
      onAdded()
      onClose()
    })

  return (
    <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-deck-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-md flex-col gap-4 overflow-hidden rounded-2xl bg-white p-5 text-left shadow-xl"
      >
        <div>
          <h3 id="add-to-deck-title" className="text-base font-semibold text-slate-900">
            {t.decks.dialogTitle(term)}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{t.decks.dialogDesc}</p>
        </div>

        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          {decks === null && !error && <Spinner />}
          {decks?.length === 0 && <p className="py-2 text-sm text-slate-500">{t.decks.dialogNoDecks}</p>}
          <ul className="flex flex-col gap-1.5">
            {decks?.map((deck) => (
              <li key={deck.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 ring-1 ring-inset transition',
                    deck.contains_vocabulary ? 'bg-indigo-50 ring-indigo-200' : 'ring-slate-200 hover:bg-slate-50',
                    busyId !== null && 'cursor-wait opacity-70',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={deck.contains_vocabulary}
                    disabled={busyId !== null}
                    onChange={() => toggle(deck)}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <span className="h-6 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: deck.color }} aria-hidden />
                  <span className="text-lg">{deck.icon}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{deck.name}</span>
                  <span className="shrink-0 text-xs text-slate-400">{t.decks.wordCount(deck.word_count)}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={createAndAdd} className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={100}
            placeholder={t.decks.newDeckPlaceholder}
            className={cn(inputClass.replace('mt-1 ', ''), 'flex-1')}
          />
          <Button type="submit" size="sm" disabled={!newName.trim() || busyId !== null}>
            {t.decks.createAndAddBtn}
          </Button>
        </form>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex flex-col items-start gap-1">
            <button type="button" onClick={onlyQueue} disabled={busyId !== null} className="text-xs font-medium text-slate-500 hover:text-indigo-600 disabled:opacity-50">
              {t.decks.onlyQueueBtn}
            </button>
            <Link href="/review/lists" className="text-xs font-medium text-indigo-600 hover:underline">
              {t.decks.manageListsLink}
            </Link>
          </div>
          <Button size="sm" onClick={onClose}>
            {t.decks.doneBtn}
          </Button>
        </div>
      </div>
    </div>
  )
}
