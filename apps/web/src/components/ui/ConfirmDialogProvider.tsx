'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

interface ConfirmOptions {
  title?: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  /** true = nút xác nhận màu đỏ (hành động xoá/thu hồi quyền...) */
  danger?: boolean
}

type ConfirmFn = (input: string | ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

/** Popup xác nhận thay cho window.confirm() — trả Promise<boolean>, dùng y hệt
 * confirm() cũ: `if (!(await confirm("Xoá X?"))) return`. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm phải được gọi trong ConfirmDialogProvider')
  return ctx
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolveRef = useRef<(value: boolean) => void>()

  const confirm = useCallback<ConfirmFn>((input) => {
    setOptions(typeof input === 'string' ? { description: input } : input)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const close = (result: boolean) => {
    setOptions(null)
    resolveRef.current?.(result)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
          onClick={() => close(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-description"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
          >
            {options.title && <h3 className="text-base font-semibold text-slate-900">{options.title}</h3>}
            <p id="confirm-dialog-description" className={cn('text-sm text-slate-600', options.title && 'mt-2')}>
              {options.description}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => close(false)}>
                {options.cancelLabel ?? 'Hủy'}
              </Button>
              <Button variant={options.danger ? 'danger' : 'primary'} size="sm" onClick={() => close(true)} autoFocus>
                {options.confirmLabel ?? 'Xác nhận'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
