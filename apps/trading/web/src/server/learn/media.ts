import { randomUUID } from 'node:crypto'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2Config } from '../env'
import { HttpError } from '../http'
import { CONTENT_TYPES, isMediaName, MAX_IMAGE_MB, sniffImage } from './image'

const PREFIX = 'trading/lessons/'
const PRESIGN_TTL_SECONDS = 3600

const g = globalThis as unknown as { tradingR2?: { client: S3Client; bucket: string } }

/** 1 client R2 mỗi process; chưa cấu hình → UPLOAD_UNAVAILABLE (các phần khác vẫn chạy) */
function r2() {
  if (g.tradingR2) return g.tradingR2
  const cfg = r2Config()
  if (!cfg) throw new HttpError(503, 'UPLOAD_UNAVAILABLE')
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  })
  return (g.tradingR2 = { client, bucket: cfg.bucket })
}

export async function uploadLessonImage(file: File): Promise<{ url: string }> {
  const { client, bucket } = r2() // kiểm tra cấu hình TRƯỚC khi đọc file
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) throw new HttpError(400, 'IMAGE_TOO_LARGE', { max: MAX_IMAGE_MB })
  const body = new Uint8Array(await file.arrayBuffer())
  const ext = sniffImage(body.subarray(0, 16))
  if (!ext) throw new HttpError(400, 'INVALID_IMAGE')
  const name = `${randomUUID()}.${ext}`
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: PREFIX + name, Body: body, ContentType: CONTENT_TYPES[ext] }))
  return { url: `/api/media/${name}` }
}

/** Link tạm (presigned) tới ảnh — tên phải đúng dạng do upload sinh ra */
export async function mediaUrl(name: string): Promise<string> {
  if (!isMediaName(name)) throw new HttpError(404, 'NOT_FOUND')
  const { client, bucket } = r2()
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: PREFIX + name }), { expiresIn: PRESIGN_TTL_SECONDS })
}
