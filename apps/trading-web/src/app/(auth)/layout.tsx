import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="mb-6 text-center text-xl font-bold text-emerald-600">📈 TradeLab</p>
        {children}
      </div>
    </div>
  )
}
