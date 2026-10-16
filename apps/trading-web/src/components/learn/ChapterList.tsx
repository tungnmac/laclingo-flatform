'use client'

import Link from 'next/link'
import { useT } from '@/i18n/I18nProvider'
import type { CatalogDto } from '@/server/learn/learn-service'

export function ChapterList({ chapters }: { chapters: CatalogDto['chapters'] }) {
  const { t } = useT()
  return (
    <div className="space-y-4">
      {chapters.map((c, ci) => {
        const done = c.lessons.filter((l) => l.progress?.completed).length
        return (
          <section key={c.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-slate-800">
                  {ci + 1}. {c.title}
                  <LevelBadge level={c.level} />
                </h2>
                <span className="text-xs tabular-nums text-slate-500">
                  {done}/{c.lessons.length}
                </span>
              </div>
              {c.description && <p className="mt-0.5 text-sm text-slate-500">{c.description}</p>}
              <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${(done / c.lessons.length) * 100}%` }} />
              </div>
            </div>
            <ul className="divide-y divide-slate-100">
              {c.lessons.map((l) => {
                const p = l.progress
                const status = p?.completed
                  ? t('learn.statusDone', { score: p.best_score })
                  : p
                    ? t('learn.statusInProgress', { score: p.best_score })
                    : t('learn.statusNew')
                return (
                  <li key={l.id}>
                    <Link href={`/learn/${l.slug}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800">{l.title}</p>
                        {l.summary && <p className="truncate text-sm text-slate-500">{l.summary}</p>}
                      </div>
                      <div className="shrink-0 text-right text-xs">
                        <p className={p?.completed ? 'font-semibold text-emerald-700' : p ? 'text-amber-700' : 'text-slate-400'}>{status}</p>
                        {l.question_count > 0 && <p className="text-slate-400">{t('learn.questionCount', { count: l.question_count })}</p>}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

const LEVEL_STYLES: Record<string, string> = {
  basic: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  intermediate: 'bg-sky-50 text-sky-700 ring-sky-200',
  advanced: 'bg-violet-50 text-violet-700 ring-violet-200',
}

export function LevelBadge({ level }: { level: string }) {
  const { t } = useT()
  return (
    <span className={`ml-2 inline-block rounded-full px-2 py-0.5 align-middle text-[11px] font-semibold ring-1 ${LEVEL_STYLES[level] ?? LEVEL_STYLES.basic}`}>
      {t(`levels.${level}`)}
    </span>
  )
}

