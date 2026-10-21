'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useT } from '@/i18n/I18nProvider'
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher'
import type { SessionUser } from '@/server/auth/types'

const NAV_ITEMS = [
  { href: '/markets', labelKey: 'nav.markets' },
  { href: '/portfolio', labelKey: 'nav.portfolio' },
  { href: '/journal', labelKey: 'nav.journal' },
  { href: '/companies', labelKey: 'nav.companies' },
  { href: '/learn', labelKey: 'nav.learn' },
  { href: '/practice', labelKey: 'nav.practice' },
]
const ADMIN_ITEMS = [
  { href: '/admin/learn', labelKey: 'nav.admin' },
  { href: '/admin/companies', labelKey: 'nav.adminCompanies' },
  { href: '/admin/library', labelKey: 'nav.adminLibrary' },
  { href: '/admin/references', labelKey: 'nav.adminReferences' },
]

export function AppNav({ user }: { user: SessionUser }) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useT()

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/markets" className="text-lg font-bold text-emerald-600">
          📈 TradeLab
        </Link>
        <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {[...NAV_ITEMS, ...(user.role === 'admin' ? ADMIN_ITEMS : [])].map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold ${active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {t(item.labelKey)}
              </Link>
            )
          })}
        </nav>
        <LanguageSwitcher className="hidden sm:block" />
        <span className="hidden text-sm text-slate-600 md:inline">{user.display_name}</span>
        <button onClick={logout} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          {t('nav.logout')}
        </button>
      </div>
    </header>
  )
}
