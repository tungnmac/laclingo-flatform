'use client'

import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'
import { moderationService } from '../moderation.service'
import { useBlockUser } from '../useBlockUser'

/** Hồ sơ: danh sách người đã chặn + bỏ chặn */
export function BlockedUsersCard() {
  const m = useTranslation().moderation
  const { data, reload } = useApi(() => moderationService.blocked(), [])
  const { unblock } = useBlockUser()

  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-900">🚫 {m.blockedListTitle}</h3>
      <p className="mt-1 text-sm text-slate-500">{m.blockedListHint}</p>
      {data && data.length === 0 && <p className="mt-3 text-sm text-slate-400">{m.blockedListEmpty}</p>}
      {data && data.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-100">
          {data.map((u) => {
            const name = u.full_name || u.username
            return (
              <li key={u.id} className="flex items-center gap-3 py-2">
                <Avatar name={name} src={u.avatar_url || undefined} className="h-8 w-8 shrink-0 text-xs" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                  {name} <span className="text-slate-400">@{u.username}</span>
                </span>
                <Button size="sm" variant="secondary" onClick={() => void unblock(u.id, name).then((done) => done && reload())}>
                  {m.unblock}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
