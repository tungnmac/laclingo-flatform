'use client'

import { useEffect, useState } from 'react'

/** Trả về giá trị trễ delayMs sau lần đổi cuối — dùng cho search input để không gọi API mỗi lần gõ phím */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
