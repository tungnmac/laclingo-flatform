'use client'

import { useState, type FormEvent } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useTranslation } from '@/hooks/useTranslation'
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
  const t = useTranslation()

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
      setInviteSuccess(t.challenges.inviteSuccess(username))
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
        <p className="text-sm text-slate-500">{t.challenges.roomCodeHint}</p>
        <p className="mt-2 text-4xl font-bold tracking-[0.3em] text-indigo-600">{room.code}</p>
        <p className="mt-2 text-xs text-slate-400">
          {!connected ? t.challenges.connecting : t.challenges.questionsCountAndTime(room.question_count, room.time_per_question_seconds)}
        </p>
        {(room.is_practice || room.difficulty) && (
          <div className="mt-3 flex justify-center gap-2">
            {room.is_practice && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                {t.challenges.practiceNoRanking}
              </span>
            )}
            {room.difficulty && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {t.challenges.difficultyBadge(room.difficulty)}
              </span>
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
        <h3 className="mb-3 text-sm font-semibold text-slate-900">{t.challenges.participantsTitle(room.participants.length)}</h3>
        <ul className="space-y-2">
          {room.participants.map((p) => {
            const isRoomHost = p.user_id === room.host_user_id
            const ready = readyMap[p.user_id]
            return (
              <li key={p.user_id} className="flex items-center gap-3">
                <Avatar name={participantName(p, t.challenges.defaultPlayerName)} src={p.avatar_url || undefined} className="h-9 w-9 text-sm" />
                <span className="flex-1 font-medium text-slate-900">{participantName(p, t.challenges.defaultPlayerName)}</span>
                {isRoomHost ? (
                  <span className="text-xs text-indigo-600">{t.challenges.roomHostLabel}</span>
                ) : (
                  <span className={cn('text-xs font-medium', ready ? 'text-emerald-600' : 'text-slate-400')}>
                    {ready ? t.challenges.participantReady : t.challenges.participantNotReady}
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
          <h3 className="mb-2 text-sm font-semibold text-slate-900">{t.challenges.inviteByUsernameTitle}</h3>
          <p className="mb-3 text-xs text-slate-500">{t.challenges.inviteByUsernameDesc}</p>
          <form onSubmit={onInvite} className="flex gap-2">
            <input
              name="username"
              type="text"
              placeholder="username"
              className="flex-1 rounded-lg border-0 px-3 py-2 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
            />
            <Button type="submit" variant="secondary" size="sm" disabled={inviting}>
              {inviting ? t.challenges.inviting : t.challenges.inviteBtn}
            </Button>
          </form>
          {inviteError && <p className="mt-2 text-xs text-rose-600">{inviteError}</p>}
          {inviteSuccess && <p className="mt-2 text-xs text-emerald-600">{inviteSuccess}</p>}
        </Card>
      )}

      {!isHost && <ReadyToggle ready={iAmReady} onToggle={onSetReady} />}

      {isHost ? (
        <Button size="lg" className="w-full" disabled={!connected || !allReady} onClick={onStart}>
          {!allReady ? t.challenges.waitingForReady : t.challenges.startGameBtn}
        </Button>
      ) : (
        <p className="text-center text-sm text-slate-500">{t.challenges.waitingHostStart}</p>
      )}
    </div>
  )
}
