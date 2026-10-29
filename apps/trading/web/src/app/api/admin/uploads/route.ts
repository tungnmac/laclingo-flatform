import { NextResponse } from 'next/server'
import { requireAdmin } from '@/server/auth/require-user'
import { handleRoute, HttpError } from '@/server/http'
import { MAX_IMAGE_MB } from '@/server/learn/image'
import { uploadLessonImage } from '@/server/learn/media'

export const dynamic = 'force-dynamic'

export const POST = handleRoute(async (req: Request) => {
  await requireAdmin()
  // Từ chối body quá lớn TRƯỚC khi đọc vào bộ nhớ (ảnh ≤ MAX_IMAGE_MB, cộng phần đầu multipart)
  const length = Number(req.headers.get('content-length'))
  if (!length) throw new HttpError(411, 'INVALID_IMAGE') // body chunked không khai kích thước → không đọc
  if (length > (MAX_IMAGE_MB + 0.5) * 1024 * 1024) throw new HttpError(400, 'IMAGE_TOO_LARGE', { max: MAX_IMAGE_MB })
  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) throw new HttpError(400, 'INVALID_IMAGE')
  return NextResponse.json(await uploadLessonImage(file), { status: 201 })
})
