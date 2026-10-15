'use client'

import { useCallback, useState } from 'react'
import { api } from '@/lib/api'
import type { AccountSnapshot } from '@/server/trading/account-service'
import { usePolling } from './usePolling'

/** Ví ảo của user — poll định kỳ (mỗi lần poll server quyết toán lệnh chờ trước khi trả về). */
export function useAccount(pollMs = 3000) {
  const [data, setData] = useState<AccountSnapshot | null>(null)
  const [error, setError] = useState<unknown>(null)
  const reload = useCallback(async () => {
    try {
      setData(await api<AccountSnapshot>('/api/trading/account'))
      setError(null)
    } catch (err) {
      setError(err)
    }
  }, [])
  usePolling(reload, pollMs, [reload])
  return { data, error, reload }
}
