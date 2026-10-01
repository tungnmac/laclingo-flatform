'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState, Spinner } from '@/components/ui/States'
import { inputClass } from '@/features/auth/components/AuthForm'
import { userService } from '@/features/user/user.service'
import { useApi } from '@/hooks/useApi'
import { displayName, formatDate } from '@/lib/utils'
import { useSession } from '@/store/session'

export default function ProfilePage() {
  const router = useRouter()
  const logout = useSession((s) => s.logout)
  const setUser = useSession((s) => s.setUser)
  const { data: user, error, loading, reload } = useApi(userService.me, [])

  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null)

  if (loading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!user) return null

  const onSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setSaving(true)
    setSaveMsg(null)
    try {
      const updated = await userService.updateMe({
        full_name: String(form.get('full_name') ?? ''),
        avatar_url: String(form.get('avatar_url') ?? ''),
      })
      setUser(updated) // đồng bộ lại sidebar/header
      setSaveMsg({ ok: true, text: 'Đã lưu thay đổi.' })
      reload()
    } catch (err) {
      setSaveMsg({ ok: false, text: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  const stats = [
    { label: 'Chuỗi ngày học', value: `🔥 ${user.streak_count}` },
    { label: 'Tham gia từ', value: formatDate(user.created_at) },
  ]

  return (
    <>
      <PageHeader title="Hồ sơ" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-3 self-start text-center">
          <Avatar name={displayName(user)} src={user.avatar_url || undefined} className="h-24 w-24 text-2xl" />
          <div className="min-w-0 max-w-full">
            <h2 className="truncate text-xl font-bold text-slate-900">{displayName(user)}</h2>
            <p className="truncate text-sm text-slate-500">{user.email}</p>
          </div>
          <Button
            variant="secondary"
            className="mt-2 w-full"
            onClick={() => {
              logout()
              router.replace('/login')
            }}
          >
            Đăng xuất
          </Button>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {stats.map((s) => (
              <Card key={s.label}>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{s.value}</p>
              </Card>
            ))}
          </div>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900">Chỉnh sửa hồ sơ</h3>
            <form onSubmit={onSave} className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Họ tên
                <input name="full_name" type="text" maxLength={100} defaultValue={user.full_name} className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Ảnh đại diện (URL)
                <input
                  name="avatar_url"
                  type="url"
                  defaultValue={user.avatar_url}
                  placeholder="https://..."
                  className={inputClass}
                />
              </label>

              {saveMsg && (
                <p
                  role="alert"
                  className={
                    saveMsg.ok
                      ? 'rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200'
                      : 'rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200'
                  }
                >
                  {saveMsg.text}
                </p>
              )}

              <Button type="submit" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  )
}
