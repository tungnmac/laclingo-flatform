'use client'

import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { useTranslation } from '@/hooks/useTranslation'
import { cn, displayName } from '@/lib/utils'
import { MAX_ACCOUNTS, isSessionValid, useSession, type SavedAccount } from '@/store/session'

/** Tải lại trang ở tài khoản mới — xoá sạch dữ liệu/trạng thái của tài khoản trước trên màn hình */
export function reloadAsActiveAccount() {
  window.location.assign('/learn')
}

/** Đăng xuất tài khoản đang dùng: còn tài khoản khác → chuyển sang (tải lại trang), không thì về trang đăng nhập */
export function signOutCurrent() {
  if (useSession.getState().logout()) reloadAsActiveAccount()
  else window.location.assign('/login')
}

/**
 * Danh sách tài khoản đã đăng nhập trên máy: bấm để chuyển (phiên hết hạn → đăng nhập lại, điền sẵn tên đăng nhập),
 * gỡ từng tài khoản, thêm tài khoản, đăng xuất tất cả. Dùng trong menu tài khoản trên header (UserMenu) và trang Hồ sơ.
 */
export function AccountList({ onDone }: { onDone?: () => void }) {
  const t = useTranslation()
  const a = t.accounts
  const router = useRouter()
  const confirm = useConfirm()
  const accounts = useSession((s) => s.accounts)
  const currentId = useSession((s) => s.user?.id)
  const activate = useSession((s) => s.activate)
  const removeAccount = useSession((s) => s.removeAccount)
  const logoutAll = useSession((s) => s.logoutAll)

  const choose = (acc: SavedAccount) => {
    onDone?.()
    if (acc.user.id === currentId) return
    if (activate(acc.user.id)) return reloadAsActiveAccount()
    router.push(`/login?relogin=${encodeURIComponent(acc.user.username)}`)
  }
  const remove = (acc: SavedAccount) => {
    if (acc.user.id !== currentId) return removeAccount(acc.user.id)
    onDone?.()
    signOutCurrent()
  }
  const signOutAll = async () => {
    if (!(await confirm({ description: a.logoutAllConfirm, danger: true }))) return
    onDone?.()
    logoutAll()
    router.replace('/login')
  }

  return (
    <div className="space-y-1">
      <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-slate-400">{a.title}</p>
      <ul className="space-y-0.5">
        {accounts.map((acc) => {
          const current = acc.user.id === currentId
          const valid = isSessionValid(acc)
          return (
            <li key={acc.user.id} className="group flex items-center gap-1">
              <button
                type="button"
                onClick={() => choose(acc)}
                aria-current={current ? 'true' : undefined}
                title={valid ? undefined : a.reloginTitle(acc.user.username)}
                className={cn('flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left', current ? 'bg-indigo-50' : 'hover:bg-slate-100')}
              >
                <Avatar name={displayName(acc.user)} src={acc.user.avatar_url || undefined} className={cn('h-8 w-8 shrink-0 text-xs', !valid && 'opacity-50')} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">{displayName(acc.user)}</span>
                  <span className={cn('block truncate text-xs', valid ? 'text-slate-500' : 'text-orange-600')}>
                    {valid ? acc.user.email : a.expired}
                  </span>
                </span>
                {current && <span className="shrink-0 text-xs font-semibold text-indigo-600">✓ {a.current}</span>}
              </button>
              <button
                type="button"
                onClick={() => remove(acc)}
                aria-label={a.remove(displayName(acc.user))}
                title={a.remove(displayName(acc.user))}
                className="shrink-0 rounded px-1.5 py-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
              >
                ×
              </button>
            </li>
          )
        })}
      </ul>
      <div className="border-t border-slate-100 pt-1">
        <button
          type="button"
          onClick={() => {
            onDone?.()
            router.push('/login?add=1')
          }}
          title={a.max(MAX_ACCOUNTS)}
          className="w-full rounded-lg px-2 py-1.5 text-left text-sm font-medium text-indigo-600 hover:bg-indigo-50"
        >
          {a.add}
        </button>
        <button type="button" onClick={() => void signOutAll()} className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-slate-500 hover:bg-slate-100">
          {a.logoutAll}
        </button>
      </div>
    </div>
  )
}
