'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Toast {
  id: number
  message: string
  variant: 'success' | 'error'
}

type ToastFn = (message: string, variant?: Toast['variant']) => void

const ToastContext = createContext<ToastFn | null>(null)

const DURATION_MS = 3000

/** Thông báo nổi tạm thời (toast) — gọi toast("Đã lưu") hoặc toast("Lỗi...", "error"). */
export function useToast(): ToastFn {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast phải được gọi trong ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback<ToastFn>((message, variant = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), DURATION_MS)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2 sm:bottom-4 sm:left-auto sm:right-4 sm:translate-x-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg ring-1 ring-inset',
              t.variant === 'success' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-rose-50 text-rose-800 ring-rose-200',
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
