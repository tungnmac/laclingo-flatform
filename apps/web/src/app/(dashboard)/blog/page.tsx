'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/admin/Pagination'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Spinner } from '@/components/ui/States'
import { blogService } from '@/features/blog/blog.service'
import { inputClass } from '@/features/auth/components/AuthForm'
import { courseService } from '@/features/course/course.service'
import { useApi } from '@/hooks/useApi'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTranslation } from '@/hooks/useTranslation'
import { cn, formatDate } from '@/lib/utils'

const PAGE_SIZE = 10

export default function BlogListPage() {
  const t = useTranslation()
  const [languageId, setLanguageId] = useState('')
  const [tag, setTag] = useState('')
  const [mineOnly, setMineOnly] = useState(false)
  const [page, setPage] = useState(1)
  const debouncedTag = useDebouncedValue(tag)

  const { data: languages } = useApi(courseService.list, [])
  const { data, error, loading, reload } = useApi(
    () => blogService.list({ languageId: languageId || undefined, tag: debouncedTag || undefined, mine: mineOnly, page, pageSize: PAGE_SIZE }),
    [languageId, debouncedTag, mineOnly, page],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.blog.pageTitle}
        description={t.blog.pageDesc}
        action={<ButtonLink href="/blog/new">{t.blog.writeNewBtn}</ButtonLink>}
      />

      <div className="flex flex-wrap items-end gap-3">
        <select
          value={languageId}
          onChange={(e) => {
            setLanguageId(e.target.value)
            setPage(1)
          }}
          className={cn(inputClass, 'mt-0 max-w-xs')}
        >
          <option value="">{t.blog.allLanguagesOption}</option>
          {languages?.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={tag}
          onChange={(e) => {
            setTag(e.target.value)
            setPage(1)
          }}
          placeholder={t.blog.tagFilterPlaceholder}
          className={cn(inputClass, 'mt-0 max-w-xs')}
        />
        <label className="flex items-center gap-2 pb-2.5 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={mineOnly}
            onChange={(e) => {
              setMineOnly(e.target.checked)
              setPage(1)
            }}
            className="h-4 w-4 rounded border-slate-300"
          />
          {t.blog.mineOnlyLabel}
        </label>
      </div>

      {loading && <Spinner label={t.blog.loadingPosts} />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState icon="📝" title={t.blog.emptyPosts} />}

      {data && data.items.length > 0 && (
        <div className="space-y-3">
          {data.items.map((p) => (
            <Link key={p.id} href={`/blog/${p.id}`}>
              <Card className="transition hover:ring-indigo-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900">{p.title}</h2>
                      {p.is_hidden && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                          {t.blog.hiddenBadge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {t.blog.byLabel(p.author_full_name || p.author_username)} · {formatDate(p.created_at)}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{p.excerpt}</p>
                    {p.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {p.tags.map((tg) => (
                          <span key={tg} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            #{tg}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>⭐ {p.star_count}</span>
                      <span>🔖 {p.marker_count}</span>
                      <span>👍 {p.like_count}</span>
                      <span>👎 {p.dislike_count}</span>
                      <span>
                        👁 {p.view_count} {t.blog.viewsSuffix}
                      </span>
                      <span>
                        💬 {p.comment_count} {t.blog.commentsSuffix}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />}
    </div>
  )
}
