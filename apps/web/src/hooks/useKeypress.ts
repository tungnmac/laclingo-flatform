'use client'

import { useEffect } from 'react'

/**
 * Lắng nghe phím tắt; bỏ qua khi đang gõ trong input/textarea.
 * Handler trả về true nếu đã xử lý phím — khi đó chặn hành vi mặc định (vd: Space cuộn trang).
 */
export function useKeypress(handler: (key: string) => boolean | void, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (handler(e.key)) e.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handler, enabled])
}
