'use client'

import { useEffect, useRef } from 'react'

const FOCUSABLE = 'input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
const HEADER_OFFSET = 80 // thanh menu dính đầu trang (khớp scroll-mt-20)

/**
 * Mở form sửa / tạo (hoặc chuyển sang sửa dòng khác) → cuộn tới form (nếu đang khuất) và đặt con trỏ vào ô
 * có `data-autofocus`, không có thì ô nhập đầu tiên. Bỏ qua khi con trỏ đã ở trong form (vd vừa bấm Lưu —
 * id đổi từ "new" sang id thật không được kéo trang / giật focus).
 * `trigger`: giá trị đổi mỗi khi cần nhảy tới (vd id dòng đang sửa); null/undefined = form chưa hiện.
 * Gắn ref vào phần tử bọc form; nên kèm class `scroll-mt-20` để không bị thanh menu dính (sticky) che.
 */
export function useFocusOnOpen<T extends HTMLElement = HTMLElement>(trigger: unknown) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (trigger === null || trigger === undefined || trigger === false) return
    // chờ 1 frame để form vừa render xong
    const id = requestAnimationFrame(() => {
      const el = ref.current
      if (!el || el.contains(document.activeElement)) return
      const { top } = el.getBoundingClientRect()
      if (top < HEADER_OFFSET || top > window.innerHeight - HEADER_OFFSET) {
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
      }
      ;(el.querySelector<HTMLElement>('[data-autofocus]') ?? el.querySelector<HTMLElement>(FOCUSABLE))?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(id)
  }, [trigger])
  return ref
}
