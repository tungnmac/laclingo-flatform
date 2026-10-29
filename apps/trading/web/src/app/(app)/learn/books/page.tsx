'use client'

import { useEffect, useState } from 'react'
import { filterGrid, FilterSelect } from '@/components/FilterSelect'
import { LevelBadge } from '@/components/learn/ChapterList'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { BookDto, BookPageDto } from '@/server/library/library-service'
import { BOOK_STATUSES, BOOK_TOPICS, BOOKS_PAGE_SIZE, type BookStatus } from '@/server/library/validation'
import { LEVELS } from '@/server/learn/validation'

type Filter = { level: string; topic: string; status: string }

const SEARCH_DELAY_MS = 300

export default function BooksPage() {
  const { t, locale } = useT()
  const [data, setData] = useState<BookPageDto | null>(null)
  const [filter, setFilter] = useState<Filter>({ level: '', topic: '', status: '' })
  const [query, setQuery] = useState('') // ô nhập
  const [q, setQ] = useState('') // từ khoá đã "lắng" (debounce) — mới gọi API
  const [page, setPage] = useState(1)
  const [error, setError] = useState<unknown>(null)
  const [retry, setRetry] = useState(0)
  const [pending, setPending] = useState<Set<string>>(new Set()) // sách đang lưu trạng thái — khoá nút tới khi xong

  useEffect(() => {
    const id = setTimeout(() => {
      setQ(query.trim())
      setPage(1)
    }, SEARCH_DELAY_MS)
    return () => clearTimeout(id)
  }, [query])

  useEffect(() => {
    let alive = true // gõ / đổi trang nhanh → bỏ kết quả của request cũ
    setError(null)
    const params = new URLSearchParams({ page: String(page), page_size: String(BOOKS_PAGE_SIZE) })
    if (q) params.set('q', q)
    for (const [k, v] of Object.entries(filter)) if (v) params.set(k, v)
    api<BookPageDto>(`/api/learn/books?${params}`).then(
      (d) => alive && setData(d),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [q, filter, page, locale, retry])

  const pages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1
  // Trang hiện tại trống (vd vừa bỏ đánh dấu cuốn cuối khi lọc "Của tôi") → nhảy thẳng tới trang cuối còn sách.
  // Chỉ xét khi data đúng là của trang đang xem (data cũ của trang trước không được kích hoạt lùi tiếp).
  useEffect(() => {
    if (data && data.page === page && data.items.length === 0 && page > 1) setPage(Math.max(1, Math.ceil(data.total / data.page_size)))
  }, [data, page])

  const changeFilter = (patch: Partial<Filter>) => {
    setFilter((f) => ({ ...f, ...patch }))
    setPage(1)
  }

  const setStatus = async (book: BookDto, status: BookStatus | null) => {
    if (pending.has(book.id)) return
    setPending((s) => new Set(s).add(book.id))
    setError(null)
    try {
      await api(`/api/learn/books/${book.id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
      // Hiện ngay trạng thái mới, rồi tải lại trang để thống kê và bộ lọc "Của tôi" khớp server
      setData((d) => (d ? { ...d, items: d.items.map((b) => (b.id === book.id ? { ...b, my_status: status } : b)) } : d))
      setRetry((r) => r + 1)
    } catch (err) {
      setError(err)
    } finally {
      setPending((s) => {
        const next = new Set(s)
        next.delete(book.id)
        return next
      })
    }
  }

  const select = (key: keyof Filter, options: readonly string[], label: (o: string) => string) => (
    <FilterSelect label={t(`books.${key === 'status' ? 'myStatus' : key}`)} value={filter[key]} onChange={(v) => changeFilter({ [key]: v })}>
      <option value="">{t('books.any')}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {label(o)}
        </option>
      ))}
    </FilterSelect>
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('books.title')}</h1>
        <p className="text-sm text-slate-500">{t('books.subtitle')}</p>
      </div>
      {data && data.stats.books > 0 && (
        <p className="text-sm font-medium text-slate-600">{t('books.progress', { done: data.stats.done, total: data.stats.books, reading: data.stats.reading })}</p>
      )}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('books.search')}
        aria-label={t('books.search')}
        className="block w-full rounded-lg border-0 px-3 py-2 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-emerald-600"
      />
      <div className={filterGrid(3)}>
        {select('level', LEVELS, (o) => t(`levels.${o}`))}
        {select('topic', BOOK_TOPICS, (o) => t(`books.topic_${o}`))}
        {select('status', BOOK_STATUSES, (o) => t(`books.status_${o}`))}
      </div>
      {data && <p className="text-right text-xs text-slate-500">{t('books.found', { count: data.total })}</p>}
      {error !== null && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          <span>{errorMessage(error, t)}</span>
          <button onClick={() => setRetry((r) => r + 1)} className="font-semibold underline">
            {t('common.retry')}
          </button>
        </div>
      )}
      {!data && error === null && <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>}
      {data && data.items.length === 0 && page === 1 && <p className="py-10 text-center text-slate-400">{t('books.empty')}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {data?.items.map((b) => (
          <article key={b.id} className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <h2 className="font-semibold text-slate-900">
              {b.title}
              <LevelBadge level={b.level} />
            </h2>
            {b.original_title && <p className="text-xs italic text-slate-500">{t('books.original', { title: b.original_title })}</p>}
            <p className="text-sm text-slate-500">
              {b.author}
              {b.year ? ` · ${b.year}` : ''} · {t(`books.topic_${b.topic}`)}
            </p>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-700">{b.summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {BOOK_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(b, b.my_status === s ? null : s)}
                  disabled={pending.has(b.id)}
                  aria-pressed={b.my_status === s}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 disabled:opacity-60 ${b.my_status === s ? 'bg-emerald-600 text-white ring-emerald-600' : 'text-slate-600 ring-slate-200 hover:bg-slate-50'}`}
                >
                  {t(`books.status_${s}`)}
                </button>
              ))}
              {b.url && (
                <a href={b.url} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs font-semibold text-emerald-700 hover:underline">
                  {t('books.more')}
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
      {data && pages > 1 && (
        <nav className="flex items-center justify-center gap-3 text-sm" aria-label={t('books.pageOf', { page, pages })}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg px-3 py-1.5 font-semibold text-emerald-700 ring-1 ring-slate-200 disabled:opacity-40">
            {t('books.prev')}
          </button>
          <span className="tabular-nums text-slate-600">{t('books.pageOf', { page, pages })}</span>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages} className="rounded-lg px-3 py-1.5 font-semibold text-emerald-700 ring-1 ring-slate-200 disabled:opacity-40">
            {t('books.next')}
          </button>
        </nav>
      )}
      <p className="text-xs text-slate-400">{t('books.note')}</p>
    </div>
  )
}
