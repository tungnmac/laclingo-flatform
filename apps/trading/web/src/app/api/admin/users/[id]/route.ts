import { NextResponse } from 'next/server'
import { z } from 'zod'
import { updateUserAdmin, userActionSchema } from '@/server/admin/user-admin'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, HttpError, readJson } from '@/server/http'

export const dynamic = 'force-dynamic'

export const PATCH = handleRoute(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin()
  const { id } = await ctx.params
  if (!z.uuid().safeParse(id).success) throw new HttpError(404, 'NOT_FOUND')
  return NextResponse.json(await updateUserAdmin(admin, id, userActionSchema.parse(await readJson(req))))
})
