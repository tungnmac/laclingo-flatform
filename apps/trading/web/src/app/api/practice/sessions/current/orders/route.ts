import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { placePracticeOrder } from '@/server/practice/practice-service'
import { practiceOrderSchema } from '@/server/practice/validation'

export const POST = handleRoute(async (req: Request) => {
  const user = await requireUser()
  return NextResponse.json(await placePracticeOrder(user.id, practiceOrderSchema.parse(await readJson(req))))
})
