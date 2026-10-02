'use client'

import { useSession } from '@/store/session'
import type { ChallengeRoomDetail } from '@/types/api'
import { useChallengeSocket } from '../hooks/useChallengeSocket'
import { FinalResultsView } from './FinalResultsView'
import { LobbyView } from './LobbyView'
import { QuestionView } from './QuestionView'

/** Phòng đang waiting/in_progress — mở WebSocket và render đúng màn theo phase. */
export function LiveRoomView({ room, onParticipantChange }: { room: ChallengeRoomDetail; onParticipantChange: () => void }) {
  const me = useSession((s) => s.user)
  const socket = useChallengeSocket(room.id, onParticipantChange)
  const isHost = me?.id === room.host_user_id

  if (socket.phase === 'finished') {
    return <FinalResultsView leaderboard={socket.leaderboard} myUserId={me?.id} />
  }

  if (socket.phase === 'question' || socket.phase === 'reveal') {
    return (
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
  }

  return (
    <LobbyView room={room} isHost={isHost} connected={socket.connected} wsError={socket.wsError} onStart={socket.startGame} />
  )
}
