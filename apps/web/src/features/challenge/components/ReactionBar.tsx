'use client'

import type { ChallengeParticipant } from '@/types/api'
import type { ReactionEntry } from '../hooks/useChallengeSocket'
import { participantName } from '../utils'

const REACTIONS = ['👍', '🔥', '😂', '😮', '❤️', '👏']

/** Dãy nút bắn emoji nhanh — không có text, chỉ 1 whitelist cố định (khớp backend). */
export function ReactionBar({ onReact }: { onReact: (emoji: string) => void }) {
  return (
    <div className="flex justify-center gap-1 border-t border-slate-200 p-2">
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onReact(emoji)}
          className="rounded-full px-2 py-1 text-xl transition hover:scale-125 hover:bg-slate-100"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

/** Lớp phủ nổi hiện các reaction gần nhất rồi tự biến mất (prune ở hook). */
export function ReactionOverlay({ reactions, participants }: { reactions: ReactionEntry[]; participants: ChallengeParticipant[] }) {
  if (reactions.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-30 flex flex-col items-end gap-1 sm:bottom-4">
      {reactions.slice(-5).map((r) => {
        const p = participants.find((x) => x.user_id === r.userId)
        return (
          <div key={r.id} className="animate-pop-in rounded-full bg-white px-3 py-1 text-sm shadow-md ring-1 ring-slate-200">
            <span className="mr-1 text-lg">{r.emoji}</span>
            <span className="text-slate-600">{p ? participantName(p) : 'Người chơi'}</span>
          </div>
        )
      })}
    </div>
  )
}
