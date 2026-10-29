'use client'

import { useEffect, useState } from 'react'

/** true sau khi component mount ở client — tránh lệch SSR khi đọc localStorage */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return hydrated
}
