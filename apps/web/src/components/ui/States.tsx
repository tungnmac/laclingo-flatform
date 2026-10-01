import type { ReactNode } from 'react'
import { Button } from './Button'

export function Spinner({ label = 'Đang tải...' }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-2xl bg-rose-50 px-4 py-10 text-center ring-1 ring-rose-200">
      <span className="text-4xl">😵</span>
      <p className="max-w-md text-sm text-rose-700">{error.message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  )
}

export function EmptyState({ icon = '🪹', title, children }: { icon?: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 px-4 py-12 text-center">
      <span className="text-5xl">{icon}</span>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {children && <div className="max-w-md text-sm text-slate-500">{children}</div>}
    </div>
  )
}
