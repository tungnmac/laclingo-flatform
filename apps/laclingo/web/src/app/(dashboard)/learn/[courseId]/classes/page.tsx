'use client'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { ClassesSection } from '@/features/class/components/ClassesSection'
import { courseService } from '@/features/course/course.service'
import { useApi } from '@/hooks/useApi'
import { useTranslation } from '@/hooks/useTranslation'

export default function ClassesListPage({ params }: { params: { courseId: string } }) {
  const t = useTranslation()
  const { data: language } = useApi(() => courseService.getById(params.courseId), [params.courseId])

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t.nav.learn, href: '/learn' },
          { label: language?.name ?? params.courseId, href: `/learn/${params.courseId}` },
          { label: t.classes.sectionTitle },
        ]}
      />

      <h1 className="text-2xl font-bold text-slate-900">{t.classes.sectionTitle}</h1>

      <ClassesSection languageId={params.courseId} />
    </div>
  )
}
