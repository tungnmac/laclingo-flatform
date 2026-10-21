'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useT } from '@/i18n/I18nProvider'

const ITEMS = [
  { href: '/learn', label: 'learnNav.roadmap', icon: '🧭' },
  { href: '/learn/books', label: 'learnNav.books', icon: '📚' },
  { href: '/learn/plans', label: 'learnNav.plans', icon: '🎯' },
  { href: '/learn/glossary', label: 'learnNav.glossary', icon: '📖' },
  { href: '/learn/references', label: 'learnNav.references', icon: '🔗' },
]

/** Lộ trình đang mở khi ở /learn hoặc 1 bài học (/learn/<slug>), không phải các mục con khác */
function activeHref(pathname: string): string {
  const sub = ITEMS.slice(1).find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
  return sub?.href ?? '/learn'
}

export function LearnSidebar() {
  const { t } = useT()
  const active = activeHref(usePathname())
  return (
    <nav aria-label={t('learnNav.title')} className="-mx-4 mb-4 overflow-x-auto px-4 lg:mx-0 lg:mb-0 lg:overflow-visible lg:px-0">
      <p className="mb-2 hidden px-3 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:block">{t('learnNav.title')}</p>
      <ul className="flex gap-1 lg:sticky lg:top-20 lg:flex-col">
        {ITEMS.map((i) => {
          const on = i.href === active
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={on ? 'page' : undefined}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${on ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <span aria-hidden>{i.icon}</span>
                {t(i.label)}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
