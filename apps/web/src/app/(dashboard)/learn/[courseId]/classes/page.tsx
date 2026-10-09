'use client'

import Link from 'next/link'
import { ClassesSection } from '@/features/class/components/ClassesSection'
import { useTranslation } from '@/hooks/useTranslation'

export default function ClassesListPage({ params }: { params: { courseId: string } }) {
  const t = useTranslation()

  return (
    <div className="space-y-6">
      <Link href={`/learn/${params.courseId}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600">
        {t.learn.backToCourse}
      </Link>

      <h1 className="text-2xl font-bold text-slate-900">{t.classes.sectionTitle}</h1>

      <ClassesSection languageId={params.courseId} />
    </div>
  )
}
