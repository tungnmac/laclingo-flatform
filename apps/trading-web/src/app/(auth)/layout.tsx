import type { ReactNode } from 'react'
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <LanguageSwitcher className="absolute right-4 top-4" />
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="mb-6 text-center text-xl font-bold text-emerald-600">📈 TradeLab</p>
        {children}
      </div>
    </div>
  )
}
