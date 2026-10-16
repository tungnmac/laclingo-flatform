import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, readJson } from '@/server/http'
import { createBook, listBooksAdmin } from '@/server/library/library-service'
import { bookSchema } from '@/server/library/validation'

export const dynamic = 'force-dynamic'

export const GET = handleRoute(async () => {
  await requireAdmin()
  return NextResponse.json(await listBooksAdmin())
})

export const POST = handleRoute(async (req: Request) => {
  await requireAdmin()
  return NextResponse.json(await createBook(bookSchema.parse(await readJson(req))), { status: 201 })
})
