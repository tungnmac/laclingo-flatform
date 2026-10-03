'use client'

import { useState, type FormEvent } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import type { ChallengeRoomDetail } from '@/types/api'
import { challengeService } from '../challenge.service'
import { KickButton } from './KickButton'
import { ReadyToggle } from './ReadyToggle'
import { participantName } from '../utils'

export function LobbyView({
  room,
  isHost,
  myUserId,
  connected,
  wsError,
  readyMap,
  onStart,
  onSetReady,
  onKick,
}: {
  room: ChallengeRoomDetail
  isHost: boolean
  myUserId?: string
  connected: boolean
  wsError: string | null
  readyMap: Record<string, boolean>
  onStart: () => void
  onSetReady: (ready: boolean) => void
  onKick: (userId: string) => void
}) {
  const others = room.participants.filter((p) => p.user_id !== room.host_user_id)
  const allReady = others.every((p) => readyMap[p.user_id])
  const iAmReady = myUserId ? !!readyMap[myUserId] : false

  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  const onInvite = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const username = String(form.get('username') ?? '').trim()
    if (!username) return
    setInviting(true)
    setInviteError(null)
    setInviteSuccess(null)
    try {
      await challengeService.inviteByUsername(room.id, username)
      setInviteSuccess(`Đã mời ${username} vào phòng.`)
      e.currentTarget.reset()
    } catch (err) {
      setInviteError((err as Error).message)
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="text-center">
        <p className="text-sm text-slate-500">Mã phòng — đọc cho bạn bè để tham gia</p>
        <p className="mt-2 text-4xl font-bold tracking-[0.3em] text-indigo-600">{room.code}</p>
        <p className="mt-2 text-xs text-slate-400">
          {!connected ? 'Đang kết nối...' : `${room.question_count} câu · ${room.time_per_question_seconds}s/câu`}
        </p>
        {(room.is_practice || room.difficulty) && (
          <div className="mt-3 flex justify-center gap-2">
            {room.is_practice && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                Luyện tập — không xếp hạng
              </span>
            )}
            {room.difficulty && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">Độ khó {room.difficulty}</span>
            )}
          </div>
        )}
      </Card>

      {wsError && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-center text-sm text-rose-700 ring-1 ring-rose-200">
          {wsError}
        </p>
      )}

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Người tham gia ({room.participants.length})</h3>
        <ul className="space-y-2">
          {room.participants.map((p) => {
            const isRoomHost = p.user_id === room.host_user_id
            const ready = readyMap[p.user_id]
            return (
              <li key={p.user_id} className="flex items-center gap-3">
                <Avatar name={participantName(p)} src={p.avatar_url || undefined} className="h-9 w-9 text-sm" />
                <span className="flex-1 font-medium text-slate-900">{participantName(p)}</span>
                {isRoomHost ? (
                  <span className="text-xs text-indigo-600">Chủ phòng</span>
                ) : (
                  <span className={cn('text-xs font-medium', ready ? 'text-emerald-600' : 'text-slate-400')}>
                    {ready ? '✅ Sẵn sàng' : '⏳ Chưa sẵn sàng'}
                  </span>
                )}
                {isHost && !isRoomHost && <KickButton onKick={() => onKick(p.user_id)} />}
              </li>
            )
          })}
        </ul>
      </Card>

      {isHost && (
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Mời theo username</h3>
          <p className="mb-3 text-xs text-slate-500">Thêm trực tiếp người này vào phòng — kể cả người vừa bị mời ra trước đó.</p>
          <form onSubmit={onInvite} className="flex gap-2">
            <input
              name="username"
              type="text"
              placeholder="nguyenvana"
              className="flex-1 rounded-lg border-0 px-3 py-2 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
            />
            <Button type="submit" variant="secondary" size="sm" disabled={inviting}>
              {inviting ? 'Đang mời...' : 'Mời'}
            </Button>
          </form>
          {inviteError && <p className="mt-2 text-xs text-rose-600">{inviteError}</p>}
          {inviteSuccess && <p className="mt-2 text-xs text-emerald-600">{inviteSuccess}</p>}
        </Card>
      )}

      {!isHost && <ReadyToggle ready={iAmReady} onToggle={onSetReady} />}

      {isHost ? (
        <Button size="lg" className="w-full" disabled={!connected || !allReady} onClick={onStart}>
          {!allReady ? 'Chờ mọi người sẵn sàng...' : 'Bắt đầu trò chơi'}
        </Button>
      ) : (
        <p className="text-center text-sm text-slate-500">Đang chờ chủ phòng bắt đầu...</p>
      )}
    </div>
  )
}
