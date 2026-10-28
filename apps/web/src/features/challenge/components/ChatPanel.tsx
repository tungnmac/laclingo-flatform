'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'

// Server nhận tối đa 1 tin / 800ms mỗi người — chặn sớm ở đây để tin không bị nuốt mất (giữ nguyên nội dung đang gõ)
const CHAT_MIN_INTERVAL_MS = 800
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'
import type { ChallengeParticipant } from '@/types/api'
import type { ChatEntry } from '../hooks/useChallengeSocket'
import { participantName } from '../utils'

function resolveName(participants: ChallengeParticipant[], userId: string, fallback: string) {
  const p = participants.find((x) => x.user_id === userId)
  return p ? participantName(p, fallback) : fallback
}

/**
 * Khung chat trong phòng — tên resolve từ participant list vì WS chỉ gửi user_id. Tin của người khác báo cáo / chặn
 * được; tin của người đã chặn chỉ hiện dòng giữ chỗ.
 */
export function ChatPanel({
  messages,
  participants,
  myUserId,
  blockedIds,
  onSend,
  onReport,
  onBlock,
}: {
  messages: ChatEntry[]
  participants: ChallengeParticipant[]
  myUserId?: string
  blockedIds: Set<string>
  onSend: (message: string) => void
  onReport: (messageId: string) => void
  onBlock: (userId: string, name: string) => void
}) {
  const [draft, setDraft] = useState('')
  const lastSentRef = useRef(0)
  const listRef = useRef<HTMLDivElement>(null)
  const t = useTranslation()

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages.length])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || Date.now() - lastSentRef.current < CHAT_MIN_INTERVAL_MS) return
    lastSentRef.current = Date.now()
    onSend(text)
    setDraft('')
  }

  return (
    <div className="flex h-72 flex-col">
      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
        {messages.length === 0 && <p className="text-center text-xs text-slate-400">{t.challenges.noMessagesYet}</p>}
        {messages.map((m, i) => {
          const name = resolveName(participants, m.userId, t.challenges.defaultPlayerName)
          if (blockedIds.has(m.userId)) {
            return (
              <p key={m.id || `${m.sentAt}-${m.userId}-${i}`} className="text-xs italic text-slate-400">
                🚫 {t.moderation.blockedChat}
              </p>
            )
          }
          const mine = m.userId === myUserId
          return (
            <p key={m.id || `${m.sentAt}-${m.userId}-${i}`} className="group text-sm leading-snug">
              <span className={cn('font-semibold', mine ? 'text-indigo-600' : 'text-slate-700')}>{name}:</span>{' '}
              <span className="text-slate-700">{m.message}</span>
              {!mine && (
                // Máy có chuột: hiện khi rê vào tin; màn hình cảm ứng: luôn hiện
                <span className="ml-1 inline-flex align-middle [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
                  {m.id && (
                    <button
                      type="button"
                      onClick={() => onReport(m.id!)}
                      aria-label={t.moderation.reportChat}
                      title={t.moderation.reportChat}
                      className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      🚩
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onBlock(m.userId, name)}
                    aria-label={t.moderation.block(name)}
                    title={t.moderation.block(name)}
                    className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    🚫
                  </button>
                </span>
              )}
            </p>
          )
        })}
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-slate-200 p-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={200}
          placeholder={t.challenges.chatPlaceholder}
          className="flex-1 rounded-lg border-0 px-3 py-2 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
        />
        <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
          {t.challenges.sendBtn}
        </button>
      </form>
    </div>
  )
}
