import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { createLesson } from '@/server/learn/admin-service'
import { lessonSchema } from '@/server/learn/validation'

export const POST = handleRoute(async (req: Request) => {
  await requireAdmin()
  return NextResponse.json(await createLesson(lessonSchema.parse(await readJson(req))), { status: 201 })
})
