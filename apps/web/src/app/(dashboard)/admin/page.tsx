'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/States'
import { useTranslation } from '@/hooks/useTranslation'
import { hasModule } from '@/lib/adminModules'
import { useSession } from '@/store/session'

export default function AdminHubPage() {
  const user = useSession((s) => s.user)
  const t = useTranslation()
  const sections = [
    { key: 'users', href: '/admin/users', icon: '👤', title: t.adminCommon.moduleUsers, description: t.adminCommon.usersDesc },
    { key: 'missions', href: '/admin/missions', icon: '🎯', title: t.adminCommon.moduleMissions, description: t.adminCommon.missionsDesc },
    { key: 'vocabulary', href: '/admin/vocabulary', icon: '📚', title: t.adminCommon.moduleVocabulary, description: t.adminCommon.vocabularyDesc },
    { key: 'grammar', href: '/admin/grammar', icon: '📖', title: t.adminCommon.moduleGrammar, description: t.adminCommon.grammarDesc },
    {
      key: 'challenge_questions',
      href: '/admin/challenge-questions',
      icon: '🎮',
      title: t.adminCommon.moduleChallengeQuestions,
      description: t.adminCommon.challengeQuestionsDesc,
    },
    { key: 'listening', href: '/admin/listening', icon: '🎧', title: t.adminCommon.moduleListening, description: t.adminCommon.listeningDesc },
    { key: 'classes', href: '/admin/classes', icon: '📋', title: t.adminCommon.moduleClasses, description: t.adminCommon.classesDesc },
    { key: 'blog', href: '/admin/blog', icon: '📝', title: t.adminCommon.moduleBlog, description: t.adminCommon.blogDesc },
  ]
  const visible = sections.filter((s) => hasModule(user, s.key))

  return (
    <>
      <PageHeader title={t.adminCommon.hubTitle} description={t.adminCommon.hubDesc} />

      {visible.length === 0 && (
        <EmptyState icon="🔒" title={t.adminCommon.noAccessTitle}>
          {t.adminCommon.noAccessBody}
        </EmptyState>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {visible.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex flex-col gap-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-indigo-300"
          >
            <span className="text-3xl">{s.icon}</span>
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600">{s.title}</h3>
            <p className="text-sm text-slate-500">{s.description}</p>
          </Link>
        ))}
      </div>
    </>
  )
}
