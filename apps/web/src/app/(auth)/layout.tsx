import Link from 'next/link'
import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-slate-50 px-4 py-10">
      <Link href="/" className="mb-6 flex items-center gap-2 text-2xl font-bold text-indigo-600">
        <img src="/logo.svg" alt="" className="h-9 w-9 rounded-xl" /> LacLingo
      </Link>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200 sm:p-8">{children}</div>
    </div>
  )
}
