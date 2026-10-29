import { NextResponse } from 'next/server'
import { listUsersAdmin, userListSchema } from '@/server/admin/user-admin'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async (req: Request) => {
  await requireAdmin()
  return NextResponse.json(await listUsersAdmin(userListSchema.parse(Object.fromEntries(new URL(req.url).searchParams))))
})
