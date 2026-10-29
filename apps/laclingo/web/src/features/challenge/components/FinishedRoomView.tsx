'use client'

import { ErrorState, Spinner } from '@/components/ui/States'
import { useApi } from '@/hooks/useApi'
import { useSession } from '@/store/session'
import { challengeService } from '../challenge.service'
import { FinalResultsView } from './FinalResultsView'

/**
 * Phòng đã finished/cancelled từ trước khi user vào — đọc thẳng leaderboard
 * qua REST, KHÔNG mở WebSocket (Hub đã reap room, mở lại sẽ tạo Room mới ở
 * trạng thái "waiting" sai lệch với status thật trong DB).
 */
export function FinishedRoomView({ roomId }: { roomId: string }) {
  const me = useSession((s) => s.user)
  const { data, error, loading, reload } = useApi(() => challengeService.getLeaderboard(roomId), [roomId])

  if (loading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={reload} />

  return <FinalResultsView leaderboard={data ?? []} myUserId={me?.id} />
}
