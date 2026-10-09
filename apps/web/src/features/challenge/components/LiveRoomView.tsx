'use client'

import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useTranslation } from '@/hooks/useTranslation'
import { useSession } from '@/store/session'
import type { ChallengeRoomDetail } from '@/types/api'
import { useChallengeSocket } from '../hooks/useChallengeSocket'
import { ChatPanel } from './ChatPanel'
import { FinalResultsView } from './FinalResultsView'
import { LobbyView } from './LobbyView'
import { QuestionView } from './QuestionView'
import { ReactionBar, ReactionOverlay } from './ReactionBar'

/** Phòng đang waiting/in_progress — mở WebSocket và render đúng màn theo phase. */
export function LiveRoomView({ room, onParticipantChange }: { room: ChallengeRoomDetail; onParticipantChange: () => void }) {
  const router = useRouter()
  const me = useSession((s) => s.user)
  const socket = useChallengeSocket(room.id, onParticipantChange)
  const isHost = me?.id === room.host_user_id
  const [chatOpen, setChatOpen] = useState(false)
  const t = useTranslation()

  if (socket.kicked) {
    return (
      <Card className="space-y-4 text-center">
        <p className="text-4xl">🚫</p>
        <p className="font-semibold text-slate-900">{socket.kicked.reason}</p>
        <ButtonLink href="/challenges">{t.challenges.backToChallenges}</ButtonLink>
      </Card>
    )
  }

  const onLeave = () => {
    if (!window.confirm(t.challenges.leaveRoomConfirm)) return
    socket.leaveRoom()
    router.push('/challenges')
  }

  let content: ReactNode
  if (socket.phase === 'finished') {
    content = <FinalResultsView leaderboard={socket.leaderboard} myUserId={me?.id} />
  } else if (socket.phase === 'question' || socket.phase === 'reveal') {
    content = (
      <QuestionView
        phase={socket.phase}
        question={socket.question}
        timeLeft={socket.timeLeft}
        myAnswer={socket.myAnswer}
        answerResult={socket.answerResult}
        reveal={socket.reveal}
        leaderboard={socket.leaderboard}
        myUserId={me?.id}
        onSubmit={socket.submitAnswer}
      />
    )
  } else {
    content = (
      <LobbyView
        room={room}
        isHost={isHost}
        myUserId={me?.id}
        connected={socket.connected}
        wsError={socket.wsError}
        readyMap={socket.readyMap}
        onStart={socket.startGame}
        onSetReady={socket.setReady}
        onKick={socket.kickParticipant}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onLeave}>
          {t.challenges.leaveRoomBtn}
        </Button>
      </div>

      {content}

      <ReactionOverlay reactions={socket.reactions} participants={room.participants} />

      <Card className="p-0 sm:p-0">
        <button
          type="button"
          onClick={() => setChatOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700"
        >
          {t.challenges.chatReactionToggle}
          <span className="text-slate-400">{chatOpen ? '▲' : '▼'}</span>
        </button>
        {chatOpen && (
          <div className="border-t border-slate-200">
            <ChatPanel messages={socket.chatMessages} participants={room.participants} myUserId={me?.id} onSend={socket.sendChat} />
            <ReactionBar onReact={socket.sendReaction} />
          </div>
        )}
      </Card>
    </div>
  )
}
