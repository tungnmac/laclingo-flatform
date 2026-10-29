import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { closePracticePosition } from '@/server/practice/practice-service'

export const POST = handleRoute(async () => {
  const user = await requireUser()
  return NextResponse.json(await closePracticePosition(user.id))
})
