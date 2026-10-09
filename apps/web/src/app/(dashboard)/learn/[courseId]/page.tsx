'use client'

import Link from 'next/link'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Card } from '@/components/ui/Card'
import { ErrorState, Spinner } from '@/components/ui/States'
import { Mascot } from '@/components/mascot/Mascot'
import { languageFlag } from '@/features/course/components/LanguageCard'
import { courseService } from '@/features/course/course.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'

export default function CoursePage({ params }: { params: { courseId: string } }) {
  const { data: language, error, loading, reload } = useApi(() => courseService.getById(params.courseId), [params.courseId])
  const t = useTranslation()

  if (loading) return <Spinner />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!language) return null

  const cards = [
    {
      key: 'vocabulary',
      href: `/review/new?language=${params.courseId}`,
      icon: '📚',
      title: t.learn.vocabularyCardTitle,
      description: t.learn.vocabularyCardDesc,
    },
    {
      key: 'grammar',
      href: `/learn/${params.courseId}/grammar`,
      icon: '📖',
      title: t.learn.grammarSectionTitle,
      description: t.learn.grammarCardDesc,
    },
    {
      key: 'classes',
      href: `/learn/${params.courseId}/classes`,
      icon: '📋',
      title: t.classes.sectionTitle,
      description: t.classes.cardDesc,
    },
    {
      key: 'srs',
      href: `/review/vocabulary?language=${params.courseId}`,
      icon: '🧠',
      title: t.learn.srsCardTitle,
      description: t.learn.srsCardDesc,
    },
  ]

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: t.nav.learn, href: '/learn' }, { label: language.name }]} />

      <Card className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <span className="text-6xl sm:text-7xl">{languageFlag(language.id)}</span>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{language.name}</h1>
          <p className="text-slate-500">
            {t.learn.languageCodeLabel}: {language.code}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.key}
            href={c.href}
            className="group flex flex-col gap-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-indigo-300"
          >
            <span className="text-3xl">{c.icon}</span>
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600">{c.title}</h3>
            <p className="text-sm text-slate-500">{c.description}</p>
          </Link>
        ))}
      </div>

      <Mascot message={t.learn.mascotCourse(language.name)} />
    </div>
  )
}
