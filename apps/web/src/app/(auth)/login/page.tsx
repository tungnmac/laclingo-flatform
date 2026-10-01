import Link from 'next/link'
import { AuthForm } from '@/features/auth/components/AuthForm'

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Đăng nhập</h1>
      <p className="mt-1 text-sm text-slate-500">Chào mừng quay lại! Chim Lạc nhớ bạn lắm 🦩</p>

      <AuthForm mode="login" />

      <p className="mt-6 text-center text-sm text-slate-500">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="font-semibold text-indigo-600 hover:underline">
          Đăng ký
        </Link>
      </p>
    </>
  )
}
