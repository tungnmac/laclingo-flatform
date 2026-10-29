'use client'

import Link from 'next/link'
import type { Ref } from 'react'
import { useT } from '@/i18n/I18nProvider'
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher'
import type { SessionUser } from '@/server/auth/types'
import type { Plan } from '@/server/billing/plans'
import { AccountMenu } from './AccountMenu'
import { NotificationBell } from './NotificationBell'

/** Header trên cùng: logo, Pro, ngôn ngữ, thông báo, tài khoản. Mục menu nằm ở sidebar trái (☰ mở trên mobile). */
export function AppHeader({
  user,
  plan,
  menuOpen,
  onMenu,
  menuButtonRef,
}: {
  user: SessionUser
  plan: Plan
  menuOpen: boolean
  onMenu: () => void
  menuButtonRef: Ref<HTMLButtonElement>
}) {
  const { t } = useT()
  return (
    <header className="sticky top-0 z-20 h-14 border-b border-slate-200 bg-white">
      <div className="flex h-full items-center gap-4 px-4 sm:px-6">
        <button
          ref={menuButtonRef}
          onClick={onMenu}
          aria-label={t('nav.openMenu')}
          aria-expanded={menuOpen}
          aria-controls="app-sidebar"
          className="-ml-2 rounded-lg px-2 py-1 text-xl text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          ☰
        </button>
        <Link href="/markets" className="flex-1 text-lg font-bold text-emerald-600">
          📈 TradeLab
        </Link>
        <Link
          href="/pro"
          className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${plan === 'pro' ? 'bg-emerald-600 text-white' : 'text-emerald-700 ring-1 ring-emerald-300 hover:bg-emerald-50'}`}
        >
          {t(plan === 'pro' ? 'pro.badge' : 'pro.upgradeShort')}
        </Link>
        <LanguageSwitcher className="hidden sm:block" />
        <NotificationBell />
        <AccountMenu user={user} />
      </div>
    </header>
  )
}
