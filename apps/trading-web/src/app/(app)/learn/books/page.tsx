'use client'

import { useEffect, useMemo, useState } from 'react'
import { LevelBadge } from '@/components/learn/ChapterList'
import { useT } from '@/i18n/I18nProvider'
import { api } from '@/lib/api'
import { errorMessage } from '@/lib/error-message'
import type { BookDto } from '@/server/library/library-service'
import { BOOK_STATUSES, BOOK_TOPICS, type BookStatus } from '@/server/library/validation'
import { LEVELS } from '@/server/learn/validation'

type Filter = { level: string; topic: string; status: string }

export default function BooksPage() {
  const { t, locale } = useT()
  const [books, setBooks] = useState<BookDto[] | null>(null)
  const [filter, setFilter] = useState<Filter>({ level: '', topic: '', status: '' })
  const [error, setError] = useState<unknown>(null)
  const [retry, setRetry] = useState(0)
  const [pending, setPending] = useState<Set<string>>(new Set()) // sách đang lưu trạng thái — khoá nút tới khi xong

  // Lọc ở client: danh sách nhỏ, đổi trạng thái không phải tải lại
  useEffect(() => {
    let alive = true
    setError(null)
    api<BookDto[]>('/api/learn/books').then(
      (b) => alive && setBooks(b),
      (e) => alive && setError(e),
    )
    return () => {
      alive = false
    }
  }, [locale, retry])

  const shown = useMemo(
    () =>
      (books ?? []).filter(
        (b) => (!filter.level || b.level === filter.level) && (!filter.topic || b.topic === filter.topic) && (!filter.status || b.my_status === filter.status),
      ),
    [books, filter],
  )

  const setStatus = async (book: BookDto, status: BookStatus | null) => {
    if (pending.has(book.id)) return
    const prev = book.my_status
    setPending((s) => new Set(s).add(book.id))
    setBooks((list) => list?.map((b) => (b.id === book.id ? { ...b, my_status: status } : b)) ?? null) // lạc quan
    try {
      await api(`/api/learn/books/${book.id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
    } catch (err) {
      setBooks((list) => list?.map((b) => (b.id === book.id ? { ...b, my_status: prev } : b)) ?? null)
      setError(err)
    } finally {
      setPending((s) => {
        const next = new Set(s)
        next.delete(book.id)
        return next
      })
    }
  }

  const count = (s: BookStatus) => (books ?? []).filter((b) => b.my_status === s).length
  const select = (key: keyof Filter, options: readonly string[], label: (o: string) => string) => (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      {t(`books.${key === 'status' ? 'myStatus' : key}`)}
      <select value={filter[key]} onChange={(e) => setFilter((f) => ({ ...f, [key]: e.target.value }))} className="rounded-lg border-0 py-1 text-sm ring-1 ring-slate-200">
        <option value="">{t('books.any')}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {label(o)}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t('books.title')}</h1>
        <p className="text-sm text-slate-500">{t('books.subtitle')}</p>
      </div>
      {books && books.length > 0 && (
        <p className="text-sm font-medium text-slate-600">{t('books.progress', { done: count('done'), total: books.length, reading: count('reading') })}</p>
      )}
      <div className="flex flex-wrap gap-3">
        {select('level', LEVELS, (o) => t(`levels.${o}`))}
        {select('topic', BOOK_TOPICS, (o) => t(`books.topic_${o}`))}
        {select('status', BOOK_STATUSES, (o) => t(`books.status_${o}`))}
      </div>
      {error !== null && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          <span>{errorMessage(error, t)}</span>
          <button onClick={() => setRetry((r) => r + 1)} className="font-semibold underline">
            {t('common.retry')}
          </button>
        </div>
      )}
      {!books && error === null && <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>}
      {books && shown.length === 0 && <p className="py-10 text-center text-slate-400">{t('books.empty')}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {shown.map((b) => (
          <article key={b.id} className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <h2 className="font-semibold text-slate-900">
              {b.title}
              <LevelBadge level={b.level} />
            </h2>
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
                  className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${b.my_status === s ? 'bg-emerald-600 text-white ring-emerald-600' : 'text-slate-600 ring-slate-200 hover:bg-slate-50'}`}
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
      <p className="text-xs text-slate-400">{t('books.note')}</p>
    </div>
  )
}
