'use client'

import { LevelBadge } from '@/components/learn/ChapterList'
import { useT } from '@/i18n/I18nProvider'
import type { ResourceDto } from '@/server/references/references-service'

export const RESOURCE_ICONS: Record<string, string> = { course: '🎓', program: '🏅', youtube: '▶️', website: '🌐', podcast: '🎙️' }

export function ResourceCard({ r }: { r: ResourceDto }) {
  const { t } = useT()
  return (
    <article className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h2 className="font-semibold text-slate-900">
        <span aria-hidden className="mr-1.5">
          {RESOURCE_ICONS[r.type] ?? '🔗'}
        </span>
        {r.title}
        <LevelBadge level={r.level} />
      </h2>
      <p className="text-sm text-slate-500">
        {[r.provider, t(`references.type_${r.type}`), t(`references.topic_${r.topic}`)].filter(Boolean).join(' · ')}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-700 ring-1 ring-sky-200">{t(`references.lang_${r.language}`)}</span>
        <span className={`rounded-full px-2 py-0.5 ring-1 ${r.is_free ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>
          {r.is_free ? t('references.free') : t('references.paid')}
        </span>
      </div>
      {r.description && <p className="mt-2 flex-1 text-sm leading-6 text-slate-700">{r.description}</p>}
      <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-3 self-start text-sm font-semibold text-emerald-700 hover:underline">
        {t('references.open')}
      </a>
    </article>
  )
}
