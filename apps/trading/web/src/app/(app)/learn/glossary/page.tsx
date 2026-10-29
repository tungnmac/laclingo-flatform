'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Markdown } from '@/components/learn/Markdown'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { TermDto } from '@/server/library/library-service'
import { foldText, matchesTerm } from '@/server/library/validation'

export default function GlossaryPage() {
  const { t, locale } = useT()
  const [terms, setTerms] = useState<TermDto[] | null>(null)
  const [q, setQ] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [retry, setRetry] = useState(0)

  // Tải 1 lần theo ngôn ngữ, tìm ở client (bỏ dấu) — gõ tới đâu lọc tới đó, không gọi API mỗi phím
  useEffect(() => {
    let alive = true
    setTerms(null)
    setError(null)
    api<TermDto[]>('/api/learn/glossary').then(
      (list) => alive && setTerms(list),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [locale, retry])

  const groups = useMemo(() => {
    const map = new Map<string, TermDto[]>()
    for (const term of terms ?? []) {
      if (!matchesTerm(term.term, q)) continue
      const letter = foldText(term.term).charAt(0).toUpperCase() || '#'
      map.set(letter, [...(map.get(letter) ?? []), term])
    }
    return [...map.entries()]
  }, [terms, q])
  const shownCount = groups.reduce((n, [, list]) => n + list.length, 0)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('glossary.title')}</h1>
        <p className="text-sm text-slate-500">{t('glossary.subtitle')}</p>
      </div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('glossary.search')}
        className="block w-full rounded-lg border-0 px-3 py-2 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-emerald-600"
      />
      {terms && <p className="text-xs text-slate-500">{t('glossary.count', { count: shownCount })}</p>}
      {error !== null && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          <span>{errorMessage(error, t)}</span>
          <button onClick={() => setRetry((r) => r + 1)} className="font-semibold underline">
            {t('common.retry')}
          </button>
        </div>
      )}
      {!terms && error === null && <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>}
      {terms && shownCount === 0 && <p className="py-10 text-center text-slate-400">{t('glossary.empty')}</p>}
      {groups.map(([letter, list]) => (
        <section key={letter}>
          <h2 className="mb-2 text-sm font-bold text-emerald-700">{letter}</h2>
          <dl className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            {list.map((term) => (
              <div key={term.id} className="px-4 py-3">
                <dt className="font-semibold text-slate-900">{term.term}</dt>
                <dd className="text-sm [&>*:first-child]:mt-1">
                  <Markdown source={term.definition_md} />
                  {term.lesson_slug && (
                    <Link href={`/learn/${term.lesson_slug}`} className="mt-1 inline-block text-xs font-semibold text-emerald-700 hover:underline">
                      {t('glossary.lesson')}
                    </Link>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
