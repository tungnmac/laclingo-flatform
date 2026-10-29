import { NextResponse } from 'next/server'
import { requireUser } from '@/server/auth/require-user'
import { handleRoute } from '@/server/http'
import { resetAccount } from '@/server/trading/account-service'

export const POST = handleRoute(async () => {
  const user = await requireUser()
  return NextResponse.json(await resetAccount(user.id))
})
