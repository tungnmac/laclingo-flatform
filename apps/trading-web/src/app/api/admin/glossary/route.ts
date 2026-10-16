import { NextResponse } from 'next/server'
import { z } from 'zod'
import { LOCALES } from '@/i18n/locales'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { createTerm, listGlossaryAdmin } from '@/server/library/library-service'
import { termSchema } from '@/server/library/validation'

export const dynamic = 'force-dynamic'
const query = z.object({ locale: z.enum(LOCALES, 'INVALID_INPUT').default('vi') })

export const GET = handleRoute(async (req: Request) => {
  await requireAdmin()
  const { locale } = query.parse(Object.fromEntries(new URL(req.url).searchParams))
  return NextResponse.json(await listGlossaryAdmin(locale))
})

export const POST = handleRoute(async (req: Request) => {
  await requireAdmin()
  return NextResponse.json(await createTerm(termSchema.parse(await readJson(req))), { status: 201 })
})
