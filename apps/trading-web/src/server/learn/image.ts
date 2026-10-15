export const MAX_IMAGE_MB = 5
export type ImageExt = 'jpg' | 'png' | 'webp' | 'gif'
export const CONTENT_TYPES: Record<ImageExt, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }

const startsWith = (head: Uint8Array, sig: number[], offset = 0) =>
  head.length >= offset + sig.length && sig.every((b, i) => head[offset + i] === b)
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0))

/** Nhận diện ảnh theo magic bytes — không tin tên file / Content-Type client gửi */
export function sniffImage(head: Uint8Array): ImageExt | null {
  if (startsWith(head, [0xff, 0xd8, 0xff])) return 'jpg'
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png'
  if (startsWith(head, ascii('GIF87a')) || startsWith(head, ascii('GIF89a'))) return 'gif'
  if (startsWith(head, ascii('RIFF')) && startsWith(head, ascii('WEBP'), 8)) return 'webp'
  return null
}

/** Chỉ nhận đúng tên do upload sinh ra — chặn path traversal ở route public */
export const MEDIA_NAME_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|gif)$/
export const isMediaName = (name: string) => MEDIA_NAME_RE.test(name)
