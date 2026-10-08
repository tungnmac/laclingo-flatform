'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Pagination } from '@/components/admin/Pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useConfirm } from '@/components/ui/ConfirmDialogProvider'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { inputClass } from '@/features/auth/components/AuthForm'
import { userService } from '@/features/user/user.service'
import { useApi } from '@/hooks/useApi'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { ADMIN_MODULES } from '@/lib/adminModules'
import { cn, displayName, formatDate } from '@/lib/utils'
import { useSession } from '@/store/session'
import type { User } from '@/types/api'

const PAGE_SIZE = 20

export default function AdminUsersPage() {
  const confirm = useConfirm()
  const me = useSession((s) => s.user)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [role, setRole] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const { data, error, loading, reload } = useApi(
    () => userService.listUsersAdmin({ page, pageSize: PAGE_SIZE, q: debouncedSearch, role, module: moduleFilter }),
    [page, debouncedSearch, role, moduleFilter],
  )
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [editingModulesId, setEditingModulesId] = useState<string | null>(null)

  const onToggleRole = async (u: User) => {
    const nextRole = u.role === 'admin' ? 'user' : 'admin'
    const verb = nextRole === 'admin' ? 'Cấp quyền admin cho' : 'Thu hồi quyền admin của'
    if (!(await confirm({ description: `${verb} "${displayName(u)}"?`, danger: nextRole === 'user' }))) return

    setBusyId(u.id)
    setActionError(null)
    try {
      await userService.setRole(u.id, nextRole)
      reload()
    } catch (err) {
      setActionError((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <PageHeader title="Học viên" description="Danh sách người học — tìm kiếm, lọc theo role, cấp/thu hồi quyền admin." />

      <div className="mb-4 flex flex-wrap gap-4">
        <label className="block text-sm font-medium text-slate-700">
          Tìm kiếm
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Tìm theo username/email/họ tên..."
            className={cn(inputClass, 'max-w-xs')}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Role
          <select
            value={role}
            onChange={(e) => {
              const nextRole = e.target.value
              setRole(nextRole)
              if (nextRole === 'user') setModuleFilter('')
              setPage(1)
            }}
            className={cn(inputClass, 'max-w-[10rem]')}
          >
            <option value="">Tất cả</option>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Quyền module
          <select
            value={moduleFilter}
            disabled={role === 'user'}
            onChange={(e) => {
              setModuleFilter(e.target.value)
              setPage(1)
            }}
            className={cn(inputClass, 'max-w-[12rem]', role === 'user' && 'cursor-not-allowed opacity-50')}
          >
            <option value="">Tất cả</option>
            {ADMIN_MODULES.map((m) => (
              <option key={m.key} value={m.key}>
                {m.icon} {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {actionError && (
        <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {actionError}
        </p>
      )}

      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title="Không tìm thấy học viên nào" icon="👤" />}

      {data && data.items.length > 0 && (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {data.items.map((u) => {
              const isSelf = u.id === me?.id
              const isOpen = editingModulesId === u.id
              const canExpand = u.role === 'admin'
              return (
                <li key={u.id}>
                  <div
                    role={canExpand ? 'button' : undefined}
                    tabIndex={canExpand ? 0 : undefined}
                    onClick={() => canExpand && setEditingModulesId(isOpen ? null : u.id)}
                    onKeyDown={(e) => {
                      if (canExpand && (e.key === 'Enter' || e.key === ' ')) setEditingModulesId(isOpen ? null : u.id)
                    }}
                    className={cn(
                      'flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6',
                      canExpand && 'cursor-pointer hover:bg-slate-50',
                    )}
                  >
                    <Avatar name={displayName(u)} src={u.avatar_url || undefined} className="h-9 w-9 shrink-0 text-sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        <Link
                          href={`/admin/users/${u.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-indigo-600 hover:underline"
                        >
                          {displayName(u)}
                        </Link>
                        {isSelf && <span className="ml-2 text-xs font-normal text-indigo-600">(bạn)</span>}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {u.username} · {u.email}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-xs text-slate-500">
                      <p>
                        ⭐ Lv.{u.level} · 🏆 {u.points} · 🔥 {u.streak_count}
                      </p>
                      <p className="text-slate-400">Tham gia {formatDate(u.created_at)}</p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
                        u.role === 'admin' ? 'bg-indigo-50 text-indigo-700 ring-indigo-200' : 'bg-slate-50 text-slate-600 ring-slate-200',
                      )}
                    >
                      {u.role}
                    </span>
                    {canExpand && (
                      <span className={cn('shrink-0 text-slate-400 transition-transform', isOpen && 'rotate-180')} aria-hidden>
                        ▾
                      </span>
                    )}
                    <Button
                      variant={u.role === 'admin' ? 'danger' : 'secondary'}
                      size="sm"
                      disabled={isSelf && u.role === 'admin'}
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleRole(u)
                      }}
                    >
                      {busyId === u.id ? 'Đang lưu...' : u.role === 'admin' ? 'Thu hồi quyền' : 'Cấp quyền admin'}
                    </Button>
                  </div>

                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-6">
                      <ModulesEditor user={u} isSelf={isSelf} onClose={() => setEditingModulesId(null)} onSaved={reload} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      )}
      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />}
    </>
  )
}

/** Panel chọn module /admin mà user này được cấp quyền truy cập */
function ModulesEditor({
  user,
  isSelf,
  onClose,
  onSaved,
}: {
  user: User
  isSelf: boolean
  onClose: () => void
  onSaved: () => void
}) {
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
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ml-12 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
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
          {saving ? 'Đang lưu...' : 'Lưu'}
        </Button>
        <Button size="sm" variant="secondary" onClick={onClose}>
          Hủy
        </Button>
      </div>
    </div>
  )
}
