'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useT } from '@/i18n/I18nProvider'
import { AccountMenu } from './AccountMenu'
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher'
import type { SessionUser } from '@/server/auth/types'
import type { Plan } from '@/server/billing/plans'

const NAV_ITEMS: { href: string; labelKey: string; also?: string[] }[] = [
  { href: '/markets', labelKey: 'nav.markets', also: ['/vn-stocks'] }, // chi tiết cổ phiếu VN thuộc tab CK Việt Nam
  { href: '/portfolio', labelKey: 'nav.portfolio' },
  { href: '/journal', labelKey: 'nav.journal' },
  { href: '/companies', labelKey: 'nav.companies' },
  { href: '/learn', labelKey: 'nav.learn' },
  { href: '/practice', labelKey: 'nav.practice' },
  { href: '/contests', labelKey: 'nav.contests' },
  { href: '/orgs', labelKey: 'nav.orgs', also: ['/join'] },
]
const ADMIN_ITEMS: { href: string; labelKey: string; also?: string[] }[] = [
  { href: '/admin/learn', labelKey: 'nav.admin' },
  { href: '/admin/companies', labelKey: 'nav.adminCompanies' },
  { href: '/admin/library', labelKey: 'nav.adminLibrary' },
  { href: '/admin/references', labelKey: 'nav.adminReferences' },
  { href: '/admin/vn-data', labelKey: 'nav.adminVnData' },
  { href: '/admin/subscriptions', labelKey: 'nav.adminSubscriptions' },
  { href: '/admin/contests', labelKey: 'nav.adminContests' },
  { href: '/admin/orgs', labelKey: 'nav.adminOrgs' },
]

export function AppNav({ user, plan }: { user: SessionUser; plan: Plan }) {
  const pathname = usePathname()
  const { t } = useT()

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/markets" className="text-lg font-bold text-emerald-600">
          📈 TradeLab
        </Link>
        <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {[...NAV_ITEMS, ...(user.role === 'admin' ? ADMIN_ITEMS : [])].map((item) => {
            const active = [item.href, ...(item.also ?? [])].some((h) => pathname === h || pathname.startsWith(`${h}/`))
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
        <Link
          href="/pro"
          className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${plan === 'pro' ? 'bg-emerald-600 text-white' : 'text-emerald-700 ring-1 ring-emerald-300 hover:bg-emerald-50'}`}
        >
          {t(plan === 'pro' ? 'pro.badge' : 'pro.upgradeShort')}
        </Link>
        <LanguageSwitcher className="hidden sm:block" />
        <AccountMenu user={user} />
      </div>
    </header>
  )
}
