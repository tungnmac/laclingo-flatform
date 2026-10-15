import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { getSessionById } from '@/server/practice/practice-service'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async (_req: Request, ctx: { params: { id: string } }) => {
  const user = await requireUser()
  return NextResponse.json(await getSessionById(user.id, ctx.params.id))
})
