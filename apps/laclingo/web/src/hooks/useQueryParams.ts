'use client'

import { useSearchParams } from 'next/navigation'

/**
 * Đọc query trên URL ở client. Trang dùng được khi offline phải dùng hook này thay cho props searchParams của server:
 * service worker (public/sw.js) trả bản lưu KHÔNG query string cho mọi query, props của bản đó không khớp URL thật.
 * Cần bọc trang trong <Suspense> (useSearchParams).
 */
export function useQueryParams<K extends string>(...keys: K[]): Partial<Record<K, string>> {
  const params = useSearchParams()
  return Object.fromEntries(keys.map((k) => [k, params.get(k) ?? undefined])) as Partial<Record<K, string>>
}
