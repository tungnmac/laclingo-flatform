import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { saveNote } from '@/server/journal/journal-service'
import { noteSchema } from '@/server/journal/validation'

export const PUT = handleRoute(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser()
  const input = noteSchema.parse(await readJson(req))
  return NextResponse.json(await saveNote(user.id, (await ctx.params).id, input))
})
