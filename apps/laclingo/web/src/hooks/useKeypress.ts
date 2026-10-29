'use client'

import { useEffect } from 'react'

/** Đang gõ/chọn trong ô nhập liệu — phím tắt toàn trang không được bắt phím lúc này */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')
}

/**
 * Lắng nghe phím tắt; bỏ qua khi đang gõ trong input/textarea/select.
 * Handler trả về true nếu đã xử lý phím — khi đó chặn hành vi mặc định (vd: Space cuộn trang).
 */
export function useKeypress(handler: (key: string) => boolean | void, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return
      if (handler(e.key)) e.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handler, enabled])
}
