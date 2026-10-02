'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { ErrorState, Spinner } from '@/components/ui/States'
import { FinishedRoomView } from '@/features/challenge/components/FinishedRoomView'
import { LiveRoomView } from '@/features/challenge/components/LiveRoomView'
import { challengeService } from '@/features/challenge/challenge.service'
import { useApi } from '@/hooks/useApi'

export default function ChallengeRoomPage({ params }: { params: { roomId: string } }) {
  const { data: room, error, loading, reload } = useApi(() => challengeService.getRoom(params.roomId), [params.roomId])

  return (
    <div className="space-y-6">
      <PageHeader title="Phòng thử thách" />

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {room &&
        (room.status === 'finished' || room.status === 'cancelled' ? (
          <FinishedRoomView roomId={params.roomId} />
        ) : (
          <LiveRoomView room={room} onParticipantChange={reload} />
        ))}
    </div>
  )
}
