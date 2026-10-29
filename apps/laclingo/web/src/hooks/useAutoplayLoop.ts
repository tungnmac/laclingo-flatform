'use client'

import { useCallback, useRef, useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { shouldLoopAgain, useAutoplaySettings } from '@/store/autoplaySettings'

/**
 * Đếm vòng "lặp lại cả danh sách" cho đọc tự động (dùng chung trang chủ đề và
 * ôn SRS). Gọi start() khi bật tự động đọc; khi đọc xong từ cuối danh sách gọi
 * endOfList() — trả true = đọc tiếp vòng mới (caller tự quay về đầu danh sách),
 * false = dừng. Luôn đọc cài đặt mới nhất (đổi cài đặt giữa chừng áp dụng ngay).
 */
export function useAutoplayLoop() {
  const t = useTranslation()
  const loopMode = useAutoplaySettings((s) => s.loopMode)
  const loopCount = useAutoplaySettings((s) => s.loopCount)
  const [pass, setPass] = useState(1)
  const latest = useRef({ loopMode, loopCount, pass })
  latest.current = { loopMode, loopCount, pass }

  const start = useCallback(() => setPass(1), [])

  const endOfList = useCallback(() => {
    const { loopMode: mode, loopCount: count, pass: done } = latest.current
    if (!shouldLoopAgain(mode, count, done)) return false
    setPass(done + 1)
    return true
  }, [])

  // "Vòng 2/3" — không hiện tổng nhỏ hơn vòng hiện tại khi vừa giảm số vòng giữa chừng
  const label = loopMode === 'once' ? null : t.review.loopPass(pass, loopMode === 'count' ? Math.max(pass, loopCount) : null)

  return { pass, start, endOfList, label }
}
