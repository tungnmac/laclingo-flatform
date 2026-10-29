'use client'

import { useEffect, useRef } from 'react'

/** Gọi fn ngay rồi lặp mỗi intervalMs; tạm dừng khi tab bị ẩn, chạy lại ngay khi hiện. */
export function usePolling(fn: () => void | Promise<void>, intervalMs: number, deps: unknown[]) {
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined
    const tick = () => void fnRef.current()
    const start = () => {
      if (timer) return
      tick()
      timer = setInterval(tick, intervalMs)
    }
    const stop = () => {
      if (timer) clearInterval(timer)
      timer = undefined
    }
    const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop())
    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, ...deps])
}
