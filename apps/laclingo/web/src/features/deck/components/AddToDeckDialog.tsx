'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { addWordToDeck, isNetworkError, learnWord } from '@/features/srs-review/offline'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import type { DeckSummary } from '@/types/api'
import { deckService } from '../deck.service'
import { DeckPicker } from './DeckPicker'

/**
 * Hộp "Thêm vào ôn tập": tích/bỏ tích list là thêm/bỏ từ ngay (không cần nút
 * Lưu), tạo list mới tại chỗ, hoặc chỉ đưa vào hàng đợi SRS không qua list.
 * onAdded báo cha khi từ đã chắc chắn nằm trong hàng đợi ôn tập (hoặc đã xếp hàng đợi đồng bộ khi offline).
 * Offline: thêm vào list có sẵn / chỉ đưa vào hàng đợi vẫn dùng được; tạo list, bỏ từ khỏi list cần mạng.
 */
export function AddToDeckDialog({
  vocabularyId,
  term,
  onClose,
  onAdded,
  onMembershipChange,
  deckIds,
}: {
  vocabularyId: string
  term: string
  /** Các list đang chứa từ (nếu nơi gọi biết) — đánh dấu list khi offline, không hỏi được server */
  deckIds?: string[]
  onClose: () => void
  onAdded: () => void
  /** Báo mỗi lần từ được thêm vào / gỡ khỏi 1 list (kể cả list vừa tạo) */
  onMembershipChange?: (deck: DeckSummary, contained: boolean) => void
}) {
  const t = useTranslation()
  const [decks, setDecks] = useState<DeckSummary[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    deckService
      .list(vocabularyId)
      .catch((err: Error) => {
        if (!isNetworkError(err)) throw err
        return deckService.list() // offline, chưa lưu riêng cho từ này: danh sách list đã lưu (đánh dấu theo deckIds bên dưới)
      })
      // deckIds (từ danh sách từ, đã gồm thao tác đang chờ đồng bộ) đúng hơn kết quả đã lưu có thể cũ khi offline
      .then((list) => (deckIds ? list.map((d) => ({ ...d, contains_vocabulary: deckIds.includes(d.id) })) : list))
      .then(setDecks)
      .catch((err: Error) => setError(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocabularyId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  /** Chạy 1 thao tác (mỗi lúc 1 thao tác) — trả true nếu thành công */
  const run = async (id: string, action: () => Promise<void>): Promise<boolean> => {
    if (busyId) return false
    setBusyId(id)
    setError(null)
    try {
      await action()
      return true
    } catch (err) {
      setError(inlineError(err))
      return false
    } finally {
      setBusyId(null)
    }
  }

  const toggle = (deck: DeckSummary) =>
    run(deck.id, async () => {
      if (deck.contains_vocabulary) await deckService.removeWord(deck.id, vocabularyId)
      else {
        await addWordToDeck(deck.id, vocabularyId)
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

  const createAndAdd = async (name: string) => {
    let created = false
    const ok = await run('__new__', async () => {
      const deck = await deckService.create({ name })
      created = true
      // Hiện list mới NGAY sau khi tạo — nếu bước thêm từ lỗi, user tích lại
      // list này thay vì bấm "Tạo & thêm" lần nữa (sẽ tạo list trùng tên)
      setDecks((ds) => [{ ...deck, word_count: 0, contains_vocabulary: false }, ...(ds ?? [])])
      onMembershipChange?.(deck, false) // báo list mới ngay cả khi bước thêm từ bên dưới lỗi
      // Đã có toast "Tạo mới" của list — bước thêm từ không báo thêm (lỗi vẫn hiện ngay trong hộp thoại)
      await addWordToDeck(deck.id, vocabularyId, { notify: false })
      onAdded()
      onMembershipChange?.(deck, true)
      setDecks((ds) => ds?.map((d) => (d.id === deck.id ? { ...d, word_count: 1, contains_vocabulary: true } : d)) ?? null)
    })
    // List đã tạo thì xoá ô tên kể cả khi bước thêm từ lỗi — user tích lại list đó thay vì tạo trùng tên
    return ok || created
  }

  const onlyQueue = () =>
    run('__queue__', async () => {
      await learnWord(vocabularyId)
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

        <DeckPicker
          decks={decks}
          loadFailed={!!error && decks === null}
          isChecked={(deck) => deck.contains_vocabulary}
          onToggle={(deck) => void toggle(deck)}
          onCreate={createAndAdd}
          busy={busyId !== null}
        />

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
