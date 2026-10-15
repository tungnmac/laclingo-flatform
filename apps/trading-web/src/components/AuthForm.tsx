'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { api } from '@/lib/api'
import { safeNextPath } from '@/lib/safe-next'

const inputClass =
  'mt-1 block w-full rounded-lg border-0 px-3 py-2.5 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-emerald-600'

export function AuthForm({ mode, next }: { mode: 'login' | 'register'; next?: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isLogin = mode === 'login'

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = {
      email: form.get('email'),
      password: form.get('password'),
      ...(isLogin ? {} : { display_name: form.get('display_name') }),
    }
    setLoading(true)
    setError(null)
    try {
      await api(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(body) })
      router.replace(safeNextPath(next))
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-bold">{isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
      {!isLogin && (
        <label className="block text-sm font-medium text-slate-700">
          Tên hiển thị
          <input name="display_name" required maxLength={100} className={inputClass} />
        </label>
      )}
      <label className="block text-sm font-medium text-slate-700">
        Email
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Mật khẩu
        <input
          name="password"
          type="password"
          required
          minLength={isLogin ? 1 : 8}
          maxLength={72}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          className={inputClass}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Đăng ký'}
      </button>
      <p className="text-center text-sm text-slate-500">
        {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
        <Link
          href={`${isLogin ? '/register' : '/login'}${next ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="font-semibold text-emerald-700 hover:underline"
        >
          {isLogin ? 'Đăng ký' : 'Đăng nhập'}
        </Link>
      </p>
    </form>
  )
}
