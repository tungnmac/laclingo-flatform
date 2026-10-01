'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'

const inputClass =
  'mt-1 block w-full rounded-lg border-0 px-3 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600'

// TODO: gọi POST /auth/register khi backend có API đăng ký
export default function RegisterPage() {
  const [submitted, setSubmitted] = useState(false)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Tạo tài khoản</h1>
      <p className="mt-1 text-sm text-slate-500">Học mỗi ngày cùng Chim Lạc 🦩</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Họ tên
          <input name="full_name" type="text" autoComplete="name" className={inputClass} placeholder="Nguyễn Văn A" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input name="email" type="email" required autoComplete="email" className={inputClass} placeholder="ban@laclingo.vn" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Mật khẩu
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
        </label>

        {submitted && (
          <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
            Backend chưa hỗ trợ đăng ký. Vui lòng dùng tài khoản có sẵn ở trang đăng nhập.
          </p>
        )}

        <Button type="submit" size="lg" className="w-full">
          Đăng ký
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Đã có tài khoản?{' '}
        <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </>
  )
}
