'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { cn } from '@/lib/utils'
import type { ChallengeParticipant } from '@/types/api'
import type { ChatEntry } from '../hooks/useChallengeSocket'
import { participantName } from '../utils'

function resolveName(participants: ChallengeParticipant[], userId: string) {
  const p = participants.find((x) => x.user_id === userId)
  return p ? participantName(p) : 'Người chơi'
}

/** Khung chat trong phòng — ephemeral (không lưu lịch sử), tên resolve từ participant list vì WS chỉ gửi user_id. */
export function ChatPanel({
  messages,
  participants,
  myUserId,
  onSend,
}: {
  messages: ChatEntry[]
  participants: ChallengeParticipant[]
  myUserId?: string
  onSend: (message: string) => void
}) {
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages.length])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    onSend(text)
    setDraft('')
  }

  return (
    <div className="flex h-72 flex-col">
      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
        {messages.length === 0 && <p className="text-center text-xs text-slate-400">Chưa có tin nhắn nào.</p>}
        {messages.map((m, i) => (
          <p key={i} className="text-sm leading-snug">
            <span className={cn('font-semibold', m.userId === myUserId ? 'text-indigo-600' : 'text-slate-700')}>
              {resolveName(participants, m.userId)}:
            </span>{' '}
            <span className="text-slate-700">{m.message}</span>
          </p>
        ))}
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-slate-200 p-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={200}
          placeholder="Nhập tin nhắn..."
          className="flex-1 rounded-lg border-0 px-3 py-2 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
        />
        <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
          Gửi
        </button>
      </form>
    </div>
  )
}
