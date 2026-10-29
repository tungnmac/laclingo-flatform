import { NextResponse } from 'next/server'
import { getMobileAppSettings, mobileAppSchema, setMobileAppSettings } from '@/server/admin/app-settings'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async () => {
  await requireAdmin()
  return NextResponse.json(await getMobileAppSettings())
})

export const PUT = handleRoute(async (req: Request) => {
  await requireAdmin()
  return NextResponse.json(await setMobileAppSettings(mobileAppSchema.parse(await readJson(req))))
})
