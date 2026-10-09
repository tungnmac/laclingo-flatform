'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/hooks/useTranslation'
import { ADMIN_MODULES, hasModule } from '@/lib/adminModules'
import { cn } from '@/lib/utils'
import { useSession } from '@/store/session'

/** Tab điều hướng giữa các trang quản trị — chỉ hiện module user ĐƯỢC CẤP,
 * luôn hiện trên mọi trang /admin/* (trừ trang tổng quan). */
export function AdminSubNav() {
  const pathname = usePathname()
  const user = useSession((s) => s.user)
  const t = useTranslation()
  const items = ADMIN_MODULES.filter((m) => hasModule(user, m.key))
  const moduleLabels: Record<string, string> = {
    users: t.adminCommon.moduleUsers,
    missions: t.adminCommon.moduleMissions,
    vocabulary: t.adminCommon.moduleVocabulary,
    grammar: t.adminCommon.moduleGrammar,
    challenge_questions: t.adminCommon.moduleChallengeQuestions,
    listening: t.adminCommon.moduleListening,
    classes: t.adminCommon.moduleClasses,
  }

  return (
    <nav className="mb-6 -mx-4 flex gap-1 overflow-x-auto border-b border-slate-200 px-4 sm:mx-0 sm:px-0">
      <Link
        href="/admin"
        className="shrink-0 border-b-2 border-transparent px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:text-slate-700"
      >
        {t.adminCommon.overviewTab}
      </Link>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition',
              active ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            {item.icon} {moduleLabels[item.key]}
          </Link>
        )
      })}
    </nav>
  )
}
