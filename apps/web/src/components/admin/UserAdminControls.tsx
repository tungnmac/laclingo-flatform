'use client'

import { useState, type MouseEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { useToast } from '@/components/ui/ToastProvider'
import { userService } from '@/features/user/user.service'
import { ADMIN_MODULES } from '@/lib/adminModules'
import { cn, displayName } from '@/lib/utils'
import { useSession } from '@/store/session'
import type { User } from '@/types/api'

const ROLE_BADGE_STYLES: Record<User['role'], string> = {
  owner: 'bg-amber-50 text-amber-700 ring-amber-200',
  admin: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  user: 'bg-slate-50 text-slate-600 ring-slate-200',
}

export function RoleBadge({ user, className }: { user: User; className?: string }) {
  return (
    <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', ROLE_BADGE_STYLES[user.role], className)}>
      {user.role}
    </span>
  )
}

export function ActiveBadge({ user }: { user: User }) {
  if (user.is_active) return null
  return (
    <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">Đã khoá</span>
  )
}

/** Nút cấp/thu hồi quyền admin. Cấp (user → admin) thì ai đang xem trang này
 * cũng làm được (trang đã được gate bởi module "users"). Thu hồi (admin →
 * user, demote) thì CHỈ owner mới thấy nút — khớp SetRole owner-only guard
 * phía backend. Không hiện gì với target role="owner" (được bảo vệ tuyệt đối). */
export function RoleToggleButton({ user, onChanged }: { user: User; onChanged: () => void }) {
  const confirm = useConfirm()
  const toast = useToast()
  const me = useSession((s) => s.user)
  const [busy, setBusy] = useState(false)

  if (user.role === 'owner') return null
  const isRevoke = user.role === 'admin'
  if (isRevoke && me?.role !== 'owner') return null

  const isSelf = user.id === me?.id
  const nextRole = isRevoke ? 'user' : 'admin'

  const onClick = async (e: MouseEvent) => {
    e.stopPropagation()
    const verb = isRevoke ? 'Thu hồi quyền admin của' : 'Cấp quyền admin cho'
    if (!(await confirm({ description: `${verb} "${displayName(user)}"?`, danger: isRevoke }))) return
    setBusy(true)
    try {
      await userService.setRole(user.id, nextRole)
      onChanged()
      toast(isRevoke ? `Đã thu hồi quyền admin của "${displayName(user)}"` : `Đã cấp quyền admin cho "${displayName(user)}"`)
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button variant={isRevoke ? 'danger' : 'secondary'} size="sm" disabled={busy || (isSelf && isRevoke)} onClick={onClick}>
      {isRevoke ? 'Thu hồi quyền' : 'Cấp quyền admin'}
    </Button>
  )
}

/** Nút khoá/khôi phục tài khoản (soft-delete, is_active) — CHỈ owner thấy,
 * không áp dụng lên owner hoặc chính mình — khớp SetActive owner-only guard
 * phía backend. Khoá là hành động cần xác nhận; khôi phục thì không. */
export function ActiveToggleButton({ user, onChanged }: { user: User; onChanged: () => void }) {
  const confirm = useConfirm()
  const toast = useToast()
  const me = useSession((s) => s.user)
  const [busy, setBusy] = useState(false)

  if (me?.role !== 'owner' || user.role === 'owner' || user.id === me?.id) return null

  const nextActive = !user.is_active

  const onClick = async (e: MouseEvent) => {
    e.stopPropagation()
    if (!nextActive) {
      const ok = await confirm({
        description: `Khoá tài khoản "${displayName(user)}"? Người này sẽ không thể đăng nhập cho đến khi được khôi phục.`,
        danger: true,
      })
      if (!ok) return
    }
    setBusy(true)
    try {
      await userService.setActive(user.id, nextActive)
      onChanged()
      toast(nextActive ? `Đã khôi phục tài khoản "${displayName(user)}"` : `Đã khoá tài khoản "${displayName(user)}"`)
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button variant={nextActive ? 'secondary' : 'danger'} size="sm" disabled={busy} onClick={onClick}>
      {nextActive ? 'Khôi phục tài khoản' : 'Khoá tài khoản'}
    </Button>
  )
}

/** Panel chọn module /admin mà user này (role="admin") được cấp quyền truy
 * cập — dùng chung cho trang danh sách (dropdown) và trang chi tiết (inline).
 * Không hiện với owner (owner luôn có mọi module, bypass ở middleware). */
export function ModulesEditor({ user, onClose, onSaved }: { user: User; onClose?: () => void; onSaved: () => void }) {
  const toast = useToast()
  const me = useSession((s) => s.user)
  const isSelf = user.id === me?.id
  const [selected, setSelected] = useState<string[]>(user.admin_modules ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = (key: string) => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]))
  }

  const onSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await userService.setModules(user.id, selected)
      onSaved()
      toast(`Đã lưu quyền module cho "${displayName(user)}"`)
    } catch (err) {
      const message = (err as Error).message
      setError(message)
      toast(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p className="mb-3 text-sm font-medium text-slate-700">Module được cấp quyền truy cập /admin:</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ADMIN_MODULES.map((m) => {
          const lockedSelf = isSelf && m.key === 'users'
          return (
            <label key={m.key} className={cn('flex items-center gap-2 text-sm', lockedSelf ? 'text-slate-400' : 'text-slate-700')}>
              <input
                type="checkbox"
                checked={selected.includes(m.key)}
                disabled={lockedSelf}
                onChange={() => toggle(m.key)}
                className="h-4 w-4 rounded border-slate-300"
              />
              {m.icon} {m.label}
            </label>
          )
        })}
      </div>
      {isSelf && <p className="mt-2 text-xs text-slate-500">Không thể tự rút quyền module &quot;Học viên&quot; của chính mình.</p>}
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button size="sm" disabled={saving} onClick={onSave}>
          Lưu
        </Button>
        {onClose && (
          <Button size="sm" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
        )}
      </div>
    </div>
  )
}
