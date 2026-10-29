import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6', className)}
      {...props}
    />
  )
}
