'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { useToast } from '@/components/ui/ToastProvider'
import { inputClass } from '@/features/auth/components/AuthForm'
import { DeckForm } from '@/features/deck/components/DeckForm'
import { deckService } from '@/features/deck/deck.service'
import { LevelBadge } from '@/features/grammar/components/LevelBadge'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { resolveMediaUrl } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { DeckWord } from '@/types/api'

/** Chi tiết 1 danh sách ôn tập: sửa/xoá list, học lại, chuyển/sao chép/bỏ từ */
export default function DeckDetailPage({ params }: { params: { id: string } }) {
  const t = useTranslation()
  const router = useRouter()
  const confirm = useConfirm()
  const toast = useToast()
  const { data: deck, error, loading, reload } = useApi(() => deckService.get(params.id), [params.id])
  // Các list khác — đích để chuyển/sao chép từ
  const { data: allDecks } = useApi(() => deckService.list(), [params.id])
  const otherDecks = allDecks?.filter((d) => d.id !== params.id) ?? []
  const [editing, setEditing] = useState(false)
  const [moveWord, setMoveWord] = useState<string | null>(null)

  if (loading && !deck) return <Spinner />
  if (error || !deck) return <ErrorState error={error ?? new Error('not found')} onRetry={reload} />

  const onDelete = async () => {
    if (!(await confirm({ description: t.decks.deleteConfirm(deck.name), danger: true }))) return
    try {
      await deckService.delete(deck.id)
      router.push('/review/lists')
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const onRemove = async (word: DeckWord) => {
    if (!(await confirm({ description: t.decks.removeWordConfirm(word.term), danger: true }))) return
    try {
      await deckService.removeWord(deck.id, word.vocabulary_id)
      reload()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t.nav.review, href: '/review' },
          { label: t.decks.backToLists, href: '/review/lists' },
          { label: deck.name },
        ]}
      />

      <Card className="border-l-4" style={{ borderLeftColor: deck.color }}>
        {editing ? (
          <DeckForm
            initial={{ name: deck.name, description: deck.description, icon: deck.icon, color: deck.color }}
            submitLabel={t.decks.saveBtn}
            onCancel={() => setEditing(false)}
            onSubmit={async (body) => {
              await deckService.update(deck.id, body)
              setEditing(false)
              reload()
            }}
          />
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="text-4xl">{deck.icon}</span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{deck.name}</h1>
                {deck.description && <p className="mt-1 text-sm text-slate-500">{deck.description}</p>}
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  {t.decks.wordCount(deck.word_count)}
                  {deck.due_count > 0 && <span className="text-rose-600"> · {t.decks.dueCount(deck.due_count)}</span>}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {deck.word_count > 0 && <ButtonLink href={`/review/vocabulary?deck=${deck.id}`}>{t.decks.practiceBtn}</ButtonLink>}
              <Button variant="secondary" onClick={() => setEditing(true)}>
                {t.decks.editBtn}
              </Button>
              <Button variant="danger" onClick={onDelete}>
                {t.decks.deleteBtn}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {deck.words.length === 0 ? (
        <EmptyState icon="📭" title={t.decks.emptyWords}>
          {t.decks.emptyWordsHint}
        </EmptyState>
      ) : (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {deck.words.map((word) => (
              <li key={word.vocabulary_id} className="flex flex-col gap-3 px-4 py-3 sm:px-6">
                <div className="flex flex-wrap items-center gap-3">
                  {word.image_url ? (
                    <img src={resolveMediaUrl(word.image_url)} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <span className="w-10 text-center text-2xl">{word.image_emoji || '📘'}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {word.term} {word.phonetic && <span className="font-normal text-slate-400">/{word.phonetic}/</span>}
                    </p>
                    <p className="truncate text-sm text-slate-500">{word.meaning}</p>
                    <p className="text-xs text-slate-400">
                      {t.decks.practiceCount(word.practice_count)}
                      {word.next_review_at && ` · ${t.decks.nextReview(formatDate(word.next_review_at))}`}
                    </p>
                  </div>
                  <LevelBadge level={word.level} />
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setMoveWord(moveWord === word.vocabulary_id ? null : word.vocabulary_id)}
                    >
                      {t.decks.moveCopyBtn}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => onRemove(word)}>
                      {t.decks.removeWordBtn}
                    </Button>
                  </div>
                </div>
                {moveWord === word.vocabulary_id && (
                  <MoveCopyPanel
                    deckId={deck.id}
                    word={word}
                    targets={otherDecks}
                    onDone={(message, moved) => {
                      toast(message, 'success')
                      setMoveWord(null)
                      if (moved) reload()
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

/** Chọn list đích rồi Chuyển (thêm sang đích + bỏ khỏi list này) hoặc Sao chép (chỉ thêm sang đích) */
function MoveCopyPanel({
  deckId,
  word,
  targets,
  onDone,
}: {
  deckId: string
  word: DeckWord
  targets: { id: string; name: string; icon: string }[]
  onDone: (message: string, moved: boolean) => void
}) {
  const t = useTranslation()
  // targets có thể tải xong SAU khi panel mở — chưa chọn gì thì mặc định list đầu tiên
  const [targetId, setTargetId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const target = targets.find((d) => d.id === targetId) ?? targets[0]

  if (targets.length === 0) return <p className="text-sm text-slate-500">{t.decks.noOtherDecks}</p>

  const run = async (move: boolean) => {
    if (!target) return
    setBusy(true)
    setError(null)
    try {
      await deckService.addWord(target.id, word.vocabulary_id)
      if (move) await deckService.removeWord(deckId, word.vocabulary_id)
      onDone(move ? t.decks.moved(target.name) : t.decks.copied(target.name), move)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl bg-slate-50 p-3">
      <label className="block min-w-48 flex-1 text-sm font-medium text-slate-700">
        {t.decks.targetDeckLabel}
        <select value={target?.id ?? ''} onChange={(e) => setTargetId(e.target.value)} className={inputClass}>
          {targets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.icon} {d.name}
            </option>
          ))}
        </select>
      </label>
      <Button size="sm" onClick={() => run(true)} disabled={busy}>
        {t.decks.moveBtn}
      </Button>
      <Button size="sm" variant="secondary" onClick={() => run(false)} disabled={busy}>
        {t.decks.copyBtn}
      </Button>
      {error && <p className="w-full text-sm text-rose-600">{error}</p>}
    </div>
  )
}
