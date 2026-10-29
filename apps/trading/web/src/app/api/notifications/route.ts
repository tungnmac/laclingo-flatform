import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { listNotifications } from '@/server/notifications/notification-service'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async () => {
  const user = await requireUser()
  return NextResponse.json(await listNotifications(user.id))
})
