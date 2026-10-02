'use client'

import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { ChallengeRoomDetail } from '@/types/api'
import { participantName } from '../utils'

export function LobbyView({
  room,
  isHost,
  connected,
  wsError,
  onStart,
}: {
  room: ChallengeRoomDetail
  isHost: boolean
  connected: boolean
  wsError: string | null
  onStart: () => void
}) {
  return (
    <div className="space-y-6">
      <Card className="text-center">
        <p className="text-sm text-slate-500">Mã phòng — đọc cho bạn bè để tham gia</p>
        <p className="mt-2 text-4xl font-bold tracking-[0.3em] text-indigo-600">{room.code}</p>
        <p className="mt-2 text-xs text-slate-400">
          {!connected ? 'Đang kết nối...' : `${room.question_count} câu · ${room.time_per_question_seconds}s/câu`}
        </p>
      </Card>

      {wsError && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-center text-sm text-rose-700 ring-1 ring-rose-200">
          {wsError}
        </p>
      )}

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Người tham gia ({room.participants.length})</h3>
        <ul className="space-y-2">
          {room.participants.map((p) => (
            <li key={p.user_id} className="flex items-center gap-3">
              <Avatar name={participantName(p)} src={p.avatar_url || undefined} className="h-9 w-9 text-sm" />
              <span className="font-medium text-slate-900">{participantName(p)}</span>
              {p.user_id === room.host_user_id && <span className="text-xs text-indigo-600">(chủ phòng)</span>}
            </li>
          ))}
        </ul>
      </Card>

      {isHost ? (
        <Button size="lg" className="w-full" disabled={!connected || room.participants.length < 1} onClick={onStart}>
          Bắt đầu trò chơi
        </Button>
      ) : (
        <p className="text-center text-sm text-slate-500">Đang chờ chủ phòng bắt đầu...</p>
      )}
    </div>
  )
}
