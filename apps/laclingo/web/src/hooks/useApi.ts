'use client'

import { useCallback, useEffect, useState } from 'react'

import { useLocale } from '@/store/locale'

interface ApiState<T> {
  data: T | null
  error: Error | null
  loading: boolean
  reload: () => void
}

/**
 * Gọi một hàm fetch khi mount / khi deps đổi / khi đổi ngôn ngữ giao diện (nội dung học trả về theo ngôn ngữ đó).
 * Truyền `enabled = false` để hoãn (ví dụ khi chưa có user).
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[], enabled = true): ApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [version, setVersion] = useState(0)
  const locale = useLocale((s) => s.locale)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setLoading(true)
    setError(null)
    fetcher()
      .then((res) => !cancelled && setData(res))
      .catch((err: Error) => !cancelled && setError(err))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, version, locale])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  return { data, error, loading, reload }
}
