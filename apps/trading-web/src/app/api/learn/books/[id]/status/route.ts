import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { setBookStatus } from '@/server/library/library-service'
import { bookStatusSchema } from '@/server/library/validation'

export const PUT = handleRoute(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser()
  const { status } = bookStatusSchema.parse(await readJson(req))
  return NextResponse.json(await setBookStatus(user.id, (await ctx.params).id, status))
})
