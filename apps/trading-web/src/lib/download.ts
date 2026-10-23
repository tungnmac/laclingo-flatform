import { ApiError } from './api'

/** Tải file từ API (giữ cookie phiên). Lỗi JSON {code} → ném ApiError để trang hiện thông báo (VD PRO_REQUIRED) */
export async function downloadFile(url: string, fallbackName: string): Promise<void> {
  const res = await fetch(url, { credentials: 'same-origin' })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { code?: string; error?: string }
    throw new ApiError(body.error ?? res.statusText, res.status, body.code ?? 'INTERNAL')
  }
  const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? fallbackName
  const href = URL.createObjectURL(await res.blob())
  const a = Object.assign(document.createElement('a'), { href, download: name })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(href), 1000) // thu hồi ngay có thể huỷ tải trên Safari/Firefox
}
