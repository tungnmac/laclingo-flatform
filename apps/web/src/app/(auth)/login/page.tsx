'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { StreakBadge } from '@/features/user/components/StreakBadge'
import { userService } from '@/features/user/user.service'
import { useApi } from '@/hooks/useApi'
import { displayName } from '@/lib/utils'
import { useSession } from '@/store/session'
import type { User } from '@/types/api'

// TODO: thay bằng form email/mật khẩu khi backend có API đăng nhập
export default function LoginPage() {
  const router = useRouter()
  const setUser = useSession((s) => s.setUser)
  const { data, error, loading, reload } = useApi(userService.list, [])

  const login = (user: User) => {
    setUser(user)
    router.push('/learn')
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">Đăng nhập</h1>
      <p className="mt-1 text-sm text-slate-500">Chọn tài khoản để bắt đầu học.</p>

      <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
        Chế độ dev: backend chưa có API xác thực nên đăng nhập bằng cách chọn user có sẵn.
      </div>

      <div className="mt-6">
        {loading && <Spinner />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data && data.length === 0 && (
          <EmptyState icon="👤" title="Chưa có tài khoản nào">
            Hãy thêm user vào bảng <code>users</code> trong database.
          </EmptyState>
        )}
        {data && data.length > 0 && (
          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {data.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={() => login(user)}
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left ring-1 ring-slate-200 transition hover:bg-indigo-50 hover:ring-indigo-300"
                >
                  <Avatar name={displayName(user)} src={user.avatar_url || undefined} className="h-10 w-10 shrink-0 text-sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{displayName(user)}</p>
                    <p className="truncate text-sm text-slate-500">{user.email}</p>
                  </div>
                  <StreakBadge count={user.streak_count} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="font-semibold text-indigo-600 hover:underline">
          Đăng ký
        </Link>
      </p>
    </>
  )
}
