import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { advanceSession } from '@/server/practice/practice-service'
import { advanceSchema } from '@/server/practice/validation'

export const POST = handleRoute(async (req: Request) => {
  const user = await requireUser()
  const { steps } = advanceSchema.parse(await readJson(req))
  return NextResponse.json(await advanceSession(user.id, steps))
})
