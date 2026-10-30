'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/ToastProvider'
import { userService } from '@/features/user/user.service'
import { useTranslation } from '@/hooks/useTranslation'
import { inlineError } from '@/lib/api'
import { DEFAULT_THEME, THEMES, applyTheme, isThemeId, type ThemeId } from '@/lib/themes'
import { cn } from '@/lib/utils'
import { useSession } from '@/store/session'

/** Chọn tông màu chủ đạo — áp ngay rồi lưu vào tài khoản; lưu lỗi thì quay về tông cũ */
export function ThemeSettingsCard() {
  const t = useTranslation()
  const toast = useToast()
  const user = useSession((s) => s.user)
  const setUser = useSession((s) => s.setUser)
  const current: ThemeId = isThemeId(user?.theme) ? user.theme : DEFAULT_THEME
  const [saving, setSaving] = useState<ThemeId | null>(null)

  const choose = async (id: ThemeId) => {
    if (id === current || saving) return
    setSaving(id)
    applyTheme(id)
    try {
      setUser(await userService.updateMe({ theme: id }))
      toast(t.settings.saved)
    } catch (err) {
      applyTheme(current)
      toast(inlineError(err), 'error')
    } finally {
      setSaving(null)
    }
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-900">{t.settings.themeTitle}</h3>
      <p className="mt-1 text-sm text-slate-500">{t.settings.themeDesc}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {THEMES.map(({ id, palette }) => {
          const active = (saving ?? current) === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => choose(id)}
              disabled={!!saving}
              aria-pressed={active}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3 text-left transition disabled:opacity-70',
                active ? 'border-transparent ring-2 ring-indigo-600' : 'border-slate-200 hover:border-slate-300',
              )}
            >
              <span
                aria-hidden
                className="h-9 w-9 shrink-0 rounded-full shadow-inner"
                style={{ background: `linear-gradient(135deg, ${palette[300]}, ${palette[600]} 55%, ${palette[900]})` }}
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900">{t.settings.themeNames[id]}</span>
                {active && <span className="block text-xs text-indigo-700">{t.settings.current}</span>}
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
