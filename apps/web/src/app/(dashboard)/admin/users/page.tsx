'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Pagination } from '@/components/admin/Pagination'
import { ActiveBadge, ActiveToggleButton, ModulesEditor, RoleBadge, RoleToggleButton } from '@/components/admin/UserAdminControls'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { inputClass } from '@/features/auth/components/AuthForm'
import { userService } from '@/features/user/user.service'
import { useApi } from '@/hooks/useApi'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { ADMIN_MODULES } from '@/lib/adminModules'
import { cn, displayName, formatDate } from '@/lib/utils'
import { useSession } from '@/store/session'

const PAGE_SIZE = 20

export default function AdminUsersPage() {
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
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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

      {loading && !data && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title="Không tìm thấy học viên nào" icon="👤" />}

      {data && data.items.length > 0 && (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {data.items.map((u) => {
              const isSelf = u.id === me?.id
              const isOpen = openIds.has(u.id)
              const canExpand = u.role === 'admin'
              return (
                <li key={u.id} className={cn(!u.is_active && 'opacity-60')}>
                  <div
                    role={canExpand ? 'button' : undefined}
                    tabIndex={canExpand ? 0 : undefined}
                    onClick={() => canExpand && toggleOpen(u.id)}
                    onKeyDown={(e) => {
                      if (canExpand && (e.key === 'Enter' || e.key === ' ')) toggleOpen(u.id)
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
                          href={`/admin/users/${encodeURIComponent(u.username)}`}
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
                    <RoleBadge user={u} />
                    <ActiveBadge user={u} />
                    {canExpand && (
                      <span className={cn('shrink-0 text-slate-400 transition-transform', isOpen && 'rotate-180')} aria-hidden>
                        ▾
                      </span>
                    )}
                    <RoleToggleButton user={u} onChanged={reload} />
                    <ActiveToggleButton user={u} onChanged={reload} />
                  </div>

                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-6">
                      <ModulesEditor user={u} onClose={() => toggleOpen(u.id)} onSaved={reload} />
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
