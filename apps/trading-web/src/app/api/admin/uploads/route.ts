import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, HttpError } from '@/server/http'
import { uploadLessonImage } from '@/server/learn/media'

export const dynamic = 'force-dynamic'

export const POST = handleRoute(async (req: Request) => {
  await requireAdmin()
  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) throw new HttpError(400, 'INVALID_IMAGE')
  return NextResponse.json(await uploadLessonImage(file), { status: 201 })
})
