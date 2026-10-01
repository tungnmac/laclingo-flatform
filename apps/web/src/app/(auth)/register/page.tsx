import Link from 'next/link'
import { AuthForm } from '@/features/auth/components/AuthForm'

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Tạo tài khoản</h1>
      <p className="mt-1 text-sm text-slate-500">Học mỗi ngày cùng Chim Lạc 🦩 Mật khẩu tối thiểu 8 ký tự.</p>

      <AuthForm mode="register" />

      <p className="mt-6 text-center text-sm text-slate-500">
        Đã có tài khoản?{' '}
        <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </>
  )
}
