import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { createChapter } from '@/server/learn/admin-service'
import { chapterSchema } from '@/server/learn/validation'

export const POST = handleRoute(async (req: Request) => {
  await requireAdmin()
  return NextResponse.json(await createChapter(chapterSchema.parse(await readJson(req))), { status: 201 })
})
